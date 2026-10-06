import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Pencil, Trash2, Filter, Search, Calendar,
  ChevronDown, X, Check, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES, CATEGORY_LABELS } from "../../../drizzle/schema";
import type { ExpenseCategory } from "../../../drizzle/schema";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ─── Form schema ──────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  profileType: z.enum(["husband", "wife"]),
  description: z.string().min(1, "Descrição obrigatória").max(512),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  category: z.enum(EXPENSE_CATEGORIES),
  expenseDate: z.string().min(1, "Data obrigatória"),
  expenseType: z.enum(["fixed", "variable"]),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

// ─── Expense Form Modal ────────────────────────────────────────────────────────

function ExpenseModal({
  open, onClose, editingExpense
}: {
  open: boolean;
  onClose: () => void;
  editingExpense?: any;
}) {
  const utils = trpc.useUtils();
  const isEditing = !!editingExpense;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(expenseSchema),
    defaultValues: editingExpense ? {
      profileType: editingExpense.profileType,
      description: editingExpense.description,
      amount: parseFloat(String(editingExpense.amount)),
      category: editingExpense.category,
      expenseDate: new Date(editingExpense.expenseDate).toISOString().split("T")[0],
      expenseType: editingExpense.expenseType,
      notes: editingExpense.notes ?? "",
      isRecurring: editingExpense.isRecurring,
    } : {
      profileType: "husband",
      expenseType: "variable",
      expenseDate: new Date().toISOString().split("T")[0],
      isRecurring: false,
    },
  });

  const profileType = watch("profileType");
  const category = watch("category");
  const expenseType = watch("expenseType");

  const create = trpc.expenses.create.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.expenses.dashboardData.invalidate();
      utils.expenses.monthlySummary.invalidate();
      toast.success("Gasto adicionado com sucesso!");
      reset();
      onClose();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const update = trpc.expenses.update.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.expenses.dashboardData.invalidate();
      utils.expenses.monthlySummary.invalidate();
      toast.success("Gasto atualizado!");
      onClose();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const onSubmit = (data: ExpenseFormData) => {
    const payload = {
      ...data,
      expenseDate: new Date(data.expenseDate + "T12:00:00").getTime(),
      notes: data.notes || undefined,
      isRecurring: data.isRecurring ?? false,
    };
    if (isEditing) {
      update.mutate({ id: editingExpense.id, ...payload });
    } else {
      create.mutate(payload);
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg"
        style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.25 0.03 260)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.92 0.01 80)" }}>
            {isEditing ? "Editar Gasto" : "Novo Gasto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile type */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Perfil Responsável</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "husband" as const, label: "Marido", color: "240" },
                { value: "wife" as const, label: "Esposa", color: "340" },
              ].map(({ value, label, color }) => (
                <button key={value} type="button" onClick={() => setValue("profileType", value)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: profileType === value ? `oklch(0.65 0.18 ${color} / 0.15)` : "oklch(0.20 0.03 260)",
                    border: profileType === value ? `1.5px solid oklch(0.65 0.18 ${color} / 0.5)` : "1.5px solid oklch(0.25 0.03 260)",
                    color: profileType === value ? `oklch(0.80 0.14 ${color})` : "oklch(0.60 0.02 260)",
                  }}>
                  {profileType === value && <Check className="w-3.5 h-3.5" />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Descrição *</Label>
            <Input {...register("description")} placeholder="Ex: Mensalidade escola João"
              className="h-10" style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }} />
            {errors.description && <p className="text-xs text-red-400">{String(errors.description.message)}</p>}
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Valor *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: "oklch(0.55 0.02 260)" }}>R$</span>
                <Input {...register("amount")} type="number" step="0.01" placeholder="0,00"
                  className="h-10 pl-9" style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }} />
              </div>
              {errors.amount && <p className="text-xs text-red-400">{String(errors.amount.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Data *</Label>
              <Input {...register("expenseDate")} type="date"
                className="h-10" style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)", colorScheme: "dark" }} />
              {errors.expenseDate && <p className="text-xs text-red-400">{String(errors.expenseDate.message)}</p>}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Categoria *</Label>
            <Select value={category} onValueChange={v => setValue("category", v as ExpenseCategory)}>
              <SelectTrigger className="h-10" style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }}>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent style={{ background: "oklch(0.18 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }}>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}
                    style={{ color: "oklch(0.85 0.02 80)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                      {CATEGORY_LABELS[cat]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Tipo de Gasto</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "fixed" as const, label: "Fixo", desc: "Recorrente" },
                { value: "variable" as const, label: "Variável", desc: "Eventual" },
              ].map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => setValue("expenseType", value)}
                  className="flex flex-col items-start px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    background: expenseType === value ? "oklch(0.78 0.12 65 / 0.12)" : "oklch(0.20 0.03 260)",
                    border: expenseType === value ? "1.5px solid oklch(0.78 0.12 65 / 0.4)" : "1.5px solid oklch(0.25 0.03 260)",
                  }}>
                  <span className="font-medium" style={{ color: expenseType === value ? "oklch(0.88 0.10 70)" : "oklch(0.65 0.02 260)" }}>
                    {label}
                  </span>
                  <span className="text-xs" style={{ color: "oklch(0.50 0.02 260)" }}>{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Observações</Label>
            <Input {...register("notes")} placeholder="Opcional..."
              className="h-10" style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}
              style={{ borderColor: "oklch(0.28 0.03 260)", color: "oklch(0.65 0.02 260)" }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}
              style={{ background: "oklch(0.78 0.12 65)", color: "oklch(0.12 0.02 260)" }}>
              {isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Adicionar Gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ id, onClose }: { id: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const del = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.expenses.dashboardData.invalidate();
      utils.expenses.monthlySummary.invalidate();
      toast.success("Gasto removido");
      onClose();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm"
        style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.25 0.03 260)" }}>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.55 0.22 25 / 0.15)" }}>
            <AlertTriangle className="w-6 h-6" style={{ color: "oklch(0.70 0.20 25)" }} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-1" style={{ color: "oklch(0.92 0.01 80)" }}>Confirmar exclusão</h3>
            <p className="text-sm" style={{ color: "oklch(0.55 0.02 260)" }}>
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}
              style={{ borderColor: "oklch(0.28 0.03 260)", color: "oklch(0.65 0.02 260)" }}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={() => del.mutate({ id })} disabled={del.isPending}
              style={{ background: "oklch(0.55 0.22 25)", color: "white" }}>
              {del.isPending ? "Removendo..." : "Remover"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Lancamentos() {
  const now = new Date();
  const [month, setMonth] = useState<number | undefined>(now.getMonth() + 1);
  const [year, setYear] = useState<number | undefined>(now.getFullYear());
  const [profileFilter, setProfileFilter] = useState<"husband" | "wife" | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | undefined>();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: expenses = [], isLoading } = trpc.expenses.list.useQuery({
    month,
    year,
    profileType: profileFilter,
    category: categoryFilter,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(e =>
      e.description.toLowerCase().includes(q) ||
      CATEGORY_LABELS[e.category as ExpenseCategory]?.toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const total = useMemo(() =>
    filtered.reduce((s, e) => s + parseFloat(String(e.amount)), 0), [filtered]);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.95 0.01 80)" }}>
            Lançamentos
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.02 260)" }}>
            {filtered.length} registro{filtered.length !== 1 ? "s" : ""} · Total: {fmt(total)}
          </p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setModalOpen(true); }}
          className="flex items-center gap-2 h-10 px-5 font-medium"
          style={{ background: "oklch(0.78 0.12 65)", color: "oklch(0.12 0.02 260)", boxShadow: "0 4px 16px oklch(0.78 0.12 65 / 0.3)" }}>
          <Plus className="w-4 h-4" />
          Novo Gasto
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4"
        style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(0.50 0.02 260)" }} />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lançamentos..."
              className="pl-9 h-9 text-sm" style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }} />
          </div>

          {/* Month */}
          <select value={month ?? ""} onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 px-3 rounded-xl text-sm outline-none cursor-pointer"
            style={{ background: "oklch(0.20 0.03 260)", border: "1px solid oklch(0.28 0.03 260)", color: "oklch(0.75 0.02 80)" }}>
            <option value="">Todos os meses</option>
            {monthNames.map((m, i) => (
              <option key={i} value={i + 1} style={{ background: "oklch(0.18 0.03 260)" }}>{m}</option>
            ))}
          </select>

          {/* Year */}
          <select value={year ?? ""} onChange={e => setYear(e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 px-3 rounded-xl text-sm outline-none cursor-pointer"
            style={{ background: "oklch(0.20 0.03 260)", border: "1px solid oklch(0.28 0.03 260)", color: "oklch(0.75 0.02 80)" }}>
            <option value="">Todos os anos</option>
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y} style={{ background: "oklch(0.18 0.03 260)" }}>{y}</option>
            ))}
          </select>

          {/* Profile */}
          <select value={profileFilter ?? ""} onChange={e => setProfileFilter(e.target.value as any || undefined)}
            className="h-9 px-3 rounded-xl text-sm outline-none cursor-pointer"
            style={{ background: "oklch(0.20 0.03 260)", border: "1px solid oklch(0.28 0.03 260)", color: "oklch(0.75 0.02 80)" }}>
            <option value="">Todos os perfis</option>
            <option value="husband" style={{ background: "oklch(0.18 0.03 260)" }}>Marido</option>
            <option value="wife" style={{ background: "oklch(0.18 0.03 260)" }}>Esposa</option>
          </select>

          {/* Category */}
          <select value={categoryFilter ?? ""} onChange={e => setCategoryFilter(e.target.value as any || undefined)}
            className="h-9 px-3 rounded-xl text-sm outline-none cursor-pointer"
            style={{ background: "oklch(0.20 0.03 260)", border: "1px solid oklch(0.28 0.03 260)", color: "oklch(0.75 0.02 80)" }}>
            <option value="">Todas as categorias</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat} style={{ background: "oklch(0.18 0.03 260)" }}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {(profileFilter || categoryFilter || !month || search) && (
            <button onClick={() => { setProfileFilter(undefined); setCategoryFilter(undefined); setMonth(now.getMonth() + 1); setSearch(""); }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm transition-all hover:bg-white/5"
              style={{ border: "1px solid oklch(0.28 0.03 260)", color: "oklch(0.55 0.02 260)" }}>
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
        {isLoading ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse" style={{ background: i % 2 === 0 ? "oklch(0.16 0.025 260)" : "oklch(0.17 0.025 260)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "oklch(0.20 0.03 260)" }}>
              <Filter className="w-6 h-6" style={{ color: "oklch(0.45 0.02 260)" }} />
            </div>
            <p className="font-medium" style={{ color: "oklch(0.65 0.02 260)" }}>Nenhum lançamento encontrado</p>
            <p className="text-sm mt-1" style={{ color: "oklch(0.45 0.02 260)" }}>
              Ajuste os filtros ou adicione um novo gasto
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(0.22 0.03 260)" }}>
                  {["Data", "Descrição", "Categoria", "Perfil", "Tipo", "Valor", ""].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${i === 6 ? "text-right" : ""}`}
                      style={{ color: "oklch(0.50 0.02 260)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense, i) => {
                  const isHusband = expense.profileType === "husband";
                  const catColor = CATEGORY_COLORS[expense.category] ?? "oklch(0.60 0.10 260)";
                  return (
                    <tr key={expense.id}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid oklch(0.19 0.025 260)" : "none" }}>
                      <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={{ color: "oklch(0.60 0.02 260)" }}>
                        {format(new Date(expense.expenseDate), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="text-sm font-medium truncate" style={{ color: "oklch(0.85 0.02 80)" }}>
                          {expense.description}
                        </p>
                        {expense.notes && (
                          <p className="text-xs truncate mt-0.5" style={{ color: "oklch(0.50 0.02 260)" }}>
                            {expense.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
                          {CATEGORY_LABELS[expense.category as ExpenseCategory]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isHusband ? "profile-husband" : "profile-wife"}`}>
                          {isHusband ? "Marido" : "Esposa"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: expense.expenseType === "fixed" ? "oklch(0.65 0.18 240 / 0.12)" : "oklch(0.70 0.16 160 / 0.12)",
                            color: expense.expenseType === "fixed" ? "oklch(0.70 0.14 240)" : "oklch(0.72 0.14 160)",
                          }}>
                          {expense.expenseType === "fixed" ? "Fixo" : "Variável"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap"
                        style={{ color: "oklch(0.88 0.10 70)" }}>
                        {fmt(parseFloat(String(expense.amount)))}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingExpense(expense); setModalOpen(true); }}
                            className="p-1.5 rounded-lg transition-all hover:bg-white/10">
                            <Pencil className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.02 260)" }} />
                          </button>
                          <button onClick={() => setDeletingId(expense.id)}
                            className="p-1.5 rounded-lg transition-all hover:bg-red-500/10">
                            <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.60 0.15 25)" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <ExpenseModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditingExpense(null); }}
          editingExpense={editingExpense}
        />
      )}
      {deletingId !== null && (
        <DeleteConfirm id={deletingId} onClose={() => setDeletingId(null)} />
      )}
    </div>
  );
}
