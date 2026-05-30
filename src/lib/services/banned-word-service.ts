import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { BANNED_WORD_RISK_LEVELS, COPYWRITING_AUDIT_STATUS } from "@/lib/modules/copywriting/prompts";
import { tryCreateSettingsOperationLog } from "@/lib/services/operation-log-service";
import { ensureProductWritesAllowed, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

export type BannedWordRecord = {
  id: number;
  word: string;
  category: string;
  riskLevel: string;
  createdAt: Date;
};

export type BannedWordFormValues = {
  word: string;
  category: string;
  riskLevel: string;
};

export type BannedWordHit = {
  word: string;
  category: string;
  riskLevel: string;
  field: string;
  matchedText: string;
};

const DEFAULT_CATEGORIES = ["绝对化用语", "夸大承诺词", "医疗功效词", "宠物用品风险词", "站外交易风险词"];
const DEFAULT_RISK_LEVELS = [BANNED_WORD_RISK_LEVELS.HIGH, BANNED_WORD_RISK_LEVELS.MEDIUM, BANNED_WORD_RISK_LEVELS.LOW];

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createDuplicateError(word: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.BANNED_WORD_DUPLICATE, `违规词“${word}”已存在`);
}

function normalizeRiskLevel(value: string) {
  const trimmed = value.trim();
  if (trimmed === "high") return BANNED_WORD_RISK_LEVELS.HIGH;
  if (trimmed === "medium") return BANNED_WORD_RISK_LEVELS.MEDIUM;
  if (trimmed === "low") return BANNED_WORD_RISK_LEVELS.LOW;
  return trimmed;
}

export function normalizeBannedWordInput(values: BannedWordFormValues) {
  const word = values.word.trim();
  const category = values.category.trim();
  const riskLevel = normalizeRiskLevel(values.riskLevel);

  if (!word) {
    throw createValidationError("违规词不能为空。");
  }

  if (!category) {
    throw createValidationError("分类不能为空。");
  }

  if (!riskLevel) {
    throw createValidationError("风险等级不能为空。");
  }

  return {
    word,
    category,
    riskLevel,
  };
}

export function extractBannedWordFormValues(formData: FormData): BannedWordFormValues {
  return {
    word: String(formData.get("word") ?? ""),
    category: String(formData.get("category") ?? ""),
    riskLevel: String(formData.get("riskLevel") ?? ""),
  };
}

export function buildBannedWordsText(words: Array<Pick<BannedWordRecord, "word" | "category" | "riskLevel">>) {
  if (words.length === 0) {
    return "暂无违规词。";
  }

  return words.map((item) => `${item.word}（${item.category} / ${item.riskLevel}风险）`).join("；");
}

