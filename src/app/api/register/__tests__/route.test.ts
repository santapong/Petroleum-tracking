import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

import { POST } from "../route";
import { prisma } from "@/lib/prisma";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if name is missing", async () => {
    const res = await POST(makeRequest({ email: "test@example.com", password: "Secure123" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Name is required");
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ name: "Test", email: "not-email", password: "Secure123" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid email format");
  });

  it("returns 400 for weak password", async () => {
    const res = await POST(makeRequest({ name: "Test", email: "test@example.com", password: "weak" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid password");
    expect(data.details).toBeDefined();
    expect(data.details.length).toBeGreaterThan(0);
  });

  it("returns 400 if user already exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "existing",
      email: "test@example.com",
      name: "Existing",
      password: "hash",
      role: "USER",
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await POST(makeRequest({ name: "Test", email: "test@example.com", password: "Secure123" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("User already exists");
  });

  it("creates user successfully with valid data", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new-user-id",
      name: "Test User",
      email: "test@example.com",
      password: "hashed_password",
      role: "USER",
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await POST(makeRequest({ name: "Test User", email: "test@example.com", password: "Secure123" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("new-user-id");
    expect(data.email).toBe("test@example.com");
    expect(data.name).toBe("Test User");
  });
});
