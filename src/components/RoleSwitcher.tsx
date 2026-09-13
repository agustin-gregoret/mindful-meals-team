import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Stethoscope, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { roleHome, setActiveRole, type Me } from "@/lib/auth";
import type { AppRole } from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ROLES: { value: AppRole; label: string; icon: React.ReactNode }[] = [
  { value: "patient", label: "Paciente", icon: <User className="size-3.5" /> },
  { value: "nutritionist", label: "Nutricionista", icon: <Stethoscope className="size-3.5" /> },
];

export function RoleSwitcher({ me, current, compact }: { me: Me; current: AppRole; compact?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<AppRole | null>(null);

  const grant = useMutation({
    mutationFn: async (role: AppRole) => {
      const { error } = await supabase.rpc("grant_self_role", { _role: role });
      if (error) throw error;
      return role;
    },
    onSuccess: async (role) => {
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      setActiveRole(role);
      toast.success(`Vista de ${role === "patient" ? "paciente" : "nutricionista"} activada`);
      navigate({ to: roleHome(role) });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function pick(role: AppRole) {
    if (role === current) return;
    if (me.roles.includes(role)) {
      setActiveRole(role);
      navigate({ to: roleHome(role) });
    } else {
      setPending(role);
    }
  }

  return (
    <>
      <div className="inline-grid grid-cols-2 rounded-full bg-muted p-0.5 text-xs font-semibold" role="tablist" aria-label="Cambiar vista">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            role="tab"
            aria-selected={current === r.value}
            onClick={() => pick(r.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-colors",
              current === r.value ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {r.icon} {!compact && r.label}
          </button>
        ))}
      </div>
      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activar vista de {pending === "patient" ? "paciente" : "nutricionista"}</AlertDialogTitle>
            <AlertDialogDescription>
              Tu cuenta todavía no tiene este rol. Para probar la app podés activarlo ahora: vas a poder alternar entre
              ambas vistas desde este mismo selector.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => pending && grant.mutate(pending)}>Activar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
