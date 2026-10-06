import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { TrendingUp, Shield, BarChart3, Users } from "lucide-react";

export default function Login() {
  const features = [
    { icon: BarChart3, text: "Dashboard com gráficos em tempo real" },
    { icon: Users, text: "Perfis separados para marido e esposa" },
    { icon: TrendingUp, text: "Histórico e exportação para Google Sheets" },
    { icon: Shield, text: "Dados seguros e privados" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full"
            style={{ background: "oklch(0.78 0.12 65 / 0.04)" }} />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full"
            style={{ background: "oklch(0.65 0.18 240 / 0.06)" }} />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full"
            style={{ background: "oklch(0.65 0.18 340 / 0.05)" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.78 0.12 65 / 0.15)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
              <TrendingUp className="w-5 h-5" style={{ color: "var(--gold)" }} />
            </div>
            <span className="text-lg font-semibold tracking-wide" style={{ color: "var(--gold)" }}>
              FinançasFamília
            </span>
          </div>
        </div>

        {/* Main headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-5xl font-bold leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Gestão financeira{" "}
              <span className="text-gold-gradient">familiar</span>
              {" "}com elegância
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "oklch(0.65 0.02 260)" }}>
              Controle completo das finanças do casal. Acompanhe gastos, compare perfis e mantenha o histórico organizado.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.78 0.12 65 / 0.1)", border: "1px solid oklch(0.78 0.12 65 / 0.2)" }}>
                  <f.icon className="w-4 h-4" style={{ color: "var(--gold)" }} />
                </div>
                <span className="text-sm" style={{ color: "oklch(0.70 0.02 260)" }}>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <div className="divider-gold mb-6" />
          <p className="text-sm italic" style={{ color: "oklch(0.50 0.02 260)" }}>
            "A riqueza não está em ter muito, mas em saber administrar o que se tem."
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.78 0.12 65 / 0.15)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
              <TrendingUp className="w-5 h-5" style={{ color: "var(--gold)" }} />
            </div>
            <span className="text-lg font-semibold" style={{ color: "var(--gold)" }}>FinançasFamília</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8 space-y-6"
            style={{
              background: "oklch(0.16 0.025 260)",
              border: "1px solid oklch(0.25 0.03 260)",
              boxShadow: "0 0 0 1px oklch(0.78 0.12 65 / 0.08), 0 24px 64px oklch(0 0 0 / 0.5)"
            }}>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Bem-vindo de volta
              </h2>
              <p className="text-sm" style={{ color: "oklch(0.60 0.02 260)" }}>
                Acesse com sua conta Google para continuar
              </p>
            </div>

            <div className="divider-gold" />

            {/* Google login button */}
            <a
              href={getLoginUrl()}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "oklch(0.78 0.12 65)",
                color: "oklch(0.12 0.02 260)",
                boxShadow: "0 4px 16px oklch(0.78 0.12 65 / 0.3)"
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </a>

            <p className="text-xs text-center" style={{ color: "oklch(0.45 0.02 260)" }}>
              Ao entrar, você concorda com os termos de uso e política de privacidade.
              Seus dados são armazenados com segurança.
            </p>
          </div>

          {/* Profile hint */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "oklch(0.65 0.18 240 / 0.2)", color: "oklch(0.75 0.14 240)" }}>M</div>
              <span className="text-xs" style={{ color: "oklch(0.55 0.02 260)" }}>Perfil Marido</span>
            </div>
            <div className="w-px h-4" style={{ background: "oklch(0.25 0.03 260)" }} />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "oklch(0.65 0.18 340 / 0.2)", color: "oklch(0.75 0.14 340)" }}>E</div>
              <span className="text-xs" style={{ color: "oklch(0.55 0.02 260)" }}>Perfil Esposa</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
