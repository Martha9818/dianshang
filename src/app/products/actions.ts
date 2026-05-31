"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  extractProductFormValues,
  getProductErrorMessage,
  normalizeProductMutationInput,
  type ProductFormValues,
} from "@/lib/modules/products";
import {
  createCompetitor,
  deleteCompetitor,
  extractCompetitorFormValues,
  normalizeCompetitorMutationInput,
  updateCompetitor,
} from "@/lib/services/competitor-service";
import {
  archiveCompetitorAnalysisSnapshot,
  generateCompetitorAnalysisSnapshot,
  markCompetitorAnalysisReference,
} from "@/lib/services/competitor-analysis";
import { createProduct, softDeleteProduct, updateProduct } from "@/lib/services/product-mutation-service";
import { type BatchOperationResult } from "@/lib/modules/batch/rules";
import { runBatchOperation } from "@/lib/services/batchOperationService";
import { extractProfitFormValues, normalizeProfitMutationInput, updateProductProfit } from "@/lib/services/profit-service";
import { extractScoreFormValues, normalizeScoreFormValues, saveScoreSnapshot } from "@/lib/services/scoring-service";

type SubmitState = {
  error?: string | null;
};

type DeleteActionState = {
  success: boolean;
  error?: string | null;
};

type BatchActionState = {
  ok?: boolean;
  message?: string;
  result?: BatchOperationResult;
};

function getOptionalImage(formData: FormData, key = "mainImage") {
  const image = formData.get(key);
  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return image;
}

function buildProductValues(formData: FormData) {
  const values: ProductFormValues = extractProductFormValues(formData);
  return normalizeProductMutationInput(values);
}

function revalidateProductScopes(productId: number) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

function buildProductAnalysisRedirectUrl(productId: number, error?: string | null) {
  const params = new URLSearchParams();
  params.set("tab", "competitor-analysis");
  if (error) {
    params.set("analysisError", error);
  }
  return `/products/${productId}?${params.toString()}`;
}

