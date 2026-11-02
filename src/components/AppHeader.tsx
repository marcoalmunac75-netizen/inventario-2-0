import { Link } from "@tanstack/react-router";
import { LayoutGrid, List, Plus, Columns3 } from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/inventario", label: "Inventario", icon: List },
  { to: "/nuevo", label: "Nuevo activo", icon: Plus },
  { to: "/reportes", label: "Reportes", icon: Columns3 },
] as const;

export function AppHeader() {
  return (
    <header className="rounded-b-2xl bg-shell px-4 pb-4 pt-5 text-shell-foreground sm:rounded-2xl sm:mx-4 sm:mt-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-lg font-bold leading-tight">Inventario TI</div>
        <div className="text-xs text-shell-muted">Gerencia de Informática</div>
        <nav className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className="nav-pill"
              activeProps={{ className: "nav-pill-active" }}
              activeOptions={{ exact: it.to === "/" }}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: number | string; hint: string; tone?: "default" | "success" | "warning" | "destructive" }) {
  const toneClass = { default: "text-foreground", success: "text-success", warning: "text-warning", destructive: "text-destructive" }[tone];
  return (
    <div className="panel">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-bold tabular-nums ${toneClass}`}>{value}</div>
      <div className="mt-2 text-xs">{hint}</div>
    </div>
  );
}

export const estadoTone = (e: string) =>
  e === "Operativo" ? "success" : e === "En reparación" ? "warning" : e === "De baja" ? "destructive" : "default";
