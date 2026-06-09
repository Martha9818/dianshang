import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const screenshotService = read("src/lib/services/screenshot/screenshotRecognitionService.ts");
const productDetailPage = read("src/app/products/[id]/page.tsx");
const draftPanel = read("src/components/products/competitor-screenshot-draft-panel.tsx");

assert.match(screenshotService, /canConfirmDirectly:\s*boolean/);
assert.match(screenshotService, /confirmBlockedReason:\s*string \| null/);
assert.match(screenshotService, /if \(job\.status !== SCREENSHOT_JOB_STATUSES\.SUCCESS\)/);
assert.match(screenshotService, /if \(!\(job\.confirmedDraft \?\? job\.structuredDraft\)\)/);
assert.match(screenshotService, /getConfirmability/);

assert.match(productDetailPage, /requestedScreenshotDraftCandidate\?\.canConfirmDirectly/);
assert.match(productDetailPage, /screenshotDraftBlockedForConfirm/);
assert.match(productDetailPage, /confirmBlockedReason/);

assert.match(draftPanel, /candidate\.statusLabel/);
assert.match(draftPanel, /candidate\.qualityLabel/);
assert.match(draftPanel, /candidate\.confirmStateLabel/);
assert.match(draftPanel, /candidate\.canConfirmDirectly/);
assert.match(draftPanel, /先回截图识别页处理/);
assert.match(draftPanel, /当前截图识别质量偏低/);

console.log("thread-v17-1-thread00 stabilization verification passed");
