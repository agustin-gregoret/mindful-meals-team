import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import {
  CONSULTATION_STATUS,
  FEEDBACK,
  PAYMENT_STATUS,
  formatDateShort,
  formatDateTime,
  formatTime,
  mealEmoji,
  mealLabel,
  type ConsultationStatus,
  type FeedbackLevel,
  type MealComment,
  type MealLog,
  type PaymentStatus,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

export function PageHeader(props: { title: string; subtitle?: string; action?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3", props.className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{props.title}</h1>
        {props.subtitle && <p className="mt-1 text-sm text-muted-foreground">{props.subtitle}</p>}
      </div>
      {props.action && <div className="shrink-0">{props.action}</div>}
    </header>
  );
}

export function EmptyState(props: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed bg-card/60 px-6 py-10 text-center">
      {props.icon && (
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-leaf text-primary [&_svg]:size-6">{props.icon}</div>
      )}
      <p className="font-semibold">{props.title}</p>
      {props.text && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{props.text}</p>}
      {props.action && <div className="mt-4 flex justify-center">{props.action}</div>}
    </div>
  );
}

export function FeedbackBadge({ level, className }: { level: FeedbackLevel | null; className?: string }) {
  if (!level) {
    return (
      <span className={cn("rounded-full border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground", className)}>
        Sin valorar
      </span>
    );
  }
  const f = FEEDBACK[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", f.className, className)}>
      <span className={cn("size-1.5 rounded-full", f.dot)} /> {f.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: ConsultationStatus }) {
  const s = CONSULTATION_STATUS[status];
  return <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", s.className)}>{s.label}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_STATUS[status];
  return <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", s.className)}>{s.label}</span>;
}

export function MealLogCard(props: {
  log: MealLog;
  comments?: MealComment[];
  showDate?: boolean;
  authorLabel?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
  highlight?: boolean;
}) {
  const { log } = props;
  const comments = props.comments ?? [];
  return (
    <article
      onClick={props.onClick}
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm transition-shadow",
        props.onClick && "cursor-pointer hover:shadow-md",
        props.highlight && "ring-2 ring-primary/40",
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-leaf text-xl">{mealEmoji(log.meal_type)}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="font-semibold">{mealLabel(log.meal_type)}</p>
            <p className="text-xs text-muted-foreground">
              {props.showDate && `${formatDateShort(log.log_date)} · `}
              {formatTime(log.log_time)}
            </p>
          </div>
          <p className="mt-0.5 text-sm">{log.foods}</p>
          {log.portions && <p className="text-xs text-muted-foreground">Porciones: {log.portions}</p>}
          {(log.feeling || log.notes) && (
            <p className="mt-1 text-xs italic text-muted-foreground">
              {log.feeling && <span>Me sentí {log.feeling.toLowerCase()}</span>}
              {log.feeling && log.notes && " · "}
              {log.notes}
            </p>
          )}
        </div>
        <FeedbackBadge level={log.feedback} />
      </div>
      {comments.length > 0 && (
        <ul className="mt-3 space-y-2 border-t pt-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2 rounded-xl bg-leaf/40 p-2.5 text-sm">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary">
                  {props.authorLabel ?? "Nutricionista"} · {formatDateTime(c.created_at)}
                </p>
                <p className="whitespace-pre-wrap">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {props.footer && <div className="mt-3 border-t pt-3">{props.footer}</div>}
    </article>
  );
}

export function LinkCard(props: { to: string; title: string; text: string; icon: React.ReactNode }) {
  return (
    <Link to={props.to} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-leaf/30">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-leaf text-primary [&_svg]:size-5">{props.icon}</span>
      <div className="min-w-0">
        <p className="font-semibold">{props.title}</p>
        <p className="truncate text-xs text-muted-foreground">{props.text}</p>
      </div>
    </Link>
  );
}
