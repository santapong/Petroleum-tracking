"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Fuel, Truck, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityItem =
  | { type: "delivery"; status: string; stationName: string; fuelType: string; quantity: number; timestamp: string }
  | { type: "price"; fuelType: string; price: number; timestamp: string }
  | { type: "lowStock"; stationName: string; fuelType: string; percent: number; timestamp: string };

interface DashboardData {
  totalStations: number;
  activeDeliveries: number;
  pricesToday: number;
  lowInventory: number;
  recentActivity: ActivityItem[];
}

const DELIVERY_DOT_COLORS: Record<string, string> = {
  DELIVERED: "bg-green-500",
  IN_TRANSIT: "bg-yellow-500",
  SCHEDULED: "bg-blue-500",
  CANCELLED: "bg-red-500",
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tDeliveries = useTranslations("deliveries");
  const locale = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) setData(await res.json());
      } catch { /* ignore */ }
    })();
  }, []);

  const stats = [
    { key: "totalStations", icon: Fuel, value: data?.totalStations },
    { key: "activeDeliveries", icon: Truck, value: data?.activeDeliveries },
    { key: "priceChanges", icon: DollarSign, value: data?.pricesToday },
    { key: "lowInventory", icon: AlertTriangle, value: data?.lowInventory },
  ];

  const deliveryStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      SCHEDULED: tDeliveries("scheduled"),
      IN_TRANSIT: tDeliveries("inTransit"),
      DELIVERED: tDeliveries("delivered"),
      CANCELLED: tDeliveries("cancelled"),
    };
    return map[status] || status;
  };

  const renderActivity = (item: ActivityItem, index: number) => {
    if (item.type === "delivery") {
      return (
        <div key={index} className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${DELIVERY_DOT_COLORS[item.status] || "bg-blue-500"}`} />
          <div className="text-sm">
            <p className="font-medium">{t("deliveryActivity")}: {deliveryStatusLabel(item.status)}</p>
            <p className="text-muted-foreground">
              {item.stationName} · {item.quantity.toLocaleString()}L {item.fuelType}
            </p>
          </div>
        </div>
      );
    }
    if (item.type === "price") {
      return (
        <div key={index} className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <div className="text-sm">
            <p className="font-medium">{t("priceUpdated")}</p>
            <p className="text-muted-foreground">
              {item.fuelType}: {item.price.toFixed(2)} {tCommon("baht")}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div key={index} className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <div className="text-sm">
          <p className="font-medium">{t("lowStockAlert")}</p>
          <p className="text-muted-foreground">
            {item.stationName} · {item.fuelType} ({item.percent}%)
          </p>
        </div>
      </div>
    );
  };

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
              <div className="text-2xl font-bold">
                {stat.value !== undefined ? stat.value.toLocaleString() : "-"}
              </div>
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
              {data?.recentActivity.map(renderActivity)}
              {data && data.recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">{tCommon("noData")}</p>
              )}
              {!data && <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/${locale}/prices`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{t("updatePrices")}</span>
              </Link>
              <Link
                href={`/${locale}/deliveries`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{t("newDelivery")}</span>
              </Link>
              <Link
                href={`/${locale}/stations`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <Fuel className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{t("manageStations")}</span>
              </Link>
              <Link
                href={`/${locale}/analytics`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <AlertTriangle className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{t("viewAnalytics")}</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
