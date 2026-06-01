import Link from "next/link";
import {
  ActionButton,
  DashboardCard,
  DashboardCardHeader,
  MiniIcon,
  PageNote,
  StatusBadge,
} from "@/components/dashboard/primitives";
import { ProductImage } from "@/components/products/product-image";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { LinkImportFilterControls } from "@/components/link-imports/link-import-filter-controls";
import {
  createLinkImportDraftAction,
  linkImportDraftToCompetitorAction,
  linkImportDraftToInspirationAction,
  linkImportDraftToProductAction,
  rejectLinkImportDraftAction,
  updateLinkImportDraftAction,
} from "@/app/link-imports/actions";
import {
  LINK_IMPORT_READONLY_MESSAGE,
  getLinkImportPageData,
  linkImportPurposeOptions,
  linkImportQualityOptions,
  linkImportStatusOptions,
} from "@/lib/services/link-import";

export const dynamic = "force-dynamic";

type SearchParams = {
  draftId?: string;
  status?: string;
  purpose?: string;
  linkImportMessage?: string;
  linkImportError?: string;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";
const textareaClassName =
  "min-h-[110px] w-full resize-y rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";
const secondaryButtonClassName =
  "inline-flex h-12 items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-5 text-sm font-medium text-[#2563EB] disabled:opacity-60";
const primaryButtonClassName =
  "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.20)] disabled:opacity-60";
const dangerButtonClassName =
  "inline-flex h-12 items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 text-sm font-medium text-rose-600 disabled:opacity-60";

function parseDraftId(value?: string) {
  const id = Number(value ?? "");
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(normalized)) return true;
  if (normalized.startsWith("10.")) return true;
  if (normalized.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  return false;
}

function getSafeLinkImportDisplayUrl(value: string | null | undefined) {
  if (!value) return "--";

  if (/^[a-zA-Z]:[\\/]/.test(value)) {
    return "本地路径已隐藏";
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "file:") {
      return "本地文件 URL 已隐藏";
    }
    if (isPrivateHostname(parsed.hostname)) {
      return "本地/内网 URL 已隐藏";
    }
  } catch {
    return value;
  }

  return value;
}

function buildDraftHref(input: { draftId: number; purpose?: string | null; status?: string | null }) {
  const params = new URLSearchParams();
  params.set("draftId", String(input.draftId));
  if (input.purpose) params.set("purpose", input.purpose);
  if (input.status) params.set("status", input.status);
  return `/link-imports?${params.toString()}`;
}

