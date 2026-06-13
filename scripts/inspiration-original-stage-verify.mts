import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const managerSource = await readFile(new URL("../src/components/inspirations/inspiration-manager.tsx", import.meta.url), "utf8");
const productImageSource = await readFile(new URL("../src/components/products/product-image.tsx", import.meta.url), "utf8");

assert.match(productImageSource, /fit = "cover"/, "ProductImage should keep a default fit mode.");
assert.match(productImageSource, /fit\?: "cover" \| "contain"/, "ProductImage should allow contain mode for uncropped previews.");
assert.match(productImageSource, /fit === "contain" \? "object-contain" : "object-cover"/, "ProductImage should map contain mode to object-contain.");

assert.match(managerSource, /<ProductImage[\s\S]*src=\{selectedInspiration\.imagePath\}[\s\S]*fit="contain"/, "The inspiration center stage should render the original image in contain mode.");
assert.match(managerSource, /setIsStageImageOpen\(true\)/, "The inspiration stage should still open the large preview.");
assert.match(managerSource, /aria-label="原图预览"/, "The large original-image preview dialog should remain available.");

console.log("inspiration original stage verification passed");
