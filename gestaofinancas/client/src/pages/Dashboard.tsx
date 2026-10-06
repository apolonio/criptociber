import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Calendar, RefreshCw, Filter, X, GraduationCap, Wrench, Droplets, Zap, Building2, ShoppingCart, BookOpen, Heart, Smartphone, Dumbbell, Plane, PiggyBank, MoreHorizontal } from "lucide-react";
import { CATEGORY_LABELS, EXPENSE_CATEGORIES } from "../../../drizzle/schema";
import type { ExpenseCategory } from "../../../drizzle/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "oklch(0.78 0.12 65)",
  "oklch(0.65 0.18 240)",
  "oklch(0.65 0.18 340)",
  "oklch(0.70 0.16 160)",
  "oklch(0.70 0.16 300)",
  "oklch(0.72 0.14 200)",
  "oklch(0.68 0.18 30)",
  "oklch(0.68 0.16 120)",
  "oklch(0.65 0.20 280)",
  "oklch(0.70 0.14 350)",
  "oklch(0.72 0.12 180)",
  "oklch(0.68 0.18 50)",
  "oklch(0.60 0.10 260)",
];

const CATEGORY_ICON_MAP: Record<ExpenseCategory, React.ElementType> = {
  escola_cursos: GraduationCap,
  manutencao_imoveis: Wrench,
  agua: Droplets,
  luz: Zap,
  condominio: Building2,
  comida: ShoppingCart,
  faculdade: BookOpen,
  plano_saude: Heart,
  celular: Smartphone,
  academia: Dumbbell,
  viagens: Plane,
  economias: PiggyBank,
  outros: MoreHorizontal,
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-sm shadow-xl"
      style={{ background: "oklch(0.18 0.03 260)", border: "1px solid oklch(0.28 0.03 260)" }}>
      {label && <p className="font-semibold mb-1" style={{ color: "oklch(0.85 0.02 80)" }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? "oklch(0.78 0.12 65)" }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl px-4 py-3 text-sm shadow-xl"
      style={{ background: "oklch(0.18 0.03 260)", border: "1px solid oklch(0.28 0.03 260)" }}>
      <p className="font-semibold" style={{ color: d.payload.fill }}>{d.name}</p>
      <p style={{ color: "oklch(0.85 0.02 80)" }}>{fmt(d.value)}</p>
      <p style={{ color: "oklch(0.55 0.02 260)" }}>{d.payload.percent?.toFixed(1)}%</p>
    </div>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-2xl p-5 space-y-3"
      style={{
        background: "oklch(0.16 0.025 260)",
        border: "1px solid oklch(0.22 0.03 260)",
        boxShadow: "0 4px 24px oklch(0 0 0 / 0.3)"
      }}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && trend !== "neutral" && (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{
              background: trend === "up" ? "oklch(0.55 0.22 25 / 0.15)" : "oklch(0.70 0.16 160 / 0.15)",
              color: trend === "up" ? "oklch(0.70 0.20 25)" : "oklch(0.75 0.14 160)",
            }}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 80)" }}>{value}</p>
        <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.02 260)" }}>{title}</p>
        {subtitle && <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.02 260)" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Category Filter Chip ──────────────────────────────────────────────────────

