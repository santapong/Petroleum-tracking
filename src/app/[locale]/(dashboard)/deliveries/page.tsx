"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Delivery {
  id: string;
  fuelType: string;
  quantity: number;
  status: string;
  scheduledDate: string;
  deliveredDate: string | null;
  driverName: string | null;
  truckPlate: string | null;
  notes: string | null;
  depot: { name: string };
  station: { name: string; province: { nameEn: string } };
}

interface DepotOption {
  id: string;
  name: string;
}

interface StationOption {
  id: string;
  name: string;
}

const FUEL_TYPES = [
  "DIESEL", "DIESEL_B7", "GASOHOL_91", "GASOHOL_95",
  "GASOHOL_E20", "GASOHOL_E85", "LPG", "NGV",
];

export default function DeliveriesPage() {
  const t = useTranslations("deliveries");
  const tCommon = useTranslations("common");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [depots, setDepots] = useState<DepotOption[]>([]);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    depotId: "", stationId: "", fuelType: "", quantity: "", scheduledDate: "", driverName: "", truckPlate: "", notes: "",
  });

  const fetchDeliveries = useCallback(async () => {
    try {
      setError(null);
      const url = statusFilter !== "all" ? `/api/deliveries?status=${statusFilter}` : "/api/deliveries";
      const res = await fetch(url);
      if (res.ok) {
        setDeliveries(await res.json());
      } else {
        setError("Failed to fetch deliveries");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }, [statusFilter]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  useEffect(() => {
    (async () => {
      try {
        const [depotsRes, stationsRes] = await Promise.all([
          fetch("/api/depots"),
          fetch("/api/stations"),
        ]);
        if (depotsRes.ok) setDepots(await depotsRes.json());
        if (stationsRes.ok) setStations(await stationsRes.json());
      } catch {
        setError("Failed to load depots and stations");
      }
    })();
  }, []);

  const handleSubmit = async () => {
    try {
      setError(null);
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({ depotId: "", stationId: "", fuelType: "", quantity: "", scheduledDate: "", driverName: "", truckPlate: "", notes: "" });
        fetchDeliveries();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create delivery");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setError(null);
      const data: Record<string, string> = { status };
      if (status === "DELIVERED") data.deliveredDate = new Date().toISOString();
      const res = await fetch(`/api/deliveries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchDeliveries();
      } else {
        setError("Failed to update delivery status");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      SCHEDULED: { variant: "outline", label: t("scheduled") },
      IN_TRANSIT: { variant: "secondary", label: t("inTransit") },
      DELIVERED: { variant: "default", label: t("delivered") },
      CANCELLED: { variant: "destructive", label: t("cancelled") },
    };
    const c = config[status] || { variant: "outline" as const, label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addDelivery")}
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="SCHEDULED">{t("scheduled")}</TabsTrigger>
          <TabsTrigger value="IN_TRANSIT">{t("inTransit")}</TabsTrigger>
          <TabsTrigger value="DELIVERED">{t("delivered")}</TabsTrigger>
          <TabsTrigger value="CANCELLED">{t("cancelled")}</TabsTrigger>
        </TabsList>
      </Tabs>

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
                <TableHead>{t("depot")}</TableHead>
                <TableHead>{t("station")}</TableHead>
                <TableHead>{t("fuelType")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("scheduledDate")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead>{t("driverName")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.depot.name}</TableCell>
                  <TableCell>{d.station.name}</TableCell>
                  <TableCell>{d.fuelType}</TableCell>
                  <TableCell>{d.quantity.toLocaleString()}</TableCell>
                  <TableCell>{new Date(d.scheduledDate).toLocaleDateString()}</TableCell>
                  <TableCell>{statusBadge(d.status)}</TableCell>
                  <TableCell>{d.driverName || "-"}</TableCell>
                  <TableCell>
                    <Select onValueChange={(v) => updateStatus(d.id, v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder={t("updateStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCHEDULED">{t("scheduled")}</SelectItem>
                        <SelectItem value="IN_TRANSIT">{t("inTransit")}</SelectItem>
                        <SelectItem value="DELIVERED">{t("delivered")}</SelectItem>
                        <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {deliveries.length === 0 && (
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addDelivery")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t("depot")}</Label>
              <Select value={form.depotId} onValueChange={(v) => setForm({ ...form, depotId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {depots.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("station")}</Label>
              <Select value={form.stationId} onValueChange={(v) => setForm({ ...form, stationId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("fuelType")}</Label>
              <Select value={form.fuelType} onValueChange={(v) => setForm({ ...form, fuelType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("quantity")}</Label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("scheduledDate")}</Label>
              <Input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("driverName")}</Label>
              <Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("truckPlate")}</Label>
              <Input value={form.truckPlate} onChange={(e) => setForm({ ...form, truckPlate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("notes")}</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
