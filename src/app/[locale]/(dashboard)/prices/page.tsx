"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceChart } from "@/components/analytics/price-chart";

const FUEL_TYPES = [
  "DIESEL", "DIESEL_B7", "GASOHOL_91", "GASOHOL_95",
  "GASOHOL_E20", "GASOHOL_E85", "LPG", "NGV",
];

interface FuelPrice {
  id: string;
  fuelType: string;
  price: number;
  effectiveDate: string;
  source: string;
}

export default function PricesPage() {
  const t = useTranslations("prices");
  const tCommon = useTranslations("common");
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ fuelType: "", price: "", effectiveDate: "", source: "EPPO" });

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/prices");
      if (res.ok) {
        setPrices(await res.json());
      } else {
        setError("Failed to fetch prices");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const handleSubmit = async () => {
    try {
      setError(null);
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({ fuelType: "", price: "", effectiveDate: "", source: "EPPO" });
        fetchPrices();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create price record");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(tCommon("confirmDelete"))) return;
    try {
      setError(null);
      const res = await fetch(`/api/prices/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPrices();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete price record");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const fuelTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      DIESEL: t("diesel"), DIESEL_B7: t("dieselB7"),
      GASOHOL_91: t("gasohol91"), GASOHOL_95: t("gasohol95"),
      GASOHOL_E20: t("gasoholE20"), GASOHOL_E85: t("gasoholE85"),
      LPG: t("lpg"), NGV: t("ngv"),
    };
    return map[type] || type;
  };

  // Get latest price per fuel type
  const latestPrices = FUEL_TYPES.map((type) => {
    const found = prices.find((p) => p.fuelType === type);
    return { fuelType: type, price: found?.price || 0, effectiveDate: found?.effectiveDate || "" };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addPrice")}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">{t("currentPrices")}</TabsTrigger>
          <TabsTrigger value="history">{t("priceHistory")}</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {latestPrices.map((item) => (
              <Card key={item.fuelType}>
                <CardHeader className="pb-2">
                  <CardDescription>{fuelTypeLabel(item.fuelType)}</CardDescription>
                  <CardTitle className="text-2xl">
                    {item.price > 0 ? `${item.price.toFixed(2)} ${tCommon("baht")}` : "-"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {item.effectiveDate
                      ? new Date(item.effectiveDate).toLocaleDateString()
                      : "No data"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t("priceHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceChart prices={prices} />
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("fuelType")}</TableHead>
                    <TableHead>{t("price")}</TableHead>
                    <TableHead>{t("effectiveDate")}</TableHead>
                    <TableHead>{t("source")}</TableHead>
                    <TableHead>{tCommon("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{fuelTypeLabel(price.fuelType)}</TableCell>
                      <TableCell>{price.price.toFixed(2)} {tCommon("baht")}</TableCell>
                      <TableCell>{new Date(price.effectiveDate).toLocaleDateString()}</TableCell>
                      <TableCell>{price.source}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(price.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {prices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {tCommon("noData")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addPrice")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t("fuelType")}</Label>
              <Select value={form.fuelType} onValueChange={(v) => setForm({ ...form, fuelType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{fuelTypeLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("price")}</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("effectiveDate")}</Label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("source")}</Label>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleSubmit}>{tCommon("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
