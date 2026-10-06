import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Wallet, BarChart3, Calendar } from "lucide-react";
import { CATEGORY_LABELS } from "../../../drizzle/schema";
import type { ExpenseCategory } from "../../../drizzle/schema";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CATEGORY_COLORS: Record<string, string> = {
  escola_cursos: "oklch(0.78 0.12 65)",
  manutencao_imoveis: "oklch(0.70 0.16 160)",
  agua: "oklch(0.65 0.18 240)",
  luz: "oklch(0.78 0.16 80)",
  condominio: "oklch(0.70 0.16 300)",
  comida: "oklch(0.68 0.18 30)",
  faculdade: "oklch(0.65 0.18 340)",
  plano_saude: "oklch(0.70 0.20 25)",
  celular: "oklch(0.72 0.14 200)",
  academia: "oklch(0.68 0.16 120)",
  viagens: "oklch(0.72 0.12 180)",
  economias: "oklch(0.70 0.14 350)",
  outros: "oklch(0.60 0.10 260)",
};

const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const monthNamesShort = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-sm shadow-xl"
      style={{ background: "oklch(0.18 0.03 260)", border: "1px solid oklch(0.28 0.03 260)" }}>
      {label && <p className="font-semibold mb-1" style={{ color: "oklch(0.85 0.02 80)" }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill ?? "oklch(0.78 0.12 65)" }}>{fmt(p.value)}</p>
      ))}
    </div>
  );
};

function StatCard({ title, value, sub, icon: Icon, color, pct }: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; color: string; pct?: number;
}) {
  return (
    <div className="rounded-2xl p-5"
      style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {pct !== undefined && (
          <span className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ background: "oklch(0.78 0.12 65 / 0.12)", color: "oklch(0.82 0.10 70)" }}>
            {pct.toFixed(0)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 80)" }}>{value}</p>
      <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.02 260)" }}>{title}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.02 260)" }}>{sub}</p>}
    </div>
  );
}

