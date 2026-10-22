"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Shared one-time credential panel for account creation (ADM-01-R1) and password reset
 * (ADM-01-R9). The credential lives only in this component's props/local state -- never in a
 * URL, localStorage, or anything that could be written to server-rendered HTML again. Once
 * "Done" is pressed the caller clears its own copy of the credential (see onDone), so there is
 * no code path left that can display it again.
 */
export default function OneTimePasswordPanel({
  credential,
  label = "One-time password",
  onDone,
}: {
  credential: string;
  label?: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(credential);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div role="status" className="mt-3 space-y-2 rounded-lg border bg-card p-3">
      <Label htmlFor="initial-credential">{label} (copy it now — it cannot be shown again)</Label>
      <Input
        id="initial-credential"
        type="text"
        readOnly
        value={credential}
        onFocus={(event) => event.currentTarget.select()}
        className="font-mono"
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
