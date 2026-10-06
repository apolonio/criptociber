# Family Finance Manager - TODO

## Schema & Backend
- [x] Definir schema do banco: tabela expenses com campos completos
- [x] Definir schema: tabela user_profiles para perfil marido/esposa
- [x] Gerar migração SQL e aplicar via webdev_execute_sql
- [x] Implementar db helpers: getExpenses, createExpense, updateExpense, deleteExpense
- [x] Implementar db helpers: getMonthlySummary, getCategoryTotals
- [x] Router tRPC: expenses.list (com filtros mês/ano/categoria/perfil)
- [x] Router tRPC: expenses.create
- [x] Router tRPC: expenses.update
- [x] Router tRPC: expenses.delete
- [x] Router tRPC: expenses.monthlySummary
- [x] Router tRPC: expenses.dashboardData (totais, por categoria, comparativo casal)
- [x] Router tRPC: expenses.exportData (para Google Sheets)
- [x] Router tRPC: userProfile.get e userProfile.set (marido/esposa)

## Frontend - Layout & Auth
- [x] Design premium: paleta de cores, tipografia, CSS variables (tema escuro elegante)
- [x] DashboardLayout com sidebar navegação premium
- [x] Página de login elegante com botão Google OAuth
- [x] Configuração de perfil (marido/esposa) após primeiro login
- [x] Roteamento completo em App.tsx

## Frontend - Dashboard
- [x] Dashboard principal com cards de resumo (total mês, fixos, variáveis)
- [x] Gráfico de pizza por categoria (Recharts)
- [x] Gráfico de barras comparativo marido vs esposa (Recharts)
- [x] Gráfico de barras mensais (últimos 6 meses)
- [x] Indicadores visuais diferenciados por perfil (marido/esposa)

## Frontend - Lançamentos
- [x] Listagem de gastos com tabela elegante
- [x] Filtros: mês, ano, categoria, perfil
- [x] Formulário modal de adição de gasto
- [x] Formulário modal de edição de gasto
- [x] Confirmação de exclusão
- [x] Badge colorido por categoria
- [x] Diferenciação visual marido vs esposa na listagem

## Frontend - Resumo Mensal
- [x] Página de resumo mensal com totais por categoria
- [x] Saldo disponível (se orçamento configurado)
- [x] Indicadores fixos vs variáveis
- [x] Comparativo mensal entre perfis

## Exportação Google Sheets
- [x] Endpoint de exportação que gera CSV/JSON formatado
- [x] Integração Google Sheets API (via exportação CSV + guia passo a passo)
- [x] Botão de exportação na interface
- [x] Feedback visual de exportação concluída

## Testes
- [x] Vitest: expenses.create procedure
- [x] Vitest: expenses.list com filtros
- [x] Vitest: monthlySummary calculation
- [x] Vitest: userProfile procedures

## Filtros de Categoria no Dashboard
- [x] Backend: dashboardData aceitar filtro de categoria opcional
- [x] Backend: getMonthlySummary filtrar por categoria
- [x] Frontend: seletor multi-categoria no dashboard (chips/badges clicáveis)
- [x] Frontend: gráficos e cards reagem ao filtro de categoria selecionado
- [x] Frontend: indicador visual de filtro ativo e botão para limpar filtro
