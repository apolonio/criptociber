import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { FileSpreadsheet, Download, CheckCircle, ExternalLink, Table, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CATEGORY_LABELS } from "../../../drizzle/schema";
import type { ExpenseCategory } from "../../../drizzle/schema";

export default function Exportar() {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const { data: exportData } = trpc.expenses.exportData.useQuery();

  const downloadCSV = () => {
    if (!exportData || exportData.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    setExporting(true);

    const headers = [
      "ID", "Perfil", "Descrição", "Valor (R$)", "Categoria",
      "Data", "Tipo", "Observações", "Recorrente", "Criado em"
    ];

    const rows = exportData.map(row => [
      row.id,
      row.profileType === "husband" ? "Marido" : "Esposa",
      `"${row.description.replace(/"/g, '""')}"`,
      row.amount.toFixed(2).replace(".", ","),
      `"${row.category}"`,
      row.expenseDate,
      row.expenseType,
      `"${(row.notes ?? "").replace(/"/g, '""')}"`,
      row.isRecurring,
      row.createdAt.split("T")[0],
    ]);

    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financas-familia-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExporting(false);
    setExported(true);
    toast.success(`${exportData.length} registros exportados com sucesso!`);
    setTimeout(() => setExported(false), 4000);
  };

  const downloadJSON = () => {
    if (!exportData || exportData.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financas-familia-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo JSON exportado!");
  };

  const steps = [
    {
      num: "1",
      title: "Exporte o arquivo CSV",
      desc: "Clique no botão abaixo para baixar todos os lançamentos em formato CSV com separador ponto-e-vírgula.",
    },
    {
      num: "2",
      title: "Abra o Google Sheets",
      desc: "Acesse sheets.google.com e crie uma nova planilha em branco.",
      link: "https://sheets.google.com",
    },
    {
      num: "3",
      title: "Importe o arquivo",
      desc: 'Vá em Arquivo → Importar → Fazer upload. Selecione o CSV baixado. Em "Separador", escolha "Ponto e vírgula".',
    },
    {
      num: "4",
      title: "Organize e analise",
      desc: "Use filtros, tabelas dinâmicas e gráficos do Google Sheets para criar relatórios personalizados do histórico.",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.95 0.01 80)" }}>
          Exportar Dados
        </h1>
        <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.02 260)" }}>
          Exporte o histórico financeiro para Google Sheets ou outros sistemas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total de registros", value: exportData?.length ?? 0 },
          { label: "Registros Marido", value: exportData?.filter(r => r.profileType === "husband").length ?? 0 },
          { label: "Registros Esposa", value: exportData?.filter(r => r.profileType === "wife").length ?? 0 },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 text-center"
            style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
            <p className="text-2xl font-bold" style={{ color: "oklch(0.88 0.10 70)" }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.02 260)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div className="rounded-2xl p-6 space-y-4"
        style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
        <h3 className="text-base font-semibold" style={{ color: "oklch(0.88 0.02 80)" }}>
          Formatos de Exportação
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* CSV */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: "oklch(0.18 0.025 260)", border: "1px solid oklch(0.25 0.03 260)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.70 0.16 160 / 0.15)", border: "1px solid oklch(0.70 0.16 160 / 0.3)" }}>
                <Table className="w-5 h-5" style={{ color: "oklch(0.72 0.14 160)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "oklch(0.88 0.02 80)" }}>CSV</p>
                <p className="text-xs" style={{ color: "oklch(0.50 0.02 260)" }}>Para Google Sheets / Excel</p>
              </div>
            </div>
            <Button onClick={downloadCSV} disabled={exporting || !exportData?.length}
              className="w-full h-9 text-sm font-medium flex items-center gap-2"
              style={{
                background: exported ? "oklch(0.70 0.16 160)" : "oklch(0.78 0.12 65)",
                color: "oklch(0.12 0.02 260)"
              }}>
              {exported ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {exporting ? "Exportando..." : exported ? "Exportado!" : "Baixar CSV"}
            </Button>
          </div>

          {/* JSON */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: "oklch(0.18 0.025 260)", border: "1px solid oklch(0.25 0.03 260)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.65 0.18 240 / 0.15)", border: "1px solid oklch(0.65 0.18 240 / 0.3)" }}>
                <FileText className="w-5 h-5" style={{ color: "oklch(0.70 0.14 240)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "oklch(0.88 0.02 80)" }}>JSON</p>
                <p className="text-xs" style={{ color: "oklch(0.50 0.02 260)" }}>Para integrações e APIs</p>
              </div>
            </div>
            <Button onClick={downloadJSON} disabled={!exportData?.length} variant="outline"
              className="w-full h-9 text-sm font-medium flex items-center gap-2"
              style={{ borderColor: "oklch(0.28 0.03 260)", color: "oklch(0.65 0.02 260)" }}>
              <Download className="w-4 h-4" />
              Baixar JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Google Sheets guide */}
      <div className="rounded-2xl p-6 space-y-5"
        style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.78 0.12 65 / 0.15)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
            <FileSpreadsheet className="w-5 h-5" style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "oklch(0.88 0.02 80)" }}>
              Como importar no Google Sheets
            </h3>
            <p className="text-xs" style={{ color: "oklch(0.50 0.02 260)" }}>
              Passo a passo para manter seu histórico organizado
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl"
              style={{ background: "oklch(0.18 0.025 260)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: "oklch(0.78 0.12 65 / 0.15)", color: "var(--gold)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
                {step.num}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: "oklch(0.82 0.02 80)" }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "oklch(0.55 0.02 260)" }}>{step.desc}</p>
                {step.link && (
                  <a href={step.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs mt-1 transition-opacity hover:opacity-80"
                    style={{ color: "oklch(0.70 0.14 240)" }}>
                    <ExternalLink className="w-3 h-3" />
                    Abrir Google Sheets
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="rounded-xl p-4"
          style={{ background: "oklch(0.78 0.12 65 / 0.06)", border: "1px solid oklch(0.78 0.12 65 / 0.15)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.82 0.10 70)" }}>
            Dica profissional
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.04 70)" }}>
            No Google Sheets, use <strong>Dados → Tabela dinâmica</strong> para criar relatórios automáticos por mês,
            categoria ou perfil. Combine com gráficos nativos do Sheets para visualizações adicionais.
          </p>
        </div>
      </div>
    </div>
  );
}
