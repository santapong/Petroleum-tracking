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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { key: "dashboard", href: "", icon: LayoutDashboard },
  { key: "prices", href: "/prices", icon: DollarSign },
  { key: "stations", href: "/stations", icon: Fuel },
  { key: "inventory", href: "/inventory", icon: Package },
  { key: "deliveries", href: "/deliveries", icon: Truck },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const otherLocale = locale === "en" ? "th" : "en";

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
          </nav>
        </div>
      )}
    </div>
  );
}
