import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createExpense,
  deleteExpense,
  getAllExpensesForExport,
  getAllProfiles,
  getExpenses,
  getMonthlySummary,
  getMonthlyTrend,
  getUserProfile,
  updateExpense,
  upsertUserProfile,
} from "./db";
import { EXPENSE_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from "../drizzle/schema";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileTypeSchema = z.enum(["husband", "wife"]);
const categorySchema = z.enum(EXPENSE_CATEGORIES);
const expenseTypeSchema = z.enum(["fixed", "variable"]);

const expenseCreateSchema = z.object({
  profileType: profileTypeSchema,
  description: z.string().min(1).max(512),
  amount: z.number().positive(),
  category: categorySchema,
  expenseDate: z.number(), // Unix timestamp ms
  expenseType: expenseTypeSchema,
  notes: z.string().max(2000).optional(),
  isRecurring: z.boolean().optional(),
});

const expenseUpdateSchema = expenseCreateSchema.partial().extend({
  id: z.number().int().positive(),
});

const expenseFiltersSchema = z.object({
  profileType: profileTypeSchema.optional(),
  category: categorySchema.optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});

// ─── Routers ──────────────────────────────────────────────────────────────────

const userProfileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getUserProfile(ctx.user.id);
    return profile ?? null;
  }),

  set: protectedProcedure
    .input(z.object({
      profileType: profileTypeSchema,
      displayName: z.string().min(1).max(128),
      avatarColor: z.string().optional(),
      monthlyBudget: z.number().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return upsertUserProfile({
        userId: ctx.user.id,
        profileType: input.profileType,
        displayName: input.displayName,
        avatarColor: input.avatarColor ?? "#6366f1",
        monthlyBudget: input.monthlyBudget?.toString() ?? "0.00",
      });
    }),

  getAllProfiles: protectedProcedure.query(async () => {
    return getAllProfiles();
  }),
});

const expensesRouter = router({
  list: protectedProcedure
    .input(expenseFiltersSchema)
    .query(async ({ ctx, input }) => {
      return getExpenses({
        userId: ctx.user.id,
        profileType: input.profileType,
        category: input.category,
        month: input.month,
        year: input.year,
      });
    }),

  create: protectedProcedure
    .input(expenseCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return createExpense({
        userId: ctx.user.id,
        profileType: input.profileType,
        description: input.description,
        amount: input.amount.toString(),
        category: input.category,
        expenseDate: new Date(input.expenseDate),
        expenseType: input.expenseType,
        notes: input.notes ?? null,
        isRecurring: input.isRecurring ?? false,
      });
    }),

  update: protectedProcedure
    .input(expenseUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.profileType !== undefined) updateData.profileType = data.profileType;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = data.amount.toString();
      if (data.category !== undefined) updateData.category = data.category;
      if (data.expenseDate !== undefined) updateData.expenseDate = new Date(data.expenseDate);
      if (data.expenseType !== undefined) updateData.expenseType = data.expenseType;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
      return updateExpense(id, ctx.user.id, updateData as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return deleteExpense(input.id, ctx.user.id);
    }),

  monthlySummary: protectedProcedure
    .input(z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }))
    .query(async ({ ctx, input }) => {
      return getMonthlySummary(input.year, input.month, ctx.user.id);
    }),

  monthlyTrend: protectedProcedure
    .input(z.object({ year: z.number().int(), months: z.number().int().min(1).max(12).optional() }))
    .query(async ({ ctx, input }) => {
      return getMonthlyTrend(input.year, input.months ?? 6, ctx.user.id);
    }),

  dashboardData: protectedProcedure
    .input(z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      categories: z.array(categorySchema).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const [summary, trend] = await Promise.all([
        getMonthlySummary(input.year, input.month, ctx.user.id, input.categories),
        getMonthlyTrend(input.year, 6, ctx.user.id, input.categories),
      ]);
      return { summary, trend };
    }),

  exportData: protectedProcedure.query(async ({ ctx }) => {
    const rows = await getAllExpensesForExport(ctx.user.id);
    return rows.map(r => ({
      id: r.id,
      profileType: r.profileType,
      description: r.description,
      amount: parseFloat(String(r.amount)),
      category: CATEGORY_LABELS[r.category] ?? r.category,
      expenseDate: r.expenseDate.toISOString().split("T")[0],
      expenseType: r.expenseType === "fixed" ? "Fixo" : "Variável",
      notes: r.notes ?? "",
      isRecurring: r.isRecurring ? "Sim" : "Não",
      createdAt: r.createdAt.toISOString(),
    }));
  }),

  categories: publicProcedure.query(() => {
    return EXPENSE_CATEGORIES.map(cat => ({
      value: cat,
      label: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat],
    }));
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  userProfile: userProfileRouter,
  expenses: expensesRouter,
});

export type AppRouter = typeof appRouter;
