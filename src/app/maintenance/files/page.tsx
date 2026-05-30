import { FileMaintenancePanel } from "@/components/maintenance/file-maintenance-panel";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { getInitialFileMaintenancePageData } from "@/lib/services/fileMaintenanceService";

export const dynamic = "force-dynamic";

export default async function FileMaintenancePage() {
  const initialData = await getInitialFileMaintenancePageData();

  return (
    <WorkspacePage
      eyebrow="Maintenance"
      title="文件清理与回收站"
      description="手动扫描 uploads、exports、backups，按建议移入应用内回收站，并二次确认永久删除。"
    >
      <FileMaintenancePanel initialData={initialData} />
    </WorkspacePage>
  );
}
