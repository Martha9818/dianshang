"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ActionButton,
  DashboardCard,
  DashboardCardHeader,
  MiniIcon,
  StatusBadge,
} from "@/components/dashboard/primitives";
import {
  clearCopywritingUsedAction,
  deleteCopywritingAction,
  deleteCopywritingsAction,
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
  product?: {
    id: number;
    name: string;
    spu: string;
  } | null;
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
  "inline-flex h-12 min-w-[148px] items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-4 text-sm font-medium text-[#2563EB] shadow-[0_10px_22px_rgba(59,130,246,0.08)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] hover:shadow-[0_16px_30px_rgba(59,130,246,0.12)] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none motion-reduce:transform-none";
const dangerButtonClassName =
  "inline-flex h-12 min-w-[112px] items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 text-sm font-medium text-rose-600 shadow-[0_10px_22px_rgba(244,63,94,0.08)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none motion-reduce:transform-none";
const primaryActionButtonClassName =
  "group inline-flex h-12 min-w-[190px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.24)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] hover:shadow-[0_20px_42px_rgba(43,115,255,0.32)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none motion-reduce:transform-none";

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
  const groups = new Map<string, CopywritingView[]>();

  for (const record of records) {
    const key = record.aiJobId ? `job:${record.aiJobId}` : `manual:${record.id}`;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  return Array.from(groups.entries())
    .map(([key, groupRecords]) => {
      const sortedRecords = groupRecords.toSorted((left, right) => {
        if (left.isUsedInListing !== right.isUsedInListing) {
          return left.isUsedInListing ? -1 : 1;
        }

        const platformDiff =
          COPYWRITING_PLATFORMS.indexOf((left.platform ?? "") as (typeof COPYWRITING_PLATFORMS)[number]) -
          COPYWRITING_PLATFORMS.indexOf((right.platform ?? "") as (typeof COPYWRITING_PLATFORMS)[number]);
        if (platformDiff !== 0) return platformDiff;

        const versionDiff = String(left.versionLabel ?? left.version ?? "").localeCompare(String(right.versionLabel ?? right.version ?? ""), "en");
        if (versionDiff !== 0) return versionDiff;

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
      const first = sortedRecords[0];
      const newestTime = Math.max(...sortedRecords.map((record) => new Date(record.createdAt).getTime()));
      const platformCount = new Set(sortedRecords.map((record) => record.platform).filter(Boolean)).size;

      return {
        key,
        title: first?.aiJobId ? `生成批次 #${first.aiJobId}` : `${first?.platform ?? "手动"} ${first?.versionLabel ?? first?.version ?? ""} 版`,
        description: `${sortedRecords.length} 条文案 / ${platformCount || 1} 个平台 / ${new Date(newestTime).toLocaleString("zh-CN")}`,
        records: sortedRecords,
      };
    })
    .toSorted((left, right) => {
      const leftTime = Math.max(...left.records.map((record) => new Date(record.createdAt).getTime()));
      const rightTime = Math.max(...right.records.map((record) => new Date(record.createdAt).getTime()));
      return rightTime - leftTime;
    });
}

export function CopywritingManager({
  products,
  providers,
  defaultProviderId,
  initialProductId,
  initialPlatform,
  initialProviderId,
  initialCopywritings,
  runtimeNotice,
  dataNotice,
}: {
  products: ProductOption[];
  providers: ProviderOption[];
  defaultProviderId: number | null;
  initialProductId: number | null;
  initialPlatform: string | null;
  initialProviderId: number | null;
  initialCopywritings: CopywritingView[];
  runtimeNotice?: string | null;
  dataNotice?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [productId, setProductId] = useState<number | "">(initialProductId ?? "");
  const [platform, setPlatform] = useState<string>(initialPlatform ?? "");
  const selectedInitialProviderId =
    providers.find((provider) => provider.id === initialProviderId && provider.enabled)?.id ??
    providers.find((provider) => provider.id === defaultProviderId && provider.enabled)?.id ??
    providers.find((provider) => provider.isDefault && provider.enabled)?.id ??
    providers.find((provider) => provider.enabled)?.id ??
    "";
  const [providerId, setProviderId] = useState<number | "">(selectedInitialProviderId);
  const [records, setRecords] = useState<CopywritingView[]>(() => initialCopywritings);
  const [drafts, setDrafts] = useState<Record<string, EditableDraftState>>(() => buildDraftMap(initialCopywritings));
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<number>>(() => new Set());

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
      providers.find((provider) => provider.enabled)?.id ??
      null,
    [defaultProviderId, providers],
  );

  const activeProviderId =
    providerId && providers.some((provider) => provider.id === providerId && provider.enabled)
      ? providerId
      : defaultEnabledProviderId ?? "";

  const groupedRecords = useMemo(() => {
    return groupRecords(records);
  }, [records]);
  const visibleRecords = useMemo(() => groupedRecords.flatMap((group) => group.records), [groupedRecords]);
  const visibleRecordIds = useMemo(() => visibleRecords.map((record) => record.id), [visibleRecords]);
  const selectedVisibleCount = visibleRecordIds.filter((id) => selectedRecordIds.has(id)).length;

  function buildRoute(nextProductId: number | "", nextPlatform: string, nextProviderId: number | "" = activeProviderId) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextProductId) {
      params.set("productId", String(nextProductId));
    } else {
      params.delete("productId");
    }
    if (nextPlatform) {
      params.set("platform", nextPlatform);
    } else {
      params.delete("platform");
    }
    if (nextProviderId) {
      params.set("providerId", String(nextProviderId));
    } else {
      params.delete("providerId");
    }
    return `/copywriting${params.toString() ? `?${params.toString()}` : ""}`;
  }

  function syncRoute(nextProductId: number | "", nextPlatform: string, nextProviderId: number | "" = activeProviderId) {
    router.push(buildRoute(nextProductId, nextPlatform, nextProviderId));
  }

  function handleProductChange(nextProductId: number | "") {
    setMessage(null);
    setProductId(nextProductId);
    const nextProduct = products.find((product) => product.id === nextProductId) ?? null;
    const productPlatforms =
      nextProduct?.targetPlatformList.filter((item): item is (typeof COPYWRITING_PLATFORMS)[number] =>
        COPYWRITING_PLATFORMS.includes(item as (typeof COPYWRITING_PLATFORMS)[number]),
      ) ?? [];
    const nextPlatform =
      !platform || productPlatforms.length === 0 || productPlatforms.includes(platform as (typeof COPYWRITING_PLATFORMS)[number])
        ? platform
        : productPlatforms[0];
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
      const targetPlatform = (platform || platformOptions[0] || COPYWRITING_PLATFORMS[0]) as (typeof COPYWRITING_PLATFORMS)[number];
      const result = await generateCopywritingAction({
        productId: Number(productId),
        platform: targetPlatform,
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
        platform: (record.platform || platform || COPYWRITING_PLATFORMS[0]) as (typeof COPYWRITING_PLATFORMS)[number],
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
        platform: (record.platform || platform || COPYWRITING_PLATFORMS[0]) as (typeof COPYWRITING_PLATFORMS)[number],
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

  function handleDelete(record: CopywritingView) {
    if (!window.confirm("确认删除这条文案记录？只会删除当前文案，不会删除商品、AIJob 或素材文件。")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCopywritingAction({
        copywritingId: record.id,
        productId: record.productId,
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      removeDeletedRecords([record.id]);
      setMessage("文案记录已删除。");
      router.refresh();
    });
  }

  function toggleRecordSelection(recordId: number, checked: boolean) {
    setSelectedRecordIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(recordId);
      } else {
        next.delete(recordId);
      }
      return next;
    });
  }

  function removeDeletedRecords(recordIds: number[]) {
    const deletedIdSet = new Set(recordIds);
    setRecords((current) => current.filter((item) => !deletedIdSet.has(item.id)));
    setDrafts((current) => {
      const next = { ...current };
      for (const id of deletedIdSet) {
        delete next[String(id)];
      }
      return next;
    });
    setSelectedRecordIds((current) => {
      const next = new Set(current);
      for (const id of deletedIdSet) {
        next.delete(id);
      }
      return next;
    });
  }

  function handleDeleteMany(recordIds: number[], confirmText: string) {
    const uniqueIds = Array.from(new Set(recordIds));
    if (uniqueIds.length === 0) {
      setMessage("请先选择要删除的文案记录。");
      return;
    }

    if (!window.confirm(confirmText)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCopywritingsAction({ copywritingIds: uniqueIds });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      removeDeletedRecords(result.data.ids);
      setMessage(`已删除 ${result.data.deletedCount} 条文案记录。`);
      router.refresh();
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

      <DashboardCard className="px-5 py-4">
        <div className="grid gap-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(320px,1fr)_180px_240px]">
            <Field label="选择商品">
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
            </Field>
            <Field label="生成平台">
              <select className={inputClassName} value={platform} onChange={(event) => handlePlatformChange(event.target.value)}>
                <option value="">全部平台</option>
                {platformOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="AI Provider">
              <select
                className={inputClassName}
                value={activeProviderId}
                onChange={(event) => {
                  setMessage(null);
                  const nextProviderId = event.target.value ? Number(event.target.value) : "";
                  setProviderId(nextProviderId);
                  syncRoute(productId, platform, nextProviderId);
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
            </Field>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#EEF2F8] pt-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-1 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{selectedProduct?.name ?? "先选择商品，再生成文案"}</p>
              <p>
                {selectedProduct
                  ? `参考售价 ${typeof selectedProduct.estimatedPrice === "number" ? `¥${selectedProduct.estimatedPrice.toFixed(2)}` : "--"}，${platform || "全部平台"}，生成后保留历史版本。`
                  : "顶部筛选只影响历史文案列表；这里用于生成新的文案草稿。"}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[560px]">
              <ActionButton variant="secondary" href={productId ? `/products/${productId}?tab=copywriting` : "/products"}>
                商品详情
              </ActionButton>
              <button
                type="button"
                disabled={isPending || Boolean(runtimeNotice)}
                onClick={handleGenerateSinglePlatform}
                className={actionButtonClassName}
              >
                生成当前平台
              </button>
              <button
                type="button"
                disabled={isPending || Boolean(runtimeNotice)}
                onClick={handleGeneratePackage}
                className={primaryActionButtonClassName}
              >
                <MiniIcon name="spark" className="h-4 w-4" />
                {isPending ? "生成中..." : "生成文案包"}
              </button>
            </div>
          </div>
        </div>
      </DashboardCard>

      {message ? (
        <div className="rounded-[24px] border border-[#E4EAF3] bg-[#FBFDFF] px-5 py-4 text-sm text-slate-600">{message}</div>
      ) : null}

      <DashboardCard className="px-5 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-900">当前筛选结果：{visibleRecordIds.length} 条文案</p>
            <p className="mt-1">已选择 {selectedVisibleCount} 条。批量删除只删除文案记录，不删除商品、AIJob 或素材文件。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={actionButtonClassName}
              disabled={visibleRecordIds.length === 0 || isPending}
              onClick={() => setSelectedRecordIds(new Set(visibleRecordIds))}
            >
              全选当前结果
            </button>
            <button
              type="button"
              className={actionButtonClassName}
              disabled={selectedVisibleCount === 0 || isPending}
              onClick={() => setSelectedRecordIds(new Set())}
            >
              取消选择
            </button>
            <button
              type="button"
              className={dangerButtonClassName}
              disabled={selectedVisibleCount === 0 || isPending}
              onClick={() =>
                handleDeleteMany(
                  visibleRecordIds.filter((id) => selectedRecordIds.has(id)),
                  `确认删除已选 ${selectedVisibleCount} 条文案记录？不会删除商品、AIJob 或素材文件。`,
                )
              }
            >
              删除已选
            </button>
            <button
              type="button"
              className={dangerButtonClassName}
              disabled={visibleRecordIds.length === 0 || isPending}
              onClick={() =>
                handleDeleteMany(
                  visibleRecordIds,
                  `确认删除当前筛选结果中的 ${visibleRecordIds.length} 条文案记录？不会删除商品、AIJob 或素材文件。`,
                )
              }
            >
              一键删除当前全部
            </button>
          </div>
        </div>
      </DashboardCard>

      {groupedRecords.length > 0 ? (
        groupedRecords
          .filter((group) => group.records.length > 0)
          .map((group) => (
            <DashboardCard key={group.key}>
              <DashboardCardHeader
                title={group.title}
                description={group.description}
              />
              <div className="space-y-4 px-5 py-5">
                {group.records.map((record) => {
                  const draft = drafts[String(record.id)] ?? buildDraftState(record);
                  const versionLabel = record.versionLabel ?? record.version ?? "A";
                  const isSelected = selectedRecordIds.has(record.id);

                  return (
                    <div key={record.id} className="rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => toggleRecordSelection(record.id, event.target.checked)}
                            disabled={isPending}
                            aria-label={`选择 ${record.platform ?? "文案"} ${versionLabel} 版`}
                            className="mt-1 h-4 w-4 shrink-0 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-900">
                                {record.platform ?? "文案"} {versionLabel} 版
                              </h3>
                              <StatusBadge label={record.auditStatus ?? "待生成"} tone={getStatusTone(record.auditStatus)} />
                              {record.isUsedInListing ? <StatusBadge label="实际使用中" tone="green" /> : null}
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              创建于 {new Date(record.createdAt).toLocaleString("zh-CN")}
                              {record.aiJobSummary ? ` · AIJob #${record.aiJobSummary.id} ${record.aiJobSummary.status}` : " · 手动记录"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={actionButtonClassName}
                            onClick={() => updateDraft(record.id, { expanded: !draft.expanded })}
                          >
                            {draft.expanded ? "收起" : "展开"}
                          </button>
                          <button type="button" disabled={isPending} onClick={() => handleDelete(record)} className={dangerButtonClassName}>
                            删除
                          </button>
                        </div>
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
                            <button type="button" disabled={isPending} onClick={() => handleDelete(record)} className={dangerButtonClassName}>
                              删除
                            </button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}
