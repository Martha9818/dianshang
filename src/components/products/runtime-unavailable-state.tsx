import { ActionButton, DashboardCard, MiniIcon } from "@/components/dashboard/primitives";

export function ProductRuntimeUnavailableState({
  title = "当前环境无法加载商品数据",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <DashboardCard className="mx-auto max-w-2xl px-6 py-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-blue-50 text-blue-500">
        <MiniIcon name="database" className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
      <div className="mt-6 flex justify-center">
        <ActionButton href="/products" variant="secondary">
          返回商品池
        </ActionButton>
      </div>
    </DashboardCard>
  );
}
