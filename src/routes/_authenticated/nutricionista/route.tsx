import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Leaf, LogOut, Users } from "lucide-react";
import { useMe, useSignOut } from "@/lib/auth";
import { useRealtimeSync } from "@/lib/queries";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { RoleGate } from "@/components/RoleGate";
import { initials } from "@/lib/labels";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/nutricionista")({
  component: NutritionistLayout,
});

const NAV = [
  { to: "/nutricionista", label: "Pacientes", icon: Users, exact: true },
  { to: "/nutricionista/consultas", label: "Consultas", icon: CalendarDays },
  { to: "/nutricionista/contenido", label: "Contenido", icon: BookOpen },
] as const;

function NutritionistLayout() {
  const me = useMe();
  const signOut = useSignOut();
  const uid = me.data?.userId;

  useRealtimeSync(
    `nutritionist-${uid}`,
    [
      { table: "meal_logs", keys: [["meal_logs"]] },
      { table: "meal_comments", keys: [["meal_comments"]] },
      { table: "consultations", filter: uid ? `nutritionist_id=eq.${uid}` : undefined, keys: [["consultations"]] },
      { table: "patient_links", keys: [["patients"], ["auth"]] },
    ],
    !!uid,
  );

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold">NutriDiario</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: "exact" in item && item.exact }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-primary" }}
            >
              <item.icon className="size-4.5" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          {me.data && (
            <div className="mb-3">
              <RoleSwitcher me={me.data} current="nutritionist" />
            </div>
          )}
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {me.data ? initials(me.data.profile.full_name || me.data.email) : "…"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me.data?.profile.full_name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Código: <span className="font-mono font-semibold text-foreground">{me.data?.profile.invite_code ?? "—"}</span>
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión">
              <LogOut />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur md:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Leaf className="size-4" />
              </span>
              <span className="truncate font-display text-lg font-semibold">NutriDiario</span>
            </div>
            <div className="flex items-center gap-1">
              {me.data && <RoleSwitcher me={me.data} current="nutritionist" compact />}
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión">
                <LogOut />
              </Button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: "exact" in item && item.exact }}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                activeProps={{ className: "bg-leaf text-primary" }}
              >
                <item.icon className="size-3.5" /> {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <RoleGate role="nutritionist">
            <Outlet />
          </RoleGate>
        </main>
      </div>
    </div>
  );
}
