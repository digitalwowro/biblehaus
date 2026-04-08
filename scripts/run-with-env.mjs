import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

const [, , envPathArg, commandArg, ...rest] = process.argv;

if (!envPathArg || !commandArg) {
  console.error("Usage: node scripts/run-with-env.mjs <env-file> <command> [...args]");
  process.exit(1);
}

const envPath = path.resolve(process.cwd(), envPathArg);
dotenv.config({ path: envPath, override: true });

const child = spawn(commandArg, rest, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
