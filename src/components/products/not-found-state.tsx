import { ActionButton, DashboardCard, MiniIcon } from "@/components/dashboard/primitives";

export function ProductNotFoundState() {
  return (
    <DashboardCard className="mx-auto max-w-xl px-6 py-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-rose-50 text-rose-500">
        <MiniIcon name="ban" className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-900">
        商品不存在或已删除
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        这个商品可能已经被软删除，或者当前链接已失效。你可以返回商品池继续查看其他商品。
      </p>
      <div className="mt-6 flex justify-center">
        <ActionButton href="/products">返回商品池</ActionButton>
      </div>
    </DashboardCard>
  );
}
