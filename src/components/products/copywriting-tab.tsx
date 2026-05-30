"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardCard, DashboardCardHeader, FilterBar, StatusBadge } from "@/components/dashboard/primitives";
import { saveManualCopywritingAction } from "@/app/copywriting/actions";
import {
  BANNED_WORD_RISK_LEVELS,
  COPYWRITING_AUDIT_STATUS,
  COPYWRITING_PLATFORMS,
  COPYWRITING_VERSIONS,
} from "@/lib/modules/copywriting/prompts";

type RiskWordHit = {
  word: string;
  riskLevel: string;
  category: string;
  field: string;
};

type CopywritingView = {
  id: number;
  productId: number;
  platform: string | null;
  version: string | null;
  versionLabel: string | null;
  style: string | null;
  title: string | null;
  body: string | null;
  mainCopy: string | null;
  auditStatus: string | null;
  isUsedInListing: boolean;
  display: {
    sellingPoints: string[];
  };
  riskWordHits?: RiskWordHit[];
};

const PLATFORM_OPTIONS = ["全部", ...COPYWRITING_PLATFORMS] as const;
const VERSION_OPTIONS = ["全部", ...COPYWRITING_VERSIONS] as const;

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

export function CopywritingTab({
  productId,
  copywritings,
}: {
  productId: number;
  copywritings: CopywritingView[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const platformFilter = searchParams.get("copyPlatform") ?? "全部";
  const versionFilter = searchParams.get("copyVersion") ?? "全部";

  const filteredCopywritings = useMemo(
    () =>
      copywritings.filter((record) => {
        if (platformFilter !== "全部" && record.platform !== platformFilter) {
          return false;
        }
        if (versionFilter !== "全部" && (record.versionLabel ?? record.version) !== versionFilter) {
          return false;
        }
        return true;
      }),
    [copywritings, platformFilter, versionFilter],
  );

  function updateFilter(nextPlatform: string, nextVersion: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPlatform === "全部") {
      params.delete("copyPlatform");
    } else {
      params.set("copyPlatform", nextPlatform);
    }

    if (nextVersion === "全部") {
      params.delete("copyVersion");
    } else {
      params.set("copyVersion", nextVersion);
    }

    router.push(`/products/${productId}?${params.toString()}`);
  }

  return (
    <div className="space-y-4 px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">这里保持轻量展示与快速编辑，完整多平台生成、历史版本和使用标记请前往文案工作台处理。</p>
        <a
          href={`/copywriting?productId=${productId}`}
          className="inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50"
        >
          打开文案工作台
        </a>
      </div>

      <FilterBar>
        <div className="xl:min-w-[180px]">
          <p className="mb-2 px-1 text-sm text-slate-500">平台筛选</p>
          <select className="h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700" value={platformFilter} onChange={(event) => updateFilter(event.target.value, versionFilter)}>
            {PLATFORM_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="xl:min-w-[180px]">
          <p className="mb-2 px-1 text-sm text-slate-500">版本筛选</p>
          <select className="h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700" value={versionFilter} onChange={(event) => updateFilter(platformFilter, event.target.value)}>
            {VERSION_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      {message ? (
        <div className="rounded-[24px] border border-[#E4EAF3] bg-[#FBFDFF] px-5 py-4 text-sm text-slate-600">{message}</div>
      ) : null}

      {filteredCopywritings.length > 0 ? (
        filteredCopywritings.map((record) => (
          <RecordCard key={record.id} productId={productId} record={record} isPending={isPending} onMessage={setMessage} onRefresh={() => router.refresh()} startTransition={startTransition} />
        ))
      ) : (
        <div className="rounded-[24px] border border-dashed border-[#D8E3F2] bg-[#FAFCFF] px-4 py-4 text-sm text-slate-500">
          当前筛选条件下还没有文案记录，可先前往文案工作台生成多平台文案包。
        </div>
      )}
    </div>
  );
}

function RecordCard({
  productId,
  record,
  isPending,
  onMessage,
  onRefresh,
  startTransition,
}: {
  productId: number;
  record: CopywritingView;
  isPending: boolean;
  onMessage: (message: string | null) => void;
  onRefresh: () => void;
  startTransition: React.TransitionStartFunction;
}) {
  const [title, setTitle] = useState(record.title ?? "");
  const [mainCopy, setMainCopy] = useState(record.body ?? record.mainCopy ?? "");
  const [sellingPoints, setSellingPoints] = useState(record.display.sellingPoints.join("\n"));

  return (
    <DashboardCard>
      <DashboardCardHeader
        title={`${record.platform ?? "--"} ${record.versionLabel ?? record.version ?? "--"} 版`}
        description={record.style ?? "--"}
        action={
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={record.auditStatus ?? "待生成"} tone={getStatusTone(record.auditStatus)} />
            {record.isUsedInListing ? <StatusBadge label="实际使用中" tone="green" /> : null}
          </div>
        }
      />
      <div className="space-y-4 px-5 py-5">
        <Field label="标题">
          <input className="h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700" value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="正文">
          <textarea className="min-h-[120px] w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm text-slate-700" value={mainCopy} onChange={(event) => setMainCopy(event.target.value)} />
        </Field>
        <Field label="卖点">
          <textarea className="min-h-[100px] w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm text-slate-700" value={sellingPoints} onChange={(event) => setSellingPoints(event.target.value)} />
        </Field>

        {record.riskWordHits?.length ? (
          <div className="rounded-2xl border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">违规词命中</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {record.riskWordHits.map((hit, index) => (
                <StatusBadge key={`${hit.word}-${index}`} label={`${hit.word} / ${hit.riskLevel}`} tone={getRiskTone(hit.riskLevel)} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(
                [
                  `${record.platform ?? "文案"} ${record.versionLabel ?? record.version ?? ""}版`,
                  title ? `标题：${title}` : null,
                  mainCopy ? `正文：\n${mainCopy}` : null,
                  sellingPoints.trim() ? `卖点：\n${sellingPoints}` : null,
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              );
              onMessage("文案已复制。");
            }}
            className="inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50"
          >
            复制
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await saveManualCopywritingAction({
                  copywritingId: record.id,
                  productId,
                  providerId: null,
                  platform: (record.platform ?? "闲鱼") as "闲鱼" | "淘宝" | "小红书" | "抖音",
                  version: (record.versionLabel ?? record.version ?? "A") as "A" | "B" | "C",
                  style: record.style ?? "",
                  title,
                  mainCopy,
                  sellingPointsText: sellingPoints,
                });

                if (!result.success) {
                  onMessage(result.error);
                  return;
                }

                onMessage("文案已保存并重新扫描。");
                onRefresh();
              });
            }}
            className="inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50 disabled:opacity-70"
          >
            保存
          </button>
        </div>
      </div>
    </DashboardCard>
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
