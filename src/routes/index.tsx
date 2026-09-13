import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarCheck, Leaf, MessageSquareHeart, NotebookPen, Sparkles } from "lucide-react";
import { sessionQuery } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const title = "NutriDiario — Seguimiento nutricional entre pacientes y nutricionistas";
const description =
  "Registrá tus comidas desde el celular y recibí comentarios de tu nutricionista en tiempo real. Consultas, contenido educativo y seguimiento diario en un solo lugar.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Landing,
});

function Landing() {
  const session = useQuery(sessionQuery);
  const loggedIn = !!session.data;

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold">NutriDiario</span>
        </div>
        <nav className="flex items-center gap-2">
          {loggedIn ? (
            <Button asChild className="rounded-full">
              <Link to="/inicio">
                Ir a mi panel <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-full">
                <Link to="/auth" search={{ modo: "ingresar" }}>
                  Ingresar
                </Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link to="/auth" search={{ modo: "registrarse" }}>
                  Crear cuenta
                </Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-leaf px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="size-3.5" /> Acompañamiento en tiempo real
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] md:text-6xl">
            Cada comida cuenta. <span className="text-primary">Tu nutricionista</span> la ve al instante.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Los pacientes registran lo que comen desde el celular; el nutricionista lo sigue desde su panel,
            comenta cada registro y organiza las consultas. Sin planillas ni mensajes perdidos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to={loggedIn ? "/inicio" : "/auth"} search={loggedIn ? undefined : { modo: "registrarse" }}>
                Empezar ahora <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/auth" search={{ modo: "ingresar" }}>
                Ya tengo cuenta
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-leaf via-sand to-transparent blur-2xl" />
          <div className="rounded-[2rem] border bg-card p-5 shadow-xl shadow-primary/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hoy</p>
            <p className="font-display text-2xl font-semibold">Tu día en comidas</p>
            <ul className="mt-4 space-y-3">
              {[
                { e: "🌅", t: "Desayuno", d: "Avena con frutas y yogur", b: "Excelente", c: "bg-success/15 text-success" },
                { e: "🥗", t: "Almuerzo", d: "Ensalada completa con pollo", b: "Bien", c: "bg-warning/25 text-warning-foreground" },
                { e: "☕", t: "Merienda", d: "Café con 2 tostadas", b: "Pendiente", c: "bg-muted text-muted-foreground" },
              ].map((m) => (
                <li key={m.t} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-card text-lg">{m.e}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{m.t}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.d}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.c}`}>{m.b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-2xl border border-dashed border-primary/40 bg-leaf/40 p-3 text-sm">
              <p className="font-semibold text-primary">Comentario de tu nutricionista</p>
              <p className="text-muted-foreground">¡Muy buen desayuno! Sumá una fruta a la merienda.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-4">
          <Feature icon={<NotebookPen />} title="Registro diario" text="Fecha, hora, tipo de comida, alimentos, porciones y cómo te sentiste." />
          <Feature icon={<MessageSquareHeart />} title="Feedback al instante" text="Comentarios y valoraciones del nutricionista sobre cada registro." />
          <Feature icon={<CalendarCheck />} title="Consultas" text="Solicitá turnos iniciales o de seguimiento y seguí su estado." />
          <Feature icon={<Leaf />} title="Aprender" text="Artículos, hábitos y consejos publicados por tu nutricionista." />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} NutriDiario · Seguimiento nutricional con acompañamiento profesional.
      </footer>
    </main>
  );
}

function Feature(props: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-leaf text-primary [&_svg]:size-5">{props.icon}</span>
      <h3 className="mt-3 text-lg font-semibold">{props.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{props.text}</p>
    </div>
  );
}
