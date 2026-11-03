import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, List, Plus, Columns3, Users, LogOut } from "lucide-react";
import { signOut, useIsAdmin, useProfile } from "@/lib/auth";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, admin: false },
  { to: "/inventario", label: "Inventario", icon: List, admin: false },
  { to: "/nuevo", label: "Nuevo activo", icon: Plus, admin: true },
  { to: "/reportes", label: "Reportes", icon: Columns3, admin: false },
  { to: "/usuarios", label: "Usuarios", icon: Users, admin: false },
] as const;

const authRoute = getRouteApi("/_authenticated");

export function AppHeader() {
  const { user } = authRoute.useRouteContext();
  const isAdmin = useIsAdmin(user.id);
  const profile = useProfile(user.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const visible = items.filter((it) => !it.admin || isAdmin);

  return (
    <header className="rounded-b-2xl bg-shell px-4 pb-4 pt-5 text-shell-foreground sm:rounded-2xl sm:mx-4 sm:mt-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold leading-tight">Inventario TI</div>
            <div className="text-xs text-shell-muted">Gerencia de Informática</div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight">{profile?.full_name || user.email}</div>
              <div className="text-xs text-shell-muted">{isAdmin ? "Administrador" : "Solo lectura"}</div>
            </div>
            <button
              type="button"
              className="nav-pill"
              onClick={async () => {
                await signOut(queryClient);
                navigate({ to: "/auth", replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
        <nav className={`mt-4 grid grid-cols-2 gap-2 ${visible.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
          {visible.map((it) => (
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

export const estadoTone = (e: string): "default" | "success" | "warning" | "destructive" =>
  e === "OPERATIVO" || e === "EQUIPO NUEVO"
    ? "success"
    : e === "GESTION CAMBIO DE EQUIPO" || e === "PENDIENTE DE VALIDAR"
      ? "warning"
      : e === "DAÑADO" || e === "BAJA"
        ? "destructive"
        : "default";

const PLURAL: Record<string, string> = {
  NOTEBOOK: "Notebooks",
  MONITOR: "Monitores",
  IMPRESORA: "Impresoras",
  PC: "PCs",
  UPS: "UPS",
  SWITCH: "Switches",
  "IMPRESORA DE CHEQUES": "Impresoras de cheques",
  NVR: "NVR",
  "MINI PC": "Mini PC",
  "FIREWALL / SEGURIDAD DE RED": "Firewall / Seg. de red",
  OPERATIVO: "Operativos",
  "EQUIPO NUEVO": "Equipos nuevos",
  REACONDICIONADO: "Reacondicionados",
  "GESTION CAMBIO DE EQUIPO": "Gestión cambio de equipo",
  "EN BODEGA": "En bodega",
  "PENDIENTE DE VALIDAR": "Pendientes de validar",
  DAÑADO: "Dañados",
  BAJA: "De baja",
};
export const pretty = (v: string) =>
  PLURAL[v] ?? v.charAt(0) + v.slice(1).toLowerCase();
