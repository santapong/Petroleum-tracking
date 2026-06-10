import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  isValidDate,
  safeParseFloat,
  validateStation,
  validateDelivery,
  validatePrice,
  validateInventoryUpdate,
  FUEL_TYPES,
  DELIVERY_STATUSES,
  STATION_STATUSES,
  DEFAULT_TANK_CAPACITY,
} from "../validations";

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toEqual({ valid: true });
    expect(validateEmail("admin@petroleum.th")).toEqual({ valid: true });
    expect(validateEmail("test.user+tag@domain.co")).toEqual({ valid: true });
  });

  it("rejects empty or missing email", () => {
    expect(validateEmail("")).toEqual({ valid: false, error: "Email is required" });
    expect(validateEmail(null as unknown as string)).toEqual({ valid: false, error: "Email is required" });
    expect(validateEmail(undefined as unknown as string)).toEqual({ valid: false, error: "Email is required" });
  });

  it("rejects invalid email formats", () => {
    expect(validateEmail("not-an-email")).toEqual({ valid: false, error: "Invalid email format" });
    expect(validateEmail("@domain.com")).toEqual({ valid: false, error: "Invalid email format" });
    expect(validateEmail("user@")).toEqual({ valid: false, error: "Invalid email format" });
    expect(validateEmail("user @domain.com")).toEqual({ valid: false, error: "Invalid email format" });
  });
});

