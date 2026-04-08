const PLACEHOLDER_SECRETS = new Set([
  "change_me_in_production",
  "dev_secret_change_in_production",
]);

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }

  if (process.env.NODE_ENV === "production" && PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error("JWT_SECRET must be changed from the placeholder value in production");
  }

  return new TextEncoder().encode(secret);
}
