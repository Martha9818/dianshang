import {
  DashboardCard,
  DashboardCardHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  PageNote,
  StatusBadge,
  TableActionLink,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { PromptTaskCopyButton, PromptTaskCancelButton } from "@/components/prompt-tasks/prompt-task-actions";
import { PromptTaskCreateForm } from "@/components/prompt-tasks/prompt-task-form";
import { getPromptTaskStatusTone, PROMPT_TASK_STATUS } from "@/lib/services/prompt-task-service";

type PromptTaskView = Awaited<ReturnType<typeof import("@/lib/services/prompt-task-service").getProductPromptTasks>>[number];

export function ProductPromptTasksTab({
  productId,
  productName,
  productSpu,
  tasks,
  runtimeNotice,
}: {
  productId: number;
  productName: string;
  productSpu: string;
  tasks: PromptTaskView[];
  runtimeNotice?: string | null;
}) {
  const products = [{ id: productId, name: productName, spu: productSpu }];

  return (
    <div className="grid gap-4 px-5 py-5 xl:grid-cols-[0.8fr_1.2fr]">
      <DashboardCard>
        <DashboardCardHeader title="新建 Prompt 任务" />
        <PromptTaskCreateForm products={products} runtimeNotice={runtimeNotice} defaultProductId={productId} />
      </DashboardCard>

      <DashboardCard>
        <DashboardCardHeader title="该商品 Prompt 任务" />
        <TableScrollArea>
          <DataTable className="min-w-[820px]">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell className="w-[28%]">任务 ID</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[12%]">平台</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[12%]">类型</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[12%]">尺寸</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[12%]">状态</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[24%]">操作</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <DataTableRow key={task.id}>
                    <DataTableCell>{task.taskCode}</DataTableCell>
                    <DataTableCell>{task.platformLabel}</DataTableCell>
                    <DataTableCell>{task.imageTypeLabel}</DataTableCell>
                    <DataTableCell>{task.recommendedSize ?? "--"}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={task.status} tone={getPromptTaskStatusTone(task.status)} />
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-2">
                        <PromptTaskCopyButton taskCode={task.taskCode} promptText={task.promptText ?? ""} disabled={Boolean(runtimeNotice)} />
                        {task.status !== PROMPT_TASK_STATUS.RETURNED ? (
                          <PromptTaskCancelButton taskCode={task.taskCode} disabled={Boolean(runtimeNotice)} />
                        ) : null}
                        <TableActionLink href={`/prompt-tasks/${encodeURIComponent(task.taskCode)}/upload`}>上传</TableActionLink>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))
              ) : (
                <DataTableRow>
                  <DataTableCell colSpan={6} className="py-10 text-center text-sm text-slate-400">
                    暂无 Prompt 任务。
                  </DataTableCell>
                </DataTableRow>
              )}
            </DataTableBody>
          </DataTable>
        </TableScrollArea>
        <div className="px-5 pb-5">
          <PageNote>复制成功后才会标记为已复制；复制失败时会显示手动复制文本。</PageNote>
        </div>
      </DashboardCard>
    </div>
  );
}
