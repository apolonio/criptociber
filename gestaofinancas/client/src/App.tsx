import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Lancamentos from "./pages/Lancamentos";
import Resumo from "./pages/Resumo";
import Exportar from "./pages/Exportar";
import Perfil from "./pages/Perfil";
import { trpc } from "./lib/trpc";

// ─── Protected wrapper ────────────────────────────────────────────────────────

function ProtectedApp() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading, isFetched: profileFetched } = trpc.userProfile.get.useQuery(
    undefined,
    { enabled: !!user }
  );
  const [location] = useLocation();

  if (loading || (user && profileLoading && !profileFetched)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: "oklch(0.78 0.12 65 / 0.15)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              style={{ color: "var(--gold)" }}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 260)" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // First time user - needs to set up profile
  if (!profile && location !== "/perfil-setup") {
    return <ProfileSetup />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/lancamentos" component={Lancamentos} />
        <Route path="/resumo" component={Resumo} />
        <Route path="/exportar" component={Exportar} />
        <Route path="/perfil" component={Perfil} />
        <Route path="/perfil-setup" component={ProfileSetup} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "oklch(0.18 0.03 260)",
                border: "1px solid oklch(0.28 0.03 260)",
                color: "oklch(0.88 0.02 80)",
              },
            }}
          />
          <ProtectedApp />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
