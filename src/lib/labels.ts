import type { Database } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export type MealType = Database["public"]["Enums"]["meal_type"];
export type FeedbackLevel = Database["public"]["Enums"]["feedback_level"];
export type ConsultationType = Database["public"]["Enums"]["consultation_type"];
export type ConsultationStatus = Database["public"]["Enums"]["consultation_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export type MealLog = Database["public"]["Tables"]["meal_logs"]["Row"];
export type MealComment = Database["public"]["Tables"]["meal_comments"]["Row"];
export type Consultation = Database["public"]["Tables"]["consultations"]["Row"];
export type Article = Database["public"]["Tables"]["articles"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const MEAL_TYPES: { value: MealType; label: string; emoji: string; order: number }[] = [
  { value: "desayuno", label: "Desayuno", emoji: "🌅", order: 1 },
  { value: "colacion", label: "Colación", emoji: "🍎", order: 2 },
  { value: "almuerzo", label: "Almuerzo", emoji: "🥗", order: 3 },
  { value: "merienda", label: "Merienda", emoji: "☕", order: 4 },
  { value: "cena", label: "Cena", emoji: "🌙", order: 5 },
];

export const mealLabel = (t: MealType) => MEAL_TYPES.find((m) => m.value === t)?.label ?? t;
export const mealEmoji = (t: MealType) => MEAL_TYPES.find((m) => m.value === t)?.emoji ?? "🍽️";

export const FEEDBACK: Record<
  FeedbackLevel,
  { label: string; className: string; dot: string; description: string }
> = {
  excelente: {
    label: "Excelente",
    className: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
    description: "Muy buena elección",
  },
  bien: {
    label: "Bien",
    className: "bg-warning/25 text-warning-foreground border-warning/40",
    dot: "bg-warning",
    description: "Vas por buen camino",
  },
  a_mejorar: {
    label: "A mejorar",
    className: "bg-coral/15 text-coral border-coral/30",
    dot: "bg-coral",
    description: "Revisá los comentarios",
  },
};

export const CONSULTATION_TYPE: Record<ConsultationType, string> = {
  inicial: "Consulta inicial",
  seguimiento: "Seguimiento",
};

export const CONSULTATION_STATUS: Record<ConsultationStatus, { label: string; className: string }> =
  {
    solicitada: { label: "Solicitada", className: "bg-warning/25 text-warning-foreground" },
    confirmada: { label: "Confirmada", className: "bg-primary/10 text-primary" },
    realizada: { label: "Realizada", className: "bg-success/15 text-success" },
    cancelada: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
  };

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  pendiente: { label: "Pago pendiente", className: "bg-coral/15 text-coral" },
  pagado: { label: "Pagado", className: "bg-success/15 text-success" },
};

export const FEELINGS = ["Con energía", "Satisfecho/a", "Con hambre", "Ansioso/a", "Cansado/a", "Culpable"];

export const ARTICLE_CATEGORIES = [
  "Hábitos saludables",
  "Nutrición básica",
  "Recetas",
  "Hidratación",
  "Planificación",
  "Mitos y verdades",
];

export const todayISO = () => format(new Date(), "yyyy-MM-dd");
export const nowHHMM = () => format(new Date(), "HH:mm");

export const formatDateLong = (iso: string) =>
  format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });
export const formatDateShort = (iso: string) => format(parseISO(iso), "d MMM", { locale: es });
export const formatDateTime = (iso: string) =>
  format(new Date(iso), "d MMM, HH:mm", { locale: es });
export const formatTime = (t: string) => t.slice(0, 5);

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";
