"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ActionButton,
  DashboardCard,
  DashboardCardHeader,
  FilterBar,
  MiniIcon,
  StatusBadge,
} from "@/components/dashboard/primitives";
import {
  clearCopywritingUsedAction,
  generateCopywritingAction,
  generateMultiPlatformCopywritingAction,
  markCopywritingUsedAction,
  saveManualCopywritingAction,
} from "@/app/copywriting/actions";
import {
  BANNED_WORD_RISK_LEVELS,
  COPYWRITING_AUDIT_STATUS,
  COPYWRITING_PLATFORMS,
  COPYWRITING_VERSION_STYLES,
} from "@/lib/modules/copywriting/prompts";

type ProductOption = {
  id: number;
  name: string;
  targetPlatformList: string[];
  estimatedPrice: number | null;
  sellingPoints: string | null;
  painPoints: string | null;
  usageScenes: string | null;
};

type ProviderOption = {
  id: number;
  name: string;
  modelName: string | null;
  isDefault: boolean;
  enabled: boolean;
};

type RiskWordHit = {
  word: string;
  riskLevel: string;
  category: string;
  field: string;
};

type CopywritingView = {
  id: number;
  productId: number;
  providerId: number | null;
  aiJobId: number | null;
  platform: string | null;
  version: string | null;
  versionLabel: string | null;
  style: string | null;
  title: string | null;
  body: string | null;
  mainCopy: string | null;
  auditStatus: string | null;
  generationStatus: string | null;
  isUsedInListing: boolean;
  usedAt: string | null;
  usedPlatform: string | null;
  usageNote: string | null;
  createdAt: string;
  riskWordHits: RiskWordHit[];
  violationScanResult?: {
    status: string;
    warning?: string | null;
    hits: RiskWordHit[];
  } | null;
  aiJobSummary?: {
    id: number;
    jobType: string;
    status: string;
    errorSummary: string | null;
    resultSummary: string | null;
    createdAt: string;
  } | null;
  display: {
    title: string;
    styleLabel: string;
    sections: Array<{ label: string; value: string }>;
    sellingPoints: string[];
    faqItems: string[];
    riskNotes: string[];
    copyText: string;
  };
};

type GroupedCopywritingView = {
  platform: string;
  records: CopywritingView[];
};

