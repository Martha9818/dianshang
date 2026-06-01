"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type MaterialCardShellProps = {
  href: string;
  selected: boolean;
  children: ReactNode;
};

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("a,button,input,label,select,textarea"));
}

export function MaterialCardShell({ href, selected, children }: MaterialCardShellProps) {
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
        "group relative flex h-full min-h-[320px] cursor-pointer flex-col rounded-[24px] border p-4 transition hover:-translate-y-[1px] hover:shadow-[0_18px_36px_rgba(59,130,246,0.08)] focus:outline-none focus:ring-4 focus:ring-blue-50",
        selected ? "border-blue-200 bg-[#F8FBFF]" : "border-[#EEF2F8] bg-white",
      ].join(" ")}
    >
      {children}
    </article>
  );
}
