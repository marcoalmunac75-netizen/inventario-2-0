import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageTitle, StatCard, estadoTone } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ESTADOS, TIPOS, UBICACIONES, countBy, toCsv, useInventory } from "@/lib/inventory";

export const Route = createFileRoute("/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes · Inventario TI" },
      { name: "description", content: "Indicadores para la gestión de TI: activos por tipo, estado y ubicación." },
      { property: "og:title", content: "Reportes · Inventario TI" },
      { property: "og:description", content: "Indicadores para la gestión de TI: activos por tipo, estado y ubicación." },
    ],
  }),
  component: Reportes,
});

const plural: Record<string, string> = {
  Notebook: "Notebooks",
  Monitor: "Monitores",
  Desktop: "Desktops",
  Impresora: "Impresoras",
  Periférico: "Periféricos",
  Operativo: "Operativos",
  "En reparación": "En reparación",
  "En bodega": "En bodega",
  "De baja": "De baja",
};

function Reportes() {
  const list = useInventory();
  const tipos = countBy(list, "tipo");
  const estados = countBy(list, "estado");
  const ubic = countBy(list, "ubicacion");

  const exportar = () => {
    const blob = new Blob(["\uFEFF" + toCsv(list)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario-ti-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageTitle
        title="Reportes"
        subtitle="Indicadores para gestión de TI"
        action={<Button variant="outline" onClick={exportar}><Download className="h-4 w-4" />Exportar CSV</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TIPOS.map((t) => (
          <StatCard key={t} label={plural[t]} value={tipos[t] ?? 0} hint="Tipo de activo" />
        ))}
        {ESTADOS.map((e) => (
          <StatCard key={e} label={plural[e]} value={estados[e] ?? 0} hint="Estado del activo" tone={estadoTone(e)} />
        ))}
      </div>

      <div className="panel mt-4">
        <h2 className="mb-3 font-semibold">Activos por ubicación</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {UBICACIONES.map((u) => (
              <tr key={u}>
                <td className="py-2">{u}</td>
                <td className="py-2 text-right font-semibold tabular-nums">{ubic[u] ?? 0}</td>
                <td className="w-16 py-2 text-right text-muted-foreground tabular-nums">
                  {list.length ? Math.round(((ubic[u] ?? 0) / list.length) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
