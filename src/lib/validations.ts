export const FUEL_TYPES = [
  "DIESEL",
  "DIESEL_B7",
  "GASOHOL_91",
  "GASOHOL_95",
  "GASOHOL_E20",
  "GASOHOL_E85",
  "LPG",
  "NGV",
] as const;

export const DELIVERY_STATUSES = [
  "SCHEDULED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
] as const;

export const STATION_STATUSES = ["ACTIVE", "INACTIVE", "MAINTENANCE"] as const;

export const DEFAULT_TANK_CAPACITY = 50000;

export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true };
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!password || typeof password !== "string") {
    return { valid: false, errors: ["Password is required"] };
  }
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one digit");
  }
  return { valid: errors.length === 0, errors };
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function safeParseFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return isNaN(num) ? null : num;
}

export function validateStation(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    errors.name = "Station name is required";
  }
  if (
    !data.address ||
    typeof data.address !== "string" ||
    !data.address.trim()
  ) {
    errors.address = "Address is required";
  }
  if (!data.provinceId || typeof data.provinceId !== "string") {
    errors.provinceId = "Province is required";
  }
  if (data.latitude !== undefined && data.latitude !== null) {
    const lat = safeParseFloat(data.latitude);
    if (lat === null || lat < -90 || lat > 90) {
      errors.latitude = "Latitude must be between -90 and 90";
    }
  }
  if (data.longitude !== undefined && data.longitude !== null) {
    const lng = safeParseFloat(data.longitude);
    if (lng === null || lng < -180 || lng > 180) {
      errors.longitude = "Longitude must be between -180 and 180";
    }
  }
  if (data.status && !STATION_STATUSES.includes(data.status as never)) {
    errors.status = "Invalid station status";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateDelivery(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.depotId || typeof data.depotId !== "string") {
    errors.depotId = "Depot is required";
  }
  if (!data.stationId || typeof data.stationId !== "string") {
    errors.stationId = "Station is required";
  }
  if (!data.fuelType || !FUEL_TYPES.includes(data.fuelType as never)) {
    errors.fuelType = "Valid fuel type is required";
  }
  const qty = safeParseFloat(data.quantity);
  if (qty === null || qty <= 0) {
    errors.quantity = "Quantity must be greater than 0";
  }
  if (!data.scheduledDate || !isValidDate(String(data.scheduledDate))) {
    errors.scheduledDate = "Valid scheduled date is required";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePrice(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.fuelType || !FUEL_TYPES.includes(data.fuelType as never)) {
    errors.fuelType = "Valid fuel type is required";
  }
  const price = safeParseFloat(data.price);
  if (price === null || price <= 0) {
    errors.price = "Price must be greater than 0";
  }
  if (
    !data.effectiveDate ||
    !isValidDate(String(data.effectiveDate))
  ) {
    errors.effectiveDate = "Valid effective date is required";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateInventoryUpdate(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.stationId || typeof data.stationId !== "string") {
    errors.stationId = "Station is required";
  }
  if (!data.fuelType || !FUEL_TYPES.includes(data.fuelType as never)) {
    errors.fuelType = "Valid fuel type is required";
  }
  const qty = safeParseFloat(data.quantity);
  if (qty === null || qty < 0) {
    errors.quantity = "Quantity must be 0 or greater";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