describe("validatePassword", () => {
  it("accepts strong passwords", () => {
    const result = validatePassword("SecurePass1");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty password", () => {
    const result = validatePassword("");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password is required");
  });

  it("rejects short passwords", () => {
    const result = validatePassword("Ab1");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password must be at least 8 characters");
  });

  it("rejects passwords without uppercase", () => {
    const result = validatePassword("lowercase1");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password must contain at least one uppercase letter");
  });

  it("rejects passwords without lowercase", () => {
    const result = validatePassword("UPPERCASE1");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password must contain at least one lowercase letter");
  });

  it("rejects passwords without digits", () => {
    const result = validatePassword("NoDigitsHere");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password must contain at least one digit");
  });

  it("returns multiple errors for very weak passwords", () => {
    const result = validatePassword("abc");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("isValidDate", () => {
  it("accepts valid date strings", () => {
    expect(isValidDate("2024-01-15")).toBe(true);
    expect(isValidDate("2024-01-15T10:30:00Z")).toBe(true);
    expect(isValidDate("Jan 15, 2024")).toBe(true);
  });

  it("rejects invalid dates", () => {
    expect(isValidDate("not-a-date")).toBe(false);
    expect(isValidDate("")).toBe(false);
    expect(isValidDate(null as unknown as string)).toBe(false);
    expect(isValidDate(undefined as unknown as string)).toBe(false);
  });
});

describe("safeParseFloat", () => {
  it("parses valid numbers", () => {
    expect(safeParseFloat(42)).toBe(42);
    expect(safeParseFloat("3.14")).toBe(3.14);
    expect(safeParseFloat("100")).toBe(100);
    expect(safeParseFloat(0)).toBe(0);
  });

  it("returns null for invalid values", () => {
    expect(safeParseFloat("not-a-number")).toBeNull();
    expect(safeParseFloat(null)).toBeNull();
    expect(safeParseFloat(undefined)).toBeNull();
    expect(safeParseFloat("")).toBeNull();
  });

  it("handles NaN", () => {
    expect(safeParseFloat(NaN)).toBeNull();
  });
});

describe("validateStation", () => {
  const validStation = {
    name: "PTT Station Bangkok",
    address: "123 Sukhumvit Road",
    provinceId: "prov123",
  };

  it("accepts valid station data", () => {
    const result = validateStation(validStation);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("accepts station with optional fields", () => {
    const result = validateStation({
      ...validStation,
      latitude: 13.7563,
      longitude: 100.5018,
      status: "ACTIVE",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing name", () => {
    const result = validateStation({ ...validStation, name: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it("rejects missing address", () => {
    const result = validateStation({ ...validStation, address: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.address).toBeDefined();
  });

  it("rejects missing provinceId", () => {
    const result = validateStation({ ...validStation, provinceId: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.provinceId).toBeDefined();
  });

  it("rejects invalid latitude", () => {
    const result = validateStation({ ...validStation, latitude: 91 });
    expect(result.valid).toBe(false);
    expect(result.errors.latitude).toBeDefined();
  });

  it("rejects invalid longitude", () => {
    const result = validateStation({ ...validStation, longitude: 181 });
    expect(result.valid).toBe(false);
    expect(result.errors.longitude).toBeDefined();
  });

  it("rejects NaN latitude", () => {
    const result = validateStation({ ...validStation, latitude: "abc" });
    expect(result.valid).toBe(false);
    expect(result.errors.latitude).toBeDefined();
  });

  it("rejects invalid station status", () => {
    const result = validateStation({ ...validStation, status: "INVALID" });
    expect(result.valid).toBe(false);
    expect(result.errors.status).toBeDefined();
  });
});

describe("validateDelivery", () => {
  const validDelivery = {
    depotId: "depot1",
    stationId: "station1",
    fuelType: "DIESEL",
    quantity: 5000,
    scheduledDate: "2024-06-15",
  };

  it("accepts valid delivery data", () => {
    const result = validateDelivery(validDelivery);
    expect(result.valid).toBe(true);
  });

  it("rejects missing depotId", () => {
    const result = validateDelivery({ ...validDelivery, depotId: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.depotId).toBeDefined();
  });

  it("rejects missing stationId", () => {
    const result = validateDelivery({ ...validDelivery, stationId: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.stationId).toBeDefined();
  });

  it("rejects invalid fuel type", () => {
    const result = validateDelivery({ ...validDelivery, fuelType: "ROCKET_FUEL" });
    expect(result.valid).toBe(false);
    expect(result.errors.fuelType).toBeDefined();
  });

  it("rejects zero quantity", () => {
    const result = validateDelivery({ ...validDelivery, quantity: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.quantity).toBeDefined();
  });

  it("rejects negative quantity", () => {
    const result = validateDelivery({ ...validDelivery, quantity: -100 });
    expect(result.valid).toBe(false);
    expect(result.errors.quantity).toBeDefined();
  });

  it("rejects invalid date", () => {
    const result = validateDelivery({ ...validDelivery, scheduledDate: "not-a-date" });
    expect(result.valid).toBe(false);
    expect(result.errors.scheduledDate).toBeDefined();
  });
});

describe("validatePrice", () => {
  const validPrice = {
    fuelType: "DIESEL",
    price: 29.94,
    effectiveDate: "2024-06-15",
  };

  it("accepts valid price data", () => {
    const result = validatePrice(validPrice);
    expect(result.valid).toBe(true);
  });

  it("rejects invalid fuel type", () => {
    const result = validatePrice({ ...validPrice, fuelType: "WATER" });
    expect(result.valid).toBe(false);
    expect(result.errors.fuelType).toBeDefined();
  });

  it("rejects zero price", () => {
    const result = validatePrice({ ...validPrice, price: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.price).toBeDefined();
  });

  it("rejects negative price", () => {
    const result = validatePrice({ ...validPrice, price: -10 });
    expect(result.valid).toBe(false);
    expect(result.errors.price).toBeDefined();
  });

  it("rejects invalid date", () => {
    const result = validatePrice({ ...validPrice, effectiveDate: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.effectiveDate).toBeDefined();
  });
});

describe("validateInventoryUpdate", () => {
  const validInventory = {
    stationId: "station1",
    fuelType: "DIESEL",
    quantity: 10000,
  };

  it("accepts valid inventory data", () => {
    const result = validateInventoryUpdate(validInventory);
    expect(result.valid).toBe(true);
  });

  it("accepts zero quantity", () => {
    const result = validateInventoryUpdate({ ...validInventory, quantity: 0 });
    expect(result.valid).toBe(true);
  });

  it("rejects missing stationId", () => {
    const result = validateInventoryUpdate({ ...validInventory, stationId: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.stationId).toBeDefined();
  });

  it("rejects invalid fuel type", () => {
    const result = validateInventoryUpdate({ ...validInventory, fuelType: "KEROSENE" });
    expect(result.valid).toBe(false);
    expect(result.errors.fuelType).toBeDefined();
  });

  it("rejects negative quantity", () => {
    const result = validateInventoryUpdate({ ...validInventory, quantity: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors.quantity).toBeDefined();
  });

  it("accepts a valid capacity", () => {
    const result = validateInventoryUpdate({ ...validInventory, capacity: 50000 });
    expect(result.valid).toBe(true);
  });

  it("accepts missing capacity", () => {
    const result = validateInventoryUpdate({ ...validInventory, capacity: "" });
    expect(result.valid).toBe(true);
  });

  it("rejects zero or negative capacity", () => {
    expect(validateInventoryUpdate({ ...validInventory, capacity: 0 }).valid).toBe(false);
    expect(validateInventoryUpdate({ ...validInventory, capacity: -100 }).valid).toBe(false);
  });

  it("rejects non-numeric capacity", () => {
    const result = validateInventoryUpdate({ ...validInventory, capacity: "abc" });
    expect(result.valid).toBe(false);
    expect(result.errors.capacity).toBeDefined();
  });
});

describe("Constants", () => {
  it("has 8 fuel types", () => {
    expect(FUEL_TYPES).toHaveLength(8);
    expect(FUEL_TYPES).toContain("DIESEL");
    expect(FUEL_TYPES).toContain("NGV");
  });

  it("has 4 delivery statuses", () => {
    expect(DELIVERY_STATUSES).toHaveLength(4);
    expect(DELIVERY_STATUSES).toContain("DELIVERED");
  });

  it("has 3 station statuses", () => {
    expect(STATION_STATUSES).toHaveLength(3);
    expect(STATION_STATUSES).toContain("ACTIVE");
  });

  it("has default tank capacity", () => {
    expect(DEFAULT_TANK_CAPACITY).toBe(50000);
  });
});