function parseBatchIds(formData: FormData) {
  return formData
    .getAll("ids")
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function parsePositiveActionId(value: FormDataEntryValue | null, label: string) {
  const id = Number(value ?? "");
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label}无效。`);
  }
  return id;
}

function revalidateProductBatchScopes() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/notifications");
}

export async function createProductAction(_prevState: SubmitState, formData: FormData): Promise<SubmitState> {
  let product;

  try {
    product = await createProduct({
      values: buildProductValues(formData),
      mainImage: getOptionalImage(formData),
    });
  } catch (error) {
    return {
      error: getProductErrorMessage(error, "保存商品失败，请稍后重试。"),
    };
  }

  revalidatePath("/");
  revalidatePath("/products");
  redirect(`/products/${product.id}`);
}

export async function updateProductAction(
  productId: number,
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  let product;

  try {
    product = await updateProduct(productId, {
      values: buildProductValues(formData),
      mainImage: getOptionalImage(formData),
    });
  } catch (error) {
    return {
      error: getProductErrorMessage(error, "保存商品失败，请稍后重试。"),
    };
  }

  revalidateProductScopes(productId);
  redirect(`/products/${product.id}`);
}

export async function deleteProductAction(productId: number): Promise<DeleteActionState> {
  try {
    await softDeleteProduct(productId);
    revalidateProductScopes(productId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getProductErrorMessage(error, "删除商品失败，请稍后重试。"),
    };
  }
}

export async function batchProductOperationAction(
  _state: BatchActionState,
  formData: FormData,
): Promise<BatchActionState> {
  void _state;

  try {
    const result = await runBatchOperation({
      entity: "PRODUCT",
      action: String(formData.get("action") ?? ""),
      ids: parseBatchIds(formData),
      value: String(formData.get("status") ?? ""),
      confirmText: String(formData.get("confirmText") ?? ""),
    });

    revalidateProductBatchScopes();
    return {
      ok: result.failedCount === 0,
      message: `批量操作完成：成功 ${result.successCount}，失败 ${result.failedCount}，跳过 ${result.skippedCount}。`,
      result,
    };
  } catch (error) {
    return {
      ok: false,
      message: getProductErrorMessage(error, "批量操作失败，请稍后重试。"),
    };
  }
}

export async function saveCompetitorAction(
  productId: number,
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  try {
    const values = normalizeCompetitorMutationInput(extractCompetitorFormValues(formData));
    const competitorId = Number(formData.get("competitorId") ?? "");
    const screenshot = getOptionalImage(formData, "screenshot");

    if (Number.isInteger(competitorId) && competitorId > 0) {
      await updateCompetitor({
        productId,
        competitorId,
        values,
        screenshot,
      });
    } else {
      await createCompetitor({
        productId,
        values,
        screenshot,
      });
    }
  } catch (error) {
    return {
      error: getProductErrorMessage(error, "保存竞品失败，请稍后重试。"),
    };
  }

  revalidateProductScopes(productId);
  redirect(`/products/${productId}?tab=${encodeURIComponent("竞品数据")}`);
}

export async function deleteCompetitorAction(productId: number, competitorId: number): Promise<DeleteActionState> {
  try {
    await deleteCompetitor(productId, competitorId);
    revalidateProductScopes(productId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getProductErrorMessage(error, "删除竞品失败，请稍后重试。"),
    };
  }
}

export async function generateCompetitorAnalysisAction(productId: number, formData: FormData) {
  let redirectUrl: string;

  try {
    await generateCompetitorAnalysisSnapshot({
      productId,
      competitorIds: formData.getAll("competitorIds").map((value) => String(value)),
    });
    revalidateProductScopes(productId);
    revalidatePath("/system/diagnostics");
    redirectUrl = buildProductAnalysisRedirectUrl(productId);
  } catch (error) {
    revalidateProductScopes(productId);
    revalidatePath("/system/diagnostics");
    redirectUrl = buildProductAnalysisRedirectUrl(
      productId,
      getProductErrorMessage(error, "生成竞品智能分析失败，请稍后重试。"),
    );
  }

  redirect(redirectUrl);
}

export async function markCompetitorAnalysisReferenceAction(productId: number, formData: FormData) {
  let redirectUrl: string;

  try {
    await markCompetitorAnalysisReference({
      productId,
      snapshotId: parsePositiveActionId(formData.get("snapshotId"), "分析快照"),
    });
    revalidateProductScopes(productId);
    redirectUrl = buildProductAnalysisRedirectUrl(productId);
  } catch (error) {
    redirectUrl = buildProductAnalysisRedirectUrl(
      productId,
      getProductErrorMessage(error, "标记参考版本失败，请稍后重试。"),
    );
  }

  redirect(redirectUrl);
}

export async function archiveCompetitorAnalysisAction(productId: number, formData: FormData) {
  let redirectUrl: string;

  try {
    await archiveCompetitorAnalysisSnapshot({
      productId,
      snapshotId: parsePositiveActionId(formData.get("snapshotId"), "分析快照"),
    });
    revalidateProductScopes(productId);
    redirectUrl = buildProductAnalysisRedirectUrl(productId);
  } catch (error) {
    redirectUrl = buildProductAnalysisRedirectUrl(
      productId,
      getProductErrorMessage(error, "归档分析快照失败，请稍后重试。"),
    );
  }

  redirect(redirectUrl);
}

export async function saveProfitAction(
  productId: number,
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  try {
    const values = normalizeProfitMutationInput(extractProfitFormValues(formData));
    await updateProductProfit(productId, values);
  } catch (error) {
    return {
      error: getProductErrorMessage(error, "保存利润测算失败，请稍后重试。"),
    };
  }

  revalidateProductScopes(productId);
  redirect(`/products/${productId}?tab=${encodeURIComponent("利润测算")}`);
}

export async function saveScoreAction(
  productId: number,
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  try {
    const values = normalizeScoreFormValues(extractScoreFormValues(formData));
    await saveScoreSnapshot(productId, values);
  } catch (error) {
    return {
      error: getProductErrorMessage(error, "保存评分结果失败，请稍后重试。"),
    };
  }

  revalidateProductScopes(productId);
  redirect(`/products/${productId}?tab=${encodeURIComponent("商品评分")}`);
}
