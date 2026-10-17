import "server-only";

import OpenAI, { APIConnectionTimeoutError, RateLimitError } from "openai";

import { createAdminClient } from "@/lib/supabase/admin";

import { decideQuota, DEFAULT_LIMITS, type QuotaDecision, type UsageCounts } from "./quota";

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_INPUT_CHARS = 4_000;
const MAX_OUTPUT_TOKENS = 600;

export type AiFailure =
  | "input_too_long"
  | "quota_exceeded"
  | "timeout"
  | "rate_limited"
  | "unavailable"
  | "empty_response";

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
    baseURL: process.env.SOC_LLM_BASE_URL,
    apiKey: process.env.SOC_LLM_API_KEY,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 0,
  });
  return llm;
}

interface UsageClaim {
  id: number;
  /** Usage by other calls, excluding this one. */
  priorUsage: UsageCounts;
}

/**
 * Records this call, then counts every other recent call. Recording before counting means two
 * simultaneous calls always see each other, so neither can slip past a limit (at worst both are
 * refused). Returns null if usage cannot be recorded or counted, so the caller fails closed.
 */
async function claimUsage(userId: string, feature: string): Promise<UsageClaim | null> {
  const db = createAdminClient();
  const { data: row, error } = await db
    .from("ai_usage")
    .insert({ user_id: userId, feature })
    .select("id")
    .single();
  if (error || !row) return null;

  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const countOthersSince = (since: string, sameUserOnly: boolean) => {
    const query = db
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since)
      .neq("id", row.id);
    return sameUserOnly ? query.eq("user_id", userId) : query;
  };

  const results = await Promise.all([
    countOthersSince(minuteAgo, true),
    countOthersSince(dayAgo, true),
    countOthersSince(minuteAgo, false),
  ]);
  if (results.some((result) => result.error || result.count === null)) {
    await releaseUsage(row.id);
    return null;
  }

  const [userLastMinute, userLastDay, globalLastMinute] = results.map((result) => result.count!);
  return { id: row.id, priorUsage: { userLastMinute, userLastDay, globalLastMinute } };
}

/** Removes a refused call's record so refused attempts do not use up quota. */
async function releaseUsage(id: number): Promise<void> {
  await createAdminClient().from("ai_usage").delete().eq("id", id);
}

/**
 * The only way the app calls the SoC LLM. Applies input limits, quotas and a timeout,
 * and never throws: callers get a typed failure so booking features keep working.
 * The caller must check the user's role before calling and validate the returned text.
 */
export async function generateText(request: AiRequest): Promise<AiResult> {
  if (request.input.length > MAX_INPUT_CHARS) return { ok: false, reason: "input_too_long" };

  const claim = await claimUsage(request.userId, request.feature);
  if (!claim) return { ok: false, reason: "unavailable" };

  const decision: QuotaDecision = decideQuota(claim.priorUsage, DEFAULT_LIMITS);
  if (!decision.allowed) {
    await releaseUsage(claim.id);
    return { ok: false, reason: "quota_exceeded", retryAfterSeconds: decision.retryAfterSeconds };
  }

  try {
    const completion = await getLlm().chat.completions.create({
      model: process.env.SOC_LLM_MODEL!,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.input },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    return text ? { ok: true, text } : { ok: false, reason: "empty_response" };
  } catch (error) {
    if (error instanceof APIConnectionTimeoutError) return { ok: false, reason: "timeout" };
    if (error instanceof RateLimitError) return { ok: false, reason: "rate_limited" };
    console.error("SoC LLM call failed", { feature: request.feature, error });
    return { ok: false, reason: "unavailable" };
  }
}
