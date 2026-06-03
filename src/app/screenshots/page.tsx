import Link from "next/link";
import {
  ActionButton,
  DashboardCard,
  DashboardCardHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  MiniIcon,
  PageNote,
  StatusBadge,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { ProductImage } from "@/components/products/product-image";
import { ScreenshotFileInput } from "@/components/screenshots/screenshot-file-input";
import { WorkspacePage } from "@/components/ui/workspace-page";
import {
  confirmScreenshotDraftAction,
  createScreenshotRecognitionJobAction,
  ignoreScreenshotDraftAction,
  recognizeScreenshotJobAction,
  saveScreenshotDraftAction,
} from "@/app/screenshots/actions";
import {
  SCREENSHOT_READONLY_MESSAGE,
  getScreenshotRecognitionPageData,
  screenshotQualityOptions,
  screenshotSourceTypeOptions,
  type ScreenshotStructuredDraft,
} from "@/lib/services/screenshot";

export const dynamic = "force-dynamic";

type SearchParams = {
  jobId?: string;
  sourceType?: string;
  sourceId?: string;
  productId?: string;
  screenshotError?: string;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";
const textareaClassName =
  "min-h-[108px] w-full resize-y rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";
const secondaryButtonClassName =
  "inline-flex h-12 items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-5 text-sm font-medium text-[#2563EB] disabled:opacity-60";
const primaryButtonClassName =
  "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.20)] disabled:opacity-60";

function parseJobId(value?: string) {
  const id = Number(value ?? "");
  return Number.isInteger(id) && id > 0 ? id : null;
}

function emptyDraft(): ScreenshotStructuredDraft {
  return {
    draftLabel: "截图识别草稿 / 待用户确认",
    possibleTitle: null,
    possiblePrice: null,
    possibleSalesOrHeat: null,
    possiblePlatformSource: null,
    sellingPoints: [],
    specInfo: [],
    riskWords: [],
    imageDescription: "",
    copywritingMaterialSummary: "",
    platformCopywritingDirections: [],
    privacyNotes: [],
    uncertaintyNotes: [],
    qualityLevel: "medium",
  };
}

function lines(values: string[]) {
  return values.join("\n");
}

export default async function ScreenshotsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const pageResult = await getScreenshotRecognitionPageData({
    jobId: parseJobId(params.jobId),
    sourceType: params.sourceType ?? null,
    sourceId: params.sourceId ?? null,
    productId: params.productId ?? null,
  }).catch((error) => ({
    runtime: { isWritable: false },
    jobs: [],
    selectedJob: null,
    defaults: {
      sourceType: params.sourceType ?? "manual",
      sourceId: params.sourceId ?? "",
      productId: params.productId ?? "",
    },
    readError: error instanceof Error ? error.message : "当前无法读取截图识别记录，请在 Windows 本地重试。",
  }));
  const readError = "readError" in pageResult ? pageResult.readError : null;
  const selectedJob = pageResult.selectedJob;
  const draft = selectedJob?.effectiveDraft ?? selectedJob?.structuredDraft ?? emptyDraft();
  const readonlyNotice = pageResult.runtime.isWritable ? null : SCREENSHOT_READONLY_MESSAGE;
  const shortcutActions = (
    <div className="flex flex-wrap justify-end gap-2">
      <ActionButton href="/inspirations" variant="ghost">{"\u8fd4\u56de\u7075\u611f\u7bb1"}</ActionButton>
      <ActionButton href="/materials" variant="ghost">{"\u8fd4\u56de\u7d20\u6750\u5e93"}</ActionButton>
      {pageResult.defaults.productId ? <ActionButton href={`/products/${pageResult.defaults.productId}`} variant="ghost">{"\u8fd4\u56de\u5546\u54c1\u8be6\u60c5"}</ActionButton> : null}
    </div>
  );

  return (
    <WorkspacePage
      eyebrow="Supplement / Screenshots"
      title="截图补充识别"
      description="补充入口：当图片还没先进入灵感箱时，可在这里手动识别，再回灵感箱看 AI 草稿和初筛结果。"
    >
      {readonlyNotice ? <PageNote>{readonlyNotice}</PageNote> : null}
      {readError ? <PageNote>{readError}</PageNote> : null}
      {params.screenshotError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.screenshotError}</div> : null}
      <PageNote>日常流程仍建议先看灵感箱；这里只处理补充识别，不会自动打开网页或抓取平台。</PageNote>
      {shortcutActions}

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardCard>
          <DashboardCardHeader
            title="补充上传截图"
            description="适合单张补录，也支持从灵感箱、商品详情、竞品模块或素材库选择已有图片。不会自动截屏、打开网页或抓取平台。"
          />
          <form action={createScreenshotRecognitionJobAction} className="grid gap-4 px-5 py-5">
            <Field label="来源类型">
              <select name="sourceType" defaultValue={pageResult.defaults.sourceType} className={inputClassName} disabled={!pageResult.runtime.isWritable}>
                {screenshotSourceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="来源记录 ID">
                <input
                  name="sourceId"
                  defaultValue={pageResult.defaults.sourceId}
                  placeholder="可选，例如灵感/素材/竞品/商品 ID"
                  className={inputClassName}
                  disabled={!pageResult.runtime.isWritable}
                />
              </Field>
              <Field label="关联商品 ID">
                <input
                  name="productId"
                  defaultValue={pageResult.defaults.productId}
                  placeholder="可选，用于商品详情入口"
                  className={inputClassName}
                  disabled={!pageResult.runtime.isWritable}
                />
              </Field>
            </div>
            <Field label="手动上传截图">
              <ScreenshotFileInput disabled={!pageResult.runtime.isWritable} />
              <p className="mt-2 text-xs leading-5 text-slate-400">
                不上传文件时，系统会尝试使用来源记录已有图片。支持 jpg / jpeg / png / webp，单张最大沿用现有图片服务限制。
              </p>
            </Field>
            <button type="submit" className={primaryButtonClassName} disabled={!pageResult.runtime.isWritable}>
              <MiniIcon name="upload" className="h-4 w-4" />
              创建识别草稿任务
            </button>
          </form>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader
            title="当前截图预览"
            description="识别结果只作为补充草稿显示；建议确认后回灵感箱继续判断是否保留、放弃或转商品。"
            action={
              selectedJob ? (
                <form action={recognizeScreenshotJobAction}>
                  <input type="hidden" name="jobId" value={selectedJob.id} />
                  <button
                    type="submit"
                    className={secondaryButtonClassName}
                    disabled={!pageResult.runtime.isWritable || selectedJob.status === "processing"}
                  >
                    触发 AI 识别
                  </button>
                </form>
              ) : undefined
            }
          />
          {selectedJob ? (
            <div className="grid gap-5 px-5 py-5 md:grid-cols-[220px_1fr]">
              <ProductImage src={selectedJob.displayPath} alt={selectedJob.imagePath} label="截图" large />
              <div className="grid gap-3 text-sm text-slate-600">
                <DetailRow label="任务" value={`#${selectedJob.id}`} />
                <DetailRow label="来源" value={selectedJob.sourceLabel} />
                <DetailRow label="状态" value={selectedJob.status} badgeTone={selectedJob.statusTone} />
                <DetailRow label="质量" value={selectedJob.qualityLevel ?? "--"} badgeTone={selectedJob.qualityTone} />
                <DetailRow label="图片" value={selectedJob.imagePath} />
                <DetailRow label="创建" value={selectedJob.formattedCreatedAt} />
                <DetailRow label="更新" value={selectedJob.formattedUpdatedAt} />
                <DetailRow label="确认" value={selectedJob.formattedConfirmedAt ?? "--"} />
                <DetailRow label="忽略" value={selectedJob.formattedIgnoredAt ?? "--"} />
                <DetailRow label="AIJob" value={selectedJob.aiJob ? `#${selectedJob.aiJob.id} / ${selectedJob.aiJob.status}` : "--"} />
                {selectedJob.errorSummary ? <p className="text-rose-600">{selectedJob.errorSummary}</p> : null}
                <PageNote>
                  商品、竞品、素材确认都只保存截图识别草稿记录；不会自动覆盖标题、价格、成本、评分、状态、竞品价格、素材权限或素材状态。
                </PageNote>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <PageNote>暂无补充识别任务。需要补录时再上传或选择一张截图。</PageNote>
            </div>
          )}
        </DashboardCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <DashboardCard>
          <DashboardCardHeader title="补充识别记录" description="仅显示识别任务与草稿状态；不展示本地绝对路径或 AI 原始响应。" />
          <TableScrollArea>
            <DataTable className="min-w-[760px]">
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell className="w-[14%]">任务</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[22%]">来源</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[14%]">状态</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[14%]">质量</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[22%]">时间</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[14%]">操作</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {pageResult.jobs.length > 0 ? (
                  pageResult.jobs.map((job) => (
                    <DataTableRow key={job.id}>
                      <DataTableCell>#{job.id}</DataTableCell>
                      <DataTableCell>{job.sourceLabel}</DataTableCell>
                      <DataTableCell><StatusBadge label={job.status} tone={job.statusTone} /></DataTableCell>
                      <DataTableCell><StatusBadge label={job.qualityLevel ?? "--"} tone={job.qualityTone} /></DataTableCell>
                      <DataTableCell>{job.formattedCreatedAt}</DataTableCell>
                      <DataTableCell>
                        <Link href={`/screenshots?jobId=${job.id}`} className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]">
                          查看
                        </Link>
                      </DataTableCell>
                    </DataTableRow>
                  ))
                ) : (
                  <DataTableRow>
                    <DataTableCell colSpan={6} className="py-10 text-center text-sm text-slate-400">
                      暂无补充识别记录。
                    </DataTableCell>
                  </DataTableRow>
                )}
              </DataTableBody>
            </DataTable>
          </TableScrollArea>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="结构化草稿" description="可编辑后保存或确认。确认只写入截图识别任务，建议随后回灵感箱或对应业务页继续人工判断。" />
          {selectedJob ? (
            <form className="space-y-4 px-5 py-5">
              <input type="hidden" name="jobId" value={selectedJob.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="可能商品标题">
                  <input name="possibleTitle" defaultValue={draft.possibleTitle ?? ""} className={inputClassName} disabled={!pageResult.runtime.isWritable} />
                </Field>
                <Field label="可能价格">
                  <input name="possiblePrice" defaultValue={draft.possiblePrice ?? ""} className={inputClassName} disabled={!pageResult.runtime.isWritable} />
                </Field>
                <Field label="可能销量 / 热度">
                  <input name="possibleSalesOrHeat" defaultValue={draft.possibleSalesOrHeat ?? ""} className={inputClassName} disabled={!pageResult.runtime.isWritable} />
                </Field>
                <Field label="可能平台来源">
                  <input name="possiblePlatformSource" defaultValue={draft.possiblePlatformSource ?? ""} className={inputClassName} disabled={!pageResult.runtime.isWritable} />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="质量分级">
                  <select name="qualityLevel" defaultValue={draft.qualityLevel} className={inputClassName} disabled={!pageResult.runtime.isWritable}>
                    {screenshotQualityOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="图片内容描述">
                  <input name="imageDescription" defaultValue={draft.imageDescription} className={inputClassName} disabled={!pageResult.runtime.isWritable} />
                </Field>
              </div>
              <Field label="可能商品卖点">
                <textarea name="sellingPointsText" defaultValue={lines(draft.sellingPoints)} className={textareaClassName} disabled={!pageResult.runtime.isWritable} />
              </Field>
              <Field label="可能规格信息">
                <textarea name="specInfoText" defaultValue={lines(draft.specInfo)} className={textareaClassName} disabled={!pageResult.runtime.isWritable} />
              </Field>
              <Field label="可能风险词">
                <textarea name="riskWordsText" defaultValue={lines(draft.riskWords)} className={textareaClassName} disabled={!pageResult.runtime.isWritable} />
              </Field>
              <Field label="适合生成商品文案的素材摘要">
                <textarea name="copywritingMaterialSummary" defaultValue={draft.copywritingMaterialSummary} className={textareaClassName} disabled={!pageResult.runtime.isWritable} />
              </Field>
              <Field label="可能适合的平台文案方向">
                <textarea name="platformCopywritingDirectionsText" defaultValue={lines(draft.platformCopywritingDirections)} className={textareaClassName} disabled={!pageResult.runtime.isWritable} />
              </Field>
              <Field label="隐私 / 敏感信息提醒">
                <textarea name="privacyNotesText" defaultValue={lines(draft.privacyNotes)} className={textareaClassName} disabled={!pageResult.runtime.isWritable} />
              </Field>
              <Field label="不确定项">
                <textarea name="uncertaintyNotesText" defaultValue={lines(draft.uncertaintyNotes)} className={textareaClassName} disabled={!pageResult.runtime.isWritable} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button formAction={saveScreenshotDraftAction} type="submit" className={secondaryButtonClassName} disabled={!pageResult.runtime.isWritable}>
                  保存草稿
                </button>
                <button formAction={confirmScreenshotDraftAction} type="submit" className={primaryButtonClassName} disabled={!pageResult.runtime.isWritable}>
                  确认保存草稿
                </button>
                <button formAction={ignoreScreenshotDraftAction} type="submit" className={secondaryButtonClassName} disabled={!pageResult.runtime.isWritable}>
                  忽略草稿
                </button>
              </div>
            </form>
          ) : (
            <div className="px-5 py-5">
              <PageNote>选择识别任务后，这里会显示可编辑的补充识别草稿。</PageNote>
            </div>
          )}
        </DashboardCard>
      </section>

      <div className="hidden flex-wrap gap-2">
        <ActionButton href="/inspirations" variant="ghost">返回灵感箱</ActionButton>
        <ActionButton href="/materials" variant="ghost">返回素材库</ActionButton>
        {pageResult.defaults.productId ? <ActionButton href={`/products/${pageResult.defaults.productId}`} variant="ghost">返回商品详情</ActionButton> : null}
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

