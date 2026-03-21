"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Station {
  id: string;
  name: string;
  address: string;
  province: { nameEn: string; nameTh: string };
  owner: string | null;
  phone: string | null;
  status: string;
  inventory: { fuelType: string; quantity: number; capacity: number }[];
}

export default function StationsPage() {
  const t = useTranslations("stations");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [stations, setStations] = useState<Station[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", provinceId: "", owner: "", phone: "", status: "ACTIVE",
  });

  const fetchStations = useCallback(async () => {
    try {
      const url = search ? `/api/stations?search=${encodeURIComponent(search)}` : "/api/stations";
      const res = await fetch(url);
      if (res.ok) setStations(await res.json());
    } catch { /* ignore */ }
  }, [search]);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({ name: "", address: "", provinceId: "", owner: "", phone: "", status: "ACTIVE" });
        fetchStations();
      }
    } catch { /* ignore */ }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ACTIVE: "default",
      INACTIVE: "destructive",
      MAINTENANCE: "secondary",
    };
    const labels: Record<string, string> = {
      ACTIVE: t("active"),
      INACTIVE: t("inactive"),
      MAINTENANCE: t("maintenance"),
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
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
          {t("addStation")}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("stationName")}</TableHead>
                <TableHead>{t("province")}</TableHead>
                <TableHead>{t("owner")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell>
                    {locale === "th" ? station.province.nameTh : station.province.nameEn}
                  </TableCell>
                  <TableCell>{station.owner || "-"}</TableCell>
                  <TableCell>{station.phone || "-"}</TableCell>
                  <TableCell>{statusBadge(station.status)}</TableCell>
                  <TableCell>
                    <Link href={`/${locale}/stations/${station.id}`}>
                      <Button variant="ghost" size="sm">{tCommon("edit")}</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {stations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
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
            <DialogTitle>{t("addStation")}</DialogTitle>
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
              <Label>{t("owner")}</Label>
              <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("phone")}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleSubmit}>{tCommon("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
