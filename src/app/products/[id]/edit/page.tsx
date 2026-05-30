import { WorkspacePage } from "@/components/ui/workspace-page";
import { ProductForm } from "@/components/products/product-form";
import { ProductNotFoundState } from "@/components/products/not-found-state";
import { ProductRuntimeUnavailableState } from "@/components/products/runtime-unavailable-state";
import { buildProductFormValues } from "@/lib/modules/products";
import { updateProductAction } from "@/app/products/actions";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { getProductEditPageData } from "@/lib/services/product-service";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId)) {
    return (
      <WorkspacePage eyebrow="Products" title="编辑商品" description="修改商品基础信息。">
        <ProductNotFoundState />
      </WorkspacePage>
    );
  }

  const runtime = getRuntimeModeSummary();
  const pageData = await getProductEditPageData(productId);

  if (pageData.kind === "unavailable") {
    return (
      <WorkspacePage eyebrow="Products" title="编辑商品" description="修改商品基础信息。">
        <ProductRuntimeUnavailableState description={pageData.message} />
      </WorkspacePage>
    );
  }

  const product = pageData.data;

  if (!product) {
    return (
      <WorkspacePage eyebrow="Products" title="编辑商品" description="修改商品基础信息。">
        <ProductNotFoundState />
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage
      eyebrow="Products"
      title={`编辑商品 · ${product.name}`}
      description="更新商品基础信息。SPU 为系统生成字段，创建后不可编辑。"
    >
      <ProductForm
        mode="edit"
        initialValues={buildProductFormValues(product)}
        productMeta={{
          id: product.id,
          spu: product.spu,
          status: product.status,
          mainImagePath: product.mainImagePath,
        }}
        runtimeNotice={runtime.isWritable ? null : buildReadonlyRuntimeMessage(runtime.mode)}
        submitAction={updateProductAction.bind(null, product.id)}
      />
    </WorkspacePage>
  );
}
