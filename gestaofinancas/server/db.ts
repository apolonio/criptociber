import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, expenses, userProfiles, InsertExpense, InsertUserProfile, type ExpenseCategory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserProfile(profile: InsertUserProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, profile.userId)).limit(1);
  if (existing.length > 0) {
    await db.update(userProfiles)
      .set({ profileType: profile.profileType, displayName: profile.displayName, avatarColor: profile.avatarColor, monthlyBudget: profile.monthlyBudget })
      .where(eq(userProfiles.userId, profile.userId));
    const updated = await db.select().from(userProfiles).where(eq(userProfiles.userId, profile.userId)).limit(1);
    return updated[0];
  } else {
    await db.insert(userProfiles).values(profile);
    const inserted = await db.select().from(userProfiles).where(eq(userProfiles.userId, profile.userId)).limit(1);
    return inserted[0];
  }
}

export async function getAllProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ profile: userProfiles, user: users })
    .from(userProfiles)
    .innerJoin(users, eq(userProfiles.userId, users.id));
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export interface ExpenseFilters {
  userId?: number;
  profileType?: "husband" | "wife";
  category?: ExpenseCategory;
  month?: number; // 1-12
  year?: number;
  startDate?: Date;
  endDate?: Date;
}

export async function getExpenses(filters: ExpenseFilters = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.userId !== undefined) conditions.push(eq(expenses.userId, filters.userId));
  if (filters.profileType) conditions.push(eq(expenses.profileType, filters.profileType));
  if (filters.category) conditions.push(eq(expenses.category, filters.category));

  if (filters.year && filters.month) {
    const start = new Date(filters.year, filters.month - 1, 1);
    const end = new Date(filters.year, filters.month, 0, 23, 59, 59);
    conditions.push(gte(expenses.expenseDate, start));
    conditions.push(lte(expenses.expenseDate, end));
  } else if (filters.year) {
    const start = new Date(filters.year, 0, 1);
    const end = new Date(filters.year, 11, 31, 23, 59, 59);
    conditions.push(gte(expenses.expenseDate, start));
    conditions.push(lte(expenses.expenseDate, end));
  }

  if (filters.startDate) conditions.push(gte(expenses.expenseDate, filters.startDate));
  if (filters.endDate) conditions.push(lte(expenses.expenseDate, filters.endDate));

  const query = db.select().from(expenses);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(expenses.expenseDate));
  }
  return query.orderBy(desc(expenses.expenseDate));
}

export async function createExpense(data: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(expenses).values(data);
  const result = await db.select().from(expenses)
    .where(and(eq(expenses.userId, data.userId), eq(expenses.description, data.description)))
    .orderBy(desc(expenses.createdAt)).limit(1);
  return result[0];
}

export async function updateExpense(id: number, userId: number, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(expenses).set(data).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
  const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return result[0];
}

export async function deleteExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
  return { success: true };
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getMonthlySummary(year: number, month: number, userId?: number, categories?: ExpenseCategory[]) {
  const db = await getDb();
  if (!db) return { byCategory: [], byProfile: [], totals: { fixed: 0, variable: 0, total: 0 } };

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const baseConditions = [gte(expenses.expenseDate, start), lte(expenses.expenseDate, end)];
  if (userId !== undefined) baseConditions.push(eq(expenses.userId, userId));
  if (categories && categories.length > 0) {
    baseConditions.push(sql`${expenses.category} IN (${sql.join(categories.map(c => sql`${c}`), sql`, `)})`);
  }
  const rows = await db.select().from(expenses)
    .where(and(...baseConditions));

  const byCategory: Record<string, number> = {};
  const byProfile: Record<string, number> = { husband: 0, wife: 0 };
  let fixed = 0;
  let variable = 0;

  for (const row of rows) {
    const amt = parseFloat(String(row.amount));
    byCategory[row.category] = (byCategory[row.category] ?? 0) + amt;
    byProfile[row.profileType] = (byProfile[row.profileType] ?? 0) + amt;
    if (row.expenseType === "fixed") fixed += amt;
    else variable += amt;
  }

  return {
    byCategory: Object.entries(byCategory).map(([category, total]) => ({ category, total })),
    byProfile: Object.entries(byProfile).map(([profile, total]) => ({ profile, total })),
    totals: { fixed, variable, total: fixed + variable },
  };
}

export async function getMonthlyTrend(year: number, months: number = 6, userId?: number, categories?: ExpenseCategory[]) {
  const db = await getDb();
  if (!db) return [];

  const results = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(year, new Date().getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const trendConditions = [gte(expenses.expenseDate, start), lte(expenses.expenseDate, end)];
    if (userId !== undefined) trendConditions.push(eq(expenses.userId, userId));
    if (categories && categories.length > 0) {
      trendConditions.push(sql`${expenses.category} IN (${sql.join(categories.map(c => sql`${c}`), sql`, `)})`);
    }
    const rows = await db.select().from(expenses)
      .where(and(...trendConditions));

    const husbandTotal = rows.filter(r => r.profileType === "husband").reduce((s, r) => s + parseFloat(String(r.amount)), 0);
    const wifeTotal = rows.filter(r => r.profileType === "wife").reduce((s, r) => s + parseFloat(String(r.amount)), 0);

    results.push({
      month: m,
      year: y,
      label: `${d.toLocaleString('pt-BR', { month: 'short' })}/${y}`,
      husband: husbandTotal,
      wife: wifeTotal,
      total: husbandTotal + wifeTotal,
    });
  }
  return results;
}

export async function getAllExpensesForExport(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId !== undefined) {
    return db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.expenseDate));
  }
  return db.select().from(expenses).orderBy(desc(expenses.expenseDate));
}
