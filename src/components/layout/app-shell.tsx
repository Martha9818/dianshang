import type { ReactNode } from "react";
import { InspirationRuntimeScheduler } from "@/components/inspirations/inspiration-runtime-scheduler";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <InspirationRuntimeScheduler />
      <div className="flex min-h-screen w-full px-0 lg:py-3 lg:pl-3">
        <AppSidebar />
        <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.98))] lg:min-h-[calc(100vh-24px)] lg:rounded-l-[34px] lg:border-y lg:border-l lg:border-white/80 lg:shadow-[0_28px_76px_rgba(53,77,118,0.08)]">
          <MobileNavigation />
          <div className="flex flex-1 flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}
