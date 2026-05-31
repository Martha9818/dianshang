import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import type { LookupFunction } from "node:net";
import { URL } from "node:url";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError, formatDateTime } from "@/lib/modules/products";
import { assertSupportedImageFile, storeImageFile } from "@/lib/services/images";
import { createShortFileName, toSafeRelativePath } from "@/lib/services/local-paths/pathSafetyService";
import { getRuntimeModeSummary, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";
import {
  LINK_IMPORT_PLATFORMS,
  LINK_IMPORT_PURPOSES,
  LINK_IMPORT_QUALITY_LEVELS,
  LINK_IMPORT_READONLY_MESSAGE,
  LINK_IMPORT_STATUSES,
  isLinkImportPurpose,
  type LinkImportPlatform,
  type LinkImportPurpose,
  type LinkImportQualityLevel,
  type LinkImportStatus,
} from "./linkImportTypes";

const MAX_META_BYTES = 384 * 1024;
const MAX_REDIRECTS = 2;
const META_TIMEOUT_MS = 6000;

const linkImportDraftSelect = {
  id: true,
  url: true,
  normalizedUrl: true,
  sourcePlatform: true,
  purpose: true,
  status: true,
  qualityLevel: true,
  manualText: true,
  screenshotMaterialId: true,
  screenshotPath: true,
  screenshotThumbnailPath: true,
  screenshotFileHash: true,
  note: true,
  metaTitle: true,
  metaDescription: true,
  errorSummary: true,
  productId: true,
  competitorId: true,
  convertedInspirationId: true,
  createdAt: true,
  updatedAt: true,
  product: { select: { id: true, name: true, spu: true, deletedAt: true } },
  competitor: { select: { id: true, title: true, productId: true } },
  convertedInspiration: { select: { id: true, title: true, status: true } },
} satisfies Prisma.LinkImportDraftSelect;

type LinkImportDraftRecord = Prisma.LinkImportDraftGetPayload<{ select: typeof linkImportDraftSelect }>;

type PublicMetaResult = {
  title: string | null;
  description: string | null;
};

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createReadonlyError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, LINK_IMPORT_READONLY_MESSAGE);
}

function ensureLinkImportWritesAllowed() {
  const runtime = getRuntimeModeSummary();
  if (!runtime.isWritable) {
    throw createReadonlyError();
  }
}

function normalizeOptionalText(value: string | null | undefined, maxLength = 800) {
  const trimmed = String(value ?? "").replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeLongText(value: string | null | undefined, maxLength = 6000) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function sanitizeSegment(value: string, fallback: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function normalizePurpose(value: string): LinkImportPurpose {
  const purpose = value.trim();
  if (!isLinkImportPurpose(purpose)) {
    throw createValidationError("请选择有效的链接用途。");
  }
  return purpose;
}

function normalizeUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw createValidationError("请粘贴一个商品或竞品链接。");
  }

  const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw createValidationError("链接格式无效，请检查后重新粘贴。");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw createValidationError("仅支持 http 或 https 链接。");
  }

  parsed.hash = "";
  parsed.username = "";
  parsed.password = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  if ((parsed.protocol === "https:" && parsed.port === "443") || (parsed.protocol === "http:" && parsed.port === "80")) {
    parsed.port = "";
  }

  assertPublicUrl(parsed);
  return parsed.toString();
}

function classifySourcePlatform(normalizedUrl: string | null): LinkImportPlatform {
  if (!normalizedUrl) return LINK_IMPORT_PLATFORMS.OTHER;
  const hostname = new URL(normalizedUrl).hostname.toLowerCase();

  if (hostname.endsWith("taobao.com") || hostname.endsWith("tmall.com")) return LINK_IMPORT_PLATFORMS.TAOBAO;
  if (hostname.endsWith("goofish.com") || hostname.endsWith("2.taobao.com")) return LINK_IMPORT_PLATFORMS.XIAN_YU;
  if (hostname.endsWith("xiaohongshu.com") || hostname.endsWith("xhslink.com")) return LINK_IMPORT_PLATFORMS.XIAO_HONG_SHU;
  if (hostname.endsWith("douyin.com") || hostname.endsWith("iesdouyin.com")) return LINK_IMPORT_PLATFORMS.DOU_YIN;
  if (hostname.endsWith("1688.com")) return LINK_IMPORT_PLATFORMS.ALIBABA_1688;
  return LINK_IMPORT_PLATFORMS.OTHER;
}

