"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type PromptTaskCardShellProps = {
  href: string;
  selected: boolean;
  children: ReactNode;
};

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("a,button,input,label,select,textarea"));
}

export function PromptTaskCardShell({ href, selected, children }: PromptTaskCardShellProps) {
  const router = useRouter();

  function openDetail() {
    router.replace(href, { scroll: false });
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (isInteractiveTarget(event.target)) return;
        openDetail();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (isInteractiveTarget(event.target)) return;
        event.preventDefault();
        openDetail();
      }}
      className={[
        "rounded-2xl border px-4 py-3 transition focus:outline-none focus:ring-4 focus:ring-blue-50",
        selected
          ? "cursor-default border-blue-200 bg-[#F8FBFF] shadow-[0_14px_30px_rgba(59,130,246,0.08)]"
          : "cursor-pointer border-[#EEF2F8] bg-white hover:border-blue-100 hover:bg-[#FBFDFF]",
      ].join(" ")}
    >
      {children}
    </article>
  );
}