export default async function LinkImportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const pageResult = await getLinkImportPageData({
    draftId: parseDraftId(params.draftId),
    status: params.status ?? null,
    purpose: params.purpose ?? null,
  }).catch((error) => ({
    runtime: { isWritable: false },
    drafts: [],
    selectedDraft: null,
    filters: { status: params.status ?? null, purpose: params.purpose ?? null },
    readError: error instanceof Error ? error.message : "当前无法读取链接导入草稿，请在 Windows 本地重试。",
  }));

  const readError = "readError" in pageResult ? pageResult.readError : null;
  const selectedDraft = pageResult.selectedDraft;
  const readonlyNotice = pageResult.runtime.isWritable ? null : LINK_IMPORT_READONLY_MESSAGE;

  return (
    <WorkspacePage
      eyebrow="V1.5 Thread 03"
      title="链接导入尝试与质量分级"
      description="手动粘贴单个商品或竞品链接，保存为链接导入草稿；仅尝试公开元信息，转化必须由用户确认。"
    >
      {readonlyNotice ? <PageNote>{readonlyNotice}</PageNote> : null}
      {readError ? <PageNote>{readError}</PageNote> : null}
      {params.linkImportMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{params.linkImportMessage}</div> : null}
      {params.linkImportError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.linkImportError}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardCard>
          <DashboardCardHeader
            title="新建链接草稿"
            description="一次只处理一个手动粘贴的链接；截图、页面文本和备注都只是辅助信息。"
          />
          <form action={createLinkImportDraftAction} className="grid gap-4 px-5 py-5">
            <Field label="链接">
              <input
                name="url"
                placeholder="https://..."
                className={inputClassName}
                disabled={!pageResult.runtime.isWritable}
                required
              />
            </Field>
            <Field label="用途">
              <select name="purpose" defaultValue={pageResult.filters.purpose ?? "inspiration"} className={inputClassName} disabled={!pageResult.runtime.isWritable}>
                {linkImportPurposeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            <Field label="辅助截图">
              <input
                type="file"
                name="screenshot"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className={inputClassName}
                disabled={!pageResult.runtime.isWritable}
              />
            </Field>
            <Field label="页面文本">
              <textarea
                name="manualText"
                placeholder="可手动粘贴页面中能公开看到的标题、规格、卖点或说明"
                className={textareaClassName}
                disabled={!pageResult.runtime.isWritable}
              />
            </Field>
            <Field label="备注">
              <textarea
                name="note"
                placeholder="记录你为什么要保存这个链接"
                className={textareaClassName}
                disabled={!pageResult.runtime.isWritable}
              />
            </Field>
            <button type="submit" className={primaryButtonClassName} disabled={!pageResult.runtime.isWritable}>
              <MiniIcon name="upload" className="h-4 w-4" />
              创建链接草稿
            </button>
          </form>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader
            title="当前草稿"
            description="质量分级只提示导入信息完整度，不代表商品判断结论。"
          />
          {selectedDraft ? (
            <div className="grid gap-5 px-5 py-5 lg:grid-cols-[220px_1fr]">
              <div>
                {selectedDraft.displayScreenshotPath ? (
                  <ProductImage src={selectedDraft.displayScreenshotPath} alt="链接导入辅助截图" label="链接" large />
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-[#D8E3F2] bg-[#F8FBFF] text-sm text-slate-400">
                    未上传截图
                  </div>
                )}
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                <DetailRow label="草稿" value={`#${selectedDraft.id}`} />
                <DetailRow label="用途" value={selectedDraft.purposeLabel} />
                <DetailRow label="状态" value={selectedDraft.statusLabel} badgeTone={selectedDraft.statusTone} />
                <DetailRow label="质量" value={selectedDraft.qualityLabel} badgeTone={selectedDraft.qualityTone} />
                <DetailRow label="平台" value={selectedDraft.sourcePlatformLabel} />
                <DetailRow label="原链接" value={getSafeLinkImportDisplayUrl(selectedDraft.url)} />
                <DetailRow label="规范化" value={getSafeLinkImportDisplayUrl(selectedDraft.normalizedUrl)} />
                <DetailRow label="公开标题" value={selectedDraft.metaTitle ?? "--"} />
                <DetailRow label="公开描述" value={selectedDraft.metaDescription ?? "--"} />
                <DetailRow label="转化" value={selectedDraft.conversionLabel} />
                <DetailRow label="创建" value={selectedDraft.formattedCreatedAt} />
                <DetailRow label="更新" value={selectedDraft.formattedUpdatedAt} />
                {selectedDraft.errorSummary ? <p className="text-amber-600">{selectedDraft.errorSummary}</p> : null}
                <PageNote>
                  本页不会自动打开多个链接、不会保存 Cookie、不会登录平台，也不会自动创建正式商品或竞品事实。
                </PageNote>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <PageNote>暂无链接导入草稿。</PageNote>
            </div>
          )}
        </DashboardCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <DashboardCard>
          <DashboardCardHeader title="草稿列表" description="查看手动保存的链接草稿；默认最多展示最近 80 条。" />
          <div className="border-b border-[#EEF2F8] px-5 py-4">
            <LinkImportFilterControls
              purpose={pageResult.filters.purpose ?? ""}
              status={pageResult.filters.status ?? ""}
              purposeOptions={linkImportPurposeOptions}
              statusOptions={linkImportStatusOptions}
            />
          </div>
          <div className="space-y-3 px-5 py-4">
            {pageResult.drafts.length > 0 ? (
              pageResult.drafts.map((draft) => (
                <Link
                  key={draft.id}
                  href={buildDraftHref({
                    draftId: draft.id,
                    purpose: pageResult.filters.purpose,
                    status: pageResult.filters.status,
                  })}
                  className={[
                    "block rounded-2xl border px-4 py-4 transition hover:-translate-y-[1px] hover:border-blue-100 hover:bg-[#FBFDFF] hover:shadow-[0_14px_30px_rgba(59,130,246,0.08)]",
                    selectedDraft?.id === draft.id ? "border-blue-200 bg-[#F8FBFF]" : "border-[#EEF2F8] bg-white",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">草稿 #{draft.id}</span>
                    <span className="text-xs text-slate-400">{draft.formattedCreatedAt}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge label={draft.purposeLabel} tone="blue" />
                    <StatusBadge label={draft.sourcePlatformLabel} tone="violet" />
                    <StatusBadge label={draft.statusLabel} tone={draft.statusTone} />
                    <StatusBadge label={draft.qualityLabel} tone={draft.qualityTone} />
                  </div>
                  <p className="mt-3 line-clamp-2 break-all text-xs leading-5 text-slate-500">{getSafeLinkImportDisplayUrl(draft.normalizedUrl ?? draft.url)}</p>
                </Link>
              ))
            ) : (
              <PageNote>暂无链接导入草稿。</PageNote>
            )}
          </div>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="手动整理与确认转化" description="编辑辅助文本，或明确确认转灵感、关联已有商品、关联已有竞品。" />
          {selectedDraft ? (
            <div className="grid gap-5 px-5 py-5">
              <form className="grid gap-4">
                <input type="hidden" name="draftId" value={selectedDraft.id} />
                <Field label="用途">
                  <select name="purpose" defaultValue={selectedDraft.purpose} className={inputClassName} disabled={!pageResult.runtime.isWritable}>
                    {linkImportPurposeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="页面文本">
                  <textarea name="manualText" defaultValue={selectedDraft.manualText ?? ""} className={textareaClassName} disabled={!pageResult.runtime.isWritable} />
                </Field>
                <Field label="备注">
                  <textarea name="note" defaultValue={selectedDraft.note ?? ""} className={textareaClassName} disabled={!pageResult.runtime.isWritable} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <button formAction={updateLinkImportDraftAction} type="submit" className={secondaryButtonClassName} disabled={!pageResult.runtime.isWritable}>
                    保存草稿
                  </button>
                  <button formAction={rejectLinkImportDraftAction} type="submit" className={dangerButtonClassName} disabled={!pageResult.runtime.isWritable}>
                    放弃 / 归档
                  </button>
                </div>
              </form>

              <div className="grid gap-3 rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4">
                <p className="text-sm font-semibold text-slate-800">质量分级规则</p>
                <div className="flex flex-wrap gap-2">
                  {linkImportQualityOptions.map((option) => (
                    <StatusBadge key={option.value} label={option.label} tone={option.value === selectedDraft.qualityLevel ? selectedDraft.qualityTone : "slate"} />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <form action={linkImportDraftToInspirationAction} className="grid gap-3 rounded-[24px] border border-[#EEF2F8] bg-white px-4 py-4">
                  <input type="hidden" name="draftId" value={selectedDraft.id} />
                  <p className="text-sm font-semibold text-slate-800">转为灵感</p>
                  <p className="min-h-12 text-xs leading-6 text-slate-500">
                    {selectedDraft.screenshotPath ? "创建后仍进入灵感箱等待人工处理。" : "需要先上传辅助截图，才能转为灵感。"}
                  </p>
                  <button type="submit" className={secondaryButtonClassName} disabled={!pageResult.runtime.isWritable || !selectedDraft.screenshotPath}>
                    确认转灵感
                  </button>
                </form>

                <form action={linkImportDraftToProductAction} className="grid gap-3 rounded-[24px] border border-[#EEF2F8] bg-white px-4 py-4">
                  <input type="hidden" name="draftId" value={selectedDraft.id} />
                  <p className="text-sm font-semibold text-slate-800">关联商品</p>
                  <input name="productId" placeholder="已有商品 ID" className={inputClassName} disabled={!pageResult.runtime.isWritable} required />
                  <button type="submit" className={secondaryButtonClassName} disabled={!pageResult.runtime.isWritable}>
                    确认关联商品
                  </button>
                </form>

                <form action={linkImportDraftToCompetitorAction} className="grid gap-3 rounded-[24px] border border-[#EEF2F8] bg-white px-4 py-4">
                  <input type="hidden" name="draftId" value={selectedDraft.id} />
                  <p className="text-sm font-semibold text-slate-800">关联竞品</p>
                  <input name="competitorId" placeholder="已有竞品 ID" className={inputClassName} disabled={!pageResult.runtime.isWritable} required />
                  <button type="submit" className={secondaryButtonClassName} disabled={!pageResult.runtime.isWritable}>
                    确认关联竞品
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <PageNote>选择一条链接草稿后，可以编辑辅助信息或执行确认转化。</PageNote>
            </div>
          )}
        </DashboardCard>
      </section>

      <div className="flex flex-wrap gap-2">
        <ActionButton href="/inspirations" variant="ghost">返回灵感箱</ActionButton>
        <ActionButton href="/products" variant="ghost">返回商品池</ActionButton>
      </div>
    </WorkspacePage>
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

function DetailRow({
  label,
  value,
  badgeTone,
}: {
  label: string;
  value: string;
  badgeTone?: "blue" | "amber" | "green" | "violet" | "red" | "slate";
}) {
  return (
    <div className="grid gap-1 md:grid-cols-[76px_1fr]">
      <span className="text-slate-400">{label}</span>
      <div className="min-w-0 break-all">
        {badgeTone ? <StatusBadge label={value} tone={badgeTone} /> : <span>{value}</span>}
      </div>
    </div>
  );
}