function isBlockedHostname(hostname: string) {
  const lower = hostname.toLowerCase();
  return lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".local");
}

function parseIpv4(address: string) {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  const numbers = parts.map((part) => Number(part));
  if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return numbers;
}

function isPrivateIpv4(address: string) {
  const parts = parseIpv4(address);
  if (!parts) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fe80:")) return true;
  if (/^f[cd][0-9a-f]{0,2}:/i.test(normalized)) return true;

  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4[1]) : false;
}

function isPrivateAddress(address: string) {
  const family = net.isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return false;
}

function assertPublicUrl(url: URL) {
  if (isBlockedHostname(url.hostname)) {
    throw createValidationError("链接指向本机或私有地址，已阻止处理。");
  }

  if (isPrivateAddress(url.hostname)) {
    throw createValidationError("链接指向本机或私有网段，已阻止处理。");
  }
}

function createSafeLookup(): LookupFunction {
  return (hostname, options, callback) => {
    if (isBlockedHostname(hostname)) {
      callback(new Error("blocked private host"), "", 4);
      return;
    }

    dns.lookup(hostname, options, (error, address, family) => {
      if (error) {
        callback(error, address as never, family as never);
        return;
      }

      const addresses = Array.isArray(address) ? address : [{ address, family }];
      if (addresses.some((entry) => isPrivateAddress(entry.address))) {
        callback(new Error("blocked private address"), "", 4);
        return;
      }

      callback(null, address as never, family as never);
    });
  };
}

