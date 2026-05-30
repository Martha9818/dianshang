import Link from "next/link";
import {
  ActionButton,
  DashboardCard,
  DashboardCardHeader,
  FilterBar,
  MiniIcon,
  MockThumb,
  PageNote,
  StatusBadge,
  TableActionLink,
} from "@/components/dashboard/primitives";
import { PromptTaskCopyButton, PromptTaskCancelButton } from "@/components/prompt-tasks/prompt-task-actions";
import { PromptTaskCreateForm } from "@/components/prompt-tasks/prompt-task-form";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { getProductErrorMessage } from "@/lib/modules/products";
import { PROMPT_IMAGE_TYPES, PROMPT_TASK_PLATFORMS } from "@/lib/modules/prompt-task";
import { getPromptTaskPageData, getPromptTaskStatusTone, PROMPT_TASK_STATUS } from "@/lib/services/prompt-task-service";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { normalizePromptTaskQuery } from "@/lib/services/query-service";

export const dynamic = "force-dynamic";

const selectClassName =
  "h-11 w-full rounded-2xl border border-[#E4EAF3] bg-white px-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

export default async function PromptTasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    productId?: string;
    q?: string;
    platform?: string;
    imageType?: string;
    recommendedSize?: string;
    status?: string;
    sort?: string;
    taskCode?: string;
  }>;
}) {
  const params = await searchParams;
  const runtime = getRuntimeModeSummary();
  const query = normalizePromptTaskQuery(params);
  const pageData = await getPromptTaskPageData(query).catch((error) => ({
    products: [],
    tasks: [],
    recommendedSizes: [],
    platforms: PROMPT_TASK_PLATFORMS,
    imageTypes: PROMPT_IMAGE_TYPES,
    statuses: Object.values(PROMPT_TASK_STATUS),
    runtime,
    readError: getProductErrorMessage(error, "当前预览环境未加载 Windows 本地 SQLite 商品库，请在 Windows 本地验收 Prompt 任务。"),
  }));
  const activeTask = pageData.tasks.find((task) => task.taskCode === params.taskCode) ?? pageData.tasks[0] ?? null;
  const runtimeNotice = pageData.runtime.isWritable ? null : buildReadonlyRuntimeMessage(pageData.runtime.mode);

  return (
    <WorkspacePage
      eyebrow="Prompt Tasks"
      title="Prompt 任务"
      description="为商品生成可复制到网页版 ChatGPT 的生图 Prompt，并管理生成图回传状态。"
    >
      <FilterBar className="py-3">
        <form className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_140px_140px_140px_140px_150px_auto] xl:items-end">
          <label className="min-w-0">
            <span className="mb-1.5 block px-1 text-sm text-slate-500">商品关键词</span>
            <input name="q" defaultValue={query.keyword ?? ""} placeholder="搜索商品 / Task ID" className={selectClassName} />
          </label>
          <FilterSelect label="商品" name="productId" defaultValue={params.productId ?? ""}>
            <option value="">全部商品</option>
            {pageData.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="平台" name="platform" defaultValue={params.platform ?? ""}>
            <option value="">全部平台</option>
            {pageData.platforms.map((platform) => (
              <option key={platform.code} value={platform.code}>
                {platform.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="图片类型" name="imageType" defaultValue={params.imageType ?? ""}>
            <option value="">全部类型</option>
            {pageData.imageTypes.map((imageType) => (
              <option key={imageType.code} value={imageType.code}>
                {imageType.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="推荐尺寸" name="recommendedSize" defaultValue={params.recommendedSize ?? ""}>
            <option value="">全部尺寸</option>
            {pageData.recommendedSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="状态" name="status" defaultValue={params.status ?? ""}>
            <option value="">全部状态</option>
            {pageData.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="创建时间" name="sort" defaultValue={query.sort}>
            <option value="createdAt_desc">从新到旧</option>
            <option value="createdAt_asc">从旧到新</option>
          </FilterSelect>
          <div className="flex gap-2">
            <button
              type="submit"
              className="group inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-4 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.22)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] hover:shadow-[0_20px_42px_rgba(43,115,255,0.32)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 motion-reduce:transition-none motion-reduce:transform-none"
            >
              筛选
            </button>
            <ActionButton variant="secondary">
              <MiniIcon name="prompt" className="h-4 w-4" />
              批量生成
            </ActionButton>
          </div>
        </form>
      </FilterBar>

      {"readError" in pageData ? <PageNote>{pageData.readError}</PageNote> : null}
      {runtimeNotice ? <PageNote>{runtimeNotice}</PageNote> : null}

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.82fr)]">
        <DashboardCard>
          <DashboardCardHeader title="任务列表" description="任务、商品、平台、尺寸、状态与回传入口。" />
          <div className="px-4 py-4">
            {pageData.tasks.length > 0 ? (
              <div className="space-y-3">
                {pageData.tasks.map((task) => {
                  const isActive = activeTask?.taskCode === task.taskCode;

                  return (
                    <article
                      key={task.id}
                      className={[
                        "rounded-2xl border px-4 py-3 transition",
                        isActive
                          ? "border-blue-200 bg-[#F8FBFF] shadow-[0_14px_30px_rgba(59,130,246,0.08)]"
                          : "border-[#EEF2F8] bg-white hover:border-blue-100 hover:bg-[#FBFDFF]",
                      ].join(" ")}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <MockThumb label="PT" tone="violet" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <Link
                                href={`/prompt-tasks?taskCode=${encodeURIComponent(task.taskCode)}`}
                                className="break-all text-sm font-semibold leading-5 text-slate-900 hover:text-[#2563EB]"
                              >
                                {task.taskCode}
                              </Link>
                              <StatusBadge label={task.status} tone={getPromptTaskStatusTone(task.status)} />
                            </div>
                            <p className="mt-1 text-xs text-slate-400">{task.formattedUpdatedAt}</p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                          <TableActionLink href={`/prompt-tasks?taskCode=${encodeURIComponent(task.taskCode)}`}>查看</TableActionLink>
                          <TableActionLink href={`/prompt-tasks/${encodeURIComponent(task.taskCode)}/upload`}>上传</TableActionLink>
                        </div>
                      </div>

                      <dl className="mt-3 grid gap-2 border-t border-[#EEF2F8] pt-3 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                        <TaskMetaItem label="商品" value={task.product.name} subValue={task.product.spu} />
                        <TaskMetaItem label="平台" value={task.platformLabel} />
                        <TaskMetaItem label="图片类型" value={task.imageTypeLabel} />
                        <TaskMetaItem label="推荐尺寸" value={task.recommendedSize ?? "--"} strong />
                      </dl>
                    </article>
                  );
                })}
              </div>
            ) : (
              <PageNote>暂无 Prompt 任务。</PageNote>
            )}
          </div>
        </DashboardCard>

        <div className="space-y-4">
          <DashboardCard>
            <DashboardCardHeader title="新建任务" description="按平台和图片类型带出推荐尺寸，也可手动修改。" />
            <div className="[&_form]:px-4 [&_form]:py-4">
              <PromptTaskCreateForm products={pageData.products} runtimeNotice={runtimeNotice} />
            </div>
          </DashboardCard>

          <DashboardCard>
            <DashboardCardHeader title="任务详情" />
            {activeTask ? (
              <div className="space-y-4 px-4 py-4">
                <div className="grid gap-3 rounded-2xl border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4 text-sm text-slate-600 sm:grid-cols-2">
                  <DetailItem label="任务 ID" value={activeTask.taskCode} strong />
                  <DetailItem label="商品" value={activeTask.product.name} />
                  <DetailItem label="平台" value={activeTask.platformLabel} />
                  <DetailItem label="图片类型" value={activeTask.imageTypeLabel} />
                  <DetailItem label="推荐尺寸" value={activeTask.recommendedSize ?? "--"} />
                  <div>
                    <p className="text-slate-400">状态</p>
                    <div className="mt-1">
                      <StatusBadge label={activeTask.status} tone={getPromptTaskStatusTone(activeTask.status)} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#EEF2F8] bg-[#FBFDFF]">
                  <div className="border-b border-[#EEF2F8] px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">Prompt 内容</p>
                  </div>
                  <pre className="max-h-[380px] overflow-y-auto whitespace-pre-wrap bg-white px-4 py-4 text-sm leading-7 text-slate-600">
                    {activeTask.promptText}
                  </pre>
                </div>

                <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-[#EEF2F8] bg-white px-4 py-3">
                  <PromptTaskCopyButton
                    taskCode={activeTask.taskCode}
                    promptText={activeTask.promptText ?? ""}
                    disabled={Boolean(runtimeNotice)}
                  />
                  {activeTask.status !== PROMPT_TASK_STATUS.RETURNED ? (
                    <PromptTaskCancelButton taskCode={activeTask.taskCode} disabled={Boolean(runtimeNotice)} />
                  ) : null}
                  <TableActionLink href={`/prompt-tasks/${encodeURIComponent(activeTask.taskCode)}/upload`}>上传生成结果</TableActionLink>
                </div>
              </div>
            ) : (
              <div className="px-4 py-4">
                <PageNote>请先创建或选择一个 Prompt 任务。</PageNote>
              </div>
            )}
          </DashboardCard>
        </div>
      </section>
    </WorkspacePage>
  );
}

function FilterSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1.5 block px-1 text-sm text-slate-500">{label}</span>
      <select name={name} defaultValue={defaultValue} className={selectClassName}>
        {children}
      </select>
    </label>
  );
}

function DetailItem({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-slate-400">{label}</p>
      <p className={strong ? "mt-1 break-words font-medium text-slate-900" : "mt-1 truncate text-slate-600"}>{value}</p>
    </div>
  );
}

function TaskMetaItem({
  label,
  value,
  subValue,
  strong = false,
}: {
  label: string;
  value: string;
  subValue?: string | null;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white/70 px-3 py-2">
      <dt className="text-[11px] text-slate-400">{label}</dt>
      <dd className={strong ? "mt-1 break-words font-semibold text-slate-800" : "mt-1 break-words font-medium text-slate-700"}>
        {value}
      </dd>
      {subValue ? <dd className="mt-0.5 break-words text-[11px] text-slate-400">{subValue}</dd> : null}
    </div>
  );
}
