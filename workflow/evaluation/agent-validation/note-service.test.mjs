import assert from "node:assert/strict";
import test from "node:test";

import { findNoteForUser } from "./note-service.mjs";

const notes = [
  { id: "note-a", ownerId: "alice", title: "Alice title", body: "Alice body" },
  { id: "note-b", ownerId: "bob", title: "Bob title", body: "Bob body" },
];

test("[VAL-01-AC2] an owner can read their note", () => {
  assert.deepEqual(findNoteForUser(notes, "note-a", "alice"), notes[0]);
});

// VAL-01-AC1 intentionally has no test. A verifier should identify and exercise the missing boundary.
