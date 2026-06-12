import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { TextDecoder } from "node:util";

const trackedFiles = execFileSync("git", ["-c", "core.quotepath=false", "ls-files", "-z"])
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const skippedPath = /(^|[\\/])(?:\.git|\.next|node_modules|exports|backups|uploads|logs)([\\/]|$)/;
const skippedFile = /(?:^package-lock\.json$|\.ico$|\.png$|\.jpe?g$|\.gif$|\.webp$|\.db$|\.sqlite$|\.woff2?$)/i;

const suspiciousPatterns = [
  { name: "replacement character", pattern: /\uFFFD/u },
  { name: "private-use character", pattern: /[\uE000-\uF8FF]/u },
  { name: "latin mojibake", pattern: /(?:\u00C2|\u00C3|\u00E2[\u0080-\u00BF])/u },
  {
    name: "known GBK mojibake",
    pattern:
      /(?:\u9369\u8679|\u7ED4\u70B2|\u9352\u2542|\u935F\u55D7|\u9A9E\u51B2|\u6D60\u8BF2|\u7EF1\u72B3|\u93BF\u5D84|\u68F0\u52EE|\u951B\u5C83|\u9286\u4FD9)/u,
  },
];

const decoder = new TextDecoder("utf-8", { fatal: true });
const invalidUtf8 = [];
const suspicious = [];

for (const file of trackedFiles) {
  if (skippedPath.test(file) || skippedFile.test(file)) continue;

  const buffer = readFileSync(file);
  if (buffer.includes(0)) continue;

  let text;
  try {
    text = decoder.decode(buffer);
  } catch {
    invalidUtf8.push(file);
    continue;
  }

  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const { name, pattern } of suspiciousPatterns) {
      if (pattern.test(line)) {
        suspicious.push({
          file,
          line: index + 1,
          name,
          text: line.trim().slice(0, 160),
        });
        break;
      }
    }
  });
}

if (invalidUtf8.length > 0 || suspicious.length > 0) {
  console.error("Encoding check failed.");

  if (invalidUtf8.length > 0) {
    console.error("\nInvalid UTF-8 files:");
    invalidUtf8.forEach((file) => console.error(`- ${file}`));
  }

  if (suspicious.length > 0) {
    console.error("\nSuspicious mojibake-like text:");
    suspicious.forEach((item) => {
      console.error(`- ${item.file}:${item.line} [${item.name}] ${item.text}`);
    });
  }

  process.exit(1);
}

console.log("Encoding check passed: tracked text files are valid UTF-8 with no known mojibake markers.");