export async function getBannedWordSettingsPageData(filters?: { query?: string; category?: string; riskLevel?: string }) {
  try {
    const query = filters?.query?.trim() ?? "";
    const category = filters?.category?.trim() ?? "";
    const riskLevel = normalizeOptionalText(filters?.riskLevel) ?? "";
    const where = {
      ...(query
        ? {
            word: {
              contains: query,
            },
          }
        : {}),
      ...(category ? { category } : {}),
      ...(riskLevel ? { riskLevel } : {}),
    };

    const [totalCount, highRiskCount, categories, words] = await Promise.all([
      prisma.bannedWord.count(),
      prisma.bannedWord.count({
        where: { riskLevel: BANNED_WORD_RISK_LEVELS.HIGH },
      }),
      prisma.bannedWord.findMany({
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
      prisma.bannedWord.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    ]);

    return {
      stats: {
        totalCount,
        categoryCount: categories.length,
        highRiskCount,
      },
      filters: {
        categories: Array.from(new Set([...DEFAULT_CATEGORIES, ...categories.map((item) => item.category)])).sort((left, right) =>
          left.localeCompare(right, "zh-CN"),
        ),
        riskLevels: DEFAULT_RISK_LEVELS,
      },
      words,
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getBannedWords() {
  try {
    return await prisma.bannedWord.findMany({
      orderBy: [{ riskLevel: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function createBannedWord(values: BannedWordFormValues) {
  ensureProductWritesAllowed();

  const input = normalizeBannedWordInput(values);

  try {
    const existing = await prisma.bannedWord.findUnique({
      where: { word: input.word },
      select: { id: true },
    });

    if (existing) {
      throw createDuplicateError(input.word);
    }

    const created = await prisma.bannedWord.create({
      data: input,
    });

    await tryCreateSettingsOperationLog({ action: "CREATE_BANNED_WORD", detail: `新增违规词 ${created.word}` });

    return created;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function updateBannedWord(wordId: number, values: BannedWordFormValues) {
  ensureProductWritesAllowed();

  const input = normalizeBannedWordInput(values);

  try {
    const existing = await prisma.bannedWord.findUnique({
      where: { id: wordId },
    });

    if (!existing) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "违规词不存在。");
    }

    const duplicated = await prisma.bannedWord.findUnique({
      where: { word: input.word },
      select: { id: true },
    });

    if (duplicated && duplicated.id !== wordId) {
      throw createDuplicateError(input.word);
    }

    const updated = await prisma.bannedWord.update({
      where: { id: wordId },
      data: input,
    });

    await tryCreateSettingsOperationLog({ action: "UPDATE_BANNED_WORD", detail: `更新违规词 ${updated.word}` });

    return updated;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function deleteBannedWord(wordId: number) {
  ensureProductWritesAllowed();

  try {
    const existing = await prisma.bannedWord.findUnique({
      where: { id: wordId },
    });

    if (!existing) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "违规词不存在。");
    }

    await prisma.bannedWord.delete({
      where: { id: wordId },
    });

    await tryCreateSettingsOperationLog({ action: "DELETE_BANNED_WORD", detail: `删除违规词 ${existing.word}` });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export function detectBannedWords(input: {
  title?: string | null;
  mainCopy?: string | null;
  sellingPoints?: string[];
  faq?: string[];
  riskNotes?: string[];
  bannedWords: Array<Pick<BannedWordRecord, "word" | "category" | "riskLevel">>;
}) {
  const fields = [
    { field: "title", content: input.title ?? "" },
    { field: "mainCopy", content: input.mainCopy ?? "" },
    { field: "sellingPoints", content: (input.sellingPoints ?? []).join("\n") },
    { field: "faq", content: (input.faq ?? []).join("\n") },
    { field: "riskNotes", content: (input.riskNotes ?? []).join("\n") },
  ];

  const hits: BannedWordHit[] = [];

  for (const bannedWord of input.bannedWords) {
    const pattern = new RegExp(escapeRegExp(bannedWord.word), "gi");

    for (const field of fields) {
      if (!field.content) {
        continue;
      }

      const matched = field.content.match(pattern);
      if (!matched) {
        continue;
      }

      for (const item of matched) {
        hits.push({
          word: bannedWord.word,
          category: bannedWord.category,
          riskLevel: bannedWord.riskLevel,
          field: field.field,
          matchedText: item,
        });
      }
    }
  }

  const uniqueHits = Array.from(new Map(hits.map((item) => [`${item.word}:${item.field}:${item.matchedText}`, item])).values());
  const hasHighRisk = uniqueHits.some((item) => item.riskLevel === BANNED_WORD_RISK_LEVELS.HIGH);
  const hasAnyRisk = uniqueHits.length > 0;

  return {
    hits: uniqueHits,
    auditStatus: hasHighRisk
      ? COPYWRITING_AUDIT_STATUS.NEEDS_EDIT
      : hasAnyRisk
        ? COPYWRITING_AUDIT_STATUS.RISKY
        : COPYWRITING_AUDIT_STATUS.SAFE,
    hasHighRisk,
  };
}
