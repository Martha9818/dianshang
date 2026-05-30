"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type GuardState = {
  isDirty: boolean;
  resetDirty: () => void;
};

export function useUnsavedChangesGuard({ isDirty, resetDirty }: GuardState) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => window.removeEventListener("beforeunload", beforeUnloadHandler);
  }, [isDirty]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isDirty) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      const destination = link.getAttribute("href");
      if (!destination || destination.startsWith("#") || destination.startsWith("javascript:")) {
        return;
      }

      const nextUrl = new URL(destination, window.location.href);
      const currentAbsolute = new URL(window.location.href);
      if (nextUrl.pathname === currentAbsolute.pathname && nextUrl.search === currentAbsolute.search) {
        return;
      }

      const confirmed = window.confirm("表单尚未保存，确认离开当前页面吗？");
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        resetDirty();
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [isDirty, pathname, resetDirty]);
}
