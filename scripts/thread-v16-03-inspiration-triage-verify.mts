import assert from "node:assert/strict";
import {
  buildInspirationInboxPrimaryFields,
  getInspirationInboxTriage,
} from "../src/components/inspirations/inspiration-inbox-view";

const strongDraft = {
  title: null,
  fileName: "portable-blender.png",
  note: "Office and gym use both look plausible.",
  status: "pending",
  rejectedReason: null,
  convertedProduct: null,
  aiSuggestion: {
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
    sellingPoints: ["Portable", "Easy to clean", "USB charging"],
    riskNotes: ["Battery life needs manual confirmation"],
    copywritingDirections: ["Focus on convenience"],
    uncertaintyNotes: ["Capacity is unclear"],
    draftLabel: "AI 草稿待确认",
  },
  aiDraftJobs: [],
};

const weakDraft = {
  title: null,
  fileName: "unknown.png",
  note: null,
  status: "pending",
  rejectedReason: null,
  convertedProduct: null,
  aiSuggestion: {
    titleSuggestion: "",
    shortDescription: "",
    possibleCategory: "",
    possibleProductType: "",
    colors: [],
    materials: [],
    styleKeywords: [],
    suitablePlatforms: [],
    visibleElements: [],
    useScenarios: [],
    targetAudience: [],
    sellingPoints: [],
    riskNotes: [],
    copywritingDirections: [],
    uncertaintyNotes: [],
    draftLabel: "",
  },
  aiDraftJobs: [],
};

const strongTriage = getInspirationInboxTriage(strongDraft);
assert.equal(strongTriage.dimensions.length, 6);
assert.equal(strongTriage.isReady, true);
assert.equal(typeof strongTriage.totalScore, "number");
assert.equal(strongTriage.scoreLabel, `${strongTriage.totalScore} / 100`);
assert.equal(strongTriage.disclaimer, "仅用于线索初筛，不代表正式商品评估。");
assert.match(strongTriage.conclusion, /优先保留|可以保留|暂存观察|建议放弃/);

const strongFields = buildInspirationInboxPrimaryFields(strongDraft);
assert.equal(strongFields.find((field) => field.label === "草稿初筛分")?.value, strongTriage.scoreLabel);
assert.equal(strongFields.find((field) => field.label === "初筛结论")?.value, strongTriage.conclusion);
assert.equal(strongFields.find((field) => field.label === "下一步建议")?.value, strongTriage.nextStep);

const weakTriage = getInspirationInboxTriage(weakDraft);
assert.equal(weakTriage.isReady, false);
assert.equal(weakTriage.totalScore, null);
assert.equal(weakTriage.scoreLabel, "信息不足");
assert.equal(weakTriage.conclusion, "信息不足");
assert.match(weakTriage.nextStep, /先补充更多图片线索|先补充更多线索/);

const weakFields = buildInspirationInboxPrimaryFields(weakDraft);
assert.equal(weakFields.find((field) => field.label === "草稿初筛分")?.value, "信息不足");
assert.equal(weakFields.find((field) => field.label === "初筛结论")?.value, "信息不足");
assert.equal(weakFields.find((field) => field.label === "初筛说明")?.value, "仅用于线索初筛，不代表正式商品评估。");

console.log("thread-v16-03 inspiration triage verification passed");