export default function Resumo() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: summary, isLoading } = trpc.expenses.monthlySummary.useQuery({ year, month });
  const { data: profile } = trpc.userProfile.get.useQuery();

  const budget = profile?.monthlyBudget ? parseFloat(String(profile.monthlyBudget)) : 0;
  const total = summary?.totals.total ?? 0;
  const saldo = budget > 0 ? budget - total : null;
  const fixedPct = total > 0 ? ((summary?.totals.fixed ?? 0) / total) * 100 : 0;
  const variablePct = total > 0 ? ((summary?.totals.variable ?? 0) / total) * 100 : 0;

  const categoryChartData = useMemo(() => {
    if (!summary?.byCategory) return [];
    return summary.byCategory
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .map(d => ({
        name: CATEGORY_LABELS[d.category as ExpenseCategory] ?? d.category,
        value: d.total,
        fill: CATEGORY_COLORS[d.category] ?? "oklch(0.60 0.10 260)",
      }));
  }, [summary]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.95 0.01 80)" }}>
            Resumo Mensal
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.02 260)" }}>
            {monthNames[month - 1]} de {year}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
          <Calendar className="w-4 h-4" style={{ color: "oklch(0.55 0.02 260)" }} />
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="bg-transparent text-sm outline-none cursor-pointer"
            style={{ color: "oklch(0.80 0.02 80)" }}>
            {monthNamesShort.map((m, i) => (
              <option key={i} value={i + 1} style={{ background: "oklch(0.16 0.025 260)" }}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-transparent text-sm outline-none cursor-pointer"
            style={{ color: "oklch(0.80 0.02 80)" }}>
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y} style={{ background: "oklch(0.16 0.025 260)" }}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: "oklch(0.16 0.025 260)" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total do Mês" value={fmt(total)} icon={Wallet} color="oklch(0.78 0.12 65)" />
          <StatCard title="Gastos Fixos" value={fmt(summary?.totals.fixed ?? 0)} sub="Recorrentes"
            icon={TrendingDown} color="oklch(0.65 0.18 240)" pct={fixedPct} />
          <StatCard title="Gastos Variáveis" value={fmt(summary?.totals.variable ?? 0)} sub="Eventuais"
            icon={TrendingUp} color="oklch(0.65 0.18 340)" pct={variablePct} />
          <StatCard
            title={saldo !== null ? (saldo >= 0 ? "Saldo Disponível" : "Acima do Orçamento") : "Orçamento"}
            value={saldo !== null ? fmt(Math.abs(saldo)) : "Não definido"}
            sub={saldo !== null ? (saldo >= 0 ? "Dentro do orçamento" : "Excedido") : "Configure no perfil"}
            icon={BarChart3}
            color={saldo !== null ? (saldo >= 0 ? "oklch(0.70 0.16 160)" : "oklch(0.55 0.22 25)") : "oklch(0.60 0.10 260)"}
          />
        </div>
      )}

      {/* Fixed vs Variable bar */}
      {!isLoading && total > 0 && (
        <div className="rounded-2xl p-5"
          style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.75 0.02 80)" }}>
            Proporção: Fixos vs Variáveis
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.03 260)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${fixedPct}%`, background: "oklch(0.65 0.18 240)" }} />
            </div>
            <div className="flex items-center gap-4 text-xs flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.65 0.18 240)" }} />
                <span style={{ color: "oklch(0.65 0.02 260)" }}>Fixos {fixedPct.toFixed(0)}%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.65 0.18 340)" }} />
                <span style={{ color: "oklch(0.65 0.02 260)" }}>Variáveis {variablePct.toFixed(0)}%</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      <div className="rounded-2xl p-6"
        style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
        <h3 className="text-base font-semibold mb-5" style={{ color: "oklch(0.88 0.02 80)" }}>
          Gastos por Categoria
        </h3>

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-xl" style={{ background: "oklch(0.20 0.03 260)" }} />
        ) : categoryChartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm" style={{ color: "oklch(0.45 0.02 260)" }}>Nenhum lançamento neste período</p>
          </div>
        ) : (
          <div className="space-y-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryChartData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.025 260)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "oklch(0.50 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={130}
                  tick={{ fill: "oklch(0.60 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{
                  position: "right", formatter: (v: number) => fmt(v),
                  style: { fill: "oklch(0.65 0.02 260)", fontSize: 11 }
                }}>
                  {categoryChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Category list */}
            <div className="divider-gold" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categoryChartData.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ background: "oklch(0.18 0.025 260)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                    <span className="text-sm" style={{ color: "oklch(0.70 0.02 260)" }}>{d.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "oklch(0.50 0.02 260)" }}>
                      {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "oklch(0.85 0.08 70)" }}>
                      {fmt(d.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile comparison */}
      {!isLoading && (summary?.byProfile?.length ?? 0) > 0 && (
        <div className="rounded-2xl p-6"
          style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: "oklch(0.88 0.02 80)" }}>
            Comparativo por Perfil
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {summary?.byProfile.map(d => {
              const isHusband = d.profile === "husband";
              const pct = total > 0 ? (d.total / total) * 100 : 0;
              const color = isHusband ? "oklch(0.65 0.18 240)" : "oklch(0.65 0.18 340)";
              return (
                <div key={d.profile} className="rounded-xl p-4 space-y-3"
                  style={{ background: `${color}0d`, border: `1px solid ${color}25` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: `${color}25`, color }}>
                      {isHusband ? "M" : "E"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color }}>
                        {isHusband ? "Marido" : "Esposa"}
                      </p>
                      <p className="text-xs" style={{ color: "oklch(0.50 0.02 260)" }}>{pct.toFixed(1)}% do total</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold" style={{ color: "oklch(0.92 0.01 80)" }}>{fmt(d.total)}</p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.03 260)" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
