import { FUEL_TYPES } from "@/lib/validations";

export type FuelTypeKey = (typeof FUEL_TYPES)[number];

export interface NormalizedFuelPrice {
  fuelType: FuelTypeKey;
  price: number;
  effectiveDate: Date;
}

const DEFAULT_API_BASE = "https://api.eppo.go.th";
const DEFAULT_CATALOG_BASE = "https://catalog.eppo.go.th";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

const FUEL_LABEL_MAP: Record<string, FuelTypeKey> = {
  diesel: "DIESEL",
  "diesel hsd": "DIESEL",
  "ดีเซล": "DIESEL",
  "ดีเซลหมุนเร็ว": "DIESEL",
  "diesel b7": "DIESEL_B7",
  "ดีเซล b7": "DIESEL_B7",
  "ดีเซลบี7": "DIESEL_B7",
  "gasohol 91": "GASOHOL_91",
  "แก๊สโซฮอล์ 91": "GASOHOL_91",
  "แก๊สโซฮอล 91": "GASOHOL_91",
  "gasohol 95": "GASOHOL_95",
  "แก๊สโซฮอล์ 95": "GASOHOL_95",
  "แก๊สโซฮอล 95": "GASOHOL_95",
  "gasohol e20": "GASOHOL_E20",
  "e20": "GASOHOL_E20",
  "แก๊สโซฮอล์ e20": "GASOHOL_E20",
  "gasohol e85": "GASOHOL_E85",
  "e85": "GASOHOL_E85",
  "แก๊สโซฮอล์ e85": "GASOHOL_E85",
  "lpg": "LPG",
  "แอลพีจี": "LPG",
  "ngv": "NGV",
  "เอ็นจีวี": "NGV",
};

export function mapFuelLabel(label: string): FuelTypeKey | null {
  if (!label) return null;
  const key = label.trim().toLowerCase().replace(/\s+/g, " ");
  return FUEL_LABEL_MAP[key] ?? null;
}

function getApiBase(): string {
  return process.env.EPPO_API_BASE || DEFAULT_API_BASE;
}

function getCatalogBase(): string {
  return process.env.EPPO_CATALOG_BASE || DEFAULT_CATALOG_BASE;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  attempt = 1
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok && attempt < MAX_RETRIES && res.status >= 500) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res;
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    const delay = 500 * 2 ** (attempt - 1);
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithRetry(url, init, attempt + 1);
  } finally {
    clearTimeout(timer);
  }
}

interface EppoCurrentPriceRow {
  product?: string;
  product_name?: string;
  fuel?: string;
  price?: number | string;
  retail_price?: number | string;
  date?: string;
  effective_date?: string;
}

interface EppoCurrentResponse {
  data?: EppoCurrentPriceRow[];
  result?: EppoCurrentPriceRow[];
}

export async function fetchEppoCurrentPrices(
  today: Date = new Date()
): Promise<NormalizedFuelPrice[]> {
  const url = `${getApiBase()}/v1/openAPI/oil/retail/current`;
  const body = JSON.stringify({
    date: today.toISOString().slice(0, 10),
  });
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) return [];
  const json = (await res.json()) as EppoCurrentResponse;
  const rows = json.data ?? json.result ?? [];
  return normalizeRows(rows, today);
}

interface CkanPackageResource {
  url: string;
  format?: string;
  name?: string;
}

interface CkanPackageResponse {
  success?: boolean;
  result?: { resources?: CkanPackageResource[] };
}

export async function fetchEppoCkanRetailPrices(
  packageId = "petroleum-retail-price"
): Promise<NormalizedFuelPrice[]> {
  const url = `${getCatalogBase()}/api/3/action/package_show?id=${encodeURIComponent(packageId)}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) return [];
  const json = (await res.json()) as CkanPackageResponse;
  const resources = json.result?.resources ?? [];
  const jsonResource = resources.find(
    (r) => (r.format || "").toLowerCase() === "json"
  );
  if (!jsonResource) return [];
  const dataRes = await fetchWithRetry(jsonResource.url);
  if (!dataRes.ok) return [];
  const rows = (await dataRes.json()) as EppoCurrentPriceRow[];
  return normalizeRows(Array.isArray(rows) ? rows : [], new Date());
}

function normalizeRows(
  rows: EppoCurrentPriceRow[],
  fallbackDate: Date
): NormalizedFuelPrice[] {
  const out: NormalizedFuelPrice[] = [];
  for (const row of rows) {
    const label = row.product || row.product_name || row.fuel || "";
    const fuelType = mapFuelLabel(label);
    if (!fuelType) continue;
    const rawPrice = row.price ?? row.retail_price;
    const price =
      typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice));
    if (!isFinite(price) || price <= 0) continue;
    const dateStr = row.effective_date || row.date;
    const effectiveDate = dateStr ? new Date(dateStr) : fallbackDate;
    if (isNaN(effectiveDate.getTime())) continue;
    effectiveDate.setUTCHours(0, 0, 0, 0);
    out.push({ fuelType, price, effectiveDate });
  }
  return dedupe(out);
}

function dedupe(items: NormalizedFuelPrice[]): NormalizedFuelPrice[] {
  const map = new Map<string, NormalizedFuelPrice>();
  for (const it of items) {
    const key = `${it.fuelType}|${it.effectiveDate.toISOString()}`;
    map.set(key, it);
  }
  return Array.from(map.values());
}

export async function fetchEppoPrices(): Promise<NormalizedFuelPrice[]> {
  const fromApi = await fetchEppoCurrentPrices().catch(() => []);
  if (fromApi.length > 0) return fromApi;
  return fetchEppoCkanRetailPrices().catch(() => []);
}
