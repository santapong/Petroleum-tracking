"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, User, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StationDetail {
  id: string;
  name: string;
  address: string;
  provinceId: string;
  province: { nameEn: string; nameTh: string };
  owner: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  inventory: { fuelType: string; quantity: number; capacity: number }[];
  deliveries: {
    id: string;
    fuelType: string;
    quantity: number;
    status: string;
    scheduledDate: string;
    depot: { name: string };
  }[];
}

interface Province {
  id: string;
  nameEn: string;
  nameTh: string;
}

export default function StationDetailPage() {
  const t = useTranslations("stations");
  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");
  const tDeliveries = useTranslations("deliveries");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const [station, setStation] = useState<StationDetail | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", provinceId: "", owner: "", phone: "",
    latitude: "", longitude: "", status: "ACTIVE",
  });

  const fetchStation = useCallback(async () => {
    try {
      const res = await fetch(`/api/stations/${params.id}`);
      if (res.ok) setStation(await res.json());
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => { fetchStation(); }, [fetchStation]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/provinces");
        if (res.ok) setProvinces(await res.json());
      } catch { /* ignore */ }
    })();
  }, []);

  const openEdit = () => {
    if (!station) return;
    setForm({
      name: station.name,
      address: station.address,
      provinceId: station.provinceId,
      owner: station.owner || "",
      phone: station.phone || "",
      latitude: station.latitude !== null ? String(station.latitude) : "",
      longitude: station.longitude !== null ? String(station.longitude) : "",
      status: station.status,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/stations/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude: form.latitude || null,
          longitude: form.longitude || null,
        }),
      });
      if (res.ok) {
        setEditOpen(false);
        fetchStation();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update station");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(tCommon("confirmDelete"))) return;
    try {
      setError(null);
      const res = await fetch(`/api/stations/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/${locale}/stations`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete station");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  if (!station) {
    return <div className="p-6">{tCommon("loading")}</div>;
  }

  const inventoryLevel = (quantity: number, capacity: number) => {
    const pct = capacity > 0 ? (quantity / capacity) * 100 : 0;
    if (pct < 25) return { label: tInventory("low"), color: "bg-red-500" };
    if (pct < 60) return { label: tInventory("medium"), color: "bg-yellow-500" };
    return { label: tInventory("full"), color: "bg-green-500" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/stations`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{station.name}</h1>
            <Badge variant={station.status === "ACTIVE" ? "default" : "secondary"}>
              {station.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            {tCommon("edit")}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {tCommon("delete")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{station.address}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === "th" ? station.province.nameTh : station.province.nameEn}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{station.owner || "-"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{station.phone || "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("inventorySummary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tInventory("fuelType")}</TableHead>
                <TableHead>{tInventory("quantity")}</TableHead>
                <TableHead>{tInventory("capacity")}</TableHead>
                <TableHead>{tInventory("level")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {station.inventory.map((inv) => {
                const level = inventoryLevel(inv.quantity, inv.capacity);
                const pct = inv.capacity > 0 ? ((inv.quantity / inv.capacity) * 100).toFixed(1) : "0";
                return (
                  <TableRow key={inv.fuelType}>
                    <TableCell className="font-medium">{inv.fuelType}</TableCell>
                    <TableCell>{inv.quantity.toLocaleString()}</TableCell>
                    <TableCell>{inv.capacity.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${level.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {station.inventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {tCommon("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentDeliveries")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tDeliveries("depot")}</TableHead>
                <TableHead>{tDeliveries("fuelType")}</TableHead>
                <TableHead>{tDeliveries("quantity")}</TableHead>
                <TableHead>{tDeliveries("scheduledDate")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {station.deliveries.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.depot.name}</TableCell>
                  <TableCell>{d.fuelType}</TableCell>
                  <TableCell>{d.quantity.toLocaleString()}</TableCell>
                  <TableCell>{new Date(d.scheduledDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "DELIVERED" ? "default" : d.status === "CANCELLED" ? "destructive" : "secondary"}>
                      {d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {station.deliveries.length === 0 && (
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editStation")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t("stationName")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("address")}</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("province")}</Label>
              <Select value={form.provinceId} onValueChange={(v) => setForm({ ...form, provinceId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {locale === "th" ? p.nameTh : p.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("owner")}</Label>
                <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t("phone")}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("latitude")}</Label>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t("longitude")}</Label>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{tCommon("status")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                  <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
                  <SelectItem value="MAINTENANCE">{t("maintenance")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleUpdate}>{tCommon("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
