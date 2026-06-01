"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ActionButton,
  DashboardCard,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  MiniIcon,
  StatusBadge,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import {
  deleteAIProviderAction,
  disableAIProviderAction,
  enableAIProviderAction,
  saveAISceneDefaultsAction,
  saveImageGenerationSettingsAction,
  saveAIProviderAction,
  testAIProviderConnectionAction,
  testAIProviderConnectionWithConfigAction,
} from "@/app/settings/actions";

type ProviderView = {
  id: number;
  name: string;
  providerType: string;
  baseUrl: string | null;
  modelName: string | null;
  purpose: string | null;
  enabled: boolean;
  isDefault: boolean;
  hasApiKey: boolean;
  maskedApiKey: string;
};

type ImageGenerationSettingsView = {
  enabled: boolean;
  defaultSize: string;
  defaultQuality: string;
  costHint: string;
};

type SceneDefaultSettingsView = {
  copywriting: number | null;
  vision: number | null;
  image: number | null;
};

type ConnectionResult =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

function getEmptyForm() {
  return {
    id: "",
    name: "",
    providerType: "openai-compatible",
    baseUrl: "",
    apiKey: "",
    modelName: "",
    purpose: "text",
    enabled: true,
    isDefault: false,
    hasApiKey: false,
    maskedApiKey: "--",
  };
}

