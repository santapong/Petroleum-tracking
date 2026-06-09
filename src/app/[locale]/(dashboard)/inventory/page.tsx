"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [error, setError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({ quantity: "", capacity: "" });

  const fetchInventory = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/inventory");
      if (res.ok) {
        setInventory(await res.json());
      } else {
        setError("Failed to fetch inventory");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setEditForm({ quantity: String(item.quantity), capacity: String(item.capacity) });
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    try {
      setError(null);
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: editItem.stationId,
          fuelType: editItem.fuelType,
          quantity: editForm.quantity,
          capacity: editForm.capacity,
        }),
      });
      if (res.ok) {
        setEditItem(null);
        fetchInventory();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update inventory");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

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
            <CardDescription>{t("totalRecords")}</CardDescription>
            <CardTitle className="text-2xl">{totalItems}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("lowStockAlerts")}</CardDescription>
            <CardTitle className="text-2xl text-red-600">{lowCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("healthyStock")}</CardDescription>
            <CardTitle className="text-2xl text-green-600">{totalItems - lowCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("station")}</TableHead>
                <TableHead>{t("province")}</TableHead>
                <TableHead>{t("fuelType")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("capacity")}</TableHead>
                <TableHead>{t("level")}</TableHead>
                <TableHead>{t("lastUpdated")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
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
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        {tCommon("edit")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {inventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {tCommon("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editItem !== null} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("updateInventory")}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="grid gap-4 py-4">
              <div className="text-sm text-muted-foreground">
                {editItem.station.name} · {editItem.fuelType}
              </div>
              <div className="grid gap-2">
                <Label>{t("quantity")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("capacity")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>{tCommon("cancel")}</Button>
            <Button onClick={handleUpdate}>{tCommon("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
