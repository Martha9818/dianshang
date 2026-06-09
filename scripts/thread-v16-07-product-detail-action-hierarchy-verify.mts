import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const productDetailPage = read("src/app/products/[id]/page.tsx");

assert.match(productDetailPage, /<ActionButton href=\{`\/products\/\$\{product\.id\}\?tab=competitors`\} variant="primary">/);
assert.match(productDetailPage, /补竞品/);
assert.match(productDetailPage, /算利润/);
assert.match(productDetailPage, /重新评分/);
assert.match(productDetailPage, /顶部快捷动作/);
assert.match(productDetailPage, /先补竞品，再算利润，最后回到测试结论/);
assert.match(productDetailPage, /辅助来源记录/);
assert.match(productDetailPage, /链接导入继续保留，但不再作为主入口/);
assert.match(productDetailPage, /辅助记录来源链接/);
assert.doesNotMatch(
  productDetailPage,
  /<ActionButton href=\{`\/link-imports\?purpose=product_candidate`\} variant="secondary">\s*链接导入\s*<\/ActionButton>/,
);

console.log("thread-v16-07 product detail action hierarchy verification passed");
