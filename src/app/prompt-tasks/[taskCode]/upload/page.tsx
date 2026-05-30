import { DashboardCard, DashboardCardHeader, PageNote, StatusBadge, TableActionLink } from "@/components/dashboard/primitives";
import { PromptTaskUploadForm } from "@/components/prompt-tasks/prompt-task-upload-form";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  getPromptTaskStatusTone,
  getPromptTaskUploadData,
  PROMPT_TASK_STATUS,
  PROMPT_TASK_UPLOAD_BLOCKED_STATUSES,
} from "@/lib/services/prompt-task-service";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/product-runtime-service";

export const dynamic = "force-dynamic";

export default async function PromptTaskUploadPage({
  params,
}: {
  params: Promise<{ taskCode: string }>;
}) {
  const { taskCode } = await params;
  const uploadData = await getPromptTaskUploadData(decodeURIComponent(taskCode))
    .then((task) => ({ task, readError: null as string | null }))
    .catch((error) => ({
      task: null,
      readError: getProductErrorMessage(error, "当前预览环境未加载 Windows 本地 SQLite 商品库，请在 Windows 本地验收图片回传。"),
    }));
  const { task, readError } = uploadData;
  const runtime = getRuntimeModeSummary();
  const runtimeNotice = runtime.isWritable ? null : buildReadonlyRuntimeMessage(runtime.mode);

  return (
    <WorkspacePage
      eyebrow="Prompt Tasks"
      title="上传生成结果"
      description="上传网页版 ChatGPT 生成后的图片，并自动关联 Prompt 任务、商品和素材记录。"
    >
      {readError ? <PageNote>{readError}</PageNote> : null}
      {runtimeNotice ? <PageNote>{runtimeNotice}</PageNote> : null}
      {!task ? (
        <DashboardCard className="px-5 py-8">
          <PageNote>找不到这个 Prompt Task。请回到任务列表确认 Task ID，或从素材入口手动上传。</PageNote>
          <div className="mt-4">
            <TableActionLink href="/prompt-tasks">返回 Prompt 任务</TableActionLink>
          </div>
        </DashboardCard>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <DashboardCard>
            <DashboardCardHeader title="任务信息" />
            <div className="space-y-4 px-5 py-5 text-sm text-slate-600">
              <InfoRow label="任务 ID" value={task.taskCode} strong />
              <InfoRow label="商品" value={task.product.name} />
              <InfoRow label="平台" value={task.platformLabel} />
              <InfoRow label="图片类型" value={task.imageTypeLabel} />
              <InfoRow label="推荐尺寸" value={task.recommendedSize ?? "--"} />
              <div className="grid gap-1 md:grid-cols-[96px_1fr]">
                <span className="text-slate-400">状态</span>
                <StatusBadge label={task.status} tone={getPromptTaskStatusTone(task.status)} />
              </div>
              <InfoRow label="更新时间" value={task.formattedUpdatedAt} />
              <div className="pt-2">
                <TableActionLink href={`/prompt-tasks?taskCode=${encodeURIComponent(task.taskCode)}`}>查看 Prompt</TableActionLink>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <DashboardCardHeader title="回传图片" description="支持 jpg / jpeg / png / webp，最大 10MB。" />
            <div className="space-y-4 px-5 py-5">
              {PROMPT_TASK_UPLOAD_BLOCKED_STATUSES.has(task.status) ? (
                <PageNote>任务已取消，不能回传图片。</PageNote>
              ) : null}
              {runtimeNotice ? <PageNote>{runtimeNotice}</PageNote> : null}
              {task.status === PROMPT_TASK_STATUS.RETURNED ? (
                <PageNote>该任务已有回传结果，再次上传会保存为新的版本。</PageNote>
              ) : null}
              <PromptTaskUploadForm taskCode={task.taskCode} disabled={PROMPT_TASK_UPLOAD_BLOCKED_STATUSES.has(task.status) || Boolean(runtimeNotice)} />
            </div>
          </DashboardCard>
        </section>
      )}
    </WorkspacePage>
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
    <div className="grid gap-1 md:grid-cols-[96px_1fr]">
      <span className="text-slate-400">{label}</span>
      <span className={strong ? "font-medium text-slate-900" : undefined}>{value}</span>
    </div>
  );
}
