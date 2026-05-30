import type { ReactNode } from "react";
import { MiniIcon, SearchIcon } from "@/components/dashboard/primitives";

type WorkspacePageProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

function HeaderIconButton({
  icon,
  badge,
}: {
  icon: "bell" | "gear";
  badge?: string;
}) {
  return (
    <button
      type="button"
      className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[#E6ECF5] bg-white text-slate-500 shadow-[0_10px_24px_rgba(59,130,246,0.08)] transition-all duration-200 hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-slate-700 hover:shadow-[0_14px_28px_rgba(59,130,246,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
    >
      <MiniIcon name={icon} className="h-5 w-5" />
      {badge ? (
        <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function WorkspacePage({
  eyebrow,
  title,
  description,
  children,
}: WorkspacePageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-[#EDF2F8] px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-[2.15rem] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2.6rem]">
              {title}
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-500">{description}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <button
              type="button"
              className="flex h-12 min-w-[260px] cursor-pointer items-center gap-3 rounded-2xl border border-[#E6ECF5] bg-white px-4 text-left text-sm text-slate-400 shadow-[0_12px_26px_rgba(59,130,246,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-slate-500 hover:shadow-[0_16px_30px_rgba(59,130,246,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              <SearchIcon className="h-4 w-4" />
              <span className="truncate">搜索商品、任务、素材...</span>
            </button>
            <div className="flex items-center gap-3">
              <HeaderIconButton icon="bell" badge="3" />
              <HeaderIconButton icon="gear" />
              <button
                type="button"
                className="flex h-12 cursor-pointer items-center gap-3 rounded-full border border-[#E6ECF5] bg-white px-3 pr-4 shadow-[0_10px_24px_rgba(59,130,246,0.08)] transition-all duration-200 hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:shadow-[0_14px_28px_rgba(59,130,246,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E9F1FF] text-sm font-semibold text-[#2563EB]">
                  EP
                </span>
                <span className="hidden text-sm font-medium text-slate-500 sm:inline">工作台</span>
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-slate-400" aria-hidden="true">
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 px-5 py-5 sm:px-8 sm:py-6">{children}</div>
    </div>
  );
}
