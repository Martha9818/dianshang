import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import Link from "next/link";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const interactiveBaseClassName =
  "group cursor-pointer touch-manipulation transition-all duration-200 ease-out active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 motion-reduce:transition-none motion-reduce:transform-none";

const iconMotionClassName =
  "transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 group-active:translate-y-0 group-active:scale-100 motion-reduce:transition-none motion-reduce:transform-none";

type Tone = "blue" | "amber" | "green" | "violet" | "red" | "slate";

const toneStyles: Record<Tone, { chip: string; soft: string; text: string }> = {
  blue: {
    chip: "border-blue-200/80 bg-blue-50 text-blue-600",
    soft: "bg-blue-50/80 text-blue-600",
    text: "text-blue-600",
  },
  amber: {
    chip: "border-amber-200/80 bg-amber-50 text-amber-600",
    soft: "bg-amber-50/80 text-amber-600",
    text: "text-amber-600",
  },
  green: {
    chip: "border-emerald-200/80 bg-emerald-50 text-emerald-600",
    soft: "bg-emerald-50/80 text-emerald-600",
    text: "text-emerald-600",
  },
  violet: {
    chip: "border-violet-200/80 bg-violet-50 text-violet-600",
    soft: "bg-violet-50/80 text-violet-600",
    text: "text-violet-600",
  },
  red: {
    chip: "border-rose-200/80 bg-rose-50 text-rose-600",
    soft: "bg-rose-50/80 text-rose-600",
    text: "text-rose-600",
  },
  slate: {
    chip: "border-slate-200/90 bg-slate-50 text-slate-600",
    soft: "bg-slate-50/90 text-slate-600",
    text: "text-slate-600",
  },
};

export function DashboardCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[26px] border border-[#E7ECF3] bg-white shadow-[0_18px_45px_rgba(30,64,175,0.06)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function DashboardCardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[74px] flex-col gap-3 border-b border-[#EEF2F8] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-[1.12rem] font-semibold tracking-[-0.02em] text-slate-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 self-start">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  tone,
  icon,
  compact = false,
}: {
  label: string;
  value: string;
  delta: string;
  tone: Tone;
  icon: ReactNode;
  compact?: boolean;
}) {
  return (
    <DashboardCard className={cn("h-full p-5", compact ? "min-h-[148px]" : "min-h-[172px]")}>
      <div className={cn("flex h-full items-center", compact ? "gap-3" : "gap-4")}>
        <div
          className={cn(
            compact
              ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
              : "flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px]",
            toneStyles[tone].soft,
          )}
        >
          {icon}
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col justify-between py-1",
            compact ? "min-h-[108px]" : "min-h-[128px]",
          )}
        >
          <div className={cn(compact ? "min-h-[42px]" : "min-h-[48px]")}>
            <p
              className={cn(
                "text-slate-500",
                compact ? "line-clamp-1 text-[13px] leading-5" : "line-clamp-2 text-[14px] leading-6",
              )}
            >
              {label}
            </p>
          </div>
          <div>
            <p
              className={cn(
                "font-semibold leading-none tracking-[-0.06em] text-slate-900",
                compact ? "text-[2.25rem]" : "text-[2.8rem]",
              )}
            >
              {value}
            </p>
            <p className={cn("text-slate-500", compact ? "mt-2 text-[14px]" : "mt-2.5 text-[15px]")}>
              较昨日 <span className={cn("font-semibold", toneStyles[tone].text)}>{delta}</span>
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export function FilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DashboardCard className={cn("px-4 py-4", className)}>
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">{children}</div>
    </DashboardCard>
  );
}

export function FilterField({
  label,
  value,
  icon,
  wide = false,
}: {
  label?: string;
  value: string;
  icon?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0", wide ? "xl:min-w-[320px] xl:flex-1" : "xl:min-w-[150px]")}>
      {label ? <p className="mb-2 px-1 text-sm text-slate-500">{label}</p> : null}
      <button
        type="button"
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#E4EAF3] bg-white px-4 text-left text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:-translate-y-[1px] hover:border-blue-200 hover:text-slate-900 hover:shadow-[0_12px_26px_rgba(59,130,246,0.10),inset_0_1px_0_rgba(255,255,255,0.85)]",
          interactiveBaseClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          {icon ? <span className={cn("text-slate-400", iconMotionClassName)}>{icon}</span> : null}
          <span className="truncate">{value}</span>
        </span>
        <ChevronDown className={iconMotionClassName} />
      </button>
    </div>
  );
}

