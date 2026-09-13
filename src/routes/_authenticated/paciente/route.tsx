import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Home, MessageSquareHeart, Plus, User } from "lucide-react";
import { useMe } from "@/lib/auth";
import { useRealtimeSync } from "@/lib/queries";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { RoleGate } from "@/components/RoleGate";
import { initials } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/paciente")({
  component: PatientLayout,
});

const NAV = [
  { to: "/paciente", label: "Hoy", icon: Home, exact: true },
  { to: "/paciente/comentarios", label: "Comentarios", icon: MessageSquareHeart },
  { to: "/paciente/registrar", label: "Registrar", icon: Plus, primary: true },
  { to: "/paciente/aprender", label: "Aprender", icon: BookOpen },
  { to: "/paciente/consultas", label: "Consultas", icon: CalendarDays },
] as const;

function PatientLayout() {
  const me = useMe();
  const uid = me.data?.userId;

  useRealtimeSync(
    `patient-${uid}`,
    uid
      ? [
          { table: "meal_logs", filter: `patient_id=eq.${uid}`, keys: [["meal_logs"]] },
          { table: "meal_comments", filter: `patient_id=eq.${uid}`, keys: [["meal_comments"]] },
          { table: "consultations", filter: `patient_id=eq.${uid}`, keys: [["consultations"]] },
        ]
      : [],
    !!uid,
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/paciente/perfil" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {me.data ? initials(me.data.profile.full_name || me.data.email) : <User className="size-4" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{me.data?.profile.full_name || "Mi perfil"}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {me.data?.nutritionist ? `Con ${me.data.nutritionist.full_name}` : "Sin nutricionista vinculado"}
              </span>
            </span>
          </Link>
          {me.data && <RoleSwitcher me={me.data} current="patient" compact />}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-5 safe-bottom">
        <RoleGate role="patient">
          <Outlet />
        </RoleGate>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 backdrop-blur" aria-label="Navegación principal">
        <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5">
          {NAV.map((item) => (
            <li key={item.to} className="flex justify-center">
              {"primary" in item && item.primary ? (
                <Link
                  to={item.to}
                  className="-mt-6 flex flex-col items-center gap-1 text-[11px] font-semibold text-primary"
                  aria-label={item.label}
                >
                  <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                    <item.icon className="size-7" />
                  </span>
                  {item.label}
                </Link>
              ) : (
                <Link
                  to={item.to}
                  activeOptions={{ exact: "exact" in item && item.exact }}
                  className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] font-medium text-muted-foreground"
                  activeProps={{ className: cn("text-primary") }}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
