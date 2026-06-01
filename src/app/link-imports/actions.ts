"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  createLinkImportDraft,
  linkImportDraftToCompetitor,
  linkImportDraftToInspiration,
  linkImportDraftToProduct,
  rejectLinkImportDraft,
  updateLinkImportDraft,
} from "@/lib/services/link-import";

function getOptionalImage(formData: FormData) {
  const image = formData.get("screenshot");
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
  draftId?: number | null;
  status?: string | null;
  purpose?: string | null;
  linkImportMessage?: string | null;
  linkImportError?: string | null;
}) {
  const params = new URLSearchParams();
  if (input.draftId) params.set("draftId", String(input.draftId));
  if (input.status) params.set("status", input.status);
  if (input.purpose) params.set("purpose", input.purpose);
  if (input.linkImportMessage) params.set("linkImportMessage", input.linkImportMessage);
  if (input.linkImportError) params.set("linkImportError", input.linkImportError);
  const query = params.toString();
  return query ? `/link-imports?${query}` : "/link-imports";
}

function revalidateLinkImportScopes(productId?: string | number | null, inspirationId?: string | number | null) {
  revalidatePath("/");
  revalidatePath("/link-imports");
  revalidatePath("/system/diagnostics");
  if (productId) revalidatePath(`/products/${productId}`);
  if (inspirationId) revalidatePath("/inspirations");
}

export async function createLinkImportDraftAction(formData: FormData) {
  const purpose = String(formData.get("purpose") ?? "inspiration");
  let redirectUrl: string;

  try {
    const draft = await createLinkImportDraft({
      url: String(formData.get("url") ?? ""),
      purpose,
      note: String(formData.get("note") ?? ""),
      manualText: String(formData.get("manualText") ?? ""),
      screenshot: getOptionalImage(formData),
    });

    revalidateLinkImportScopes(draft.productId, draft.convertedInspirationId);
    redirectUrl = buildRedirectUrl({ draftId: draft.id, linkImportMessage: "已创建链接草稿，可在右侧继续确认转化。" });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      purpose,
      linkImportError: getProductErrorMessage(error, "创建链接导入草稿失败，请稍后重试。"),
    });
  }

  redirect(redirectUrl);
}

export async function updateLinkImportDraftAction(formData: FormData) {
  const draftId = Number(formData.get("draftId") ?? "");
  let redirectUrl: string;

  try {
    const draft = await updateLinkImportDraft({
      draftId: parsePositiveId(formData.get("draftId"), "链接导入草稿"),
      purpose: String(formData.get("purpose") ?? "inspiration"),
      note: String(formData.get("note") ?? ""),
      manualText: String(formData.get("manualText") ?? ""),
    });

    revalidateLinkImportScopes(draft.productId, draft.convertedInspirationId);
    redirectUrl = buildRedirectUrl({ draftId: draft.id, linkImportMessage: "链接草稿已保存。" });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      draftId: Number.isInteger(draftId) && draftId > 0 ? draftId : null,
      linkImportError: getProductErrorMessage(error, "保存链接导入草稿失败，请稍后重试。"),
    });
  }

  redirect(redirectUrl);
}

export async function rejectLinkImportDraftAction(formData: FormData) {
  const draftId = Number(formData.get("draftId") ?? "");
  let redirectUrl: string;

  try {
    const draft = await rejectLinkImportDraft(parsePositiveId(formData.get("draftId"), "链接导入草稿"));
    revalidateLinkImportScopes(draft.productId, draft.convertedInspirationId);
    redirectUrl = buildRedirectUrl({ draftId: draft.id, linkImportMessage: "链接草稿已放弃并归档。" });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      draftId: Number.isInteger(draftId) && draftId > 0 ? draftId : null,
      linkImportError: getProductErrorMessage(error, "放弃或归档链接导入草稿失败，请稍后重试。"),
    });
  }

  redirect(redirectUrl);
}

export async function linkImportDraftToInspirationAction(formData: FormData) {
  const draftId = Number(formData.get("draftId") ?? "");
  let redirectUrl: string;

  try {
    const draft = await linkImportDraftToInspiration(parsePositiveId(formData.get("draftId"), "链接导入草稿"));
    revalidateLinkImportScopes(draft.productId, draft.convertedInspirationId);
    redirectUrl = buildRedirectUrl({ draftId: draft.id, linkImportMessage: "已转为灵感，可到灵感箱继续处理。" });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      draftId: Number.isInteger(draftId) && draftId > 0 ? draftId : null,
      linkImportError: getProductErrorMessage(error, "转为灵感失败，请确认草稿已上传辅助截图。"),
    });
  }

  redirect(redirectUrl);
}

export async function linkImportDraftToProductAction(formData: FormData) {
  const draftId = Number(formData.get("draftId") ?? "");
  let redirectUrl: string;

  try {
    const draft = await linkImportDraftToProduct({
      draftId: parsePositiveId(formData.get("draftId"), "链接导入草稿"),
      productId: parsePositiveId(formData.get("productId"), "商品 ID"),
    });
    revalidateLinkImportScopes(draft.productId, draft.convertedInspirationId);
    redirectUrl = buildRedirectUrl({ draftId: draft.id, linkImportMessage: "已关联到商品。" });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      draftId: Number.isInteger(draftId) && draftId > 0 ? draftId : null,
      linkImportError: getProductErrorMessage(error, "关联商品失败，请检查商品 ID。"),
    });
  }

  redirect(redirectUrl);
}

export async function linkImportDraftToCompetitorAction(formData: FormData) {
  const draftId = Number(formData.get("draftId") ?? "");
  let redirectUrl: string;

  try {
    const draft = await linkImportDraftToCompetitor({
      draftId: parsePositiveId(formData.get("draftId"), "链接导入草稿"),
      competitorId: parsePositiveId(formData.get("competitorId"), "竞品 ID"),
    });
    revalidateLinkImportScopes(draft.productId, draft.convertedInspirationId);
    redirectUrl = buildRedirectUrl({ draftId: draft.id, linkImportMessage: "已关联到竞品。" });
  } catch (error) {
    redirectUrl = buildRedirectUrl({
      draftId: Number.isInteger(draftId) && draftId > 0 ? draftId : null,
      linkImportError: getProductErrorMessage(error, "关联竞品失败，请检查竞品 ID。"),
    });
  }

  redirect(redirectUrl);
}
