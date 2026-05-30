"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  primaryNavigation,
  settingsNavigation,
  type NavigationIcon,
  type NavigationItem,
} from "@/config/navigation";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      title={item.description}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2 text-[14px] font-medium transition",
        active
          ? "bg-[linear-gradient(135deg,#EDF4FF,#DCEBFF)] text-[#2563EB] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition",
          active
            ? "border-blue-200/80 bg-white text-[#2563EB]"
            : "border-transparent bg-transparent text-slate-400 group-hover:border-slate-200 group-hover:bg-white group-hover:text-slate-600",
        )}
      >
        <SidebarIcon icon={item.icon} />
      </span>
      <span className="truncate text-[14px] tracking-[-0.01em]">{item.title}</span>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-3 hidden h-[calc(100dvh-24px)] w-[272px] shrink-0 overflow-hidden border-r border-[#EDF2F8] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,251,255,0.96))] px-4 py-4 lg:flex xl:w-[284px]">
      <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-3 px-1">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[#ECF4FF] text-[#2563EB] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
          <SidebarIcon icon="bag" />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="truncate text-[1.02rem] font-semibold tracking-[-0.03em] text-slate-900">
            EcomPilot MVP
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-400">
            本地电商评估与素材工作台
          </p>
        </div>
      </div>

      <nav className="app-sidebar-nav mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="space-y-1">
          {primaryNavigation.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </section>

        <section className="space-y-1">
          {settingsNavigation.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </section>
      </nav>

      </div>
    </aside>
  );
}

function SidebarIcon({ icon }: { icon: NavigationIcon | "bag" }) {
  const className = "h-[20px] w-[20px] stroke-[1.8]";

  switch (icon) {
    case "bag":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M7.5 9V7.5a4.5 4.5 0 0 1 9 0V9" stroke="currentColor" strokeLinecap="round" />
          <path
            d="M6 9h12l-.8 10.2a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8L6 9Z"
            stroke="currentColor"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4 11.5 12 5l8 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 10.5V19h9v-8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 4.8a4.4 4.4 0 0 0-4.4 4.4v2.2c0 1.1-.3 2.2-.9 3.1L5.6 16h12.8l-1.1-1.5a5.5 5.5 0 0 1-.9-3.1V9.2A4.4 4.4 0 0 0 12 4.8Z"
            stroke="currentColor"
            strokeLinejoin="round"
          />
          <path d="M10 18a2.3 2.3 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case "products":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="5" y="6" width="14" height="13" rx="2" stroke="currentColor" />
          <path d="M8.5 4.8v3M15.5 4.8v3M8.5 11.2h7" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case "copywriting":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M7 6.5h10M7 11h10M7 15.5h6" stroke="currentColor" strokeLinecap="round" />
          <path d="M5.5 4.5h13a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z" stroke="currentColor" />
        </svg>
      );
    case "promptTasks":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M6 6.5h12v11H9.5L6 20V6.5Z" stroke="currentColor" strokeLinejoin="round" />
          <path d="M9 10h6M9 13.5h4" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case "materials":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4.5" y="5" width="15" height="14" rx="2" stroke="currentColor" />
          <path d="M7.5 15l3-3 2.5 2 3.5-4 2 2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="9.5" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      );
    case "inspirations":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 4.5c-2.8 0-5 2.2-5 5 0 2 1.1 3.6 2.7 4.5.6.3 1 .9 1 1.6v.4h2.6v-.4c0-.7.4-1.3 1-1.6 1.6-.9 2.7-2.5 2.7-4.5 0-2.8-2.2-5-5-5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9.8 19h4.4M10.3 21h3.4" stroke="currentColor" strokeLinecap="round" />
          <path
            d="M6 12.2H4.2M19.8 12.2H18M7.4 7.4 6.1 6.1M17.9 17.9l-1.3-1.3M17.9 6.1l-1.3 1.3M7.4 16.6 6.1 17.9"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      );
    case "export":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 5.5v9" stroke="currentColor" strokeLinecap="round" />
          <path d="M8.5 11.5 12 15l3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 18h12" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case "backup":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M7 8.5a5 5 0 1 1 1.3 7.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.5 8.5H8v3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "diagnostics":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M6 5.5h12v13H6z" stroke="currentColor" strokeLinejoin="round" />
          <path d="M9 9h6M9 12h4M9 15h5.5" stroke="currentColor" strokeLinecap="round" />
          <path d="M18 8.5h2M18 15.5h2M4 8.5h2M4 15.5h2" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case "aiSettings":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 4.5v3M12 16.5v3M4.5 12h3M16.5 12h3" stroke="currentColor" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3.25" stroke="currentColor" />
          <path d="M6.7 6.7l2.1 2.1M15.2 15.2l2.1 2.1M17.3 6.7l-2.1 2.1M8.8 15.2l-2.1 2.1" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case "bannedWords":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="7" stroke="currentColor" />
          <path d="M8.5 15.5 15.5 8.5" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
