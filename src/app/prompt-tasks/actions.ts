"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  cancelPromptTask,
  createPromptTask,
  markPromptTaskCopied,
  uploadManualMaterial,
  uploadPromptTaskResult,
} from "@/lib/services/prompt-task-service";
import { deleteFailedImageGenerationJob, generateImageForPromptTask } from "@/lib/services/image-generation";

type ActionResult<T = null> = {
  success: boolean;
  data?: T;
  error?: string | null;
};

type FormState = {
  error?: string | null;
};

function getRequiredImage(formData: FormData) {
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    throw new Error("请选择要上传的图片。");
  }

  return image;
}

function revalidatePromptScopes(productId?: number | null, taskCode?: string | null) {
  revalidatePath("/");
  revalidatePath("/prompt-tasks");

  if (productId) {
    revalidatePath(`/products/${productId}`);
  }

  if (taskCode) {
    revalidatePath(`/prompt-tasks/${taskCode}/upload`);
  }
}

export async function createPromptTaskAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let task;

  try {
    task = await createPromptTask({
      productId: Number(formData.get("productId")),
      platform: String(formData.get("platform") ?? ""),
      imageType: String(formData.get("imageType") ?? ""),
      recommendedSize: String(formData.get("recommendedSize") ?? ""),
    });
  } catch (error) {
    return {
      error: getProductErrorMessage(error, "生成 Prompt 任务失败，请稍后重试。"),
    };
  }

  revalidatePromptScopes(task.productId, task.taskCode);
  redirect(`/prompt-tasks?taskCode=${encodeURIComponent(task.taskCode)}`);
}

export async function markPromptTaskCopiedAction(taskCode: string): Promise<ActionResult<{ promptText: string }>> {
  try {
    const result = await markPromptTaskCopied(taskCode);
    revalidatePromptScopes(null, taskCode);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: getProductErrorMessage(error, "标记已复制失败，请稍后重试。"),
    };
  }
}

export async function cancelPromptTaskAction(taskCode: string): Promise<ActionResult> {
  try {
    await cancelPromptTask(taskCode);
    revalidatePromptScopes(null, taskCode);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getProductErrorMessage(error, "取消任务失败，请稍后重试。"),
    };
  }
}

export async function generatePromptTaskImageAction(input: {
  taskCode: string;
  promptVersion?: string | null;
  promptUse?: string | null;
}): Promise<ActionResult<{ materialId: number | null }>> {
  try {
    const result = await generateImageForPromptTask(input);
    revalidatePromptScopes(result.productId, input.taskCode);
    revalidatePath("/materials");

    return { success: true, data: { materialId: result.resultMaterialId } };
  } catch (error) {
    return {
      success: false,
      error: getProductErrorMessage(error, "API 生图失败，请稍后重试。"),
    };
  }
}

export async function deleteFailedImageGenerationJobAction(input: {
  jobId: number;
  taskCode: string;
}): Promise<ActionResult<{ deletedId: number }>> {
  try {
    const result = await deleteFailedImageGenerationJob(input);
    revalidatePromptScopes(null, input.taskCode);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: getProductErrorMessage(error, "删除失败记录失败，请稍后重试。"),
    };
  }
}

export async function uploadPromptTaskResultAction(
  taskCode: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let material;

  try {
    material = await uploadPromptTaskResult({
      taskCode,
      file: getRequiredImage(formData),
    });
  } catch (error) {
    return {
      error: getProductErrorMessage(error, "上传生成结果失败，请稍后重试。"),
    };
  }

  revalidatePromptScopes(material.productId, taskCode);
  redirect(`/products/${material.productId}?tab=materials`);
}

export async function uploadManualMaterialAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let material;

  try {
    material = await uploadManualMaterial({
      productId: Number(formData.get("productId")),
      platform: String(formData.get("platform") ?? ""),
      materialType: String(formData.get("materialType") ?? formData.get("imageType") ?? ""),
      file: getRequiredImage(formData),
    });
  } catch (error) {
    return {
      error: getProductErrorMessage(error, "手动上传素材失败，请稍后重试。"),
    };
  }

  revalidatePromptScopes(material.productId);
  redirect(`/products/${material.productId}?tab=materials`);
}
