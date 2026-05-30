import { WorkspacePage } from "@/components/ui/workspace-page";
import { ProductForm } from "@/components/products/product-form";
import { getEmptyProductFormValues } from "@/lib/modules/products";
import { createProductAction } from "@/app/products/actions";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/product-runtime-service";

export default function NewProductPage() {
  const runtime = getRuntimeModeSummary();

  return (
    <WorkspacePage
      eyebrow="Products"
      title="新增商品"
      description="先建立商品基础档案，再逐步接入评分、文案、素材与后续工作流。"
    >
      <ProductForm
        mode="create"
        initialValues={getEmptyProductFormValues()}
        runtimeNotice={runtime.isWritable ? null : buildReadonlyRuntimeMessage(runtime.mode)}
        submitAction={createProductAction}
      />
    </WorkspacePage>
  );
}
