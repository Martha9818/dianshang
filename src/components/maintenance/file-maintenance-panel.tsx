"use client";

import { useActionState, useMemo, useState } from "react";
import {
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
  StatCard,
  StatusBadge,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import {
  compactRealIdsAction,
  moveFilesToTrashAction,
  permanentlyDeleteTrashFilesAction,
  scanFileMaintenanceAction,
  type FileMaintenanceActionState,
} from "@/app/maintenance/files/actions";
import {
  type FileMaintenancePageData,
  type FileMaintenanceRecommendation,
  type FileMaintenanceScope,
} from "@/lib/modules/cleanup/fileMaintenanceTypes";

const scopeOptions: Array<{ value: "ALL" | FileMaintenanceScope; label: string }> = [
  { value: "ALL", label: "全部目录" },
  { value: "uploads", label: "uploads" },
  { value: "exports", label: "exports" },
  { value: "backups", label: "backups" },
];

const recommendationOptions: Array<{ value: "ALL" | FileMaintenanceRecommendation; label: string }> = [
  { value: "ALL", label: "全部建议" },
  { value: "move_to_trash", label: "建议移入回收站" },
  { value: "review_before_trash", label: "人工确认后移入回收站" },
  { value: "backup_warning", label: "旧备份谨慎清理" },
  { value: "missing_file", label: "文件缺失" },
  { value: "keep", label: "保留" },
];

const VISIBLE_ROW_LIMIT = 10;

function getBadgeTone(value: string): "blue" | "amber" | "green" | "violet" | "red" | "slate" {
  if (value === "keep" || value === "active_reference") return "green";
  if (value === "missing_file" || value === "backup_warning") return "red";
  if (value === "review_before_trash" || value === "soft_deleted_reference") return "amber";
  if (value === "move_to_trash" || value === "orphan") return "violet";
  return "slate";
}

function getItemTypeLabel(item: FileMaintenancePageData["items"][number]) {
  if (item.itemKind !== "directory") {
    return item.fileType;
  }

  return item.scope === "backups" ? "备份包" : "空目录";
}

function getTrashItemTypeLabel(item: FileMaintenancePageData["trashItems"][number]) {
  if (item.itemKind !== "directory") {
    return item.fileType;
  }

  const originalSegments = item.originalRelativePath?.split("/").filter(Boolean) ?? [];
  return originalSegments.length === 2 && originalSegments[0] === "backups" ? "备份包" : "空目录";
}

function latestDataFromStates(
  initialData: FileMaintenancePageData,
  scanState: FileMaintenanceActionState,
  moveState: FileMaintenanceActionState,
  deleteState: FileMaintenanceActionState,
  compactState: FileMaintenanceActionState,
) {
  return compactState.data ?? deleteState.data ?? moveState.data ?? scanState.data ?? initialData;
}

export function FileMaintenancePanel({ initialData }: { initialData: FileMaintenancePageData }) {
  const [scanState, scanAction, scanPending] = useActionState(scanFileMaintenanceAction, {});
  const [moveState, moveAction, movePending] = useActionState(moveFilesToTrashAction, {});
  const [deleteState, deleteAction, deletePending] = useActionState(permanentlyDeleteTrashFilesAction, {});
  const [compactState, compactAction, compactPending] = useActionState(compactRealIdsAction, {});
  const [scopeFilter, setScopeFilter] = useState<"ALL" | FileMaintenanceScope>("ALL");
  const [recommendationFilter, setRecommendationFilter] = useState<"ALL" | FileMaintenanceRecommendation>("ALL");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedTrashFiles, setSelectedTrashFiles] = useState<string[]>([]);
  const [showAllScanItems, setShowAllScanItems] = useState(false);
  const [showAllTrashItems, setShowAllTrashItems] = useState(false);
  const [compactConfirmText, setCompactConfirmText] = useState("");

  const data = latestDataFromStates(initialData, scanState, moveState, deleteState, compactState);
  const actionState = deleteState.message ? deleteState : moveState.message ? moveState : scanState;
  const filteredItems = useMemo(
    () =>
      data.items.filter((item) => {
        if (scopeFilter !== "ALL" && item.scope !== scopeFilter) return false;
        if (recommendationFilter !== "ALL" && item.recommendation !== recommendationFilter) return false;
        return true;
      }),
    [data.items, recommendationFilter, scopeFilter],
  );
  const visibleFilteredItems = showAllScanItems ? filteredItems : filteredItems.slice(0, VISIBLE_ROW_LIMIT);
  const hiddenFilteredItemCount = Math.max(0, filteredItems.length - visibleFilteredItems.length);
  const visibleTrashItems = showAllTrashItems ? data.trashItems : data.trashItems.slice(0, VISIBLE_ROW_LIMIT);
  const hiddenTrashItemCount = Math.max(0, data.trashItems.length - visibleTrashItems.length);
  const movableFilteredItems = filteredItems.filter((item) => item.canMoveToTrash);
  const effectiveSelectedFiles = selectedFiles.filter((relativePath) =>
    data.items.some((item) => item.relativePath === relativePath && item.canMoveToTrash),
  );
  const effectiveSelectedTrashFiles = selectedTrashFiles.filter((trashRelativePath) =>
    data.trashItems.some((item) => item.trashRelativePath === trashRelativePath),
  );

  function toggleSelected(value: string, checked: boolean) {
    setSelectedFiles((current) => (checked ? Array.from(new Set([...current, value])) : current.filter((item) => item !== value)));
  }

  function toggleTrashSelected(value: string, checked: boolean) {
    setSelectedTrashFiles((current) => (checked ? Array.from(new Set([...current, value])) : current.filter((item) => item !== value)));
  }

  return (
    <div className="space-y-5">
      {data.readonlyMessage ? <PageNote>{data.readonlyMessage}</PageNote> : null}
      <PageNote>文件清理功能只处理本地文件，不影响商品评分、文案数据、素材记录、导出记录或备份记录。</PageNote>

      <DashboardCard>
        <DashboardCardHeader
          title="开发期真实 ID 整理"
          description="仅用于当前开发测试数据：执行前会自动备份，然后把剩余有效 Product ID / 素材 ID 重排为 1、2、3，并同步商品文件夹名。"
        />
        <form
          action={compactAction}
          onSubmit={(event) => {
            if (compactConfirmText.trim() !== "重排真实ID") {
              event.preventDefault();
              window.alert("请输入确认文案：重排真实ID");
              return;
            }

            const confirmed = window.confirm(
              "确认执行真实 ID 整理吗？\n\n此操作会修改数据库真实 Product ID、素材 ID，并重命名 uploads/products 下的商品文件夹。系统会先自动创建本地备份。",
            );
            if (!confirmed) {
              event.preventDefault();
            }
          }}
        >
          <div className="grid gap-4 border-t border-[#EEF2F8] px-5 py-5 xl:grid-cols-[1fr_auto] xl:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">确认文案</span>
              <input
                name="confirmText"
                value={compactConfirmText}
                onChange={(event) => setCompactConfirmText(event.target.value)}
                placeholder="输入：重排真实ID"
                className="h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />
            </label>
            <button
              type="submit"
              disabled={compactPending || Boolean(data.readonlyMessage) || compactConfirmText.trim() !== "重排真实ID"}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MiniIcon name="shield" className="h-4 w-4" />
              {compactPending ? "整理中..." : "整理真实 ID"}
            </button>
          </div>
        </form>
        {compactState.message ? (
          <div
            className={[
              "mx-5 mb-5 rounded-2xl border px-4 py-3 text-sm leading-6",
              compactState.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            {compactState.message}
          </div>
        ) : null}
      </DashboardCard>

      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard label="扫描文件项" value={String(data.stats.total)} delta="手动扫描" tone="blue" icon={<MiniIcon name="database" className="h-7 w-7" />} />
        <StatCard label="建议清理" value={String(data.stats.movable)} delta="人工确认" tone="amber" icon={<MiniIcon name="shield" className="h-7 w-7" />} />
        <StatCard label="文件缺失" value={String(data.stats.missing)} delta="不改数据库" tone="red" icon={<MiniIcon name="ban" className="h-7 w-7" />} />
        <StatCard label="回收站文件" value={String(data.stats.trash)} delta="仅本应用" tone="violet" icon={<MiniIcon name="backup" className="h-7 w-7" />} />
      </section>

      <DashboardCard className="px-4 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
          <form action={scanAction}>
            <button
              type="submit"
              disabled={scanPending || Boolean(data.readonlyMessage)}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MiniIcon name="shield" className="h-4 w-4" />
              {scanPending ? "扫描中..." : "开始扫描"}
            </button>
          </form>
          <div className="min-w-[180px]">
            <p className="mb-2 px-1 text-sm text-slate-500">目录筛选</p>
            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value as "ALL" | FileMaintenanceScope)}
              className="h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              {scopeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[240px]">
            <p className="mb-2 px-1 text-sm text-slate-500">建议操作筛选</p>
            <select
              value={recommendationFilter}
              onChange={(event) => setRecommendationFilter(event.target.value as "ALL" | FileMaintenanceRecommendation)}
              className="h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              {recommendationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex h-12 items-center rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-500">
            {data.scannedAt ? `最近扫描：${new Date(data.scannedAt).toLocaleString("zh-CN")}` : "尚未扫描"}
          </div>
        </div>
        {actionState.message ? (
          <div
            className={[
              "mt-3 rounded-2xl border px-4 py-3 text-sm leading-6",
              actionState.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            <p>{actionState.message}</p>
            {actionState.result?.errors.length ? (
              <ul className="mt-2 space-y-1">
                {actionState.result.errors.slice(0, 5).map((error) => (
                  <li key={`${error.relativePath}-${error.reason}`}>{error.relativePath}：{error.reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </DashboardCard>

      <DashboardCard>
        <DashboardCardHeader
          title="扫描结果"
          description="只展示相对路径；有效关联文件不会直接进入永久删除流程。"
          action={
            <button
              type="button"
              onClick={() => {
                if (movableFilteredItems.length === 0) {
                  window.alert("当前筛选结果中没有可清理项。已保护的商品主图、素材、竞品截图和灵感图片不能被勾选。");
                  return;
                }

                setSelectedFiles(movableFilteredItems.map((item) => item.relativePath));
              }}
              className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50"
            >
              选择可清理项
            </button>
          }
        />
        <form
          action={moveAction}
          onSubmit={(event) => {
            if (effectiveSelectedFiles.length === 0) {
              event.preventDefault();
              window.alert("请先勾选允许移入回收站的文件。");
              return;
            }

            const backupCount = data.items.filter((item) => effectiveSelectedFiles.includes(item.relativePath) && item.scope === "backups").length;
            const confirmed = window.confirm(
              `确认移入应用内回收站？\n已选择 ${effectiveSelectedFiles.length} 个文件。\n${backupCount > 0 ? "包含备份文件：备份删除后无法用于恢复。\n" : ""}该操作不会删除数据库记录。`,
            );
            if (!confirmed) {
              event.preventDefault();
            }
          }}
        >
          {effectiveSelectedFiles.map((relativePath) => {
            const item = data.items.find((candidate) => candidate.relativePath === relativePath);
            return item ? (
              <input
                key={relativePath}
                type="hidden"
                name="items"
                value={JSON.stringify({ scope: item.scope, relativePath: item.relativePath })}
              />
            ) : null;
          })}
          <div className="flex flex-col gap-3 border-b border-[#EEF2F8] px-5 py-4 xl:flex-row xl:items-end">
            <button
              type="submit"
              disabled={movePending || Boolean(data.readonlyMessage)}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 text-sm font-medium text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MiniIcon name="backup" className="h-4 w-4" />
              {movePending ? "处理中..." : `移入回收站（${effectiveSelectedFiles.length}）`}
            </button>
          </div>
          <TableScrollArea>
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell className="w-[5%]">选择</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[30%]">相对路径</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[8%]">目录</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[8%]">类型</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[9%]">大小</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[14%]">修改时间</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[13%]">关联状态</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[13%]">建议操作</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filteredItems.length > 0 ? (
                  visibleFilteredItems.map((item) => (
                    <DataTableRow key={item.relativePath}>
                      <DataTableCell>
                        <div className="space-y-1">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(item.relativePath)}
                            disabled={!item.canMoveToTrash}
                            onChange={(event) => toggleSelected(item.relativePath, event.target.checked)}
                            aria-label={`选择 ${item.relativePath}`}
                            title={item.canMoveToTrash ? "可移入应用内回收站" : item.reason}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                          />
                          {!item.canMoveToTrash ? <p className="text-[11px] leading-4 text-slate-400">已保护</p> : null}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="min-w-0">
                          <p className="break-all font-medium text-slate-900">{item.relativePath}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.reason}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>{item.scope}</DataTableCell>
                      <DataTableCell>{getItemTypeLabel(item)}</DataTableCell>
                      <DataTableCell>{item.fileSizeLabel}</DataTableCell>
                      <DataTableCell>{item.modifiedAtLabel}</DataTableCell>
                      <DataTableCell>
                        <div className="space-y-1">
                          <StatusBadge label={item.relationStatusLabel} tone={getBadgeTone(item.relationStatus)} />
                          {item.relatedType ? <p className="text-xs text-slate-400">{item.relatedType} #{item.relatedId}</p> : null}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge label={item.recommendationLabel} tone={getBadgeTone(item.recommendation)} />
                      </DataTableCell>
                    </DataTableRow>
                  ))
                ) : (
                  <DataTableRow>
                    <DataTableCell colSpan={8}>
                      <PageNote>当前没有扫描结果。点击“开始扫描”后查看 uploads、exports、backups 的本地文件。</PageNote>
                    </DataTableCell>
                  </DataTableRow>
                )}
              </DataTableBody>
            </DataTable>
          </TableScrollArea>
          {filteredItems.length > VISIBLE_ROW_LIMIT ? (
            <div className="flex flex-col gap-2 border-t border-[#EEF2F8] px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                当前显示 {visibleFilteredItems.length} / {filteredItems.length} 条扫描结果
                {hiddenFilteredItemCount > 0 ? `，其余 ${hiddenFilteredItemCount} 条已折叠。` : "。"}
              </span>
              <button
                type="button"
                onClick={() => setShowAllScanItems((value) => !value)}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-[#DCE5F2] px-3 font-medium text-[#2563EB] hover:bg-blue-50"
              >
                {showAllScanItems ? "收起结果" : "展开全部结果"}
              </button>
            </div>
          ) : null}
        </form>
      </DashboardCard>

      <DashboardCard>
        <DashboardCardHeader
          title="应用内回收站"
          description="永久删除只允许处理已经位于应用内回收站的文件。"
          action={
            <button
              type="button"
              onClick={() => setSelectedTrashFiles(data.trashItems.map((item) => item.trashRelativePath))}
              className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50"
            >
              选择回收站文件
            </button>
          }
        />
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (effectiveSelectedTrashFiles.length === 0) {
              event.preventDefault();
              window.alert("请先勾选回收站文件。");
              return;
            }

            const confirmed = window.confirm(
              `确认永久删除？\n已选择 ${effectiveSelectedTrashFiles.length} 个回收站文件。\n永久删除后无法从 EcomPilot 中恢复。`,
            );
            if (!confirmed) {
              event.preventDefault();
            }
          }}
        >
          {effectiveSelectedTrashFiles.map((trashRelativePath) => (
            <input
              key={trashRelativePath}
              type="hidden"
              name="items"
              value={JSON.stringify({ trashRelativePath })}
            />
          ))}
          <div className="flex flex-col gap-3 border-b border-[#EEF2F8] px-5 py-4 xl:flex-row xl:items-end">
            <button
              type="submit"
              disabled={deletePending || Boolean(data.readonlyMessage)}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MiniIcon name="ban" className="h-4 w-4" />
              {deletePending ? "删除中..." : `永久删除（${effectiveSelectedTrashFiles.length}）`}
            </button>
          </div>
          <TableScrollArea>
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell className="w-[6%]">选择</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[34%]">回收站相对路径</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[30%]">原相对路径</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[10%]">类型</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[8%]">大小</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[12%]">修改时间</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {data.trashItems.length > 0 ? (
                  visibleTrashItems.map((item) => (
                    <DataTableRow key={item.trashRelativePath}>
                      <DataTableCell>
                        <input
                          type="checkbox"
                          checked={selectedTrashFiles.includes(item.trashRelativePath)}
                          onChange={(event) => toggleTrashSelected(item.trashRelativePath, event.target.checked)}
                          aria-label={`选择 ${item.trashRelativePath}`}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                      </DataTableCell>
                      <DataTableCell>
                        <span className="block line-clamp-2 break-all font-medium leading-6 text-slate-900" title={item.trashRelativePath}>
                          {item.trashRelativePath}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="block line-clamp-2 break-all leading-6 text-slate-500" title={item.originalRelativePath ?? "--"}>
                          {item.originalRelativePath ?? "--"}
                        </span>
                      </DataTableCell>
                      <DataTableCell className="whitespace-nowrap">{getTrashItemTypeLabel(item)}</DataTableCell>
                      <DataTableCell className="whitespace-nowrap">{item.fileSizeLabel}</DataTableCell>
                      <DataTableCell className="whitespace-nowrap">{item.modifiedAtLabel}</DataTableCell>
                    </DataTableRow>
                  ))
                ) : (
                  <DataTableRow>
                    <DataTableCell colSpan={6}>
                      <PageNote>当前回收站为空。只有先移入应用内回收站的文件，才允许执行永久删除。</PageNote>
                    </DataTableCell>
                  </DataTableRow>
                )}
              </DataTableBody>
            </DataTable>
          </TableScrollArea>
          {data.trashItems.length > VISIBLE_ROW_LIMIT ? (
            <div className="flex flex-col gap-2 border-t border-[#EEF2F8] px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                当前显示 {visibleTrashItems.length} / {data.trashItems.length} 条回收站记录
                {hiddenTrashItemCount > 0 ? `，其余 ${hiddenTrashItemCount} 条已折叠。` : "。"}
              </span>
              <button
                type="button"
                onClick={() => setShowAllTrashItems((value) => !value)}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-[#DCE5F2] px-3 font-medium text-[#2563EB] hover:bg-blue-50"
              >
                {showAllTrashItems ? "收起回收站记录" : "展开全部回收站记录"}
              </button>
            </div>
          ) : null}
        </form>
      </DashboardCard>

      <DashboardCard>
        <DashboardCardHeader title="清理日志" description="记录扫描、移入回收站和永久删除结果，路径仅保存相对路径。" />
        <TableScrollArea>
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeaderCell className="w-[11%]">时间</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[11%]">动作</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[8%]">目录</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[10%]">状态</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[34%] pr-4">原路径</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[26%]">原因</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <DataTableRow key={log.id}>
                    <DataTableCell>{new Date(log.createdAt).toLocaleString("zh-CN")}</DataTableCell>
                    <DataTableCell>{log.action}</DataTableCell>
                    <DataTableCell>{log.fileScope}</DataTableCell>
                    <DataTableCell><StatusBadge label={log.status} tone={log.status === "success" ? "green" : log.status === "failed" ? "red" : "amber"} /></DataTableCell>
                    <DataTableCell className="break-all pr-4 text-slate-500">{log.originalRelativePath ?? log.trashRelativePath ?? "--"}</DataTableCell>
                    <DataTableCell className="break-all text-slate-500">{log.reason ?? "--"}</DataTableCell>
                  </DataTableRow>
                ))
              ) : (
                <DataTableRow>
                  <DataTableCell colSpan={6}>
                    <PageNote>暂无清理日志。</PageNote>
                  </DataTableCell>
                </DataTableRow>
              )}
            </DataTableBody>
          </DataTable>
        </TableScrollArea>
      </DashboardCard>
    </div>
  );
}
