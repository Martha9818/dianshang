import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const competitorTab = read("src/components/products/competitor-tab.tsx");
const competitorAnalysisTab = read("src/components/products/competitor-analysis-tab.tsx");
const profitTab = read("src/components/products/profit-tab.tsx");

assert.match(competitorTab, /这个环节在看什么/);
assert.match(competitorTab, /录入同类商品，用来判断价格带、竞争强度和卖点差异|先把真实竞品补齐/);
assert.match(competitorTab, /这个环节会产出什么/);
assert.match(competitorTab, /当前有效竞品：/);
assert.match(competitorTab, /3 个有效竞品/);
assert.match(competitorTab, /正式测试结论/);

assert.match(competitorAnalysisTab, /这个环节在看什么/);
assert.match(competitorAnalysisTab, /AI 总结已经确认的竞品资料/);
assert.match(competitorAnalysisTab, /这个环节会产出什么/);
assert.match(competitorAnalysisTab, /AI 机会分析快照|第一份 AI 机会分析快照|稳定分析/);
assert.match(competitorAnalysisTab, /不会自动改写正式评分/);
assert.match(competitorAnalysisTab, /不会直接给出正式结论|测试结论页/);

assert.match(profitTab, /这个环节在看什么/);
assert.match(profitTab, /系统会计算单件净利润和利润率|利润空间/);
assert.match(profitTab, /这个环节会产出什么/);
assert.match(profitTab, /当前缺少：/);
assert.match(profitTab, /利润结果暂不可用|正式利润结果/);
assert.match(profitTab, /它怎么影响测试结论/);
assert.match(profitTab, /不能形成完整正式结论|直接参与正式测试结论/);

console.log("thread-v16-06 evaluation tab guidance verification passed");
