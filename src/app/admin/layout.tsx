import { AdminSidebar } from "@/components/admin-sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen max-w-[1200px] mx-auto max-md:flex-col">
      <AdminSidebar />
      <main className="flex-1 px-9 py-8 max-md:px-4 max-md:py-5">{children}</main>
    </div>
  );
}
