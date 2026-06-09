import assert from "node:assert/strict";
import {
  buildInspirationInboxCardSummary,
  buildInspirationInboxPrimaryFields,
  getInspirationInboxAiStatus,
  getInspirationInboxTriage,
} from "../src/components/inspirations/inspiration-inbox-view";

const sampleSuggestion = {
  titleSuggestion: "Portable Blender Cup",
  shortDescription: "A portable blending cup for office and gym users.",
  possibleCategory: "Kitchen",
  possibleProductType: "Portable Blender",
  colors: ["White", "Green"],
  materials: ["Plastic"],
  styleKeywords: ["Minimal", "Portable"],
  suitablePlatforms: ["TikTok Shop", "Temu"],
  visibleElements: ["Cup body", "Handle", "USB charging base"],
  useScenarios: ["Office desk", "Gym bag"],
  targetAudience: ["Office workers", "Fitness users"],
  sellingPoints: ["Portable", "Easy to clean"],
  riskNotes: ["Battery life needs manual confirmation"],
  copywritingDirections: ["Focus on convenience"],
  uncertaintyNotes: ["Capacity is unclear"],
  draftLabel: "AI 草稿待确认",
};

const withDraft = {
  title: null,
  fileName: "portable-blender.png",
  note: null,
  status: "pending",
  rejectedReason: null,
  convertedProduct: null,
  aiSuggestion: sampleSuggestion,
  aiDraftJobs: [],
};

const withoutDraft = {
  title: null,
  fileName: "unknown.png",
  note: null,
  status: "pending",
  rejectedReason: null,
  convertedProduct: null,
  aiSuggestion: null,
  aiDraftJobs: [],
};

const failedDraft = {
  ...withoutDraft,
  aiDraftJobs: [{ status: "failed" }],
};

const primaryFields = buildInspirationInboxPrimaryFields(withDraft);
const triage = getInspirationInboxTriage(withDraft);

assert.deepEqual(
  primaryFields.slice(0, 6).map((field) => field.label),
  ["AI 草稿状态", "候选商品名", "候选价格", "商品类型", "目标人群", "用户痛点"],
);
assert.equal(primaryFields.find((field) => field.label === "候选商品名")?.value, "Portable Blender Cup");
assert.equal(primaryFields.find((field) => field.label === "候选价格")?.value, "待补充");
assert.equal(primaryFields.find((field) => field.label === "商品类型")?.value, "Portable Blender");
assert.equal(primaryFields.find((field) => field.label === "建议平台")?.value, "TikTok Shop、Temu");
assert.equal(primaryFields.find((field) => field.label === "可见文字摘要")?.value, "尚未生成");
assert.equal(primaryFields.find((field) => field.label === "草稿初筛分")?.value, triage.scoreLabel);
assert.equal(primaryFields.find((field) => field.label === "初筛结论")?.value, triage.conclusion);

const noDraftFields = buildInspirationInboxPrimaryFields(withoutDraft);
assert.equal(noDraftFields.find((field) => field.label === "商品类型")?.value, "信息不足");
assert.equal(noDraftFields.find((field) => field.label === "候选价格")?.value, "待补充");
assert.equal(noDraftFields.find((field) => field.label === "下一步建议")?.value, "先生成 AI 草稿，再决定保留、放弃或转商品。");
assert.equal(noDraftFields.find((field) => field.label === "草稿初筛分")?.value, "信息不足");

const aiStatus = getInspirationInboxAiStatus(withDraft);
assert.equal(aiStatus.label, "AI 草稿待确认");
assert.match(aiStatus.description, /先核对图片和 AI 草稿/);

const failedStatus = getInspirationInboxAiStatus(failedDraft);
assert.equal(failedStatus.label, "AI 草稿待重试");
assert.match(failedStatus.description, /可先补充人工备注或重试/);

const emptyStatus = getInspirationInboxAiStatus(withoutDraft);
assert.equal(emptyStatus.label, "尚未生成 AI 草稿");
assert.match(emptyStatus.description, /先生成 AI 草稿/);

const cardSummary = buildInspirationInboxCardSummary(withDraft);
assert.equal(cardSummary.title, "Portable Blender Cup");
assert.equal(cardSummary.productType, "Portable Blender");
assert.equal(cardSummary.targetAudience, "Office workers、Fitness users");
assert.equal(cardSummary.nextStep, triage.nextStep);

console.log("thread-v16-02 inspiration inbox verification passed");
