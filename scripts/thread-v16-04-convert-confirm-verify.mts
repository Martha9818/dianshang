import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const actions = read("src/app/inspirations/actions.ts");
const manager = read("src/components/inspirations/inspiration-manager.tsx");
const conversion = read("src/lib/modules/inspirations/conversion.ts");

assert.match(conversion, /INSPIRATION_CONVERSION_CONFIRM_FIELD\s*=\s*"conversionConfirmed"/);
assert.match(conversion, /INSPIRATION_CONVERSION_CONFIRM_VALUE\s*=\s*"yes"/);
assert.match(conversion, /来自 AI 草稿预填，请人工确认。/);

assert.match(actions, /formData\.get\(INSPIRATION_CONVERSION_CONFIRM_FIELD\)/);
assert.match(actions, /INSPIRATION_CONVERSION_CONFIRM_VALUE/);
assert.match(actions, /请先确认 AI 预填信息后再创建商品。/);

assert.match(manager, /先进入人工确认/);
assert.match(manager, /打开人工确认表单/);
assert.match(manager, /INSPIRATION_CONVERSION_CONFIRM_FIELD/);
assert.match(manager, /INSPIRATION_CONVERSION_CONFIRM_NOTE/);
assert.match(manager, /取消，不创建商品/);
assert.match(manager, /确认并创建商品/);
assert.doesNotMatch(manager, /window\.confirm\(/);

console.log("thread-v16-04 convert confirm verification passed");
