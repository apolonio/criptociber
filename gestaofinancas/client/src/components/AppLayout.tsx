import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Receipt, BarChart3, FileSpreadsheet,
  LogOut, TrendingUp, Menu, X, ChevronRight, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/lancamentos", icon: Receipt, label: "Lançamentos" },
  { path: "/resumo", icon: BarChart3, label: "Resumo Mensal" },
  { path: "/exportar", icon: FileSpreadsheet, label: "Exportar Dados" },
];

function ProfileBadge({ profile }: { profile: { profileType: string; displayName: string } | null | undefined }) {
  if (!profile) return null;
  const isHusband = profile.profileType === "husband";
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{
        background: isHusband ? "oklch(0.65 0.18 240 / 0.12)" : "oklch(0.65 0.18 340 / 0.12)",
        border: isHusband ? "1px solid oklch(0.65 0.18 240 / 0.25)" : "1px solid oklch(0.65 0.18 340 / 0.25)",
      }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          background: isHusband ? "oklch(0.65 0.18 240 / 0.25)" : "oklch(0.65 0.18 340 / 0.25)",
          color: isHusband ? "oklch(0.80 0.14 240)" : "oklch(0.80 0.14 340)",
        }}>
        {profile.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate" style={{
          color: isHusband ? "oklch(0.80 0.14 240)" : "oklch(0.80 0.14 340)"
        }}>
          {profile.displayName}
        </p>
        <p className="text-xs" style={{ color: "oklch(0.50 0.02 260)" }}>
          {isHusband ? "Marido" : "Esposa"}
        </p>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { data: profile } = trpc.userProfile.get.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/login"; },
    onError: () => toast.error("Erro ao sair"),
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.78 0.12 65 / 0.15)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
            <TrendingUp className="w-4 h-4" style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: "var(--gold)" }}>FinançasFamília</p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.02 260)" }}>Gestão inteligente</p>
          </div>
        </div>
      </div>

      <div className="divider-gold mx-4 mb-4" />

      {/* Profile */}
      <div className="px-4 mb-4">
        <ProfileBadge profile={profile} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path} onClick={() => setSidebarOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${isActive ? "" : "hover:bg-white/5"}`}
                style={isActive ? {
                  background: "oklch(0.78 0.12 65 / 0.12)",
                  borderLeft: "2px solid oklch(0.78 0.12 65)",
                  paddingLeft: "10px",
                } : {}}>
                <Icon className="w-4 h-4 flex-shrink-0 transition-colors"
                  style={{ color: isActive ? "var(--gold)" : "oklch(0.55 0.02 260)" }} />
                <span className="text-sm font-medium transition-colors"
                  style={{ color: isActive ? "oklch(0.90 0.08 70)" : "oklch(0.65 0.02 260)" }}>
                  {label}
                </span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: "var(--gold)" }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 space-y-2">
        <div className="divider-gold mb-3" />
        <Link href="/perfil" onClick={() => setSidebarOpen(false)}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
            <Settings className="w-4 h-4" style={{ color: "oklch(0.50 0.02 260)" }} />
            <span className="text-sm" style={{ color: "oklch(0.55 0.02 260)" }}>Configurações</span>
          </div>
        </Link>
        <button
          onClick={() => logout.mutate()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-4 h-4 transition-colors" style={{ color: "oklch(0.55 0.22 25)" }} />
          <span className="text-sm transition-colors" style={{ color: "oklch(0.60 0.10 25)" }}>Sair</span>
        </button>

        {/* User info */}
        <div className="px-3 pt-2">
          <p className="text-xs truncate" style={{ color: "oklch(0.40 0.02 260)" }}>
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0"
        style={{
          background: "oklch(0.10 0.02 260)",
          borderRight: "1px solid oklch(0.20 0.025 260)",
        }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col"
            style={{ background: "oklch(0.10 0.02 260)", borderRight: "1px solid oklch(0.20 0.025 260)" }}>
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" style={{ color: "oklch(0.60 0.02 260)" }} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: "oklch(0.10 0.02 260)", borderBottom: "1px solid oklch(0.20 0.025 260)" }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/10">
            <Menu className="w-5 h-5" style={{ color: "oklch(0.65 0.02 260)" }} />
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: "var(--gold)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--gold)" }}>FinançasFamília</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
