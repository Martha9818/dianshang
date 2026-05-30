"use client";

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

type Option = {
  value: string;
  label: string;
};

export function MaterialFilterForm({
  basePath,
  values,
  products,
  platforms,
  materialTypes,
  statuses,
  includeView = true,
  hiddenFields,
}: {
  basePath: string;
  values: {
    query?: string | null;
    productId?: string | null;
    platform?: string | null;
    materialType?: string | null;
    status?: string | null;
    view?: string | null;
    materialId?: string | null;
  };
  products: Array<{ id: number; name: string; spu: string }>;
  platforms: Option[];
  materialTypes: Option[];
  statuses: string[];
  includeView?: boolean;
  hiddenFields?: Record<string, string>;
}) {
  return (
    <form action={basePath} className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_150px_170px_150px_auto] xl:items-end">
      <label className="block">
        <span className="mb-2 block px-1 text-sm text-slate-500">搜索</span>
        <input
          name="query"
          defaultValue={values.query ?? ""}
          placeholder="搜索商品 / 素材 / Task ID"
          className={inputClassName}
        />
      </label>
      <label className="block">
        <span className="mb-2 block px-1 text-sm text-slate-500">商品</span>
        <select name="productId" defaultValue={values.productId ?? ""} className={inputClassName}>
          <option value="">全部</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} / {product.spu}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block px-1 text-sm text-slate-500">平台</span>
        <select name="platform" defaultValue={values.platform ?? ""} className={inputClassName}>
          <option value="">全部</option>
          {platforms.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block px-1 text-sm text-slate-500">素材类型</span>
        <select name="materialType" defaultValue={values.materialType ?? ""} className={inputClassName}>
          <option value="">全部</option>
          {materialTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block px-1 text-sm text-slate-500">状态</span>
        <select name="status" defaultValue={values.status ?? ""} className={inputClassName}>
          <option value="">默认</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      {includeView ? <input type="hidden" name="view" value={values.view ?? "grid"} /> : null}
      {values.materialId ? <input type="hidden" name="materialId" value={values.materialId} /> : null}
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)
        : null}
      <button
        type="submit"
        className="group inline-flex h-12 cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.22)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] hover:shadow-[0_20px_42px_rgba(43,115,255,0.32)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 motion-reduce:transition-none motion-reduce:transform-none"
      >
        筛选
      </button>
    </form>
  );
}
