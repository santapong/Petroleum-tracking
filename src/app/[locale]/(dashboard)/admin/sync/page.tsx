"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SyncResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  total?: number;
  error?: string;
  message?: string;
}

export default function AdminSyncPage() {
  const t = useTranslations("admin");
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, SyncResult>>({});

  async function refreshPrices() {
    setBusy("prices");
    try {
      const res = await fetch("/api/admin/sync/prices", { method: "POST" });
      const json = await res.json();
      setResult((r) => ({ ...r, prices: json }));
    } finally {
      setBusy(null);
    }
  }

  async function uploadCsv(kind: "stations" | "inventory" | "deliveries", file: File) {
    setBusy(kind);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/sync/${kind}`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      setResult((r) => ({ ...r, [kind]: json }));
    } finally {
      setBusy(null);
    }
  }

  function ResultBlock({ data }: { data?: SyncResult }) {
    if (!data) return null;
    if (data.error) {
      return (
        <p className="text-sm text-destructive">
          {data.error}: {data.message}
        </p>
      );
    }
    return (
      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          {t("inserted")}: {data.inserted} · {t("updated")}: {data.updated} ·{" "}
          {t("skipped")}: {data.skipped}
        </p>
        {data.errors.length > 0 && (
          <details>
            <summary className="cursor-pointer">
              {t("rowErrors")} ({data.errors.length})
            </summary>
            <ul className="mt-2 list-disc pl-5 text-xs">
              {data.errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("syncTitle")}</h1>
        <p className="text-muted-foreground">{t("syncDescription")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("refreshPrices")}</CardTitle>
          <CardDescription>{t("refreshPricesDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={refreshPrices} disabled={busy !== null}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {busy === "prices" ? t("syncing") : t("refreshPrices")}
          </Button>
          <ResultBlock data={result.prices} />
        </CardContent>
      </Card>

      {(["stations", "inventory", "deliveries"] as const).map((kind) => (
        <Card key={kind}>
          <CardHeader>
            <CardTitle>{t(`import.${kind}`)}</CardTitle>
            <CardDescription>{t(`import.${kind}Description`)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={busy !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadCsv(kind, file);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Upload className="h-4 w-4" />
                {busy === kind ? t("uploading") : t("chooseCsv")}
              </span>
            </label>
            <ResultBlock data={result[kind]} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
