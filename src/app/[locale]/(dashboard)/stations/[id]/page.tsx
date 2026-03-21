"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StationDetail {
  id: string;
  name: string;
  address: string;
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

export default function StationDetailPage() {
  const t = useTranslations("stations");
  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");
  const locale = useLocale();
  const params = useParams();
  const [station, setStation] = useState<StationDetail | null>(null);

  const fetchStation = useCallback(async () => {
    try {
      const res = await fetch(`/api/stations/${params.id}`);
      if (res.ok) setStation(await res.json());
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => { fetchStation(); }, [fetchStation]);

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
    </div>
  );
}
