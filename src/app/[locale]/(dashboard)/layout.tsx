import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  return (
    <div className="min-h-screen">
      <Sidebar isAdmin={isAdmin} />
      <MobileNav isAdmin={isAdmin} />
      <main className="md:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
