import { createFileRoute, Link } from "@tanstack/react-router";
import { PageTitle, StatCard, pretty } from "@/components/AppHeader";
import { EstadoBadge } from "@/components/EstadoBadge";
import { countBy, distinct, useInventory } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Inventario TI" },
      { name: "description", content: "Resumen del inventario de activos de la Gerencia de Informática." },
      { property: "og:title", content: "Dashboard · Inventario TI" },
      { property: "og:description", content: "Resumen del inventario de activos de la Gerencia de Informática." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const list = useInventory();
  const estados = countBy(list, "estado");
  const tipos = countBy(list, "tipo");
  const tipoKeys = distinct(list, "tipo");
  const max = Math.max(...tipoKeys.map((t) => tipos[t] ?? 0), 1);
  const atencion = list.filter((a) => ["DAÑADO", "GESTION CAMBIO DE EQUIPO", "PENDIENTE DE VALIDAR"].includes(a.estado)).slice(0, 8);

  return (
    <>
      <PageTitle title="Dashboard" subtitle="Inventario de activos tecnológicos 2026" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total activos" value={list.length} hint="Registrados" />
        <StatCard label="Operativos" value={estados["OPERATIVO"] ?? 0} hint="Estado del activo" tone="success" />
        <StatCard label="Con cambio de equipo" value={estados["GESTION CAMBIO DE EQUIPO"] ?? 0} hint="Estado del activo" tone="warning" />
        <StatCard label="Dañados" value={estados["DAÑADO"] ?? 0} hint="Estado del activo" tone="destructive" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <h2 className="mb-4 font-semibold">Activos por tipo</h2>
          <div className="space-y-3">
            {tipoKeys.map((t) => (
              <div key={t}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{pretty(t)}</span>
                  <span className="font-semibold tabular-nums">{tipos[t] ?? 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${((tipos[t] ?? 0) / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Requieren atención</h2>
            <Link to="/inventario" className="text-sm text-primary hover:underline">Ver inventario</Link>
          </div>
          <ul className="divide-y">
            {atencion.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{a.tipo} · {a.marca} {a.modelo}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.id} · {a.usuario || "Sin usuario"} · {a.area}</div>
                </div>
                <EstadoBadge estado={a.estado} />
              </li>
            ))}
            {atencion.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nada pendiente</li>}
          </ul>
        </div>
      </div>
    </>
  );
}