type EditableDraftState = {
  title: string;
  body: string;
  sellingPointsText: string;
  tagsText: string;
  usageNote: string;
  expanded: boolean;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";
const textareaClassName =
  "min-h-[120px] w-full resize-y rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";
const actionButtonClassName =
  "inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50 disabled:opacity-70";

function getStatusTone(status: string | null | undefined) {
  if (status === COPYWRITING_AUDIT_STATUS.NEEDS_EDIT) return "red" as const;
  if (status === COPYWRITING_AUDIT_STATUS.RISKY) return "amber" as const;
  if (status === COPYWRITING_AUDIT_STATUS.SAFE) return "green" as const;
  return "slate" as const;
}

function getRiskTone(level: string) {
  if (level === BANNED_WORD_RISK_LEVELS.HIGH) return "red" as const;
  if (level === BANNED_WORD_RISK_LEVELS.MEDIUM) return "amber" as const;
  return "slate" as const;
}

function buildDraftState(record: CopywritingView): EditableDraftState {
  return {
    title: record.title ?? "",
    body: record.body ?? record.mainCopy ?? "",
    sellingPointsText: record.display.sellingPoints.join("\n"),
    tagsText: (record as CopywritingView & { tags?: string[] }).tags?.join("\n") ?? "",
    usageNote: record.usageNote ?? "",
    expanded: (record.versionLabel ?? record.version) === "A",
  };
}

function buildDraftMap(records: CopywritingView[]) {
  return Object.fromEntries(records.map((record) => [String(record.id), buildDraftState(record)])) as Record<string, EditableDraftState>;
}

function groupRecords(records: CopywritingView[]) {
  return COPYWRITING_PLATFORMS.map((platform) => ({
    platform,
    records: records
      .filter((record) => record.platform === platform)
      .sort((left, right) => {
        if (left.isUsedInListing !== right.isUsedInListing) {
          return left.isUsedInListing ? -1 : 1;
        }
        if ((left.versionLabel ?? left.version ?? "") !== (right.versionLabel ?? right.version ?? "")) {
          return String(left.versionLabel ?? left.version ?? "").localeCompare(String(right.versionLabel ?? right.version ?? ""), "en");
        }
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
  })).filter((group) => group.records.length > 0);
}

export function CopywritingManager({
  products,
  providers,
  defaultProviderId,
  initialProductId,
  initialPlatform,
  initialCopywritings,
  initialGroupedCopywritings,
  runtimeNotice,
  dataNotice,
}: {
  products: ProductOption[];
  providers: ProviderOption[];
  defaultProviderId: number | null;
  initialProductId: number | null;
  initialPlatform: string | null;
  initialCopywritings: CopywritingView[];
  initialGroupedCopywritings?: GroupedCopywritingView[];
  runtimeNotice?: string | null;
  dataNotice?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [productId, setProductId] = useState<number | "">(initialProductId ?? "");
  const [platform, setPlatform] = useState<string>(initialPlatform ?? COPYWRITING_PLATFORMS[0]);
  const initialProviderId =
    providers.find((provider) => provider.id === defaultProviderId && provider.enabled)?.id ??
    providers.find((provider) => provider.isDefault && provider.enabled)?.id ??
    "";
  const [providerId, setProviderId] = useState<number | "">(initialProviderId);
  const [records, setRecords] = useState<CopywritingView[]>(() => initialCopywritings);
  const [drafts, setDrafts] = useState<Record<string, EditableDraftState>>(() => buildDraftMap(initialCopywritings));

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products],
  );

  const platformOptions = useMemo(() => {
    if (!selectedProduct || selectedProduct.targetPlatformList.length === 0) {
      return [...COPYWRITING_PLATFORMS];
    }

    const normalized = selectedProduct.targetPlatformList.filter((item): item is (typeof COPYWRITING_PLATFORMS)[number] =>
      COPYWRITING_PLATFORMS.includes(item as (typeof COPYWRITING_PLATFORMS)[number]),
    );

    return normalized.length > 0 ? normalized : [...COPYWRITING_PLATFORMS];
  }, [selectedProduct]);

  const defaultEnabledProviderId = useMemo(
    () =>
      providers.find((provider) => provider.id === defaultProviderId && provider.enabled)?.id ??
      providers.find((provider) => provider.isDefault && provider.enabled)?.id ??
      null,
    [defaultProviderId, providers],
  );

  const activeProviderId =
    providerId && providers.some((provider) => provider.id === providerId && provider.enabled)
      ? providerId
      : defaultEnabledProviderId ?? "";

  const groupedRecords = useMemo(() => {
    if (records.length === 0 && initialGroupedCopywritings) {
      return initialGroupedCopywritings;
    }
    return groupRecords(records);
  }, [initialGroupedCopywritings, records]);

  function buildRoute(nextProductId: number | "", nextPlatform: string) {
    const params = new URLSearchParams();
    if (nextProductId) {
      params.set("productId", String(nextProductId));
    }
    if (nextPlatform) {
      params.set("platform", nextPlatform);
    }
    return `/copywriting${params.toString() ? `?${params.toString()}` : ""}`;
  }

  function syncRoute(nextProductId: number | "", nextPlatform: string) {
    router.push(buildRoute(nextProductId, nextPlatform));
  }

  function handleProductChange(nextProductId: number | "") {
    setMessage(null);
    setProductId(nextProductId);
    const nextProduct = products.find((product) => product.id === nextProductId) ?? null;
    const nextPlatform =
      nextProduct?.targetPlatformList.find((item): item is (typeof COPYWRITING_PLATFORMS)[number] =>
        COPYWRITING_PLATFORMS.includes(item as (typeof COPYWRITING_PLATFORMS)[number]),
      ) ?? platform;
    setPlatform(nextPlatform);
    syncRoute(nextProductId, nextPlatform);
  }

  function handlePlatformChange(nextPlatform: string) {
    setMessage(null);
    setPlatform(nextPlatform);
    syncRoute(productId, nextPlatform);
  }

  function refreshAfterMutation(nextRecords?: CopywritingView[]) {
    if (nextRecords) {
      setRecords((current) => {
        const incomingIds = new Set(nextRecords.map((item) => item.id));
        const merged = [...nextRecords, ...current.filter((item) => !incomingIds.has(item.id))];
        return merged;
      });
      setDrafts((current) => {
        const next = { ...current };
        for (const record of nextRecords) {
          next[String(record.id)] = buildDraftState(record);
        }
        return next;
      });
    }

    router.push(buildRoute(productId, platform));
    router.refresh();
  }

  function handleGeneratePackage() {
    if (!productId) {
      setMessage("请先选择商品。");
      return;
    }

    if (!activeProviderId) {
      setMessage("当前没有可用的默认 Provider，请先配置 AI Provider。");
      return;
    }

    startTransition(async () => {
      const result = await generateMultiPlatformCopywritingAction({
        productId: Number(productId),
        providerId: Number(activeProviderId),
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setMessage("多平台文案包已生成并保存，历史文案已保留。");
      refreshAfterMutation(result.data.records);
    });
  }

  function handleGenerateSinglePlatform() {
    if (!productId) {
      setMessage("请先选择商品。");
      return;
    }

    if (!activeProviderId) {
      setMessage("当前没有可用的默认 Provider，请先配置 AI Provider。");
      return;
    }

    startTransition(async () => {
      const result = await generateCopywritingAction({
        productId: Number(productId),
        platform: platform as (typeof COPYWRITING_PLATFORMS)[number],
        providerId: Number(activeProviderId),
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setMessage(`${platform} 文案已生成，历史文案已保留。`);
      refreshAfterMutation(result.data as CopywritingView[]);
    });
  }

  function updateDraft(recordId: number, patch: Partial<EditableDraftState>) {
    setDrafts((current) => ({
      ...current,
      [String(recordId)]: {
        ...(current[String(recordId)] ?? {
          title: "",
          body: "",
          sellingPointsText: "",
          tagsText: "",
          usageNote: "",
          expanded: false,
        }),
        ...patch,
      },
    }));
  }

  function handleSave(record: CopywritingView) {
    const draft = drafts[String(record.id)] ?? buildDraftState(record);

    startTransition(async () => {
      const result = await saveManualCopywritingAction({
        copywritingId: record.id,
        productId: record.productId,
        providerId: record.providerId,
        platform: (record.platform ?? platform) as (typeof COPYWRITING_PLATFORMS)[number],
        version: (record.versionLabel ?? record.version ?? "A") as "A" | "B" | "C",
        style: record.style ?? COPYWRITING_VERSION_STYLES[(record.versionLabel ?? record.version ?? "A") as "A" | "B" | "C"],
        title: draft.title,
        mainCopy: draft.body,
        sellingPointsText: draft.sellingPointsText,
        tagsText: draft.tagsText,
        usageNote: draft.usageNote,
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setMessage(`已保存 ${record.platform ?? ""} ${record.versionLabel ?? record.version ?? ""} 版文案，并重新执行违规词扫描。`);
      refreshAfterMutation([result.data as CopywritingView]);
    });
  }

  function handleMarkUsed(record: CopywritingView) {
    const draft = drafts[String(record.id)] ?? buildDraftState(record);
    startTransition(async () => {
      const result = await markCopywritingUsedAction({
        copywritingId: record.id,
        productId: record.productId,
        platform: (record.platform ?? platform) as (typeof COPYWRITING_PLATFORMS)[number],
        usageNote: draft.usageNote,
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setMessage(`已将 ${record.platform ?? ""} ${record.versionLabel ?? record.version ?? ""} 版标记为实际使用版本。`);
      router.refresh();
    });
  }

  function handleClearUsed(record: CopywritingView) {
    startTransition(async () => {
      const result = await clearCopywritingUsedAction({
        copywritingId: record.id,
        productId: record.productId,
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setMessage("已取消实际使用标记。");
      refreshAfterMutation([result.data as CopywritingView]);
    });
  }

  return (
    <div className="space-y-5">
      {runtimeNotice ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          {runtimeNotice}
        </div>
      ) : null}

      {dataNotice ? (
        <div className="rounded-[24px] border border-[#E4EAF3] bg-[#FBFDFF] px-5 py-4 text-sm text-slate-600">
          {dataNotice}
        </div>
      ) : null}

      <FilterBar>
        <div className="xl:min-w-[300px] xl:flex-1">
          <p className="mb-2 px-1 text-sm text-slate-500">选择商品</p>
          <select
            className={inputClassName}
            value={productId}
            onChange={(event) => handleProductChange(event.target.value ? Number(event.target.value) : "")}
          >
            <option value="">请选择商品</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="xl:min-w-[180px]">
          <p className="mb-2 px-1 text-sm text-slate-500">平台筛选</p>
          <select className={inputClassName} value={platform} onChange={(event) => handlePlatformChange(event.target.value)}>
            {platformOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="xl:min-w-[240px]">
          <p className="mb-2 px-1 text-sm text-slate-500">AI Provider</p>
          <select
            className={inputClassName}
            value={activeProviderId}
            onChange={(event) => {
              setMessage(null);
              setProviderId(event.target.value ? Number(event.target.value) : "");
            }}
          >
            {defaultEnabledProviderId ? null : <option value="">请选择 Provider</option>}
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
                {provider.isDefault ? "（默认）" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 xl:ml-auto">
          <ActionButton variant="secondary" href={productId ? `/products/${productId}?tab=copywriting` : "/products"}>
            商品详情文案
          </ActionButton>
          <button
            type="button"
            disabled={isPending || Boolean(runtimeNotice)}
            onClick={handleGenerateSinglePlatform}
            className={actionButtonClassName}
          >
            仅生成当前平台
          </button>
          <button
            type="button"
            disabled={isPending || Boolean(runtimeNotice)}
            onClick={handleGeneratePackage}
            className="group inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.24)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] hover:shadow-[0_20px_42px_rgba(43,115,255,0.32)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none motion-reduce:transform-none"
          >
            <MiniIcon name="spark" className="h-4 w-4" />
            {isPending ? "生成中..." : "生成多平台文案包"}
          </button>
        </div>
      </FilterBar>

      {message ? (
        <div className="rounded-[24px] border border-[#E4EAF3] bg-[#FBFDFF] px-5 py-4 text-sm text-slate-600">{message}</div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <DashboardCard>
          <DashboardCardHeader title="商品信息概览" />
          <div className="grid gap-3 px-5 py-5 text-sm text-slate-600">
            <InfoRow label="商品名称" value={selectedProduct?.name ?? "--"} strong />
            <InfoRow
              label="参考售价"
              value={typeof selectedProduct?.estimatedPrice === "number" ? `¥${selectedProduct.estimatedPrice.toFixed(2)}` : "--"}
              strong
            />
            <InfoRow label="核心卖点" value={selectedProduct?.sellingPoints ?? "为空时仍允许继续生成，但建议先补充。"} />
            <InfoRow label="用户痛点" value={selectedProduct?.painPoints ?? "为空时将按类目保守推断。"} />
            <InfoRow label="使用场景" value={selectedProduct?.usageScenes ?? "日常使用场景"} />
          </div>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="生成说明" />
          <div className="space-y-3 px-5 py-5 text-sm leading-7 text-slate-600">
            <p>“生成多平台文案包”会一次产出闲鱼、淘宝、小红书、抖音四个平台的 A / B / C 三版草稿。</p>
            <p>默认保留历史文案，不覆盖旧记录；只有同一个 AIJob 的重试场景才会更新该 AIJob 产出的草稿。</p>
            <p>生成成功后与手动保存后都会重新执行违规词扫描；扫描失败不会破坏文案主记录，但会保留失败提示摘要。</p>
          </div>
        </DashboardCard>
      </section>

      {groupedRecords.length > 0 ? (
        groupedRecords
          .filter((group) => !platform || group.platform === platform)
          .map((group) => (
            <DashboardCard key={group.platform}>
              <DashboardCardHeader
                title={group.platform}
                description={`${group.records.length} 条历史文案记录，按版本和创建时间保留`}
              />
              <div className="space-y-4 px-5 py-5">
                {group.records.map((record) => {
                  const draft = drafts[String(record.id)] ?? buildDraftState(record);
                  const versionLabel = record.versionLabel ?? record.version ?? "A";

                  return (
                    <div key={record.id} className="rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">
                              {group.platform} {versionLabel} 版
                            </h3>
                            <StatusBadge label={record.auditStatus ?? "待生成"} tone={getStatusTone(record.auditStatus)} />
                            {record.isUsedInListing ? <StatusBadge label="实际使用中" tone="green" /> : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            创建于 {new Date(record.createdAt).toLocaleString("zh-CN")}
                            {record.aiJobSummary ? ` · AIJob #${record.aiJobSummary.id} ${record.aiJobSummary.status}` : " · 手动记录"}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={actionButtonClassName}
                          onClick={() => updateDraft(record.id, { expanded: !draft.expanded })}
                        >
                          {draft.expanded ? "收起" : "展开"}
                        </button>
                      </div>

                      {draft.expanded ? (
                        <div className="mt-4 space-y-4">
                          <Field label="标题">
                            <input
                              className={inputClassName}
                              value={draft.title}
                              onChange={(event) => updateDraft(record.id, { title: event.target.value })}
                            />
                          </Field>
                          <Field label="正文">
                            <textarea
                              className={textareaClassName}
                              value={draft.body}
                              onChange={(event) => updateDraft(record.id, { body: event.target.value })}
                            />
                          </Field>
                          <Field label="卖点">
                            <textarea
                              className={textareaClassName}
                              value={draft.sellingPointsText}
                              onChange={(event) => updateDraft(record.id, { sellingPointsText: event.target.value })}
                            />
                          </Field>
                          <Field label="标签 / 话题">
                            <textarea
                              className={textareaClassName}
                              value={draft.tagsText}
                              onChange={(event) => updateDraft(record.id, { tagsText: event.target.value })}
                            />
                          </Field>
                          <Field label="使用备注">
                            <textarea
                              className={textareaClassName}
                              value={draft.usageNote}
                              onChange={(event) => updateDraft(record.id, { usageNote: event.target.value })}
                            />
                          </Field>

                          {record.riskWordHits.length > 0 ? (
                            <div className="rounded-2xl border border-[#EEF2F8] bg-white px-4 py-4 text-sm text-slate-600">
                              <p className="font-medium text-slate-900">违规词命中</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {record.riskWordHits.map((hit, index) => (
                                  <StatusBadge key={`${record.id}-${hit.word}-${index}`} label={`${hit.word} / ${hit.riskLevel}`} tone={getRiskTone(hit.riskLevel)} />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-[#EEF2F8] bg-white px-4 py-4 text-sm text-slate-500">当前未命中违规词。</div>
                          )}

                          {record.violationScanResult?.warning ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                              违规词扫描提示：{record.violationScanResult.warning}
                            </div>
                          ) : null}

                          {record.aiJobSummary ? (
                            <div className="rounded-2xl border border-[#EEF2F8] bg-white px-4 py-4 text-sm text-slate-600">
                              <p className="font-medium text-slate-900">AIJob 摘要</p>
                              <p className="mt-2">#{record.aiJobSummary.id} · {record.aiJobSummary.jobType} · {record.aiJobSummary.status}</p>
                              {record.aiJobSummary.errorSummary ? <p className="mt-1 text-rose-600">{record.aiJobSummary.errorSummary}</p> : null}
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-2">
                            <button type="button" disabled={isPending} onClick={() => handleSave(record)} className={actionButtonClassName}>
                              保存并重扫
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={async () => {
                                await navigator.clipboard.writeText(
                                  [
                                    `${record.platform ?? "文案"} ${versionLabel} 版`,
                                    draft.title ? `标题：${draft.title}` : null,
                                    draft.body ? `正文：\n${draft.body}` : null,
                                    draft.sellingPointsText.trim() ? `卖点：\n${draft.sellingPointsText}` : null,
                                    draft.tagsText.trim() ? `标签：\n${draft.tagsText}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join("\n\n"),
                                );
                                setMessage("文案已复制。");
                              }}
                              className={actionButtonClassName}
                            >
                              复制
                            </button>
                            {record.isUsedInListing ? (
                              <button type="button" disabled={isPending} onClick={() => handleClearUsed(record)} className={actionButtonClassName}>
                                取消使用标记
                              </button>
                            ) : (
                              <button type="button" disabled={isPending} onClick={() => handleMarkUsed(record)} className={actionButtonClassName}>
                                标记为实际使用
                              </button>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          ))
      ) : (
        <DashboardCard className="px-5 py-5 text-sm text-slate-500">当前商品还没有文案记录，可先生成多平台文案包。</DashboardCard>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[100px_1fr]">
      <span className="text-slate-400">{label}</span>
      <span className={strong ? "font-medium text-slate-900" : undefined}>{value}</span>
    </div>
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
