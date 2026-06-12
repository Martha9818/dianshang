import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildInspirationsHref,
  buildInspirationsHrefFromSearchParams,
  parseLegacyInspirationSlug,
} from "../src/lib/modules/inspirations/routes";

assert.equal(buildInspirationsHref(), "/inspirations");
assert.equal(buildInspirationsHref({ selectedId: 14 }), "/inspirations?selectedId=14");
assert.equal(
  buildInspirationsHref({ selectedId: 14, status: "pending", sort: "createdAt_desc" }),
  "/inspirations?selectedId=14&status=pending&sort=createdAt_desc",
);
assert.equal(
  buildInspirationsHrefFromSearchParams(new URLSearchParams("selectedId=14&status=pending")),
  "/inspirations?selectedId=14&status=pending",
);
assert.equal(parseLegacyInspirationSlug("14"), 14);
assert.equal(parseLegacyInspirationSlug(["14"]), 14);
assert.equal(parseLegacyInspirationSlug(["14", "extra"]), null);
assert.equal(parseLegacyInspirationSlug(["legacy"]), null);

const legacyRouteSource = readFileSync(path.resolve("src/app/inspirations/[...slug]/page.tsx"), "utf8");
assert.match(legacyRouteSource, /permanentRedirect/);
assert.match(legacyRouteSource, /buildInspirationsHrefFromSearchParams/);
assert.match(legacyRouteSource, /parseLegacyInspirationSlug/);

const managerSource = readFileSync(path.resolve("src/components/inspirations/inspiration-manager.tsx"), "utf8");
assert.match(managerSource, /buildInspirationsHref/);
assert.doesNotMatch(managerSource, /router\.push\(`\/inspirations\?/);

const dashboardTodoSource = readFileSync(path.resolve("src/lib/services/dashboardTodoService.ts"), "utf8");
assert.match(dashboardTodoSource, /buildInspirationsHref\(\{ status: "pending" \}\)/);

const dedupSource = readFileSync(path.resolve("src/lib/services/image-dedup/imageDedupService.ts"), "utf8");
assert.match(dedupSource, /buildInspirationsHref\(\{ selectedId: id \}\)/);

console.log("inspiration route compatibility verification passed");
