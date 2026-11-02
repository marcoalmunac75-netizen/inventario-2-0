import { createFileRoute, Link } from "@tanstack/react-router";
import { PageTitle, StatCard } from "@/components/AppHeader";
import { EstadoBadge } from "@/components/EstadoBadge";
import { TIPOS, countBy, useInventory } from "@/lib/inventory";

export const Route = createFileRoute("/")({
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
  const recientes = [...list].sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, 6);
  const max = Math.max(...TIPOS.map((t) => tipos[t] ?? 0), 1);

  return (
    <>
      <PageTitle title="Dashboard" subtitle="Resumen general del parque tecnológico" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total activos" value={list.length} hint="Registrados" />
        <StatCard label="Operativos" value={estados["Operativo"] ?? 0} hint="Estado del activo" tone="success" />
        <StatCard label="En reparación" value={estados["En reparación"] ?? 0} hint="Estado del activo" tone="warning" />
        <StatCard label="De baja" value={estados["De baja"] ?? 0} hint="Estado del activo" tone="destructive" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <h2 className="mb-4 font-semibold">Activos por tipo</h2>
          <div className="space-y-3">
            {TIPOS.map((t) => (
              <div key={t}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{t}</span>
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
            <h2 className="font-semibold">Últimos registros</h2>
            <Link to="/inventario" className="text-sm text-primary hover:underline">Ver todo</Link>
          </div>
          <ul className="divide-y">
            {recientes.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{a.marca} {a.modelo}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.codigo} · {a.responsable}</div>
                </div>
                <EstadoBadge estado={a.estado} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
