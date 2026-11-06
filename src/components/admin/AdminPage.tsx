import { requireAdminPage } from "@/lib/admin/access";
import { AdminWorkspace } from "./AdminWorkspace";

export async function AdminPage({ section }: { section: string }) {
  await requireAdminPage();
  return <AdminWorkspace section={section} />;
}
