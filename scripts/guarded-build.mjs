import { spawn } from "node:child_process";
import path from "node:path";

const blockedPatterns = [
  "Encountered unexpected file in NFT list",
  "whole project was traced unintentionally",
];

const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextCli, "build"], {
  stdio: ["inherit", "pipe", "pipe"],
});

let output = "";

function forward(stream, target) {
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    output += text;
    target.write(chunk);
  });
}

forward(child.stdout, process.stdout);
forward(child.stderr, process.stderr);

child.on("close", (code) => {
  const hasBlockedWarning = blockedPatterns.some((pattern) => output.includes(pattern));

  if (hasBlockedWarning) {
    console.error(
      "\nGuarded build failed: Turbopack output-file-tracing warning detected. " +
        "Keep local runtime files and dynamic filesystem services out of the build trace.",
    );
    process.exit(1);
  }

  process.exit(code ?? 1);
});
