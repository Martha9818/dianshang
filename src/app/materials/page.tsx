import Link from "next/link";
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
  TableActionLink,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { MaterialFilterForm } from "@/components/materials/material-filter-form";
import { MaterialDiscardButton, MaterialStatusButton } from "@/components/materials/material-status-form";
import { ProductImage } from "@/components/products/product-image";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { MATERIAL_STATUS } from "@/lib/modules/materials";
import {
  buildProductReadUnavailableMessage,
  buildReadonlyRuntimeMessage,
  getRuntimeModeSummary,
} from "@/lib/services/product-runtime-service";
import { getMaterialLibraryPageData } from "@/lib/services/material-service";
import { normalizeMaterialLibraryQuery } from "@/lib/services/query-service";

export const dynamic = "force-dynamic";

type SearchParams = {
  query?: string;
  productId?: string;
  platform?: string;
  materialType?: string;
  status?: string;
  sort?: string;
  view?: string;
  materialId?: string;
  materialError?: string;
};

function buildSourceUrl(params: SearchParams) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "materialError") {
      searchParams.set(key, value);
    }
  }
  const query = searchParams.toString();
  return query ? `/materials?${query}` : "/materials";
}

function buildUrl(params: SearchParams, patch: Record<string, string | null>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value && key !== "materialError") {
      searchParams.set(key, value);
    }
  }
  const query = searchParams.toString();
  return query ? `/materials?${query}` : "/materials";
}

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "grid";
  const runtime = getRuntimeModeSummary();
  const query = normalizeMaterialLibraryQuery(params);
  const sourceUrl = buildSourceUrl({ ...params, view });
  const pageData = await getMaterialLibraryPageData(query).catch(() => null);

  const selectedMaterial = pageData?.selectedMaterial ?? null;
  const readonlyNotice = runtime.isWritable ? null : buildReadonlyRuntimeMessage(runtime.mode);
  const readUnavailableNotice = pageData ? null : buildProductReadUnavailableMessage(runtime.mode);
  const statusButtons = [
    { status: MATERIAL_STATUS.ADOPTED, label: "标记已采用" },
    { status: MATERIAL_STATUS.NEEDS_EDIT, label: "改为待修改" },
    { status: MATERIAL_STATUS.USABLE, label: "改为可使用" },
  ];

  return (
    <WorkspacePage
      eyebrow="Materials"
      title="素材库"
      description="集中查看、筛选、预览和管理上传图片素材状态。"
    >
      {readonlyNotice ? <PageNote>预览环境只读，请在 Windows 本地验收。</PageNote> : null}
      {readUnavailableNotice ? <PageNote>{readUnavailableNotice}</PageNote> : null}
      {params.materialError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.materialError}</div> : null}

      <DashboardCard className="px-4 py-4">
        <MaterialFilterForm
          basePath="/materials"
          values={{ ...params, sort: query.sort, view }}
          products={pageData?.products ?? []}
          platforms={(pageData?.platforms ?? []).map((item) => ({ value: item.code, label: item.label }))}
          materialTypes={(pageData?.materialTypes ?? []).map((item) => ({ value: item.code, label: item.label }))}
          statuses={pageData?.statuses ?? []}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={buildUrl(params, { view: "grid" })}
            className={[
              "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
              view === "grid" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-[#E4EAF3] bg-white text-slate-500",
            ].join(" ")}
          >
            <MiniIcon name="grid" className="h-4 w-4" />
            网格
          </Link>
          <Link
            href={buildUrl(params, { view: "list" })}
            className={[
              "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
              view === "list" ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-[#E4EAF3] bg-white text-slate-500",
            ].join(" ")}
          >
            <MiniIcon name="list" className="h-4 w-4" />
            列表
          </Link>
        </div>
      </DashboardCard>

      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard label="全部素材" value={String(pageData?.stats.total ?? 0)} delta="真实统计" tone="blue" icon={<MiniIcon name="image" className="h-7 w-7" />} />
        <StatCard label="待审核" value={String(pageData?.stats.pendingReview ?? 0)} delta="真实统计" tone="amber" icon={<MiniIcon name="clock" className="h-7 w-7" />} />
        <StatCard label="已采用" value={String(pageData?.stats.adopted ?? 0)} delta="真实统计" tone="green" icon={<MiniIcon name="shield" className="h-7 w-7" />} />
        <StatCard label="待修改" value={String(pageData?.stats.needsEdit ?? 0)} delta="真实统计" tone="amber" icon={<MiniIcon name="spark" className="h-7 w-7" />} />
      </section>

      {pageData?.stats.orphanedCount ? (
        <PageNote>
          检测到 {pageData.stats.orphanedCount} 条素材关联到已删除商品。本线程只做数据库关联提示，不做真实文件扫描、移动或删除。
        </PageNote>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.04fr_0.44fr]">
        <DashboardCard className="p-4">
          {(pageData?.materials.length ?? 0) > 0 ? (
            view === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {pageData!.materials.map((material) => (
                  <Link
                    key={material.id}
                    href={buildUrl(params, { view, materialId: String(material.id) })}
                    className={[
                      "flex h-full flex-col rounded-[24px] border p-4 transition hover:-translate-y-[1px] hover:shadow-[0_18px_36px_rgba(59,130,246,0.08)]",
                      selectedMaterial?.id === material.id ? "border-blue-200 bg-[#F8FBFF]" : "border-[#EEF2F8] bg-white",
                    ].join(" ")}
                  >
                    <ProductImage src={material.displayPath} alt={material.filePath} label="IMG" square missing={!material.fileExists} />
                    <div className="mt-4 flex flex-1 flex-col">
                      <h3 className="line-clamp-2 min-h-[48px] text-sm font-medium leading-6 text-slate-900">{material.product.name}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge label={material.platformLabel} tone="violet" />
                        <StatusBadge label={material.materialTypeLabel} tone="blue" />
                        <StatusBadge label={material.usagePermissionLabel} tone={material.isReferenceOnly ? "amber" : "green"} />
                        <StatusBadge label={material.status ?? "--"} tone={material.statusTone} />
                      </div>
                      <p className="mt-3 text-sm text-slate-400">{material.sourceTypeLabel} / {material.sourceLabel}</p>
                      {material.isReferenceOnly ? (
                        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                          该图片仅作为灵感和分析参考，不建议直接用于商品发布。
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-400">{material.formattedCreatedAt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <TableScrollArea className="px-1 py-1">
                <DataTable className="min-w-[980px]">
                  <DataTableHead>
                    <tr>
                      <DataTableHeaderCell className="w-[26%]">素材</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[20%]">文件路径</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[10%]">平台</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[12%]">类型</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[10%]">状态</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[10%]">来源</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[12%]">创建时间</DataTableHeaderCell>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {pageData!.materials.map((material) => (
                      <DataTableRow key={material.id}>
                        <DataTableCell>
                          <Link href={buildUrl(params, { view, materialId: String(material.id) })} className="flex items-center gap-3">
                            <ProductImage src={material.displayPath} alt={material.filePath} label="IMG" missing={!material.fileExists} />
                            <span className="truncate font-medium text-slate-900">{material.product.name}</span>
                          </Link>
                        </DataTableCell>
                        <DataTableCell className="truncate text-xs text-slate-500">{material.filePath}</DataTableCell>
                        <DataTableCell>{material.platformLabel}</DataTableCell>
                        <DataTableCell>{material.materialTypeLabel}</DataTableCell>
                        <DataTableCell><StatusBadge label={material.status ?? "--"} tone={material.statusTone} /></DataTableCell>
                        <DataTableCell>
                          <div className="space-y-1">
                            <div>{material.sourceTypeLabel}</div>
                            <StatusBadge label={material.usagePermissionLabel} tone={material.isReferenceOnly ? "amber" : "green"} />
                          </div>
                        </DataTableCell>
                        <DataTableCell>{material.formattedCreatedAt}</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              </TableScrollArea>
            )
          ) : (
            <PageNote>当前筛选条件下暂无素材记录。</PageNote>
          )}
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader
            title="素材详情"
            description={selectedMaterial ? "查看文件路径、尺寸、来源和状态流转。" : "从左侧选择一个素材查看详情。"}
          />
          {selectedMaterial ? (
            <div className="space-y-5 px-5 py-5">
              <ProductImage
                src={selectedMaterial.displayPath}
                alt={selectedMaterial.filePath}
                label="IMG"
                large
                missing={!selectedMaterial.fileExists}
              />
              <div className="grid gap-3 text-sm text-slate-600">
                <DetailRow label="文件路径" value={selectedMaterial.filePath} />
                <DetailRow label="缩略图" value={selectedMaterial.thumbnailPath ?? "--"} />
                <DetailRow label="图片尺寸" value={selectedMaterial.dimensionsLabel} />
                <DetailRow label="原图大小" value={selectedMaterial.originalSizeLabel} />
                <DetailRow label="缩略图大小" value={selectedMaterial.thumbnailSizeLabel} />
                <DetailRow label="MIME" value={selectedMaterial.mimeType ?? "--"} />
                <DetailRow label="文件 Hash" value={selectedMaterial.fileHash ? `${selectedMaterial.fileHash.slice(0, 12)}...` : "--"} />
                <DetailRow label="创建时间" value={selectedMaterial.formattedCreatedAt} />
                <DetailRow label="图片来源" value={selectedMaterial.sourceTypeLabel} />
                <DetailRow label="使用权限" value={selectedMaterial.usagePermissionLabel} badgeTone={selectedMaterial.isReferenceOnly ? "amber" : "green"} />
                <DetailRow label="来源" value={selectedMaterial.sourceLabel} />
                <DetailRow label="素材类型" value={selectedMaterial.materialTypeLabel} />
                <DetailRow label="状态" value={selectedMaterial.status ?? "--"} badgeTone={selectedMaterial.statusTone} />
                <DetailRow label="平台" value={selectedMaterial.platformLabel} />
                <DetailRow label="关联商品" value={`${selectedMaterial.product.name} / ${selectedMaterial.product.spu}`} />
                <DetailRow label="关联 Task ID" value={selectedMaterial.taskCode ?? "--"} />
              </div>
              {selectedMaterial.isReferenceOnly ? (
                <PageNote>该图片仅作为灵感和分析参考，不建议直接用于商品发布。</PageNote>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {readonlyNotice ? (
                  <PageNote>预览环境只读，请在 Windows 本地验收。</PageNote>
                ) : (
                  <>
                    {statusButtons.map((item) => (
                      <MaterialStatusButton key={item.status} materialId={selectedMaterial.id} status={item.status} sourceUrl={sourceUrl}>
                        {item.label}
                      </MaterialStatusButton>
                    ))}
                    <MaterialDiscardButton materialId={selectedMaterial.id} sourceUrl={sourceUrl} />
                  </>
                )}
              </div>
              <div className="border-t border-[#EEF2F8] pt-5">
                <div className="flex flex-wrap gap-2">
                  <TableActionLink href={`/products/${selectedMaterial.productId}?tab=copywriting`}>查看文案素材</TableActionLink>
                  <TableActionLink href={`/copywriting?productId=${selectedMaterial.productId}`}>去文案列表</TableActionLink>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <PageNote>选择素材后，这里会显示大图预览、文件路径、尺寸、来源、Task ID 和状态操作。</PageNote>
            </div>
          )}
        </DashboardCard>
      </section>
    </WorkspacePage>
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
    <div className="grid gap-1 md:grid-cols-[92px_1fr]">
      <span className="text-slate-400">{label}</span>
      <div className="min-w-0 break-all">
        {badgeTone ? <StatusBadge label={value} tone={badgeTone} /> : <span>{value}</span>}
      </div>
    </div>
  );
}
