import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Heart, Settings, Check } from "lucide-react";

export default function Perfil() {
  const { user } = useAuth();
  const { data: profile, isLoading } = trpc.userProfile.get.useQuery();
  const [profileType, setProfileType] = useState<"husband" | "wife">("husband");
  const [displayName, setDisplayName] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");

  useEffect(() => {
    if (profile) {
      setProfileType(profile.profileType);
      setDisplayName(profile.displayName);
      setMonthlyBudget(profile.monthlyBudget ? String(parseFloat(String(profile.monthlyBudget))) : "");
    }
  }, [profile]);

  const setProfileMutation = trpc.userProfile.set.useMutation({
    onSuccess: () => toast.success("Perfil atualizado com sucesso!"),
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { toast.error("Informe seu nome"); return; }
    setProfileMutation.mutate({
      profileType,
      displayName: displayName.trim(),
      monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : 0,
    });
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.95 0.01 80)" }}>
          Configurações do Perfil
        </h1>
        <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.02 260)" }}>
          Gerencie suas informações pessoais no sistema
        </p>
      </div>

      {/* Account info */}
      <div className="rounded-2xl p-5"
        style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.75 0.02 80)" }}>
          Conta Google
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: "oklch(0.78 0.12 65 / 0.15)", color: "var(--gold)", border: "1px solid oklch(0.78 0.12 65 / 0.3)" }}>
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-semibold" style={{ color: "oklch(0.88 0.02 80)" }}>{user?.name}</p>
            <p className="text-sm" style={{ color: "oklch(0.55 0.02 260)" }}>{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="rounded-2xl p-6"
        style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.78 0.12 65 / 0.12)", border: "1px solid oklch(0.78 0.12 65 / 0.25)" }}>
            <Settings className="w-4 h-4" style={{ color: "var(--gold)" }} />
          </div>
          <h3 className="font-semibold" style={{ color: "oklch(0.88 0.02 80)" }}>
            Perfil no Sistema
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "oklch(0.20 0.03 260)" }} />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile type */}
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Perfil Familiar</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "husband" as const, label: "Marido", icon: User, color: "240" },
                  { value: "wife" as const, label: "Esposa", icon: Heart, color: "340" },
                ].map(({ value, label, icon: Icon, color }) => (
                  <button key={value} type="button" onClick={() => setProfileType(value)}
                    className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: profileType === value ? `oklch(0.65 0.18 ${color} / 0.15)` : "oklch(0.20 0.03 260)",
                      border: profileType === value ? `1.5px solid oklch(0.65 0.18 ${color} / 0.5)` : "1.5px solid oklch(0.25 0.03 260)",
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: `oklch(0.65 0.18 ${color} / 0.2)`, color: `oklch(0.75 0.14 ${color})` }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm" style={{
                      color: profileType === value ? `oklch(0.80 0.14 ${color})` : "oklch(0.65 0.02 260)"
                    }}>{label}</span>
                    {profileType === value && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: `oklch(0.65 0.18 ${color})` }}>
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Display name */}
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Nome de exibição</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Seu nome no sistema"
                className="h-10" style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }} />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "oklch(0.75 0.02 80)" }}>Orçamento mensal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: "oklch(0.55 0.02 260)" }}>R$</span>
                <Input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)}
                  placeholder="0,00" className="h-10 pl-9"
                  style={{ background: "oklch(0.20 0.03 260)", borderColor: "oklch(0.28 0.03 260)" }} />
              </div>
              <p className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
                Usado para calcular o saldo disponível no resumo mensal
              </p>
            </div>

            <Button type="submit" disabled={setProfileMutation.isPending}
              className="w-full h-10 font-medium"
              style={{ background: "oklch(0.78 0.12 65)", color: "oklch(0.12 0.02 260)" }}>
              {setProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        )}
      </div>

      {/* Current profile display */}
      {profile && (
        <div className="rounded-2xl p-5"
          style={{ background: "oklch(0.16 0.025 260)", border: "1px solid oklch(0.22 0.03 260)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.75 0.02 80)" }}>
            Perfil Atual
          </h3>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${profile.profileType === "husband" ? "profile-husband" : "profile-wife"}`}>
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold" style={{ color: "oklch(0.88 0.02 80)" }}>{profile.displayName}</p>
              <p className="text-sm" style={{ color: "oklch(0.55 0.02 260)" }}>
                {profile.profileType === "husband" ? "Marido" : "Esposa"}
                {profile.monthlyBudget && parseFloat(String(profile.monthlyBudget)) > 0 && (
                  <> · Orçamento: {fmt(parseFloat(String(profile.monthlyBudget)))}</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
