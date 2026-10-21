import "server-only";

import { randomInt } from "node:crypto";

// Letters and digits only: the administrator copies the password like an API key, and a
// double-click selects the whole value because nothing in it splits a word.
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const INITIAL_PASSWORD_LENGTH = 24; // about 143 bits of entropy

/**
 * Initial password for an account created by an administrator (ADM-01-R1).
 * It is shown to the administrator exactly once and never stored or logged by the app.
 */
export function generateInitialPassword(): string {
  let password = "";
  for (let i = 0; i < INITIAL_PASSWORD_LENGTH; i++) {
    password += CHARSET[randomInt(CHARSET.length)];
  }
  return password;
}
