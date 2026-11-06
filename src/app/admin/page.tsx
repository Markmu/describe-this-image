import { requireAdminPage } from "@/lib/admin/access";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";

export default async function AdminPage() {
  await requireAdminPage();
  return <AdminWorkspace section="overview" />;
}
