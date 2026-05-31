"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { runScheduledInspirationScanAction } from "@/app/inspirations/actions";

const CHECK_INTERVAL_MS = 60_000;
const FIRST_CHECK_DELAY_MS = 5_000;

export function InspirationRuntimeScheduler() {
  const router = useRouter();
  const inFlightRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function tick() {
      if (disposed || inFlightRef.current || document.visibilityState === "hidden") {
        return;
      }

      inFlightRef.current = true;
      try {
        const result = await runScheduledInspirationScanAction();
        if (!disposed && result.success && result.data && !result.data.skipped) {
          router.refresh();
        }
      } finally {
        inFlightRef.current = false;
      }
    }

    timeoutId = setTimeout(tick, FIRST_CHECK_DELAY_MS);
    intervalId = setInterval(tick, CHECK_INTERVAL_MS);

    return () => {
      disposed = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
