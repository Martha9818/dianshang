import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const productDetailPage = read("src/app/products/[id]/page.tsx");
const scoreTab = read("src/components/products/score-tab.tsx");
const productService = read("src/lib/services/product-service.ts");

assert.match(productDetailPage, /label:\s*"竞品参考"/);
assert.match(productDetailPage, /label:\s*"AI 机会分析"/);
assert.match(productDetailPage, /label:\s*"成本利润"/);
assert.match(productDetailPage, /label:\s*"测试结论"/);
assert.match(productDetailPage, /商品评估流程/);
assert.match(productDetailPage, /补竞品 → 看机会 → 算利润 → 得结论/);
assert.match(productDetailPage, /当前正式结论/);
assert.match(productDetailPage, /现在为什么不能完全判断/);
assert.match(productDetailPage, /至少 3 个有效竞品/);
assert.match(productDetailPage, /sourceInspirationReference=\{pageData\.data\.sourceInspirationReference\}/);

assert.match(scoreTab, /当前测试结论/);
assert.match(scoreTab, /这里回答的是：这个商品现在值不值得小批量测试。/);
assert.match(scoreTab, /来源灵感参考/);
assert.match(scoreTab, /草稿初筛分只作为线索参考带过来，不会直接继承为正式商品评分。/);
assert.match(scoreTab, /来源初筛分/);
assert.match(scoreTab, /来源初筛结论/);
assert.match(scoreTab, /重新计算正式评分/);
assert.match(scoreTab, /测试结论是规则化正式评估，不是 AI 自动判断。/);

assert.match(productService, /export type SourceInspirationReference =/);
assert.match(productService, /sourceInspirationReference: SourceInspirationReference \| null;/);
assert.match(productService, /competitorAnalysisSnapshotCount: number;/);
assert.match(productService, /mapSourceInspirationReference/);
assert.match(productService, /evaluateInspirationTriage/);
assert.match(productService, /prisma\.inspiration\.findFirst/);
assert.match(productService, /prisma\.competitorAnalysisSnapshot\.count/);

console.log("thread-v16-05 product evaluation flow verification passed");