function fetchHtml(urlText: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  const url = new URL(urlText);
  assertPublicUrl(url);
  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(
      url,
      {
        method: "GET",
        timeout: META_TIMEOUT_MS,
        lookup: createSafeLookup(),
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
          "User-Agent": "EcomPilot-LinkImport/1.0",
        },
      },
      (response) => {
        const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
        if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
          response.resume();
          reject(new Error("unsupported content type"));
          return;
        }

        const chunks: Buffer[] = [];
        let received = 0;
        response.on("data", (chunk: Buffer) => {
          received += chunk.length;
          if (received > MAX_META_BYTES) {
            request.destroy(new Error("response too large"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    request.on("timeout", () => request.destroy(new Error("request timeout")));
    request.on("error", reject);
    request.end();
  });
}

function resolveRedirectUrl(currentUrl: string, location: string | string[] | undefined) {
  const nextLocation = Array.isArray(location) ? location[0] : location;
  if (!nextLocation) return null;
  const nextUrl = new URL(nextLocation, currentUrl);
  assertPublicUrl(nextUrl);
  if (nextUrl.protocol !== "https:" && nextUrl.protocol !== "http:") {
    throw new Error("unsupported redirect protocol");
  }
  return nextUrl.toString();
}

async function tryReadPublicMeta(normalizedUrl: string): Promise<PublicMetaResult> {
  let currentUrl = normalizedUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetchHtml(currentUrl);
    if (response.statusCode >= 300 && response.statusCode < 400) {
      const redirectUrl = resolveRedirectUrl(currentUrl, response.headers.location);
      if (!redirectUrl) break;
      currentUrl = redirectUrl;
      continue;
    }

    if (response.statusCode >= 400) {
      throw new Error("public metadata unavailable");
    }

    return parsePublicMeta(response.body);
  }

  throw new Error("too many redirects");
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getTitleFromHtml(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeOptionalText(decodeHtml(match[1]), 240) : null;
}

function getMetaContent(html: string, names: string[]) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const nameMatch = tag.match(/\b(?:name|property)=["']([^"']+)["']/i);
    const contentMatch = tag.match(/\bcontent=["']([^"']*)["']/i);
    if (!nameMatch || !contentMatch) continue;
    const name = nameMatch[1].toLowerCase();
    if (names.includes(name)) {
      return normalizeOptionalText(decodeHtml(contentMatch[1]), 500);
    }
  }
  return null;
}

function parsePublicMeta(html: string): PublicMetaResult {
  return {
    title: getMetaContent(html, ["og:title", "twitter:title"]) ?? getTitleFromHtml(html),
    description: getMetaContent(html, ["og:description", "description", "twitter:description"]),
  };
}

function scoreQuality(input: {
  normalizedUrl: string | null;
  manualText: string | null;
  note: string | null;
  screenshotPath: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  failed?: boolean;
}): LinkImportQualityLevel {
  if (input.failed || !input.normalizedUrl) return LINK_IMPORT_QUALITY_LEVELS.FAILED;
  if (input.screenshotPath || (input.manualText && input.manualText.length >= 160)) return LINK_IMPORT_QUALITY_LEVELS.HIGH;
  if (input.manualText || input.note || input.metaTitle || input.metaDescription) return LINK_IMPORT_QUALITY_LEVELS.MEDIUM;
  return LINK_IMPORT_QUALITY_LEVELS.LOW;
}

function getQualityTone(qualityLevel: string | null) {
  if (qualityLevel === LINK_IMPORT_QUALITY_LEVELS.HIGH) return "green" as const;
  if (qualityLevel === LINK_IMPORT_QUALITY_LEVELS.MEDIUM) return "blue" as const;
  if (qualityLevel === LINK_IMPORT_QUALITY_LEVELS.LOW) return "amber" as const;
  if (qualityLevel === LINK_IMPORT_QUALITY_LEVELS.FAILED) return "red" as const;
  return "slate" as const;
}

function getStatusTone(status: string) {
  if (status === LINK_IMPORT_STATUSES.CONVERTED) return "green" as const;
  if (status === LINK_IMPORT_STATUSES.FAILED) return "red" as const;
  if (status === LINK_IMPORT_STATUSES.REJECTED) return "slate" as const;
  if (status === LINK_IMPORT_STATUSES.NEEDS_REVIEW) return "blue" as const;
  return "amber" as const;
}

function buildPurposeLabel(purpose: string) {
  if (purpose === LINK_IMPORT_PURPOSES.INSPIRATION) return "灵感";
  if (purpose === LINK_IMPORT_PURPOSES.PRODUCT_CANDIDATE) return "商品候选";
  if (purpose === LINK_IMPORT_PURPOSES.COMPETITOR_REFERENCE) return "竞品参考";
  return purpose;
}

function buildSourceLabel(record: LinkImportDraftRecord) {
  if (record.convertedInspiration) {
    return `已转灵感 #${record.convertedInspiration.id}`;
  }
  if (record.product && !record.product.deletedAt) {
    return `已关联商品 ${record.product.name}`;
  }
  if (record.competitor) {
    return `已关联竞品 ${record.competitor.title}`;
  }
  return "未转化";
}

function mapLinkImportDraft(record: LinkImportDraftRecord) {
  return {
    ...record,
    displayScreenshotPath: record.screenshotThumbnailPath ?? record.screenshotPath,
    purposeLabel: buildPurposeLabel(record.purpose),
    conversionLabel: buildSourceLabel(record),
    statusTone: getStatusTone(record.status),
    qualityTone: getQualityTone(record.qualityLevel),
    formattedCreatedAt: formatDateTime(record.createdAt),
    formattedUpdatedAt: formatDateTime(record.updatedAt),
  };
}

async function storeLinkImportScreenshot(input: { file: File; purpose: LinkImportPurpose }) {
  const extension = assertSupportedImageFile(input.file, { label: "链接导入辅助截图" }).extension;
  const fileName = createShortFileName({ prefix: "link-import", extension });
  const relativePath = toSafeRelativePath(
    "uploads",
    "link-imports",
    sanitizeSegment(input.purpose, "draft"),
    fileName,
  );

  return storeImageFile({
    file: input.file,
    label: "链接导入辅助截图",
    relativePath,
  });
}

async function recordLinkImportOperation(input: {
  productId?: number | null;
  inspirationId?: number | null;
  action: string;
  detail: string;
}) {
  return prisma.operationLog.create({
    data: {
      productId: input.productId ?? null,
      relatedInspirationId: input.inspirationId ?? null,
      action: input.action,
      detail: input.detail,
    },
  });
}

export async function createLinkImportDraft(input: {
  url: string;
  purpose: string;
  note?: string | null;
  manualText?: string | null;
  screenshot?: File | null;
}) {
  ensureLinkImportWritesAllowed();

  try {
    const purpose = normalizePurpose(input.purpose || LINK_IMPORT_PURPOSES.INSPIRATION);
    const note = normalizeLongText(input.note, 1200);
    const manualText = normalizeLongText(input.manualText);
    const hasScreenshot = input.screenshot instanceof File && input.screenshot.size > 0;
    let normalizedUrl: string | null = null;
    let errorSummary: string | null = null;
    let status: LinkImportStatus = LINK_IMPORT_STATUSES.NEEDS_REVIEW;

    try {
      normalizedUrl = normalizeUrl(input.url);
    } catch (error) {
      status = LINK_IMPORT_STATUSES.FAILED;
      errorSummary = error instanceof ProductBusinessError ? error.message : "链接无效或不允许处理。";
    }

    let screenshotPath: string | null = null;
    let screenshotThumbnailPath: string | null = null;
    let screenshotFileHash: string | null = null;

    if (hasScreenshot) {
      const stored = await storeLinkImportScreenshot({ file: input.screenshot!, purpose });
      screenshotPath = stored.filePath;
      screenshotThumbnailPath = stored.thumbnailPath;
      screenshotFileHash = stored.fileHash;
    }

    let metaTitle: string | null = null;
    let metaDescription: string | null = null;
    if (normalizedUrl) {
      try {
        const meta = await tryReadPublicMeta(normalizedUrl);
        metaTitle = meta.title;
        metaDescription = meta.description;
      } catch {
        errorSummary = "公开元信息不可用，已保留为手动草稿。";
      }
    }

    const qualityLevel = scoreQuality({
      normalizedUrl,
      manualText,
      note,
      screenshotPath,
      metaTitle,
      metaDescription,
      failed: status === LINK_IMPORT_STATUSES.FAILED,
    });

    const draft = await prisma.linkImportDraft.create({
      data: {
        url: input.url.trim().slice(0, 2000),
        normalizedUrl,
        sourcePlatform: classifySourcePlatform(normalizedUrl),
        purpose,
        status,
        qualityLevel,
        manualText,
        screenshotPath,
        screenshotThumbnailPath,
        screenshotFileHash,
        note,
        metaTitle,
        metaDescription,
        errorSummary,
      },
      select: linkImportDraftSelect,
    });

    await recordLinkImportOperation({
      action: "CREATE_LINK_IMPORT_DRAFT",
      detail: `创建链接导入草稿：draftId=${draft.id} / purpose=${purpose} / quality=${qualityLevel}`,
    });

    return mapLinkImportDraft(draft);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function updateLinkImportDraft(input: {
  draftId: number;
  purpose: string;
  note?: string | null;
  manualText?: string | null;
}) {
  ensureLinkImportWritesAllowed();

  try {
    const existing = await prisma.linkImportDraft.findUnique({ where: { id: input.draftId }, select: linkImportDraftSelect });
    if (!existing) throw createValidationError("链接导入草稿不存在。");

    const purpose = normalizePurpose(input.purpose || existing.purpose);
    const note = normalizeLongText(input.note, 1200);
    const manualText = normalizeLongText(input.manualText);
    const qualityLevel = scoreQuality({
      normalizedUrl: existing.normalizedUrl,
      manualText,
      note,
      screenshotPath: existing.screenshotPath,
      metaTitle: existing.metaTitle,
      metaDescription: existing.metaDescription,
      failed: existing.status === LINK_IMPORT_STATUSES.FAILED,
    });

    const updated = await prisma.linkImportDraft.update({
      where: { id: input.draftId },
      data: {
        purpose,
        note,
        manualText,
        qualityLevel,
        status: existing.status === LINK_IMPORT_STATUSES.FAILED ? LINK_IMPORT_STATUSES.FAILED : LINK_IMPORT_STATUSES.NEEDS_REVIEW,
      },
      select: linkImportDraftSelect,
    });

    await recordLinkImportOperation({
      productId: updated.productId,
      inspirationId: updated.convertedInspirationId,
      action: "EDIT_LINK_IMPORT_DRAFT",
      detail: `编辑链接导入草稿：draftId=${updated.id} / quality=${qualityLevel}`,
    });

    return mapLinkImportDraft(updated);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function rejectLinkImportDraft(draftId: number) {
  ensureLinkImportWritesAllowed();

  try {
    const updated = await prisma.linkImportDraft.update({
      where: { id: draftId },
      data: { status: LINK_IMPORT_STATUSES.REJECTED },
      select: linkImportDraftSelect,
    });

    await recordLinkImportOperation({
      productId: updated.productId,
      inspirationId: updated.convertedInspirationId,
      action: "REJECT_LINK_IMPORT_DRAFT",
      detail: `放弃或归档链接导入草稿：draftId=${updated.id}`,
    });

    return mapLinkImportDraft(updated);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function linkImportDraftToProduct(input: { draftId: number; productId: number }) {
  ensureLinkImportWritesAllowed();

  try {
    const product = await prisma.product.findFirst({
      where: { id: input.productId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!product) throw createValidationError("关联商品不存在或已删除。");

    const updated = await prisma.linkImportDraft.update({
      where: { id: input.draftId },
      data: {
        productId: product.id,
        status: LINK_IMPORT_STATUSES.CONVERTED,
      },
      select: linkImportDraftSelect,
    });

    await recordLinkImportOperation({
      productId: product.id,
      action: "LINK_IMPORT_DRAFT_TO_PRODUCT",
      detail: `链接导入草稿关联商品：draftId=${updated.id} / productId=${product.id}`,
    });

    return mapLinkImportDraft(updated);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function linkImportDraftToCompetitor(input: { draftId: number; competitorId: number }) {
  ensureLinkImportWritesAllowed();

  try {
    const competitor = await prisma.competitor.findUnique({
      where: { id: input.competitorId },
      select: { id: true, productId: true, title: true },
    });
    if (!competitor) throw createValidationError("关联竞品不存在。");

    const updated = await prisma.linkImportDraft.update({
      where: { id: input.draftId },
      data: {
        competitorId: competitor.id,
        productId: competitor.productId,
        status: LINK_IMPORT_STATUSES.CONVERTED,
      },
      select: linkImportDraftSelect,
    });

    await recordLinkImportOperation({
      productId: competitor.productId,
      action: "LINK_IMPORT_DRAFT_TO_COMPETITOR",
      detail: `链接导入草稿关联已有竞品：draftId=${updated.id} / competitorId=${competitor.id}`,
    });

    return mapLinkImportDraft(updated);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function linkImportDraftToInspiration(draftId: number) {
  ensureLinkImportWritesAllowed();

  try {
    const draft = await prisma.linkImportDraft.findUnique({ where: { id: draftId }, select: linkImportDraftSelect });
    if (!draft) throw createValidationError("链接导入草稿不存在。");
    if (!draft.screenshotPath || !draft.screenshotFileHash) {
      throw createValidationError("转为灵感需要先在链接草稿中上传辅助截图。");
    }

    const title = normalizeOptionalText(draft.metaTitle ?? draft.note ?? draft.normalizedUrl ?? draft.url, 120) ?? `链接灵感 #${draft.id}`;
    const noteParts = [
      draft.normalizedUrl ? `来源链接：${draft.normalizedUrl}` : null,
      draft.note ? `备注：${draft.note}` : null,
      draft.manualText ? `页面文本：${draft.manualText.slice(0, 1200)}` : null,
      draft.metaDescription ? `公开摘要：${draft.metaDescription}` : null,
    ].filter(Boolean);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.inspiration.findUnique({
        where: { fileHash: draft.screenshotFileHash! },
        select: { id: true },
      });

      const inspiration =
        existing ??
        (await tx.inspiration.create({
          data: {
            title,
            note: noteParts.join("\n"),
            imagePath: draft.screenshotPath!,
            thumbnailPath: draft.screenshotThumbnailPath,
            fileHash: draft.screenshotFileHash!,
            sourceType: "link_import",
            usagePermission: "unknown",
            status: "pending",
          },
          select: { id: true },
        }));

      const updatedDraft = await tx.linkImportDraft.update({
        where: { id: draft.id },
        data: {
          convertedInspirationId: inspiration.id,
          status: LINK_IMPORT_STATUSES.CONVERTED,
        },
        select: linkImportDraftSelect,
      });

      await tx.operationLog.create({
        data: {
          relatedInspirationId: inspiration.id,
          action: "LINK_IMPORT_DRAFT_TO_INSPIRATION",
          detail: `链接导入草稿转灵感：draftId=${draft.id} / inspirationId=${inspiration.id}`,
        },
      });

      return updatedDraft;
    });

    return mapLinkImportDraft(result);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function getLinkImportPageData(input?: { draftId?: number | null; status?: string | null; purpose?: string | null }) {
  try {
    const runtime = getRuntimeModeSummary();
    const filters = {
      status: input?.status?.trim() || null,
      purpose: input?.purpose?.trim() || null,
    };

    if (!runtime.isWritable) {
      return { runtime, drafts: [], selectedDraft: null, filters };
    }

    const where: Prisma.LinkImportDraftWhereInput = {};
    if (filters.status && (Object.values(LINK_IMPORT_STATUSES) as string[]).includes(filters.status)) where.status = filters.status;
    if (filters.purpose && isLinkImportPurpose(filters.purpose)) where.purpose = filters.purpose;

    const drafts = await prisma.linkImportDraft.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 80,
      select: linkImportDraftSelect,
    });

    const selectedRecord =
      input?.draftId && Number.isInteger(input.draftId)
        ? drafts.find((draft) => draft.id === input.draftId) ??
          (await prisma.linkImportDraft.findUnique({ where: { id: input.draftId }, select: linkImportDraftSelect }))
        : drafts[0] ?? null;

    return {
      runtime,
      drafts: drafts.map(mapLinkImportDraft),
      selectedDraft: selectedRecord ? mapLinkImportDraft(selectedRecord) : null,
      filters,
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export const linkImportPurposeOptions = [
  { value: LINK_IMPORT_PURPOSES.INSPIRATION, label: "灵感" },
  { value: LINK_IMPORT_PURPOSES.PRODUCT_CANDIDATE, label: "商品候选" },
  { value: LINK_IMPORT_PURPOSES.COMPETITOR_REFERENCE, label: "竞品参考" },
];

export const linkImportStatusOptions = [
  { value: "", label: "全部状态" },
  { value: LINK_IMPORT_STATUSES.NEEDS_REVIEW, label: "needs_review" },
  { value: LINK_IMPORT_STATUSES.DRAFT, label: "draft" },
  { value: LINK_IMPORT_STATUSES.CONVERTED, label: "converted" },
  { value: LINK_IMPORT_STATUSES.REJECTED, label: "rejected" },
  { value: LINK_IMPORT_STATUSES.FAILED, label: "failed" },
];

export const linkImportQualityOptions = [
  { value: LINK_IMPORT_QUALITY_LEVELS.HIGH, label: "high：截图或文本较完整" },
  { value: LINK_IMPORT_QUALITY_LEVELS.MEDIUM, label: "medium：有部分元信息或备注" },
  { value: LINK_IMPORT_QUALITY_LEVELS.LOW, label: "low：只有 URL，信息不足" },
  { value: LINK_IMPORT_QUALITY_LEVELS.FAILED, label: "failed：链接无效或无法处理" },
];
