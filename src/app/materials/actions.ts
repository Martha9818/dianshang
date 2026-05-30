"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProductErrorMessage } from "@/lib/modules/products";
import { MATERIAL_STATUS } from "@/lib/modules/materials";
import { updateMaterialStatus } from "@/lib/services/material-service";

type ActionResult<T = null> = {
  success: boolean;
  data?: T;
  error?: string | null;
};

function normalizeSourceUrl(sourceUrl?: string | null) {
  if (!sourceUrl?.trim()) {
    return "/materials";
  }

  if (!sourceUrl.startsWith("/materials") && !sourceUrl.startsWith("/products/")) {
    return "/materials";
  }

  return sourceUrl;
}

function revalidateMaterialScopes(productId?: number | null) {
  revalidatePath("/");
  revalidatePath("/materials");

  if (productId) {
    revalidatePath(`/products/${productId}`);
  }
}

export async function updateMaterialStatusAction(
  materialId: number,
  status: string,
): Promise<ActionResult> {
  try {
    const material = await updateMaterialStatus({ materialId, status });
    revalidateMaterialScopes(material.productId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getProductErrorMessage(error, "素材状态修改失败，请稍后重试。"),
    };
  }
}

export async function discardMaterialAction(materialId: number): Promise<ActionResult> {
  return updateMaterialStatusAction(materialId, MATERIAL_STATUS.DISCARDED);
}

export async function updateMaterialStatusAndRedirectAction(formData: FormData) {
  const materialId = Number(formData.get("materialId"));
  const status = String(formData.get("status") ?? "");
  const sourceUrl = normalizeSourceUrl(String(formData.get("sourceUrl") ?? ""));
  const result = await updateMaterialStatusAction(materialId, status);

  if (!result.success) {
    const url = new URL(`http://local${sourceUrl}`);
    url.searchParams.set("materialError", result.error ?? "素材状态修改失败，请稍后重试。");
    redirect(`${url.pathname}${url.search}`);
  }

  redirect(sourceUrl);
}

export async function discardMaterialAndRedirectAction(formData: FormData) {
  const materialId = Number(formData.get("materialId"));
  const sourceUrl = normalizeSourceUrl(String(formData.get("sourceUrl") ?? ""));
  const result = await discardMaterialAction(materialId);

  if (!result.success) {
    const url = new URL(`http://local${sourceUrl}`);
    url.searchParams.set("materialError", result.error ?? "素材弃用失败，请稍后重试。");
    redirect(`${url.pathname}${url.search}`);
  }

  redirect(sourceUrl);
}
