import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setActiveRole, useMe } from "@/lib/auth";
import type { AppRole } from "@/lib/labels";
import { Button } from "@/components/ui/button";

/** Renders children only when the signed-in user holds `role`; otherwise offers to activate it (demo/testing). */
export function RoleGate({ role, children }: { role: AppRole; children: React.ReactNode }) {
  const me = useMe();
  const queryClient = useQueryClient();
  const grant = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("grant_self_role", { _role: role });
      if (error) throw error;
    },
    onSuccess: async () => {
      setActiveRole(role);
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Rol activado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (me.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Leaf className="mr-2 size-5 animate-pulse text-primary" /> Cargando…
      </div>
    );
  }
  if (me.data && !me.data.roles.includes(role)) {
    const label = role === "patient" ? "paciente" : "nutricionista";
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border bg-card p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">Vista de {label}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu cuenta no tiene el rol de {label}. Para probar esta vista podés activarlo ahora.
        </p>
        <Button className="mt-4 rounded-full" onClick={() => grant.mutate()} disabled={grant.isPending}>
          Activar vista de {label}
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
