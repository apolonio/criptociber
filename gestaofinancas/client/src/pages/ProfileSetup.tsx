import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrendingUp, User, Heart } from "lucide-react";

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const [profileType, setProfileType] = useState<"husband" | "wife" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");

  const setProfile = trpc.userProfile.set.useMutation({
    onSuccess: () => {
      toast.success("Perfil configurado com sucesso!");
      navigate("/");
    },
    onError: (err) => {
      toast.error("Erro ao salvar perfil: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileType) { toast.error("Selecione seu perfil"); return; }
    if (!displayName.trim()) { toast.error("Informe seu nome"); return; }
    setProfile.mutate({
      profileType,
      displayName: displayName.trim(),
      avatarColor: profileType === "husband" ? "#6366f1" : "#ec4899",
      monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : 0,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "oklch(0.78 0.12 65 / 0.15)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
            <TrendingUp className="w-7 h-7" style={{ color: "var(--gold)" }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Configure seu perfil
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.60 0.02 260)" }}>
            Defina como você será identificado no sistema familiar
          </p>
        </div>

        <div className="rounded-2xl p-8 space-y-6"
          style={{
            background: "oklch(0.16 0.025 260)",
            border: "1px solid oklch(0.25 0.03 260)",
            boxShadow: "0 0 0 1px oklch(0.78 0.12 65 / 0.08), 0 24px 64px oklch(0 0 0 / 0.5)"
          }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile type selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium" style={{ color: "oklch(0.80 0.02 80)" }}>
                Qual é o seu perfil?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "husband" as const, label: "Marido", icon: User, color: "240" },
                  { value: "wife" as const, label: "Esposa", icon: Heart, color: "340" },
                ].map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setProfileType(value)}
                    className="relative flex flex-col items-center gap-3 p-5 rounded-xl transition-all duration-200"
                    style={{
                      background: profileType === value
                        ? `oklch(0.65 0.18 ${color} / 0.15)`
                        : "oklch(0.20 0.03 260)",
                      border: profileType === value
                        ? `2px solid oklch(0.65 0.18 ${color} / 0.6)`
                        : "2px solid oklch(0.25 0.03 260)",
                      boxShadow: profileType === value
                        ? `0 0 20px oklch(0.65 0.18 ${color} / 0.15)`
                        : "none",
                    }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: `oklch(0.65 0.18 ${color} / 0.2)`,
                        color: `oklch(0.75 0.14 ${color})`,
                      }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-sm" style={{
                      color: profileType === value ? `oklch(0.80 0.14 ${color})` : "oklch(0.75 0.02 260)"
                    }}>
                      {label}
                    </span>
                    {profileType === value && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: `oklch(0.65 0.18 ${color})` }}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Display name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium" style={{ color: "oklch(0.80 0.02 80)" }}>
                Seu nome no sistema
              </Label>
              <Input
                id="displayName"
                placeholder="Ex: Carlos, Ana..."
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="h-11"
                style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }}
              />
            </div>

            {/* Monthly budget (optional) */}
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-sm font-medium" style={{ color: "oklch(0.80 0.02 80)" }}>
                Orçamento mensal (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: "oklch(0.60 0.02 260)" }}>R$</span>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0,00"
                  value={monthlyBudget}
                  onChange={e => setMonthlyBudget(e.target.value)}
                  className="h-11 pl-10"
                  style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }}
                />
              </div>
              <p className="text-xs" style={{ color: "oklch(0.50 0.02 260)" }}>
                Usado para calcular o saldo disponível no resumo mensal
              </p>
            </div>

            <Button
              type="submit"
              disabled={setProfile.isPending || !profileType || !displayName.trim()}
              className="w-full h-11 font-semibold text-sm"
              style={{
                background: "oklch(0.78 0.12 65)",
                color: "oklch(0.12 0.02 260)",
                boxShadow: "0 4px 16px oklch(0.78 0.12 65 / 0.3)"
              }}
            >
              {setProfile.isPending ? "Salvando..." : "Começar a usar"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
