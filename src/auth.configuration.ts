export function hasAuthConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const secret = env.AUTH_SECRET?.trim() ?? "";
  return secret.length >= 32 && !/describe-this-image|replace|example|change.?me|your.?secret/i.test(secret)
    && Boolean(env.AUTH_GOOGLE_ID?.trim()) && Boolean(env.AUTH_GOOGLE_SECRET?.trim());
}
