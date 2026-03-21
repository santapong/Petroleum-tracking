"use client";

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
  LogOut,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { key: "dashboard", href: "", icon: LayoutDashboard },
  { key: "prices", href: "/prices", icon: DollarSign },
  { key: "stations", href: "/stations", icon: Fuel },
  { key: "inventory", href: "/inventory", icon: Package },
  { key: "deliveries", href: "/deliveries", icon: Truck },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const otherLocale = locale === "en" ? "th" : "en";

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-sidebar">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 px-6 border-b">
          <Fuel className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-lg font-bold text-sidebar-foreground">
            {tCommon("appName")}
          </h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const href = `/${locale}${item.href}`;
            const isActive =
              item.href === ""
                ? pathname === `/${locale}` || pathname === `/${locale}/`
                : pathname.startsWith(href);

            return (
              <Link
                key={item.key}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 space-y-2">
          <Separator />
          <Link href={`/${otherLocale}${pathname.replace(`/${locale}`, "")}`}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Globe className="h-4 w-4" />
              {locale === "en" ? "ภาษาไทย" : "English"}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </div>
      </div>
    </aside>
  );
}
