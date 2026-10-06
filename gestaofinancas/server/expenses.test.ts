import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  createExpense: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    profileType: "husband",
    description: "Mensalidade escola",
    amount: "500.00",
    category: "escola_cursos",
    expenseDate: new Date("2026-05-01"),
    expenseType: "fixed",
    notes: null,
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateExpense: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    profileType: "husband",
    description: "Mensalidade escola - atualizado",
    amount: "550.00",
    category: "escola_cursos",
    expenseDate: new Date("2026-05-01"),
    expenseType: "fixed",
    notes: null,
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  deleteExpense: vi.fn().mockResolvedValue({ success: true }),
  getExpenses: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      profileType: "husband",
      description: "Conta de luz",
      amount: "250.00",
      category: "luz",
      expenseDate: new Date("2026-05-10"),
      expenseType: "fixed",
      notes: null,
      isRecurring: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      userId: 2,
      profileType: "wife",
      description: "Academia",
      amount: "120.00",
      category: "academia",
      expenseDate: new Date("2026-05-05"),
      expenseType: "fixed",
      notes: null,
      isRecurring: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getMonthlySummary: vi.fn().mockResolvedValue({
    byCategory: [
      { category: "luz", total: 250 },
      { category: "academia", total: 120 },
    ],
    byProfile: [
      { profile: "husband", total: 250 },
      { profile: "wife", total: 120 },
    ],
    totals: { fixed: 370, variable: 0, total: 370 },
  }),
  getMonthlyTrend: vi.fn().mockResolvedValue([
    { month: 5, year: 2026, label: "mai/2026", husband: 250, wife: 120, total: 370 },
  ]),
  getAllExpensesForExport: vi.fn().mockResolvedValue([]),
  getUserProfile: vi.fn().mockResolvedValue(null),
  upsertUserProfile: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    profileType: "husband",
    displayName: "Carlos",
    avatarColor: "#6366f1",
    monthlyBudget: "5000.00",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getAllProfiles: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────

function makeCtx(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      loginMethod: "google",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("expenses.categories", () => {
  it("returns all 13 predefined categories", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const categories = await caller.expenses.categories();
    expect(categories).toHaveLength(13);
    expect(categories.map(c => c.value)).toContain("escola_cursos");
    expect(categories.map(c => c.value)).toContain("economias");
    expect(categories.map(c => c.value)).toContain("viagens");
  });

  it("includes label and icon for each category", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const categories = await caller.expenses.categories();
    for (const cat of categories) {
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeTruthy();
    }
  });
});

describe("expenses.create", () => {
  it("creates an expense with valid data", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.create({
      profileType: "husband",
      description: "Mensalidade escola",
      amount: 500,
      category: "escola_cursos",
      expenseDate: new Date("2026-05-01").getTime(),
      expenseType: "fixed",
    });
    expect(result).toBeDefined();
    expect(result?.description).toBe("Mensalidade escola");
  });

  it("rejects negative amount", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.expenses.create({
        profileType: "husband",
        description: "Test",
        amount: -100,
        category: "comida",
        expenseDate: Date.now(),
        expenseType: "variable",
      })
    ).rejects.toThrow();
  });

  it("rejects empty description", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.expenses.create({
        profileType: "wife",
        description: "",
        amount: 100,
        category: "comida",
        expenseDate: Date.now(),
        expenseType: "variable",
      })
    ).rejects.toThrow();
  });
});

describe("expenses.list", () => {
  it("returns list of expenses", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts profile filter", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.list({ profileType: "husband" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts month and year filter", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.list({ month: 5, year: 2026 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("expenses.monthlySummary", () => {
  it("returns summary with totals", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.monthlySummary({ year: 2026, month: 5 });
    expect(result.totals).toBeDefined();
    expect(result.totals.total).toBe(370);
    expect(result.totals.fixed).toBe(370);
    expect(result.totals.variable).toBe(0);
  });

  it("returns breakdown by category", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.monthlySummary({ year: 2026, month: 5 });
    expect(result.byCategory).toHaveLength(2);
    expect(result.byCategory[0].category).toBe("luz");
  });

  it("returns breakdown by profile", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.monthlySummary({ year: 2026, month: 5 });
    expect(result.byProfile).toHaveLength(2);
    const husband = result.byProfile.find(p => p.profile === "husband");
    expect(husband?.total).toBe(250);
  });
});

describe("expenses.delete", () => {
  it("deletes an expense by id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("userProfile.set", () => {
  it("creates a user profile", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.userProfile.set({
      profileType: "husband",
      displayName: "Carlos",
      monthlyBudget: 5000,
    });
    expect(result).toBeDefined();
    expect(result?.displayName).toBe("Carlos");
    expect(result?.profileType).toBe("husband");
  });

  it("rejects empty displayName", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.userProfile.set({ profileType: "husband", displayName: "" })
    ).rejects.toThrow();
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
