"use client";

import { useState } from "react";

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
    <div role="status" className="mt-3 space-y-2 rounded-md border border-black p-3">
      <label htmlFor="initial-credential" className="block text-sm font-medium">
        {label} (copy it now — it cannot be shown again)
      </label>
      <input
        id="initial-credential"
        type="text"
        readOnly
        value={credential}
        onFocus={(event) => event.currentTarget.select()}
        className="w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Done
        </button>
      </div>
    </div>
  );
}
