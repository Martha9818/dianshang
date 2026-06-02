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
import { MaterialFilterForm } from "@/components/materials/material-filter-form";
import { MaterialDiscardButton, MaterialStatusButton } from "@/components/materials/material-status-form";
import { ProductImage } from "@/components/products/product-image";
import { ManualMaterialUploadForm } from "@/components/prompt-tasks/prompt-task-upload-form";
import { MATERIAL_STATUS, MATERIAL_TYPES } from "@/lib/modules/materials";
import { PROMPT_TASK_PLATFORMS } from "@/lib/modules/prompt-task";

type MaterialView = Awaited<ReturnType<typeof import("@/lib/services/material-service").getProductMaterials>>[number];

export function ProductMaterialsTab({
  product,
  materials,
  runtimeNotice,
  filters,
}: {
  product: { id: number; name: string; spu: string };
  materials: MaterialView[];
  runtimeNotice?: string | null;
  filters?: {
    platform?: string | null;
    materialType?: string | null;
    status?: string | null;
  };
}) {
  const sourceUrl = `/products/${product.id}?tab=materials`;
  const statusButtons = [
    { status: MATERIAL_STATUS.ADOPTED, label: "已采用" },
    { status: MATERIAL_STATUS.NEEDS_EDIT, label: "待修改" },
    { status: MATERIAL_STATUS.USABLE, label: "可使用" },
  ];

  return (
    <div className="grid gap-4 px-5 py-5 xl:grid-cols-[1.15fr_0.85fr]">
      <DashboardCard>
        <DashboardCardHeader
          title="素材记录"
          description="当前商品素材，支持按平台、类型、状态筛选和状态修改。"
          action={<TableActionLink href={`/materials?productId=${product.id}`}>查看素材库</TableActionLink>}
        />
        <div className="px-5 py-4">
          <MaterialFilterForm
            basePath={`/products/${product.id}`}
            includeView={false}
            values={{
              platform: filters?.platform ?? "",
              materialType: filters?.materialType ?? "",
              status: filters?.status ?? "",
            }}
            products={[product]}
            platforms={PROMPT_TASK_PLATFORMS.map((item) => ({ value: item.code, label: item.label }))}
            materialTypes={MATERIAL_TYPES.map((item) => ({ value: item.code, label: item.label }))}
            statuses={Object.values(MATERIAL_STATUS)}
            hiddenFields={{ tab: "materials" }}
          />
        </div>
        <TableScrollArea>
          <DataTable className="min-w-[1180px]">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell className="w-[26%]">文件</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[10%]">平台</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[11%]">素材类型</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[13%]">来源</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[11%]">状态</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[14%]">Task ID</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[10%]">创建时间</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[18%]">操作</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {materials.length > 0 ? (
                materials.map((material) => (
                  <DataTableRow key={material.id}>
                    <DataTableCell>
                        <div className="flex items-start gap-3">
                          <ProductImage src={material.displayPath} alt={material.filePath} label="IMG" missing={!material.fileExists} />
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-medium text-slate-800">{material.product.name}</p>
                            <p className="text-xs font-medium text-[#2563EB]">素材 ID {material.id}</p>
                            <p className="truncate text-xs text-slate-500">{material.filePath}</p>
                          </div>
                        </div>
                    </DataTableCell>
                    <DataTableCell>{material.platformLabel}</DataTableCell>
                    <DataTableCell>{material.materialTypeLabel}</DataTableCell>
                    <DataTableCell>
                      <div className="space-y-2">
                        <div>{material.sourceTypeLabel}</div>
                        <StatusBadge label={material.usagePermissionLabel} tone={material.isReferenceOnly ? "amber" : "green"} />
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={material.status ?? "--"} tone={material.statusTone} />
                    </DataTableCell>
                    <DataTableCell className="text-xs leading-6 text-slate-500">
                      <span className="break-all">{material.taskCode ?? "--"}</span>
                    </DataTableCell>
                    <DataTableCell className="text-slate-500">{material.formattedCreatedAt}</DataTableCell>
                    <DataTableCell>
                      {runtimeNotice ? (
                        <span className="text-xs text-slate-400">只读</span>
                      ) : (
                        <div className="grid gap-2 xl:grid-cols-2">
                          <TableActionLink href={`/screenshots?sourceType=material&sourceId=${material.id}&productId=${product.id}`}>
                            截图识别
                          </TableActionLink>
                          {statusButtons.map((item) => (
                            <MaterialStatusButton key={item.status} materialId={material.id} status={item.status} sourceUrl={sourceUrl}>
                              {item.label}
                            </MaterialStatusButton>
                          ))}
                          <MaterialDiscardButton materialId={material.id} sourceUrl={sourceUrl}>
                            弃用
                          </MaterialDiscardButton>
                        </div>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                ))
              ) : (
                <DataTableRow>
                  <DataTableCell colSpan={8} className="py-10 text-center text-sm text-slate-400">
                    暂无素材记录。
                  </DataTableCell>
                </DataTableRow>
              )}
            </DataTableBody>
          </DataTable>
        </TableScrollArea>
      </DashboardCard>

      <DashboardCard>
        <DashboardCardHeader title="无 Task ID 手动上传" description="只创建 Material，不创建 PromptTask。" />
        <ManualMaterialUploadForm products={[product]} runtimeNotice={runtimeNotice} defaultProductId={product.id} />
        <div className="space-y-3 px-5 pb-5">
          {runtimeNotice ? <PageNote>预览环境只读，请在 Windows 本地验收。</PageNote> : null}
          <div className="flex flex-wrap gap-2">
            <TableActionLink href={`/materials?productId=${product.id}`}>查看素材库</TableActionLink>
            <TableActionLink href={`/copywriting?productId=${product.id}`}>查看文案素材</TableActionLink>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
