"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  primaryNavigation,
  settingsNavigation,
  type NavigationItem,
} from "@/config/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileLink({
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
      className={[
        "cursor-pointer rounded-full border px-4 py-2.5 text-sm whitespace-nowrap transition",
        active
          ? "border-blue-200/80 bg-blue-50 text-[#2563EB]"
          : "border-[#E6ECF5] bg-white text-slate-500 hover:text-slate-700",
      ].join(" ")}
    >
      {item.title}
    </Link>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const items = [...primaryNavigation, ...settingsNavigation];

  return (
    <div className="border-b border-[#EDF2F8] px-4 py-4 lg:hidden">
      <p className="text-sm font-semibold text-slate-900">EcomPilot MVP</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <MobileLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}