export function SearchField({ placeholder }: { placeholder: string }) {
  return (
    <div className="xl:min-w-[340px] xl:flex-1">
      <button
        type="button"
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-2xl border border-[#E4EAF3] bg-white px-4 text-left text-sm text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:-translate-y-[1px] hover:border-blue-200 hover:text-slate-500 hover:shadow-[0_12px_26px_rgba(59,130,246,0.10),inset_0_1px_0_rgba(255,255,255,0.85)]",
          interactiveBaseClassName,
        )}
      >
        <SearchIcon className={cn("h-4 w-4", iconMotionClassName)} />
        <span className="truncate">{placeholder}</span>
      </button>
    </div>
  );
}

export function ActionButton({
  children,
  variant = "primary",
  href,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const className = cn(
    "inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-medium",
    interactiveBaseClassName,
    disabled && "pointer-events-none opacity-50",
    variant === "primary" &&
      "bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] text-white shadow-[0_16px_36px_rgba(43,115,255,0.28)] hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] hover:shadow-[0_20px_42px_rgba(43,115,255,0.34)]",
    variant === "secondary" &&
      "border border-[#DCE5F2] bg-white text-[#2563EB] shadow-[0_10px_22px_rgba(59,130,246,0.08)] hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] hover:shadow-[0_16px_30px_rgba(59,130,246,0.12)]",
    variant === "ghost" &&
      "border border-[#E4EAF3] bg-white text-slate-600 hover:-translate-y-[1px] hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800 hover:shadow-[0_12px_24px_rgba(148,163,184,0.10)]",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={className} disabled={disabled}>
      {children}
    </button>
  );
}

export function StatusBadge({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneStyles[tone].chip,
      )}
    >
      {label}
    </span>
  );
}

export function SectionTabs({
  items,
  active,
  getHref,
}: {
  items: string[];
  active: string;
  getHref?: (item: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-6 border-b border-[#EEF2F8] px-5">
      {items.map((item) => (
        <Link
          key={item}
          href={getHref ? getHref(item) : "#"}
          className={cn(
            "group cursor-pointer border-b-2 px-1 py-4 text-sm font-medium transition-all duration-200 ease-out active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 motion-reduce:transition-none motion-reduce:transform-none",
            item === active
              ? "border-[#2B73FF] text-[#2563EB]"
              : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700",
          )}
        >
          {item}
        </Link>
      ))}
    </div>
  );
}

export function TableActionLink({
  children,
  href = "#",
}: {
  children: ReactNode;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] hover:shadow-[0_12px_24px_rgba(59,130,246,0.10)]",
        interactiveBaseClassName,
      )}
    >
      {children}
    </Link>
  );
}

export function TableScrollArea({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("overflow-x-auto px-5 py-4", className)}>{children}</div>;
}

export function DataTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={cn("w-full min-w-full table-fixed text-left text-sm text-slate-600", className)}>
      {children}
    </table>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return <thead className="text-slate-400">{children}</thead>;
}

export function DataTableHeaderCell({
  children,
  className,
  ...props
}: {
  children: ReactNode;
} & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("pb-3 text-xs font-medium leading-5 tracking-[0.01em]", className)} {...props}>
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function DataTableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("border-t border-[#F0F3F8] align-middle", className)}>{children}</tr>;
}

export function DataTableCell({
  children,
  className,
  ...props
}: {
  children: ReactNode;
} & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("py-4 align-middle leading-6", className)} {...props}>
      {children}
    </td>
  );
}

export function EntityCell({
  thumb,
  title,
 subtitle,
}: {
  thumb: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {thumb}
      <div className="min-w-0">
        <p className="truncate font-medium leading-6 text-slate-900">{title}</p>
        {subtitle ? <p className="mt-1 truncate text-xs leading-5 text-slate-400">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function MockThumb({
  label,
  tone = "slate",
  square = false,
}: {
  label: string;
  tone?: Tone;
  square?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        square ? "h-16 w-16" : "h-12 w-12",
        tone === "blue" && "bg-[linear-gradient(135deg,#EAF2FF,#CFE1FF)] text-blue-700",
        tone === "amber" && "bg-[linear-gradient(135deg,#FFF5DE,#FFE7B0)] text-amber-700",
        tone === "green" && "bg-[linear-gradient(135deg,#E8FBEE,#C9F0D6)] text-emerald-700",
        tone === "violet" && "bg-[linear-gradient(135deg,#F1EBFF,#DDD0FF)] text-violet-700",
        tone === "red" && "bg-[linear-gradient(135deg,#FFEAE9,#FFD2CE)] text-rose-700",
        tone === "slate" && "bg-[linear-gradient(135deg,#F4F7FB,#E4EAF3)] text-slate-600",
      )}
    >
      {label}
    </div>
  );
}

export function PageNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D8E3F2] bg-[#F8FBFF] px-4 py-4 text-sm leading-7 text-slate-500">
      {children}
    </div>
  );
}

