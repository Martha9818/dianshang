import crypto from "node:crypto";

export function calculateImageHash(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

