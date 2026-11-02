import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ESTADOS, TIPOS, removeActivo, updateEstado, useInventory, type Estado } from "@/lib/inventory";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario · Inventario TI" },
      { name: "description", content: "Listado completo de activos TI con búsqueda y filtros." },
      { property: "og:title", content: "Inventario · Inventario TI" },
      { property: "og:description", content: "Listado completo de activos TI con búsqueda y filtros." },
    ],
  }),
  component: Inventario,
});

const PAGE = 25;

function Inventario() {
  const list = useInventory();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [estado, setEstado] = useState("todos");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter(
      (a) =>
        (tipo === "todos" || a.tipo === tipo) &&
        (estado === "todos" || a.estado === estado) &&
        (!s || [a.codigo, a.marca, a.modelo, a.serie, a.responsable, a.ubicacion].some((v) => v.toLowerCase().includes(s))),
    );
  }, [list, q, tipo, estado]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE, current * PAGE + PAGE);

  return (
    <>
      <PageTitle
        title="Inventario"
        subtitle={`${filtered.length} de ${list.length} activos`}
        action={<Button asChild><Link to="/nuevo">Nuevo activo</Link></Button>}
      />
      <div className="panel mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por código, serie, responsable…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        <Select value={tipo} onValueChange={(v) => { setTipo(v); setPage(0); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={(v) => { setEstado(v); setPage(0); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Equipo</th>
              <th className="px-4 py-3">Serie</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-muted/40">
                <td className="px-4 py-2.5 font-mono text-xs">{a.codigo}</td>
                <td className="px-4 py-2.5">{a.tipo}</td>
                <td className="px-4 py-2.5">{a.marca} {a.modelo}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{a.serie}</td>
                <td className="px-4 py-2.5">{a.responsable}</td>
                <td className="px-4 py-2.5">{a.ubicacion}</td>
                <td className="px-4 py-2.5">
                  <Select value={a.estado} onValueChange={(v) => updateEstado(a.id, v as Estado)}>
                    <SelectTrigger className="h-8 w-[150px]" aria-label={`Estado de ${a.codigo}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${a.codigo}`}
                    onClick={() => {
                      if (confirm(`¿Eliminar ${a.codigo}?`)) {
                        removeActivo(a.id);
                        toast.success(`${a.codigo} eliminado`);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Página {current + 1} de {pages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Siguiente</Button>
        </div>
      </div>
    </>
  );
}
