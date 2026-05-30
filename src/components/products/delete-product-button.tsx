"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type DeleteActionState = {
  success: boolean;
  error?: string | null;
};

export function DeleteProductButton({
  productId,
  deleteAction,
}: {
  productId: number;
  deleteAction: (productId: number) => Promise<DeleteActionState>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const confirmed = window.confirm("确认删除这个商品吗？删除后商品池默认不再显示。");
        if (!confirmed) {
          return;
        }

        const doubleConfirmed = window.confirm("请再次确认删除。此操作将把商品标记为已删除。");
        if (!doubleConfirmed) {
          return;
        }

        startTransition(async () => {
          const result = await deleteAction(productId);

          if (!result.success) {
            window.alert(result.error ?? "删除商品失败，请稍后重试。");
            return;
          }

          router.refresh();
        });
      }}
      className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-rose-200 px-3 text-sm font-medium text-rose-600 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "删除中..." : "删除"}
    </button>
  );
}
