"use client";

import { useState, useTransition } from "react";

import type { GenerateActivitySummaryResult } from "@/features/admin/reports/validation";
import { SUMMARY_LABEL } from "@/features/admin/reports/presentation";
import { Button } from "@/components/ui/button";

import { generateActivitySummaryAction } from "./actions";

type PanelState =
  | { status: "idle" }
  | { status: "success"; summary: string; truncated: boolean }
  | { status: "error"; message: string };

// ADM-04-R8: every handled generateText failure and the missing-key (not_configured) guard show
// the same friendly family of message -- the report itself (rendered by the parent page) is
// never affected by anything in this panel.
function describeAiFailure(
  result: Extract<GenerateActivitySummaryResult, { kind: "ai_unavailable" }>,
): string {
  switch (result.reason) {
    case "not_configured":
      return "AI summary unavailable: the AI service is not configured.";
    case "quota_exceeded":
      return "AI summary unavailable: the shared daily AI limit has been reached. Please try again later.";
    case "in_flight":
      return "A summary request for this account is already in progress. Please wait and try again.";
    case "input_too_long":
      return "AI summary unavailable: this period produced too much data to summarise.";
    case "timeout":
      return "AI summary unavailable: the request timed out. Please retry.";
    case "rate_limited":
      return "AI summary unavailable: please wait a moment and retry.";
    default:
      return "AI summary unavailable. Please retry.";
  }
}

export default function SummaryPanel({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const [state, setState] = useState<PanelState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  function generate() {
    setState({ status: "idle" });
    startTransition(async () => {
      const result = await generateActivitySummaryAction({ startDate, endDate });
      if (result.kind === "success") {
        setState({ status: "success", summary: result.summary, truncated: result.truncated });
      } else if (result.kind === "ai_unavailable") {
        setState({ status: "error", message: describeAiFailure(result) });
      } else {
        setState({ status: "error", message: "This information is not available right now." });
      }
    });
  }

  return (
    <section aria-labelledby="summary-heading" className="rounded-lg border bg-card p-4">
      <h2 id="summary-heading" className="text-lg font-semibold">
        AI activity summary
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Generates a plain-text summary comparing this period to the one before it. Not saved -- each
        click regenerates.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={generate}
        className="mt-3"
      >
        {pending ? "Summarising…" : "Summarise this period"}
      </Button>

      <div role="status" aria-live="polite" aria-busy={pending} className="mt-3 text-sm">
        {pending && <p>Summarising…</p>}
        {state.status === "success" && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">{SUMMARY_LABEL}</p>
            <p className="mt-1 whitespace-pre-wrap">{state.summary}</p>
            {state.truncated && (
              <p className="mt-1 text-xs text-muted-foreground">
                Summary truncated to fit the limit.
              </p>
            )}
          </div>
        )}
      </div>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-sm">
          {state.message}
        </p>
      )}
    </section>
  );
}
