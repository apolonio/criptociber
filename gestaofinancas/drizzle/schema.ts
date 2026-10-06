import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Perfil do usuário no sistema familiar (marido ou esposa)
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileType: mysqlEnum("profileType", ["husband", "wife"]).notNull(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  avatarColor: varchar("avatarColor", { length: 16 }).default("#6366f1").notNull(),
  monthlyBudget: decimal("monthlyBudget", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// Categorias de gastos (fixas no sistema)
export const EXPENSE_CATEGORIES = [
  "escola_cursos",
  "manutencao_imoveis",
  "agua",
  "luz",
  "condominio",
  "comida",
  "faculdade",
  "plano_saude",
  "celular",
  "academia",
  "viagens",
  "economias",
  "outros",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  escola_cursos: "Escola / Cursos",
  manutencao_imoveis: "Manutenção de Imóveis",
  agua: "Água",
  luz: "Luz",
  condominio: "Condomínio",
  comida: "Comida",
  faculdade: "Faculdade",
  plano_saude: "Plano de Saúde",
  celular: "Celular",
  academia: "Academia",
  viagens: "Viagens",
  economias: "Economias",
  outros: "Outros",
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  escola_cursos: "GraduationCap",
  manutencao_imoveis: "Wrench",
  agua: "Droplets",
  luz: "Zap",
  condominio: "Building2",
  comida: "ShoppingCart",
  faculdade: "BookOpen",
  plano_saude: "Heart",
  celular: "Smartphone",
  academia: "Dumbbell",
  viagens: "Plane",
  economias: "PiggyBank",
  outros: "MoreHorizontal",
};

// Tabela principal de gastos
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileType: mysqlEnum("profileType", ["husband", "wife"]).notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: mysqlEnum("category", EXPENSE_CATEGORIES).notNull(),
  expenseDate: timestamp("expenseDate").notNull(),
  expenseType: mysqlEnum("expenseType", ["fixed", "variable"]).notNull().default("variable"),
  notes: text("notes"),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
