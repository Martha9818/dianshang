"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  buildScreenshotDraftFromForm,
  confirmScreenshotDraft,
  createScreenshotRecognitionJob,
  ignoreScreenshotDraft,
  recognizeScreenshotJob,
  saveScreenshotDraft,
} from "@/lib/services/screenshot";

function getOptionalImage(formData: FormData) {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return image;
}

function parsePositiveId(value: FormDataEntryValue | null, label: string) {
  const id = Number(value ?? "");
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label}无效。`);
  }

  return id;
}

function buildRedirectUrl(input: {
  jobId?: number | null;
  sourceType?: string | null;
  sourceId?: string | null;
  productId?: string | null;
  screenshotError?: string | null;
}) {
  const params = new URLSearchParams();
  if (input.jobId) params.set("jobId", String(input.jobId));
  if (input.sourceType) params.set("sourceType", input.sourceType);
  if (input.sourceId) params.set("sourceId", input.sourceId);
  if (input.productId) params.set("productId", input.productId);
  if (input.screenshotError) params.set("screenshotError", input.screenshotError);
  const query = params.toString();
  return query ? `/screenshots?${query}` : "/screenshots";
}

function revalidateScreenshotScopes(productId?: string | number | null) {
  revalidatePath("/");
  revalidatePath("/screenshots");
  revalidatePath("/system/diagnostics");
  if (productId) {
    revalidatePath(`/products/${productId}`);
    revalidatePath("/materials");
    revalidatePath("/inspirations");
  }
}

function buildDraftFromForm(formData: FormData) {
  return buildScreenshotDraftFromForm({
    possibleTitle: String(formData.get("possibleTitle") ?? ""),
    possiblePrice: String(formData.get("possiblePrice") ?? ""),
    possibleSalesOrHeat: String(formData.get("possibleSalesOrHeat") ?? ""),
    possiblePlatformSource: String(formData.get("possiblePlatformSource") ?? ""),
    sellingPointsText: String(formData.get("sellingPointsText") ?? ""),
    specInfoText: String(formData.get("specInfoText") ?? ""),
    riskWordsText: String(formData.get("riskWordsText") ?? ""),
    imageDescription: String(formData.get("imageDescription") ?? ""),
    copywritingMaterialSummary: String(formData.get("copywritingMaterialSummary") ?? ""),
    platformCopywritingDirectionsText: String(formData.get("platformCopywritingDirectionsText") ?? ""),
    privacyNotesText: String(formData.get("privacyNotesText") ?? ""),
    uncertaintyNotesText: String(formData.get("uncertaintyNotesText") ?? ""),
    qualityLevel: String(formData.get("qualityLevel") ?? ""),
  });
}

export async function createScreenshotRecognitionJobAction(formData: FormData) {
  const sourceType = String(formData.get("sourceType") ?? "manual");
  const sourceId = String(formData.get("sourceId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  let redirectUrl: string;

  try {
    const job = await createScreenshotRecognitionJob({
      sourceType,
      sourceId,
      productId,
      file: getOptionalImage(formData),
    });

    revalidateScreenshotScopes(job.productId);
    redirectUrl = buildRedirectUrl({ jobId: job.id, sourceType, sourceId, productId });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      sourceType,
      sourceId,
      productId,
      screenshotError: getProductErrorMessage(error, "创建截图识别任务失败，请稍后重试。"),
    });
  }

  redirect(redirectUrl);
}

export async function recognizeScreenshotJobAction(formData: FormData) {
  const jobId = Number(formData.get("jobId") ?? "");
  let redirectUrl: string;
  try {
    const result = await recognizeScreenshotJob(parsePositiveId(formData.get("jobId"), "截图识别任务"));
    revalidateScreenshotScopes(result.productId);
    redirectUrl = buildRedirectUrl({ jobId: result.id });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      jobId: Number.isInteger(jobId) && jobId > 0 ? jobId : null,
      screenshotError: getProductErrorMessage(error, "AI 截图识别失败，请稍后重试。"),
    });
  }

  redirect(redirectUrl);
}

export async function saveScreenshotDraftAction(formData: FormData) {
  const jobId = Number(formData.get("jobId") ?? "");
  let redirectUrl: string;
  try {
    const result = await saveScreenshotDraft({
      jobId: parsePositiveId(formData.get("jobId"), "截图识别任务"),
      draft: buildDraftFromForm(formData),
    });
    revalidateScreenshotScopes(result.productId);
    redirectUrl = buildRedirectUrl({ jobId: result.id });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      jobId: Number.isInteger(jobId) && jobId > 0 ? jobId : null,
      screenshotError: getProductErrorMessage(error, "保存截图识别草稿失败，请稍后重试。"),
    });
  }

  redirect(redirectUrl);
}

export async function confirmScreenshotDraftAction(formData: FormData) {
  const jobId = Number(formData.get("jobId") ?? "");
  let redirectUrl: string;
  try {
    const result = await confirmScreenshotDraft({
      jobId: parsePositiveId(formData.get("jobId"), "截图识别任务"),
      draft: buildDraftFromForm(formData),
    });
    revalidateScreenshotScopes(result.productId);
    redirectUrl = buildRedirectUrl({ jobId: result.id });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      jobId: Number.isInteger(jobId) && jobId > 0 ? jobId : null,
      screenshotError: getProductErrorMessage(error, "确认截图识别草稿失败，请稍后重试。"),
    });
  }

  redirect(redirectUrl);
}

export async function ignoreScreenshotDraftAction(formData: FormData) {
  const jobId = Number(formData.get("jobId") ?? "");
  let redirectUrl: string;
  try {
    const result = await ignoreScreenshotDraft(parsePositiveId(formData.get("jobId"), "截图识别任务"));
    revalidateScreenshotScopes(result.productId);
    redirectUrl = buildRedirectUrl({ jobId: result.id });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      jobId: Number.isInteger(jobId) && jobId > 0 ? jobId : null,
      screenshotError: getProductErrorMessage(error, "忽略截图识别草稿失败，请稍后重试。"),
    });
  }

  redirect(redirectUrl);
}
