import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Leaf, Stethoscope, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getActiveRole, roleHome, setActiveRole, useMe } from "@/lib/auth";
import type { AppRole } from "@/lib/labels";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Inicio — NutriDiario" }] }),
  component: Inicio,
});

function Inicio() {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!me.data) return;
    const roles = me.data.roles;
    if (roles.length === 0) return;
    const preferred = getActiveRole();
    const target = preferred && roles.includes(preferred) ? preferred : roles[0];
    setActiveRole(target);
    navigate({ to: roleHome(target), replace: true });
  }, [me.data, navigate]);

  const choose = useMutation({
    mutationFn: async (role: AppRole) => {
      const { error } = await supabase.rpc("grant_self_role", { _role: role });
      if (error) throw error;
      return role;
    },
    onSuccess: async (role) => {
      setActiveRole(role);
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      navigate({ to: roleHome(role), replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (me.isPending || (me.data && me.data.roles.length > 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Leaf className="mr-2 size-5 animate-pulse text-primary" /> Cargando…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-leaf text-primary">
            <Leaf className="size-7" />
          </div>
          <h1 className="text-3xl font-semibold">¡Bienvenido/a{me.data?.profile.full_name ? `, ${me.data.profile.full_name.split(" ")[0]}` : ""}!</h1>
          <p className="mt-2 text-muted-foreground">¿Cómo vas a usar NutriDiario?</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <RoleCard
            icon={<User className="size-6" />}
            title="Soy paciente"
            text="Registro mis comidas y recibo el acompañamiento de mi nutricionista."
            onClick={() => choose.mutate("patient")}
            disabled={choose.isPending}
          />
          <RoleCard
            icon={<Stethoscope className="size-6" />}
            title="Soy nutricionista"
            text="Sigo a mis pacientes, comento sus registros y organizo consultas."
            onClick={() => choose.mutate("nutritionist")}
            disabled={choose.isPending}
          />
        </div>
      </div>
    </div>
  );
}

function RoleCard(props: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      variant="outline"
      onClick={props.onClick}
      disabled={props.disabled}
      className="h-auto flex-col items-start gap-3 whitespace-normal rounded-2xl border-2 bg-card p-5 text-left hover:border-primary hover:bg-leaf/40"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-leaf text-primary">{props.icon}</span>
      <span className="text-lg font-semibold">{props.title}</span>
      <span className="text-sm font-normal text-muted-foreground">{props.text}</span>
    </Button>
  );
}
