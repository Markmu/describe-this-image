import { Suspense } from "react";
import { requireAdminPage } from "@/lib/admin/access";
import { AdminLoading } from "./AdminLoading";
import { AdminWorkspace } from "./AdminWorkspace";

async function ProtectedAdminPage({ section }: { section: string }) {
  await requireAdminPage();
  return <AdminWorkspace section={section} />;
}

export function AdminPage({ section }: { section: string }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProtectedAdminPage section={section} />
    </Suspense>
  );
}