export function AISettingsManager({
  providers,
  defaultProviderId,
  imageGenerationSettings,
  sceneDefaultSettings,
  runtimeNotice,
}: {
  providers: ProviderView[];
  defaultProviderId: number | null;
  imageGenerationSettings: ImageGenerationSettingsView;
  sceneDefaultSettings: SceneDefaultSettingsView;
  runtimeNotice?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [connectionResult, setConnectionResult] = useState<ConnectionResult>(null);
  const [imageSettingsResult, setImageSettingsResult] = useState<ConnectionResult>(null);
  const [imageSettings, setImageSettings] = useState(imageGenerationSettings);
  const [sceneSettingsResult, setSceneSettingsResult] = useState<ConnectionResult>(null);
  const [sceneSettings, setSceneSettings] = useState(sceneDefaultSettings);
  const [form, setForm] = useState(() => {
    const defaultProvider = providers.find((item) => item.id === defaultProviderId) ?? providers[0];
    return defaultProvider
      ? {
          id: String(defaultProvider.id),
          name: defaultProvider.name,
          providerType: defaultProvider.providerType,
          baseUrl: defaultProvider.baseUrl ?? "",
          apiKey: "",
          modelName: defaultProvider.modelName ?? "",
          purpose: defaultProvider.purpose ?? "text",
          enabled: defaultProvider.enabled,
          isDefault: defaultProvider.isDefault,
          hasApiKey: defaultProvider.hasApiKey,
          maskedApiKey: defaultProvider.maskedApiKey,
        }
      : getEmptyForm();
  });

  const editingProviderId = useMemo(() => {
    const parsed = Number(form.id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [form.id]);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === editingProviderId) ?? null,
    [editingProviderId, providers],
  );
  const defaultImageProvider = useMemo(
    () =>
      providers.find((provider) => provider.id === sceneSettings.image && provider.purpose === "image" && provider.enabled) ??
      providers.find((provider) => provider.purpose === "image" && provider.enabled && provider.isDefault) ??
      null,
    [providers, sceneSettings.image],
  );
  const textProviderOptions = useMemo(
    () => providers.filter((provider) => provider.enabled && (provider.purpose ?? "text") !== "image"),
    [providers],
  );
  const imageProviderOptions = useMemo(
    () => providers.filter((provider) => provider.enabled && provider.purpose === "image"),
    [providers],
  );
  const imageProviderStatus = defaultImageProvider
    ? `当前生图 Provider：${defaultImageProvider.name} / ${defaultImageProvider.modelName?.trim() || "Provider 默认模型"}`
    : imageSettings.enabled
      ? "已启用 API 生图，但未配置可用的 API 生图 Provider。请在场景默认中选择 API 生图 Provider，或设为生图默认。"
      : "API 生图当前未启用。启用后仍需要配置用途为 API 生图的 Provider。";
  const isImageProviderForm = form.purpose === "image";

  function getProviderModelLabel(provider: ProviderView) {
    if (provider.modelName?.trim()) return provider.modelName;
    return provider.purpose === "image" ? "Provider 默认模型" : "未指定模型";
  }

  function selectProvider(provider: ProviderView) {
    setConnectionResult(null);
    setForm({
      id: String(provider.id),
      name: provider.name,
      providerType: provider.providerType,
      baseUrl: provider.baseUrl ?? "",
      apiKey: "",
      modelName: provider.modelName ?? "",
      purpose: provider.purpose ?? "text",
      enabled: provider.enabled,
      isDefault: provider.isDefault,
      hasApiKey: provider.hasApiKey,
      maskedApiKey: provider.maskedApiKey,
    });
  }

  function resetForm() {
    setConnectionResult(null);
    setForm(getEmptyForm());
  }

  function handleSave() {
    const formData = new FormData();
    formData.set("providerId", form.id);
    formData.set("name", form.name);
    formData.set("providerType", form.providerType);
    formData.set("baseUrl", form.baseUrl);
    formData.set("apiKey", form.apiKey);
    formData.set("modelName", form.modelName);
    formData.set("purpose", form.purpose);
    if (form.enabled) formData.set("enabled", "on");
    if (form.isDefault) formData.set("isDefault", "on");

    startTransition(async () => {
      const result = await saveAIProviderAction(formData);
      if (!result.success) {
        setConnectionResult({ type: "error", text: result.error });
        return;
      }

      setForm((current) => ({
        ...current,
        id: String(result.data.id),
        apiKey: "",
        enabled: result.data.enabled,
        isDefault: result.data.isDefault,
        hasApiKey: result.data.hasApiKey,
      }));
      setConnectionResult({ type: "success", text: "Provider 已保存。" });
      router.refresh();
    });
  }

  function handleTest() {
    startTransition(async () => {
      if (isImageProviderForm) {
        if (!form.baseUrl.trim() || (!form.apiKey.trim() && !form.hasApiKey)) {
          setConnectionResult({ type: "error", text: "请先填写 Base URL 和 API Key。" });
          return;
        }

        setConnectionResult({
          type: "success",
          text: "API 生图 Provider 基础配置已具备；实际接口会在手动生图时验证。",
        });
        return;
      }

      const result =
        editingProviderId && !form.apiKey
          ? await testAIProviderConnectionAction(editingProviderId)
          : await testAIProviderConnectionWithConfigAction({
              baseUrl: form.baseUrl,
              apiKey: form.apiKey,
              modelName: form.modelName,
              providerType: form.providerType,
            });

      if (!result.success) {
        setConnectionResult({ type: "error", text: result.error });
        return;
      }

      setConnectionResult({
        type: "success",
        text: `连接成功，模型 ${result.data.modelName}，耗时 ${result.data.latencyMs}ms`,
      });
    });
  }

  function handleSaveSceneSettings() {
    const formData = new FormData();
    if (sceneSettings.copywriting) formData.set("copywritingProviderId", String(sceneSettings.copywriting));
    if (sceneSettings.vision) formData.set("visionProviderId", String(sceneSettings.vision));
    if (sceneSettings.image) formData.set("imageProviderId", String(sceneSettings.image));

    startTransition(async () => {
      const result = await saveAISceneDefaultsAction(formData);
      if (!result.success) {
        setSceneSettingsResult({ type: "error", text: result.error });
        return;
      }

      setSceneSettings(result.data);
      setSceneSettingsResult({ type: "success", text: "场景默认 Provider 已保存。" });
      router.refresh();
    });
  }

  return (
    <>
      {runtimeNotice ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          {runtimeNotice}
        </div>
      ) : null}

      <DashboardCard>
        <div className="grid gap-4 px-5 py-5 xl:grid-cols-[0.84fr_1.16fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[1.12rem] font-semibold text-slate-900">已配置的 Provider</h2>
              <button
                type="button"
                onClick={resetForm}
                className="cursor-pointer rounded-xl px-2 py-1 text-sm font-medium text-[#2563EB] transition-all duration-200 hover:bg-blue-50 hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                + 新建 Provider
              </button>
            </div>

            {providers.length > 0 ? (
              providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => selectProvider(provider)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    editingProviderId === provider.id
                      ? "border-blue-200 bg-[#F8FBFF] shadow-[0_18px_36px_rgba(59,130,246,0.07)]"
                      : "border-[#EEF2F8] bg-white hover:border-blue-100 hover:bg-[#FBFDFF]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2563EB]">
                      <MiniIcon name="spark" className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{provider.name}</p>
                        {provider.isDefault ? <StatusBadge label="默认" tone="blue" /> : null}
                        <StatusBadge label={provider.enabled ? "已启用" : "已禁用"} tone={provider.enabled ? "green" : "slate"} />
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-slate-500">
                        <p>模型：{getProviderModelLabel(provider)}</p>
                        <p className="truncate">Base URL：{provider.baseUrl ?? "--"}</p>
                        <p>API Key：{provider.maskedApiKey}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#D8E3F2] bg-[#FAFCFF] px-4 py-4 text-sm text-slate-500">
                还没有配置任何 Provider，请先新增一个可用的文本 Provider。
              </div>
            )}
          </div>

          <div className="space-y-4">
            <DashboardCard className="px-5 py-5">
              <h2 className="text-[1.12rem] font-semibold text-slate-900">{editingProviderId ? "编辑 Provider" : "新建 Provider"}</h2>

              <div className="mt-5 grid gap-4">
                <Field label="Provider 名称">
                  <input className={inputClassName} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </Field>
                <Field label="Provider 类型">
                  <input className={`${inputClassName} bg-slate-50 text-slate-500`} value={form.providerType} readOnly />
                </Field>
                <Field label="Base URL">
                  <input className={inputClassName} value={form.baseUrl} onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))} />
                </Field>
                <Field label="API Key">
                  <input
                    className={inputClassName}
                    type="password"
                    placeholder={form.hasApiKey ? `已配置：${form.maskedApiKey}` : "请输入 API Key"}
                    value={form.apiKey}
                    onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
                  />
                </Field>
                <Field label={isImageProviderForm ? "模型名（可选）" : "模型名"}>
                  <input
                    className={inputClassName}
                    placeholder={isImageProviderForm ? "第三方生图接口不需要模型名时可留空" : ""}
                    value={form.modelName}
                    onChange={(event) => setForm((current) => ({ ...current, modelName: event.target.value }))}
                  />
                </Field>
                <Field label="用途">
                  <select
                    className={inputClassName}
                    value={form.purpose}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        purpose: event.target.value,
                      }))
                    }
                  >
                    <option value="text">文本 / 识图</option>
                    <option value="image">API 生图</option>
                  </select>
                </Field>

                <div className="grid gap-3">
                  <ToggleField label="是否默认" checked={form.isDefault} onChange={(checked) => setForm((current) => ({ ...current, isDefault: checked, enabled: checked ? true : current.enabled }))} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                {editingProviderId ? (
                  <>
                    <ActionButton variant="ghost" href="/settings/ai">
                      刷新页面
                    </ActionButton>
                    {selectedProvider?.enabled ? (
                      <button
                        type="button"
                        disabled={isPending || Boolean(runtimeNotice)}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await disableAIProviderAction(editingProviderId);
                            if (!result.success) {
                              setConnectionResult({ type: "error", text: result.error });
                              return;
                            }

                            setForm((current) => ({ ...current, enabled: false, isDefault: false }));
                            setConnectionResult({ type: "success", text: "Provider 已禁用。" });
                            router.refresh();
                          });
                        }}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#E4EAF3] bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        禁用
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending || Boolean(runtimeNotice)}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await enableAIProviderAction(editingProviderId);
                            if (!result.success) {
                              setConnectionResult({ type: "error", text: result.error });
                              return;
                            }

                            setForm((current) => ({ ...current, enabled: true }));
                            setConnectionResult({ type: "success", text: "Provider 已启用。" });
                            router.refresh();
                          });
                        }}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        启用
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending || Boolean(runtimeNotice)}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await deleteAIProviderAction(editingProviderId);
                          if (!result.success) {
                            setConnectionResult({ type: "error", text: result.error });
                            return;
                          }

                          resetForm();
                          setConnectionResult({ type: "success", text: "Provider 已删除。" });
                          router.refresh();
                        });
                      }}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      删除
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  disabled={isPending || Boolean(runtimeNotice)}
                  onClick={handleTest}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-5 text-sm font-medium text-[#2563EB] transition hover:bg-blue-50 disabled:opacity-70"
                >
                  测试连接
                </button>
                <button
                  type="button"
                  disabled={isPending || Boolean(runtimeNotice)}
                  onClick={handleSave}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white transition disabled:opacity-70"
                >
                  {isPending ? "处理中..." : "保存设置"}
                </button>
              </div>
            </DashboardCard>

            {connectionResult ? (
              <div
                className={`rounded-[24px] border px-5 py-4 ${
                  connectionResult.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MiniIcon name={connectionResult.type === "success" ? "shield" : "ban"} className="h-5 w-5" />
                  <p className="text-sm font-medium">{connectionResult.text}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DashboardCard>

      <DashboardCard>
        <div className="grid gap-4 px-5 py-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-[1.08rem] font-semibold text-slate-900">场景默认 Provider</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              为常用 AI 场景指定默认 Provider。未选择或 Provider 不可用时，会回退到当前全局默认。
            </p>
            <p className="mt-3 rounded-2xl border border-[#E4EAF3] bg-[#FBFDFF] px-4 py-3 text-sm leading-6 text-slate-600">
              文案生成和 AI 识图使用文本 / 识图 Provider；API 生图使用用途为 API 生图的 Provider。
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="文案生成">
                <select
                  className={inputClassName}
                  value={sceneSettings.copywriting ?? ""}
                  onChange={(event) =>
                    setSceneSettings((current) => ({
                      ...current,
                      copywriting: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  disabled={Boolean(runtimeNotice)}
                >
                  <option value="">使用文本默认</option>
                  {textProviderOptions.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="AI 识图">
                <select
                  className={inputClassName}
                  value={sceneSettings.vision ?? ""}
                  onChange={(event) =>
                    setSceneSettings((current) => ({
                      ...current,
                      vision: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  disabled={Boolean(runtimeNotice)}
                >
                  <option value="">使用文本默认</option>
                  {textProviderOptions.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="API 生图">
                <select
                  className={inputClassName}
                  value={sceneSettings.image ?? ""}
                  onChange={(event) =>
                    setSceneSettings((current) => ({
                      ...current,
                      image: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  disabled={Boolean(runtimeNotice)}
                >
                  <option value="">使用生图默认</option>
                  {imageProviderOptions.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isPending || Boolean(runtimeNotice)}
                onClick={handleSaveSceneSettings}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white transition disabled:opacity-70"
              >
                {isPending ? "处理中..." : "保存场景默认"}
              </button>
            </div>

            {sceneSettingsResult ? (
              <div
                className={`rounded-[24px] border px-5 py-4 ${
                  sceneSettingsResult.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                <p className="text-sm font-medium">{sceneSettingsResult.text}</p>
              </div>
            ) : null}
          </div>
        </div>
      </DashboardCard>

      <DashboardCard>
        <div className="grid gap-4 px-5 py-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-[1.08rem] font-semibold text-slate-900">API 生图设置</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              生图只在 Prompt 任务详情里由用户手动触发；Vercel 预览不会调用生图 API，也不会写入 uploads。
            </p>
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
              {imageSettings.costHint}
            </p>
            <p
              className={[
                "mt-3 rounded-2xl border px-4 py-3 text-sm leading-6",
                defaultImageProvider
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : imageSettings.enabled
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-[#E4EAF3] bg-white text-slate-500",
              ].join(" ")}
            >
              {imageProviderStatus}
            </p>
          </div>

          <div className="space-y-4">
            <ToggleField
              label="启用 API 生图"
              checked={imageSettings.enabled}
              onChange={(checked) => setImageSettings((current) => ({ ...current, enabled: checked }))}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="默认尺寸">
                <select
                  className={inputClassName}
                  value={imageSettings.defaultSize}
                  onChange={(event) => setImageSettings((current) => ({ ...current, defaultSize: event.target.value }))}
                >
                  <option value="1024x1024">1024x1024</option>
                  <option value="1024x1536">1024x1536</option>
                  <option value="1536x1024">1536x1024</option>
                  <option value="1792x1024">1792x1024</option>
                  <option value="1024x1792">1024x1792</option>
                </select>
              </Field>
              <Field label="默认质量">
                <select
                  className={inputClassName}
                  value={imageSettings.defaultQuality}
                  onChange={(event) => setImageSettings((current) => ({ ...current, defaultQuality: event.target.value }))}
                >
                  <option value="standard">standard</option>
                  <option value="hd">hd</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </Field>
            </div>
            <Field label="成本提示">
              <textarea
                className="min-h-[88px] w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition-all duration-200 ease-out hover:border-blue-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                value={imageSettings.costHint}
                onChange={(event) => setImageSettings((current) => ({ ...current, costHint: event.target.value }))}
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isPending || Boolean(runtimeNotice)}
                onClick={() => {
                  const formData = new FormData();
                  if (imageSettings.enabled) formData.set("imageGenerationEnabled", "on");
                  formData.set("imageGenerationSize", imageSettings.defaultSize);
                  formData.set("imageGenerationQuality", imageSettings.defaultQuality);
                  formData.set("imageGenerationCostHint", imageSettings.costHint);

                  startTransition(async () => {
                    const result = await saveImageGenerationSettingsAction(formData);
                    if (!result.success) {
                      setImageSettingsResult({ type: "error", text: result.error });
                      return;
                    }

                    setImageSettings(result.data);
                    setImageSettingsResult({ type: "success", text: "API 生图设置已保存。" });
                    router.refresh();
                  });
                }}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white transition disabled:opacity-70"
              >
                保存生图设置
              </button>
            </div>
            {imageSettingsResult ? (
              <div
                className={`rounded-[24px] border px-5 py-4 ${
                  imageSettingsResult.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                <p className="text-sm font-medium">{imageSettingsResult.text}</p>
              </div>
            ) : null}
          </div>
        </div>
      </DashboardCard>

      <DashboardCard>
        <div className="border-b border-[#EEF2F8] px-5 py-4">
          <h2 className="text-[1.08rem] font-semibold text-slate-900">当前 Provider 列表</h2>
        </div>
        <TableScrollArea>
          <DataTable className="min-w-[760px]">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell>名称</DataTableHeaderCell>
                <DataTableHeaderCell>类型</DataTableHeaderCell>
                <DataTableHeaderCell>模型</DataTableHeaderCell>
                <DataTableHeaderCell>用途</DataTableHeaderCell>
                <DataTableHeaderCell>默认</DataTableHeaderCell>
                <DataTableHeaderCell>状态</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {providers.map((provider) => (
                <DataTableRow key={provider.id}>
                  <DataTableCell>{provider.name}</DataTableCell>
                  <DataTableCell>{provider.providerType}</DataTableCell>
                  <DataTableCell>{getProviderModelLabel(provider)}</DataTableCell>
                  <DataTableCell>{provider.purpose ?? "--"}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={provider.isDefault ? "默认" : "否"} tone={provider.isDefault ? "blue" : "slate"} />
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={provider.enabled ? "启用" : "禁用"} tone={provider.enabled ? "green" : "slate"} />
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </TableScrollArea>
      </DashboardCard>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
        checked
          ? "border-blue-200 bg-[#F8FBFF] shadow-[0_12px_28px_rgba(43,115,255,0.10)]"
          : "border-[#E4EAF3] bg-white"
      }`}
    >
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={`inline-flex h-7 w-12 items-center rounded-full px-1 ${checked ? "bg-[#2B73FF]" : "bg-slate-200"}`}>
        <span className={`h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
