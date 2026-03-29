"use client";

import { useTranslations, useLocale } from "next-intl";
import { Fuel, Truck, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { key: "totalStations", icon: Fuel, value: "156", change: "+3" },
  { key: "activeDeliveries", icon: Truck, value: "24", change: "+5" },
  { key: "priceChanges", icon: DollarSign, value: "8", change: "-2" },
  { key: "lowInventory", icon: AlertTriangle, value: "12", change: "+1" },
];

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(stat.key)}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change} from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="text-sm">
                  <p className="font-medium">Delivery #1234 completed</p>
                  <p className="text-muted-foreground">Bangkok Station - 10,000L Diesel</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div className="text-sm">
                  <p className="font-medium">Low inventory alert</p>
                  <p className="text-muted-foreground">Chiang Mai Station - Gasohol 95</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="text-sm">
                  <p className="font-medium">Price updated</p>
                  <p className="text-muted-foreground">Diesel B7: 29.94 THB/L</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`/${locale}/prices`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Update Prices</span>
              </a>
              <a
                href={`/${locale}/deliveries`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">New Delivery</span>
              </a>
              <a
                href={`/${locale}/stations`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <Fuel className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Manage Stations</span>
              </a>
              <a
                href={`/${locale}/analytics`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <AlertTriangle className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">View Analytics</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
