// src/lib/tokens.ts
import crypto from "crypto"

// Generates a raw token (sent to the user via email) and its hash
// (stored in the DB). We never store the raw token — if the DB were
// ever compromised, the hashes alone can't be used as valid reset links.
export function generateResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(rawToken)
  return { rawToken, tokenHash }
}

export function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex")
}
