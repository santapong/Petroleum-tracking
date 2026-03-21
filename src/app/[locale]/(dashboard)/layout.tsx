import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileNav />
      <main className="md:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