export function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn("h-4 w-4 text-slate-400", className)} aria-hidden="true">
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function MiniIcon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "bag"
    | "clock"
    | "thumb"
    | "spark"
    | "doc"
    | "prompt"
    | "image"
    | "bell"
    | "gear"
    | "grid"
    | "list"
    | "upload"
    | "shield"
    | "database"
    | "download"
    | "backup"
    | "ban";
  className?: string;
}) {
  const common = { className, "aria-hidden": true };

  switch (name) {
    case "bag":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path d="M7.5 9V7.5a4.5 4.5 0 0 1 9 0V9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M6 9h12l-.8 10.2a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8L6 9Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7.5v5l3 1.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case "thumb":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path
            d="M10.5 20H7a2 2 0 0 1-2-2v-6.5a2 2 0 0 1 2-2h3.5m0 10 2.9-7.9a2 2 0 0 0-1.9-2.7h-1V5.7a1.7 1.7 0 0 1 3.1-1l1.6 2.8h2.3a2.5 2.5 0 0 1 2.4 3.4l-2 6.4a2.5 2.5 0 0 1-2.4 1.7h-5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path
            d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path
            d="M8 4.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V6A1.5 1.5 0 0 1 8.5 4.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M14 4.5V9h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "prompt":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <rect x="6" y="4.5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 9.5h6M9 13.5h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case "image":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <rect x="4.5" y="5" width="15" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="m7.5 15 3.2-3.3 2.6 2.5 3.7-4 2 2.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <circle cx="9" cy="9" r="1.1" fill="currentColor" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path
            d="M12 4.8a4.4 4.4 0 0 0-4.4 4.4v2.2c0 1.1-.3 2.2-.9 3.1L5.6 16h12.8l-1.1-1.5a5.5 5.5 0 0 1-.9-3.1V9.2A4.4 4.4 0 0 0 12 4.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M10 18a2.3 2.3 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case "gear":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 4.8v2M12 17.2v2M19.2 12h-2M6.8 12h-2M17 7l-1.4 1.4M8.4 15.6 7 17M17 17l-1.4-1.4M8.4 8.4 7 7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <rect x="5" y="5" width="5.2" height="5.2" rx="1.1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13.8" y="5" width="5.2" height="5.2" rx="1.1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="5" y="13.8" width="5.2" height="5.2" rx="1.1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13.8" y="13.8" width="5.2" height="5.2" rx="1.1" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "list":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path d="M9 7h10M9 12h10M9 17h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <circle cx="5.5" cy="7" r="1" fill="currentColor" />
          <circle cx="5.5" cy="12" r="1" fill="currentColor" />
          <circle cx="5.5" cy="17" r="1" fill="currentColor" />
        </svg>
      );
    case "upload":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path d="M12 16V7.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path
            d="M8.5 11 12 7.5 15.5 11"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path d="M5.5 18h13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path
            d="M12 4.8 18 7v4.8c0 4-2.3 6.7-6 8.4-3.7-1.7-6-4.4-6-8.4V7l6-2.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="m9.5 12.2 1.6 1.6 3.4-3.6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "database":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <ellipse cx="12" cy="6.5" rx="6.5" ry="2.7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 6.5v5c0 1.5 2.9 2.7 6.5 2.7s6.5-1.2 6.5-2.7v-5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 11.5v5c0 1.5 2.9 2.7 6.5 2.7s6.5-1.2 6.5-2.7v-5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "download":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path d="M12 6v8.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path
            d="m8.5 11.5 3.5 3.5 3.5-3.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path d="M6 18h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case "backup":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <path
            d="M7 8.5a5 5 0 1 1 1.3 7.1"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M4.5 8.5H8V12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "ban":
      return (
        <svg viewBox="0 0 24 24" fill="none" {...common}>
          <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="m8.8 15.2 6.4-6.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    default:
      return null;
  }
}
