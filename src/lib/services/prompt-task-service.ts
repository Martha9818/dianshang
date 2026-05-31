import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products/errors";
import { formatDateTime, OPERATION_LOG_ACTIONS } from "@/lib/modules/products";
import {
  buildPromptText,
  getImageTypeLabel,
  getPlatformLabel,
  getRecommendedSize,
  isPromptImageType,
  isPromptTaskPlatform,
  PROMPT_IMAGE_TYPES,
  PROMPT_TASK_PLATFORMS,
  type PromptImageTypeCode,
  type PromptTaskPlatformCode,
} from "@/lib/modules/prompt-task";
import { createManualMaterial, createPromptResultMaterial } from "@/lib/services/material-service";
import { createOperationLog } from "@/lib/services/operation-log-service";
import {
  ensureProductWritesAllowed,
  getRuntimeModeSummary,
  normalizeProductReadError,
  normalizeProductWriteError,
} from "@/lib/services/product-runtime-service";
import {
  getSortDirection,
  normalizePromptTaskQuery,
  type PromptTaskQuery,
} from "@/lib/services/query-service";

export const PROMPT_TASK_STATUS = {
  PENDING: "待生成",
  COPIED: "已复制",
  RETURNED: "已回传",
  CANCELLED: "已取消",
} as const;

export const PROMPT_TASK_UPLOAD_BLOCKED_STATUSES = new Set<string>([PROMPT_TASK_STATUS.CANCELLED]);

const promptTaskSelect = {
  id: true,
  taskCode: true,
  productId: true,
  platform: true,
  imageType: true,
  recommendedSize: true,
  promptText: true,
  status: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      name: true,
      spu: true,
      categoryLevel1: true,
      categoryLevel2: true,
      sellingPoints: true,
      painPoints: true,
      usageScenes: true,
      targetUser: true,
      mainImagePath: true,
    },
  },
  materials: {
    select: {
      id: true,
      filePath: true,
      version: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.PromptTaskSelect;

export type PromptTaskListFilters = PromptTaskQuery;

type PromptTaskRecord = Prisma.PromptTaskGetPayload<{ select: typeof promptTaskSelect }>;

function nowTaskTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function randomSuffix(length = 4) {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

function normalizePlatform(platform: string): PromptTaskPlatformCode {
  if (!isPromptTaskPlatform(platform)) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "请选择有效平台。");
  }

  return platform;
}

function normalizeImageType(imageType: string): PromptImageTypeCode {
  if (!isPromptImageType(imageType)) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "请选择有效图片类型。");
  }

  return imageType;
}

function buildPromptTaskWhere(filters?: PromptTaskListFilters): Prisma.PromptTaskWhereInput {
  const andConditions: Prisma.PromptTaskWhereInput[] = [{ product: { deletedAt: null } }];

  if (filters?.productId) andConditions.push({ productId: filters.productId });
  if (filters?.platform) andConditions.push({ platform: filters.platform });
  if (filters?.imageType) andConditions.push({ imageType: filters.imageType });
  if (filters?.recommendedSize) andConditions.push({ recommendedSize: filters.recommendedSize });
  if (filters?.status) {
    andConditions.push({ status: filters.status });
  } else {
    andConditions.push({ status: { not: PROMPT_TASK_STATUS.CANCELLED } });
  }
  if (filters?.keyword) {
    andConditions.push({
      OR: [
        { taskCode: { contains: filters.keyword } },
        { platform: { contains: filters.keyword } },
        { imageType: { contains: filters.keyword } },
        { product: { name: { contains: filters.keyword } } },
        { product: { spu: { contains: filters.keyword } } },
      ],
    });
  }

  return { AND: andConditions };
}

async function buildUniqueTaskCode(input: {
  productId: number;
  platform: string;
  imageType: string;
}) {
  const baseCode = `PT-${input.productId}-${input.platform}-${input.imageType}-${nowTaskTimestamp()}`;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const taskCode = attempt === 0 ? baseCode : `${baseCode}-${randomSuffix()}`;
    const existing = await prisma.promptTask.findUnique({
      where: { taskCode },
      select: { id: true },
    });

    if (!existing) {
      return taskCode;
    }
  }

  return `${baseCode}-${randomSuffix(6)}`;
}

