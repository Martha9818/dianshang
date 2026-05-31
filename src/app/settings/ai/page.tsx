import { PageNote } from "@/components/dashboard/primitives";
import { AISettingsManager } from "@/components/settings/ai-settings-manager";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { getProductErrorMessage } from "@/lib/modules/products";
import { getAISettingsPageData } from "@/lib/services/ai-provider-service";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/product-runtime-service";

export const dynamic = "force-dynamic";

export default async function AISettingsPage() {
  const runtime = getRuntimeModeSummary();
  const pageData = await getAISettingsPageData().catch((error) => ({
    providers: [],
    defaultProviderId: null,
    imageGenerationSettings: {
      enabled: false,
      defaultSize: "1024x1024",
      defaultQuality: "standard",
      costHint: "API 生图可能产生额外费用；请确认模型、尺寸和质量后再手动生成。",
    },
    readError: getProductErrorMessage(error, "当前预览环境无法读取本地 AI Provider，请在 Windows 本地验收。"),
  }));

  return (
    <WorkspacePage
      eyebrow="Settings / AI"
      title="AI 设置"
      description="配置 OpenAI-compatible 文本接口，管理默认 Provider，并支持未保存表单直接测试连接。"
    >
      {"readError" in pageData ? <PageNote>{pageData.readError}</PageNote> : null}
      <AISettingsManager
        providers={pageData.providers}
        defaultProviderId={pageData.defaultProviderId}
        imageGenerationSettings={pageData.imageGenerationSettings}
        runtimeNotice={runtime.isWritable ? null : buildReadonlyRuntimeMessage(runtime.mode)}
      />
    </WorkspacePage>
  );
}
