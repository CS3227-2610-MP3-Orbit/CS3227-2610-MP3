import "server-only";

import OpenAI, { APIConnectionTimeoutError, RateLimitError } from "openai";

import {
  claimAttempt,
  finalizeAttempt,
  markAttemptIndeterminate,
  releaseAttempt,
} from "./attempts";
import { parseAdvice } from "./output-validation";

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_INPUT_CHARS = 4_000;
const MAX_OUTPUT_TOKENS = 600;

export type AiFailure =
  | "input_too_long"
  | "quota_exceeded"
  | "timeout"
  | "rate_limited"
  | "unavailable"
  | "empty_response"
  | "invalid_output"
  | "in_flight"
  | "unresolved_attempt";

export type AiResult =
  { ok: true; text: string } | { ok: false; reason: AiFailure; retryAfterSeconds?: number };

export interface AiRequest {
  userId: string;
  /** Feature name stored with each call, e.g. "student.improve-request". */
  feature: string;
  /** Fixed instructions written by us. Never put user text here. */
  system: string;
  /** User-supplied content. Wrap untrusted parts with wrapUntrusted(). */
  input: string;
}

let llm: OpenAI | null = null;

function getLlm(): OpenAI {
  llm ??= new OpenAI({
    baseURL: process.env.SOCLAAS_BASE_URL,
    apiKey: process.env.SOCLAAS_API_KEY,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 0,
  });
  return llm;
}

function hasMalformedUnicode(value: string): boolean {
  return /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
}

/** Feature output contracts are checked before an attempt can become a successful response. */
function validGatewayOutput(feature: string, text: string): boolean {
  if (text.length > 6_000 || text.includes("\0") || hasMalformedUnicode(text)) return false;
  if (feature === "student.improve-request") return parseAdvice(text).success;
  return true;
}

/**
 * The only way the app calls the SoC LLM. Applies input limits, quotas and a timeout,
 * and never throws: callers get a typed failure so booking features keep working.
 * The caller must check the user's role before calling and validate the returned text.
 */
export async function generateText(request: AiRequest): Promise<AiResult> {
  if (request.input.length > MAX_INPUT_CHARS) return { ok: false, reason: "input_too_long" };

  const claim = await claimAttempt(request.userId, request.feature);
  if (claim.kind === "unavailable") return { ok: false, reason: "unavailable" };
  if (claim.kind === "in_flight") return { ok: false, reason: "in_flight" };
  if (claim.kind === "quota_exceeded")
    return { ok: false, reason: "quota_exceeded", retryAfterSeconds: claim.retryAfterSeconds };

  try {
    const completion = await getLlm().chat.completions.create({
      model: process.env.SOCLAAS_MODEL!,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.input },
      ],
    });
    const text = completion.choices[0]?.message?.content;
    if (!text || !text.trim()) {
      return (await releaseAttempt(claim.id))
        ? { ok: false, reason: "empty_response" }
        : { ok: false, reason: "unresolved_attempt" };
    }
    if (!validGatewayOutput(request.feature, text)) {
      return (await releaseAttempt(claim.id))
        ? { ok: false, reason: "invalid_output" }
        : { ok: false, reason: "unresolved_attempt" };
    }
    return (await finalizeAttempt(claim.id))
      ? { ok: true, text }
      : (await markAttemptIndeterminate(claim.id))
        ? { ok: false, reason: "unresolved_attempt" }
        : { ok: false, reason: "unresolved_attempt" };
  } catch (error) {
    const reason =
      error instanceof APIConnectionTimeoutError
        ? "timeout"
        : error instanceof RateLimitError
          ? "rate_limited"
          : "unavailable";
    return (await releaseAttempt(claim.id))
      ? { ok: false, reason }
      : (await markAttemptIndeterminate(claim.id))
        ? { ok: false, reason: "unresolved_attempt" }
        : { ok: false, reason: "unresolved_attempt" };
  }
}
