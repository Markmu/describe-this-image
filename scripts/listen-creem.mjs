import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createInterface } from "node:readline";

if (process.env.CREEM_ENVIRONMENT !== "test" || !process.env.CREEM_API_KEY?.startsWith("creem_test_") ||
    !process.env.CREEM_WEBHOOK_ID || !process.env.CREEM_WEBHOOK_SECRET) {
  throw new Error("Set the Creem test API key, webhook ID and webhook secret in .env.local.");
}

const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
if (origin.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) {
  throw new Error("Local webhook forwarding requires a loopback HTTP application URL.");
}

const require = createRequire(import.meta.url);
const listener = spawn(process.execPath, [require.resolve("@creem_io/cli"), "listen",
  "--environment", "test", "--webhook", process.env.CREEM_WEBHOOK_ID,
  "--forward-to", new URL("/api/webhooks/creem", origin).href, "--json"], {
  env: process.env, stdio: ["ignore", "pipe", "pipe"],
});

for (const [stream, output] of [[listener.stdout, process.stdout], [listener.stderr, process.stderr]]) {
  createInterface({ input: stream }).on("line", line => {
    let message;
    try { message = JSON.parse(line); } catch {
      output.write(line.replaceAll(process.env.CREEM_API_KEY, "[REDACTED]")
        .replaceAll(process.env.CREEM_WEBHOOK_SECRET, "[REDACTED]") + "\n");
      return;
    }
    const { secret, ...record } = message;
    if (message.type === "listening" && secret !== process.env.CREEM_WEBHOOK_SECRET) {
      process.stderr.write("Webhook signing secret does not match .env.local.\n");
      process.exitCode = 1;
      listener.kill("SIGTERM");
      return;
    }
    output.write(JSON.stringify(record) + "\n");
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => listener.kill(signal));
}
listener.on("error", error => {
  console.error(error.message);
  process.exitCode = 1;
});
listener.on("exit", (code, signal) => {
  process.exitCode ||= code ?? (signal ? 1 : 0);
});
