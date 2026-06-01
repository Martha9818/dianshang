"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";
const SCROLL_STORAGE_KEY = "ecompilot.linkImports.filterScroll";

type StoredScrollPosition = {
  x: number;
  y: number;
  anchorTop: number | null;
};

export function LinkImportFilterControls({
  purpose,
  status,
  purposeOptions,
  statusOptions,
}: {
  purpose: string;
  status: string;
  purposeOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const controlsRef = useRef<HTMLDivElement>(null);

  function rememberScrollPosition() {
    const anchorTop = controlsRef.current?.getBoundingClientRect().top ?? null;
    window.sessionStorage.setItem(
      SCROLL_STORAGE_KEY,
      JSON.stringify({
        x: window.scrollX,
        y: window.scrollY,
        anchorTop,
      }),
    );
  }

  function restoreScrollPosition() {
    const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (!raw) return;

    let position: StoredScrollPosition | null = null;
    try {
      position = JSON.parse(raw) as StoredScrollPosition;
    } catch {
      window.sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      return;
    }

    let attempts = 0;
    const restore = () => {
      if (!position) return;
      const currentAnchorTop = controlsRef.current?.getBoundingClientRect().top ?? null;
      if (typeof position.anchorTop === "number" && typeof currentAnchorTop === "number") {
        window.scrollTo(position.x, Math.max(0, window.scrollY + currentAnchorTop - position.anchorTop));
      } else {
        window.scrollTo(position.x, position.y);
      }
      attempts += 1;
      if (attempts < 8) {
        window.requestAnimationFrame(restore);
      } else {
        window.sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      }
    };

    window.requestAnimationFrame(restore);
  }

  useEffect(() => {
    restoreScrollPosition();
  }, [purpose, status]);

  function applyFilter(key: "purpose" | "status", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("draftId");
    params.delete("linkImportError");
    params.delete("linkImportMessage");
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    rememberScrollPosition();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.replace(query ? `/link-imports?${query}` : "/link-imports", { scroll: false });
  }

  return (
    <div ref={controlsRef} className="grid gap-3 md:grid-cols-2">
      <select
        aria-label="筛选用途"
        value={purpose}
        className={inputClassName}
        onChange={(event) => applyFilter("purpose", event.target.value)}
      >
        <option value="">全部用途</option>
        {purposeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        aria-label="筛选状态"
        value={status}
        className={inputClassName}
        onChange={(event) => applyFilter("status", event.target.value)}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