function mapPromptTask(task: PromptTaskRecord) {
  const latestMaterial = task.materials[0] ?? null;
  const platform = task.platform ?? "xiaohongshu";
  const imageType = task.imageType ?? "cover";
  const promptText =
    task.promptText?.includes("未填写")
      ? buildPromptText({
          product: task.product,
          platform,
          imageType,
          recommendedSize: task.recommendedSize ?? getRecommendedSize(platform, imageType),
        })
      : task.promptText;

  return {
    ...task,
    promptText,
    platformLabel: getPlatformLabel(task.platform),
    imageTypeLabel: getImageTypeLabel(task.imageType),
    formattedUpdatedAt: formatDateTime(task.updatedAt),
    formattedCreatedAt: formatDateTime(task.createdAt),
    latestMaterialPath: latestMaterial?.filePath ?? null,
    latestMaterialVersion: latestMaterial?.version ?? null,
  };
}

export function getPromptTaskStatusTone(status: string | null | undefined) {
  if (status === PROMPT_TASK_STATUS.RETURNED) return "blue" as const;
  if (status === PROMPT_TASK_STATUS.COPIED) return "green" as const;
  if (status === PROMPT_TASK_STATUS.CANCELLED) return "red" as const;
  return "amber" as const;
}

export async function getPromptTaskProductOptions() {
  try {
    return prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        spu: true,
        targetPlatforms: true,
        categoryLevel1: true,
        categoryLevel2: true,
      },
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getPromptTaskPageData(filters?: PromptTaskListFilters) {
  try {
    const query = normalizePromptTaskQuery(filters);
    const [products, tasks] = await Promise.all([
      getPromptTaskProductOptions(),
      prisma.promptTask.findMany({
        where: buildPromptTaskWhere(query),
        orderBy: { createdAt: getSortDirection(query.sort) },
        select: promptTaskSelect,
        take: 100,
      }),
    ]);

    const recommendedSizes = Array.from(
      new Set(tasks.map((task) => task.recommendedSize).filter((value): value is string => Boolean(value))),
    ).sort();

    return {
      products,
      tasks: tasks.map(mapPromptTask),
      recommendedSizes,
      platforms: PROMPT_TASK_PLATFORMS,
      imageTypes: PROMPT_IMAGE_TYPES,
      statuses: Object.values(PROMPT_TASK_STATUS),
      runtime: getRuntimeModeSummary(),
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getProductPromptTasks(productId: number) {
  try {
    const tasks = await prisma.promptTask.findMany({
      where: {
        productId,
        product: { deletedAt: null },
      },
      orderBy: { updatedAt: "desc" },
      select: promptTaskSelect,
    });

    return tasks.map(mapPromptTask);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getPromptTaskUploadData(taskCode: string) {
  try {
    const task = await prisma.promptTask.findUnique({
      where: { taskCode },
      select: promptTaskSelect,
    });

    return task ? mapPromptTask(task) : null;
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function createPromptTask(input: {
  productId: number;
  platform: string;
  imageType: string;
  recommendedSize?: string | null;
}) {
  try {
    ensureProductWritesAllowed();

    const platform = normalizePlatform(input.platform);
    const imageType = normalizeImageType(input.imageType);
    const product = await prisma.product.findFirst({
      where: {
        id: input.productId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        categoryLevel1: true,
        categoryLevel2: true,
        sellingPoints: true,
        painPoints: true,
        usageScenes: true,
        targetUser: true,
      },
    });

    if (!product) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "商品不存在或已删除。");
    }

    const recommendedSize = input.recommendedSize?.trim() || getRecommendedSize(platform, imageType);
    const taskCode = await buildUniqueTaskCode({
      productId: product.id,
      platform,
      imageType,
    });
    const promptText = buildPromptText({
      product,
      platform,
      imageType,
      recommendedSize,
    });

    const task = await prisma.promptTask.create({
      data: {
        taskCode,
        productId: product.id,
        platform,
        imageType,
        recommendedSize,
        promptText,
        status: PROMPT_TASK_STATUS.PENDING,
        version: "v1",
      },
      select: promptTaskSelect,
    });

    await createOperationLog({
      productId: product.id,
      action: OPERATION_LOG_ACTIONS.CREATE_PROMPT_TASK,
      detail: `创建 Prompt 任务：${taskCode} / ${getPlatformLabel(platform)} / ${getImageTypeLabel(imageType)}`,
    });

    return mapPromptTask(task);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function markPromptTaskCopied(taskCode: string) {
  try {
    ensureProductWritesAllowed();

    const task = await prisma.promptTask.findUnique({
      where: { taskCode },
      select: { id: true, productId: true, status: true, promptText: true },
    });

    if (!task) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "找不到 Prompt Task。");
    }

    if (task.status !== PROMPT_TASK_STATUS.CANCELLED) {
      await prisma.promptTask.update({
        where: { taskCode },
        data: { status: PROMPT_TASK_STATUS.COPIED },
      });
    }

    await createOperationLog({
      productId: task.productId,
      action: OPERATION_LOG_ACTIONS.COPY_PROMPT_TASK,
      detail: `复制 Prompt 任务：${taskCode}`,
    });

    return { promptText: task.promptText ?? "" };
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function cancelPromptTask(taskCode: string) {
  try {
    ensureProductWritesAllowed();

    const task = await prisma.promptTask.findUnique({
      where: { taskCode },
      select: { id: true, productId: true, status: true },
    });

    if (!task) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "找不到 Prompt Task。");
    }

    if (task.status === PROMPT_TASK_STATUS.RETURNED) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "已回传任务不能取消。");
    }

    await prisma.promptTask.update({
      where: { taskCode },
      data: { status: PROMPT_TASK_STATUS.CANCELLED },
    });

    await createOperationLog({
      productId: task.productId,
      action: OPERATION_LOG_ACTIONS.CANCEL_PROMPT_TASK,
      detail: `取消 Prompt 任务：${taskCode}`,
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function uploadPromptTaskResult(input: {
  taskCode: string;
  file: File;
}) {
  try {
    ensureProductWritesAllowed();

    const task = await prisma.promptTask.findUnique({
      where: { taskCode: input.taskCode },
      select: {
        id: true,
        taskCode: true,
        productId: true,
        platform: true,
        imageType: true,
        status: true,
      },
    });

    if (!task) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "找不到 Prompt Task。");
    }

    if (PROMPT_TASK_UPLOAD_BLOCKED_STATUSES.has(task.status)) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "任务已取消，不能回传图片。");
    }

    const material = await createPromptResultMaterial({
      productId: task.productId,
      promptTaskId: task.id,
      platform: task.platform ?? "xianyu",
      imageType: task.imageType ?? "main",
      file: input.file,
    });

    await prisma.promptTask.update({
      where: { id: task.id },
      data: {
        status: PROMPT_TASK_STATUS.RETURNED,
        version: material.version,
      },
    });

    await createOperationLog({
      productId: task.productId,
      action: OPERATION_LOG_ACTIONS.UPLOAD_PROMPT_RESULT,
      detail: `回传 Prompt 结果图：${task.taskCode} / materialId=${material.id} / ${material.version}`,
    });

    return material;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function uploadManualMaterial(input: {
  productId: number;
  platform: string;
  materialType: string;
  file: File;
}) {
  return createManualMaterial(input);
}

export async function getHomePromptTaskStats() {
  try {
    const [totalCount, pendingReturnCount, recentTasks] = await Promise.all([
      prisma.promptTask.count({
        where: { product: { deletedAt: null } },
      }),
      prisma.promptTask.count({
        where: {
          status: { in: [PROMPT_TASK_STATUS.PENDING, PROMPT_TASK_STATUS.COPIED] },
          product: { deletedAt: null },
        },
      }),
      prisma.promptTask.findMany({
        where: { product: { deletedAt: null } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: promptTaskSelect,
      }),
    ]);

    return {
      totalCount,
      pendingReturnCount,
      recentTasks: recentTasks.map(mapPromptTask),
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}
