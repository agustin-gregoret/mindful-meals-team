import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Leaf, Stethoscope, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { setActiveRole } from "@/lib/auth";
import type { AppRole } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  modo: z.enum(["ingresar", "registrarse"]).optional().catch(undefined),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Ingresar o crear cuenta — NutriDiario" },
      { name: "description", content: "Accedé a NutriDiario como paciente o nutricionista." },
      { property: "og:title", content: "Ingresar — NutriDiario" },
      { property: "og:description", content: "Accedé a NutriDiario como paciente o nutricionista." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"ingresar" | "registrarse">(search.modo ?? "ingresar");
  const [role, setRole] = useState<AppRole>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "registrarse") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim(), role },
          },
        });
        if (error) throw error;
        setActiveRole(role);
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        navigate({ to: "/inicio", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/inicio", replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error";
      toast.error(
        msg.includes("Invalid login") ? "Email o contraseña incorrectos" : msg.includes("already registered") ? "Ese email ya está registrado" : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    if (mode === "registrarse") setActiveRole(role);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("No se pudo iniciar sesión con Google");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/inicio", replace: true });
  }

  if (checkEmail) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-leaf text-primary text-2xl">✉️</div>
          <h1 className="text-2xl font-semibold">Revisá tu correo</h1>
          <p className="mt-2 text-muted-foreground">
            Te enviamos un enlace a <strong>{email}</strong> para confirmar tu cuenta. Después de confirmar, volvé e ingresá.
          </p>
          <Button className="mt-6 rounded-full" variant="outline" onClick={() => { setCheckEmail(false); setMode("ingresar"); }}>
            Volver a ingresar
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-medium">
        {(["ingresar", "registrarse"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-full py-2 transition-colors",
              mode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground",
            )}
          >
            {m === "ingresar" ? "Ingresar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <h1 className="text-2xl font-semibold">{mode === "ingresar" ? "Hola de nuevo" : "Creá tu cuenta"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "ingresar" ? "Ingresá para ver tu panel." : "Elegí cómo vas a usar NutriDiario."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "registrarse" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <RoleOption active={role === "patient"} onClick={() => setRole("patient")} icon={<User className="size-5" />} label="Paciente" />
              <RoleOption active={role === "nutritionist"} onClick={() => setRole("nutritionist")} icon={<Stethoscope className="size-5" />} label="Nutricionista" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre y apellido</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Pérez" autoComplete="name" />
            </div>
          </>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@ejemplo.com" autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={mode === "ingresar" ? "current-password" : "new-password"} />
        </div>
        <Button type="submit" className="w-full rounded-full" size="lg" disabled={busy}>
          {busy ? "Un momento…" : mode === "ingresar" ? "Ingresar" : "Crear cuenta"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> o <span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" className="w-full rounded-full" size="lg" onClick={handleGoogle} disabled={busy}>
        <GoogleIcon /> Continuar con Google
      </Button>
      {mode === "registrarse" && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Con Google se creará tu cuenta como <strong>{role === "patient" ? "paciente" : "nutricionista"}</strong>.
        </p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-leaf/50 via-background to-background px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Leaf className="size-5" />
        </span>
        <span className="font-display text-xl font-semibold">NutriDiario</span>
      </Link>
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">{children}</div>
    </main>
  );
}

function RoleOption(props: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "flex items-center gap-2 rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition-colors",
        props.active ? "border-primary bg-leaf/50 text-primary" : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {props.icon} {props.label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
