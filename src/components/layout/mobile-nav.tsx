"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  DollarSign,
  Fuel,
  Package,
  Truck,
  BarChart3,
  Menu,
  X,
  Globe,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { key: "dashboard", href: "", icon: LayoutDashboard, adminOnly: false },
  { key: "prices", href: "/prices", icon: DollarSign, adminOnly: false },
  { key: "stations", href: "/stations", icon: Fuel, adminOnly: false },
  { key: "inventory", href: "/inventory", icon: Package, adminOnly: false },
  { key: "deliveries", href: "/deliveries", icon: Truck, adminOnly: false },
  { key: "analytics", href: "/analytics", icon: BarChart3, adminOnly: false },
  { key: "adminSync", href: "/admin/sync", icon: RefreshCw, adminOnly: true },
];

export function MobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const otherLocale = locale === "en" ? "th" : "en";
  const visibleItems = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between h-14 px-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-primary" />
          <span className="font-bold">{tCommon("appName")}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 top-14 z-50 bg-background">
          <nav className="p-4 space-y-1">
            {visibleItems.map((item) => {
              const href = `/${locale}${item.href}`;
              const isActive =
                item.href === ""
                  ? pathname === `/${locale}` || pathname === `/${locale}/`
                  : pathname.startsWith(href);

              return (
                <Link
                  key={item.key}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:bg-accent"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.key)}
                </Link>
              );
            })}
            <Link
              href={`/${otherLocale}${pathname.replace(`/${locale}`, "")}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium"
            >
              <Globe className="h-4 w-4" />
              {locale === "en" ? "ภาษาไทย" : "English"}
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: `/${locale}/login` });
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