function CategoryChip({
  category,
  selected,
  onClick,
  color,
}: {
  category: ExpenseCategory;
  selected: boolean;
  onClick: () => void;
  color: string;
}) {
  const Icon = CATEGORY_ICON_MAP[category];
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
      style={{
        background: selected ? `${color}25` : "oklch(0.16 0.025 260)",
        border: selected ? `1px solid ${color}60` : "1px solid oklch(0.22 0.03 260)",
        color: selected ? color : "oklch(0.55 0.02 260)",
        transform: selected ? "scale(1.03)" : "scale(1)",
        boxShadow: selected ? `0 0 10px ${color}20` : "none",
      }}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{CATEGORY_LABELS[category]}</span>
    </button>
  );
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedCategories, setSelectedCategories] = useState<ExpenseCategory[]>([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  const toggleCategory = (cat: ExpenseCategory) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearCategories = () => setSelectedCategories([]);

  const { data, isLoading, refetch } = trpc.expenses.dashboardData.useQuery({
    year,
    month,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
  });

  const summary = data?.summary;
  const trend = data?.trend ?? [];

  const pieData = useMemo(() => {
    if (!summary?.byCategory) return [];
    const total = summary.totals.total || 1;
    return summary.byCategory
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((d, i) => ({
        name: CATEGORY_LABELS[d.category as ExpenseCategory] ?? d.category,
        value: d.total,
        fill: CHART_COLORS[i % CHART_COLORS.length],
        percent: (d.total / total) * 100,
      }));
  }, [summary]);

  const profileData = useMemo(() => {
    if (!summary?.byProfile) return [];
    return summary.byProfile.map(d => ({
      name: d.profile === "husband" ? "Marido" : "Esposa",
      value: d.total,
      fill: d.profile === "husband" ? "oklch(0.65 0.18 240)" : "oklch(0.65 0.18 340)",
    }));
  }, [summary]);

  const trendData = useMemo(() => trend.map(t => ({
    name: t.label,
    Marido: t.husband,
    Esposa: t.wife,
    Total: t.total,
  })), [trend]);

  const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const hasFilter = selectedCategories.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.95 0.01 80)" }}>
            Dashboard Financeiro
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.02 260)" }}>
            Visão geral das finanças familiares
            {hasFilter && (
              <span className="ml-2 font-medium" style={{ color: "oklch(0.78 0.12 65)" }}>
                · {selectedCategories.length} {selectedCategories.length === 1 ? "categoria" : "categorias"} selecionada{selectedCategories.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Category filter toggle */}
          <button
            onClick={() => setShowCategoryFilter(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
            style={{
              background: hasFilter ? "oklch(0.78 0.12 65 / 0.15)" : "oklch(0.16 0.025 260)",
              border: hasFilter ? "1px solid oklch(0.78 0.12 65 / 0.5)" : "1px solid oklch(0.22 0.03 260)",
              color: hasFilter ? "oklch(0.78 0.12 65)" : "oklch(0.65 0.02 260)",
            }}
          >
            <Filter className="w-4 h-4" />
            <span>Categorias</span>
            {hasFilter && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                style={{ background: "oklch(0.78 0.12 65)", color: "oklch(0.12 0.02 260)" }}>
                {selectedCategories.length}
              </span>
            )}
          </button>

          {hasFilter && (
            <button
              onClick={clearCategories}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={{
                background: "oklch(0.55 0.22 25 / 0.12)",
                border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                color: "oklch(0.70 0.20 25)",
              }}
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}

          {/* Month/Year selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
            <Calendar className="w-4 h-4" style={{ color: "oklch(0.55 0.02 260)" }} />
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="bg-transparent text-sm outline-none cursor-pointer"
              style={{ color: "oklch(0.80 0.02 80)" }}
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1} style={{ background: "oklch(0.16 0.025 260)" }}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="bg-transparent text-sm outline-none cursor-pointer"
              style={{ color: "oklch(0.80 0.02 80)" }}
            >
              {[2023, 2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} style={{ background: "oklch(0.16 0.025 260)" }}>{y}</option>
              ))}
            </select>
          </div>

          <button onClick={() => refetch()} className="p-2.5 rounded-xl transition-all hover:bg-white/5"
            style={{ border: "1px solid oklch(0.22 0.03 260)" }}>
            <RefreshCw className="w-4 h-4" style={{ color: "oklch(0.55 0.02 260)" }} />
          </button>
        </div>
      </div>

      {/* Category filter panel */}
      {showCategoryFilter && (
        <div className="rounded-2xl p-5"
          style={{
            background: "oklch(0.14 0.025 260)",
            border: "1px solid oklch(0.22 0.03 260)",
            boxShadow: "0 4px 24px oklch(0 0 0 / 0.3)"
          }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: "oklch(0.78 0.12 65)" }} />
              <p className="text-sm font-semibold" style={{ color: "oklch(0.88 0.02 80)" }}>
                Filtrar por Categoria
              </p>
              <span className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
                — clique para selecionar uma ou mais
              </span>
            </div>
            {hasFilter && (
              <button
                onClick={clearCategories}
                className="text-xs px-2 py-1 rounded-lg transition-all"
                style={{ color: "oklch(0.65 0.02 260)", border: "1px solid oklch(0.22 0.03 260)" }}
              >
                Limpar seleção
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((cat, i) => (
              <CategoryChip
                key={cat}
                category={cat}
                selected={selectedCategories.includes(cat)}
                onClick={() => toggleCategory(cat)}
                color={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </div>
          {hasFilter && (
            <div className="mt-4 pt-4 flex items-center gap-2 flex-wrap"
              style={{ borderTop: "1px solid oklch(0.20 0.025 260)" }}>
              <span className="text-xs" style={{ color: "oklch(0.55 0.02 260)" }}>Selecionadas:</span>
              {selectedCategories.map((cat, i) => (
                <span key={cat} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${CHART_COLORS[EXPENSE_CATEGORIES.indexOf(cat) % CHART_COLORS.length]}20`,
                    color: CHART_COLORS[EXPENSE_CATEGORIES.indexOf(cat) % CHART_COLORS.length],
                    border: `1px solid ${CHART_COLORS[EXPENSE_CATEGORIES.indexOf(cat) % CHART_COLORS.length]}40`,
                  }}>
                  {CATEGORY_LABELS[cat]}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse"
              style={{ background: "oklch(0.16 0.025 260)" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total do Mês"
            value={fmt(summary?.totals.total ?? 0)}
            subtitle={hasFilter ? `${selectedCategories.length} categoria(s)` : `${monthNames[month - 1]} ${year}`}
            icon={Wallet}
            color="oklch(0.78 0.12 65)"
          />
          <SummaryCard
            title="Gastos Fixos"
            value={fmt(summary?.totals.fixed ?? 0)}
            subtitle="Recorrentes"
            icon={RefreshCw}
            color="oklch(0.65 0.18 240)"
          />
          <SummaryCard
            title="Gastos Variáveis"
            value={fmt(summary?.totals.variable ?? 0)}
            subtitle="Eventuais"
            icon={TrendingUp}
            color="oklch(0.65 0.18 340)"
          />
          <SummaryCard
            title={hasFilter ? "Categorias Filtradas" : "Categorias"}
            value={String(hasFilter ? selectedCategories.length : pieData.length)}
            subtitle={hasFilter ? "com filtro ativo" : "com lançamentos"}
            icon={Filter}
            color={hasFilter ? "oklch(0.78 0.12 65)" : "oklch(0.70 0.16 160)"}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart - by category */}
        <div className="rounded-2xl p-6"
          style={{
            background: "oklch(0.16 0.025 260)",
            border: "1px solid oklch(0.22 0.03 260)",
            boxShadow: "0 4px 24px oklch(0 0 0 / 0.3)"
          }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: "oklch(0.88 0.02 80)" }}>
              Gastos por Categoria
            </h3>
            {hasFilter && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.78 0.12 65 / 0.15)", color: "oklch(0.78 0.12 65)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
                Filtrado
              </span>
            )}
          </div>
          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm" style={{ color: "oklch(0.45 0.02 260)" }}>
                {hasFilter ? "Nenhum lançamento nas categorias selecionadas" : "Nenhum lançamento neste período"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                    <span className="truncate" style={{ color: "oklch(0.65 0.02 260)" }}>{d.name}</span>
                    <span className="ml-auto font-medium flex-shrink-0" style={{ color: "oklch(0.80 0.02 80)" }}>
                      {d.percent.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar chart - husband vs wife */}
        <div className="rounded-2xl p-6"
          style={{
            background: "oklch(0.16 0.025 260)",
            border: "1px solid oklch(0.22 0.03 260)",
            boxShadow: "0 4px 24px oklch(0 0 0 / 0.3)"
          }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: "oklch(0.88 0.02 80)" }}>
              Comparativo: Marido vs Esposa
            </h3>
            {hasFilter && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.78 0.12 65 / 0.15)", color: "oklch(0.78 0.12 65)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
                Filtrado
              </span>
            )}
          </div>
          {profileData.length === 0 || profileData.every(d => d.value === 0) ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm" style={{ color: "oklch(0.45 0.02 260)" }}>
                {hasFilter ? "Nenhum lançamento nas categorias selecionadas" : "Nenhum lançamento neste período"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={profileData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.03 260)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Total" radius={[6, 6, 0, 0]}>
                    {profileData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3">
                {profileData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: `${d.fill}15`,
                      border: `1px solid ${d.fill}30`,
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: `${d.fill}25`, color: d.fill }}>
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "oklch(0.55 0.02 260)" }}>{d.name}</p>
                      <p className="text-sm font-semibold" style={{ color: d.fill }}>{fmt(d.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly trend chart */}
      <div className="rounded-2xl p-6"
        style={{
          background: "oklch(0.16 0.025 260)",
          border: "1px solid oklch(0.22 0.03 260)",
          boxShadow: "0 4px 24px oklch(0 0 0 / 0.3)"
        }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: "oklch(0.88 0.02 80)" }}>
            Evolução dos Últimos 6 Meses
          </h3>
          {hasFilter && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "oklch(0.78 0.12 65 / 0.15)", color: "oklch(0.78 0.12 65)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
              Filtrado
            </span>
          )}
        </div>
        {trendData.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm" style={{ color: "oklch(0.45 0.02 260)" }}>Sem dados históricos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.025 260)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span style={{ color: "oklch(0.65 0.02 260)", fontSize: 12 }}>{value}</span>}
              />
              <Bar dataKey="Marido" fill="oklch(0.65 0.18 240)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Esposa" fill="oklch(0.65 0.18 340)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
