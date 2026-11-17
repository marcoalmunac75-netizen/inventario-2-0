import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageTitle, StatCard, estadoTone, pretty } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { countBy, distinct, toCsv, useInventory, type Activo } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes · Inventario TI" },
      { name: "description", content: "Indicadores para la gestión de TI: activos por tipo, estado, ubicación y empresa." },
      { property: "og:title", content: "Reportes · Inventario TI" },
      { property: "og:description", content: "Indicadores para la gestión de TI: activos por tipo, estado, ubicación y empresa." },
    ],
  }),
  component: Reportes,
});

function Reportes() {
  const list = useInventory();
  const tipos = countBy(list, "tipo");
  const estados = countBy(list, "estado");
  const sin = (k: keyof Activo) => list.filter((a) => !a[k]).length;

  const exportar = () => exportarCsv(list, `inventario-ti-${hoy()}.csv`);
  const empresas = distinct(list, "empresa");

  return (
    <>
      <PageTitle
        title="Reportes"
        subtitle="Indicadores para gestión de TI"
        action={<Button variant="outline" onClick={exportar}><Download className="h-4 w-4" />Exportar a Excel (CSV)</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Notebooks" value={tipos["NOTEBOOK"] ?? 0} hint="Tipo de activo" />
        <StatCard label="Monitores" value={tipos["MONITOR"] ?? 0} hint="Tipo de activo" />
        <StatCard label="Operativos" value={estados["OPERATIVO"] ?? 0} hint="Estado del activo" tone="success" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Breakdown title="Distribución por tipo de activo" list={list} k="tipo" />
        <Breakdown title="Distribución por estado" list={list} k="estado" tone />
        <Breakdown title="Distribución por empresa" list={list} k="empresa" raw />
        <Breakdown title="Distribución por ubicación" list={list} k="ubicacion" raw />
        <Breakdown title="Distribución por área" list={list} k="area" raw />
        <div className="panel">
          <h2 className="mb-3 font-semibold">Exportar por empresa</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {empresas.map((e) => (
                <tr key={e}>
                  <td className="py-2">{e}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{countBy(list, "empresa")[e] ?? 0}</td>
                  <td className="w-24 py-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportarCsv(list.filter((a) => a.empresa === e), `inventario-${slugEmpresa(e)}-${hoy()}.csv`)}
                    >
                      <Download className="h-4 w-4" />CSV
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h2 className="mb-3 font-semibold">Puntos a completar / validar</h2>
          <Rows
            total={list.length}
            rows={[
              ["Activos sin usuario asignado", sin("usuario")],
              ["Activos sin responsable", sin("responsable")],
              ["Activos sin fecha de entrega", sin("fechaEntrega")],
              ["Activos sin garantía informada", sin("garantia")],
              ["Activos sin sistema operativo informado", list.filter((a) => !a.so && ["NOTEBOOK", "PC", "MINI PC"].includes(a.tipo)).length],
              ["Activos sin IP informada", sin("ip")],
            ]}
          />
        </div>
      </div>
    </>
  );
}

const hoy = () => new Date().toISOString().slice(0, 10);

/** Nombre de archivo seguro a partir del nombre de la empresa. */
export function slugEmpresa(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function exportarCsv(list: Activo[], filename: string) {
  const blob = new Blob(["\uFEFF" + toCsv(list)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Breakdown({ title, list, k, tone, raw }: { title: string; list: Activo[]; k: keyof Activo; tone?: boolean; raw?: boolean }) {
  const c = countBy(list, k);
  const keys = distinct(list, k);
  if (c["SIN INFORMACIÓN"]) keys.push("SIN INFORMACIÓN");
  return (
    <div className="panel">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <Rows total={list.length} rows={keys.map((v) => [raw ? v : pretty(v), c[v] ?? 0, tone ? estadoTone(v) : undefined])} />
    </div>
  );
}

function Rows({ rows, total }: { rows: [string, number, (string | undefined)?][]; total: number }) {
  const toneClass: Record<string, string> = { success: "text-success", warning: "text-warning", destructive: "text-destructive" };
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y">
        {rows.map(([label, n, t]) => (
          <tr key={label}>
            <td className="py-2">{label}</td>
            <td className={`py-2 text-right font-semibold tabular-nums ${t ? toneClass[t] ?? "" : ""}`}>{n}</td>
            <td className="w-14 py-2 text-right text-muted-foreground tabular-nums">{total ? Math.round((n / total) * 100) : 0}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
