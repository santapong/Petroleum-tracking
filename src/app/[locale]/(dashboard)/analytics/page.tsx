"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceChart } from "@/components/analytics/price-chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface FuelPrice {
  id: string;
  fuelType: string;
  price: number;
  effectiveDate: string;
}

interface DeliveryStats {
  SCHEDULED: number;
  IN_TRANSIT: number;
  DELIVERED: number;
  CANCELLED: number;
}

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#ef4444"];

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({
    SCHEDULED: 0, IN_TRANSIT: 0, DELIVERED: 0, CANCELLED: 0,
  });
  const [inventoryData, setInventoryData] = useState<{ name: string; quantity: number; capacity: number }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [pricesRes, deliveriesRes, inventoryRes] = await Promise.all([
        fetch("/api/prices"),
        fetch("/api/deliveries"),
        fetch("/api/inventory"),
      ]);

      if (pricesRes.ok) setPrices(await pricesRes.json());

      if (deliveriesRes.ok) {
        const deliveries = await deliveriesRes.json();
        const stats: DeliveryStats = { SCHEDULED: 0, IN_TRANSIT: 0, DELIVERED: 0, CANCELLED: 0 };
        deliveries.forEach((d: { status: keyof DeliveryStats }) => {
          if (stats[d.status] !== undefined) stats[d.status]++;
        });
        setDeliveryStats(stats);
      }

      if (inventoryRes.ok) {
        const inv = await inventoryRes.json();
        // Aggregate by fuel type
        const fuelMap = new Map<string, { quantity: number; capacity: number }>();
        inv.forEach((item: { fuelType: string; quantity: number; capacity: number }) => {
          const existing = fuelMap.get(item.fuelType) || { quantity: 0, capacity: 0 };
          existing.quantity += item.quantity;
          existing.capacity += item.capacity;
          fuelMap.set(item.fuelType, existing);
        });
        setInventoryData(
          Array.from(fuelMap.entries()).map(([name, data]) => ({ name, ...data }))
        );
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deliveryPieData = [
    { name: "Scheduled", value: deliveryStats.SCHEDULED },
    { name: "In Transit", value: deliveryStats.IN_TRANSIT },
    { name: "Delivered", value: deliveryStats.DELIVERED },
    { name: "Cancelled", value: deliveryStats.CANCELLED },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Tabs defaultValue="prices">
        <TabsList>
          <TabsTrigger value="prices">{t("priceTrends")}</TabsTrigger>
          <TabsTrigger value="inventory">{t("inventoryOverview")}</TabsTrigger>
          <TabsTrigger value="deliveries">{t("deliveryStats")}</TabsTrigger>
        </TabsList>

        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle>{t("priceTrends")}</CardTitle>
              <CardDescription>Historical fuel price changes</CardDescription>
            </CardHeader>
            <CardContent>
              <PriceChart prices={prices} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>{t("inventoryOverview")}</CardTitle>
              <CardDescription>Aggregated fuel stock across all stations</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" fill="#3b82f6" name="Current Stock" />
                    <Bar dataKey="capacity" fill="#e5e7eb" name="Total Capacity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No inventory data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle>{t("deliveryStats")}</CardTitle>
              <CardDescription>Delivery status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={deliveryPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deliveryPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No delivery data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
