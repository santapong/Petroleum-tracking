"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InventoryItem {
  id: string;
  stationId: string;
  fuelType: string;
  quantity: number;
  capacity: number;
  lastUpdated: string;
  station: {
    name: string;
    province: { nameEn: string; nameTh: string };
  };
}

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) setInventory(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const getLevel = (quantity: number, capacity: number) => {
    const pct = capacity > 0 ? (quantity / capacity) * 100 : 0;
    if (pct < 25) return { label: t("low"), color: "bg-red-500", textColor: "text-red-600" };
    if (pct < 60) return { label: t("medium"), color: "bg-yellow-500", textColor: "text-yellow-600" };
    return { label: t("full"), color: "bg-green-500", textColor: "text-green-600" };
  };

  // Summary stats
  const lowCount = inventory.filter((i) => i.capacity > 0 && (i.quantity / i.capacity) < 0.25).length;
  const totalItems = inventory.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Records</CardDescription>
            <CardTitle className="text-2xl">{totalItems}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("low")} Stock Alerts</CardDescription>
            <CardTitle className="text-2xl text-red-600">{lowCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Healthy Stock</CardDescription>
            <CardTitle className="text-2xl text-green-600">{totalItems - lowCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("station")}</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>{t("fuelType")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("capacity")}</TableHead>
                <TableHead>{t("level")}</TableHead>
                <TableHead>{t("lastUpdated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const level = getLevel(item.quantity, item.capacity);
                const pct = item.capacity > 0 ? ((item.quantity / item.capacity) * 100).toFixed(1) : "0";
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.station.name}</TableCell>
                    <TableCell>
                      {locale === "th" ? item.station.province.nameTh : item.station.province.nameEn}
                    </TableCell>
                    <TableCell>{item.fuelType}</TableCell>
                    <TableCell>{item.quantity.toLocaleString()}</TableCell>
                    <TableCell>{item.capacity.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${level.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${level.textColor}`}>{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
              {inventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {tCommon("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
