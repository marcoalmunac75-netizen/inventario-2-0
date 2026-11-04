import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Trash2, UserPen } from "lucide-react";
import { ActualizarUsuarioDialog } from "@/components/ActualizarUsuarioDialog";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppHeader";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLUMNAS, ESTADOS, distinct, formatFecha, useRemoveActivo, useUpdateEstado, useInventory, type Activo } from "@/lib/inventory";
import { useIsAdmin } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/inventario")({
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
const SEARCH_KEYS: (keyof Activo)[] = ["id", "marca", "modelo", "serie", "nInventario", "usuario", "area", "responsable", "ip", "mac", "empresa"];

function Inventario() {
  const list = useInventory();
  const [editar, setEditar] = useState<Activo | null>(null);
  const { user } = Route.useRouteContext();
  const isAdmin = useIsAdmin(user.id);
  const upd = useUpdateEstado();
  const del = useRemoveActivo();
  const updateEstado = (id: string, estado: string) =>
    upd.mutate({ id, estado }, { onError: () => toast.error("No se pudo cambiar el estado") });
  const removeActivo = (id: string) =>
    del.mutate(id, { onSuccess: () => toast.success(`${id} eliminado`), onError: () => toast.error("No se pudo eliminar") });
  const [q, setQ] = useState("");
  const [f, setF] = useState({ tipo: "todos", estado: "todos", ubicacion: "todos", empresa: "todos" });
  const [page, setPage] = useState(0);
  const [detalle, setDetalle] = useState<Activo | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter(
      (a) =>
        (Object.keys(f) as (keyof typeof f)[]).every((k) => f[k] === "todos" || a[k] === f[k]) &&
        (!s || SEARCH_KEYS.some((k) => a[k].toLowerCase().includes(s))),
    );
  }, [list, q, f]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE, current * PAGE + PAGE);
  const setFilter = (k: keyof typeof f, v: string) => { setF((p) => ({ ...p, [k]: v })); setPage(0); };

  const filtros: { k: keyof typeof f; label: string; opts: string[] }[] = [
    { k: "tipo", label: "Todos los tipos", opts: distinct(list, "tipo") },
    { k: "estado", label: "Todos los estados", opts: [...ESTADOS] },
    { k: "ubicacion", label: "Todas las ubicaciones", opts: distinct(list, "ubicacion") },
    { k: "empresa", label: "Todas las empresas", opts: distinct(list, "empresa") },
  ];

  return (
    <>
      <PageTitle
        title="Inventario"
        subtitle={`${filtered.length} de ${list.length} activos`}
        action={isAdmin ? <Button asChild><Link to="/nuevo">Nuevo activo</Link></Button> : undefined}
      />
      <div className="panel mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar serie, usuario, IP…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        {filtros.map((fl) => (
          <Select key={fl.k} value={f[fl.k]} onValueChange={(v) => setFilter(fl.k, v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">{fl.label}</SelectItem>
              {fl.opts.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
      </div>

      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Tipo</th>
              <th className="px-3 py-3">Equipo</th>
              <th className="px-3 py-3">N° serie</th>
              <th className="px-3 py-3">Usuario</th>
              <th className="px-3 py-3">Área</th>
              <th className="px-3 py-3">Ubicación</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((a) => (
              <tr key={a.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetalle(a)}>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{a.id}</td>
                <td className="px-3 py-2.5 text-xs">{a.tipo}</td>
                <td className="px-3 py-2.5">{a.marca} <span className="text-muted-foreground">{a.modelo}</span></td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{a.serie || "—"}</td>
                <td className="px-3 py-2.5">{a.usuario || "—"}</td>
                <td className="px-3 py-2.5 text-xs">{a.area || "—"}</td>
                <td className="px-3 py-2.5 text-xs">{a.ubicacion || "—"}</td>
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  {isAdmin ? (
                    <Select value={a.estado} onValueChange={(v) => updateEstado(a.id, v)}>
                      <SelectTrigger className="h-8 w-[190px] text-xs" aria-label={`Estado de ${a.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <EstadoBadge estado={a.estado} />
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="icon" aria-label={`Actualizar usuario de ${a.id}`} title="Actualizar usuario" onClick={() => setEditar(a)}>
                        <UserPen className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${a.id}`}
                        title="Eliminar"
                        onClick={() => {
                          if (confirm(`¿Eliminar ${a.id}?`)) removeActivo(a.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Sin resultados</td></tr>
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

      <ActualizarUsuarioDialog activo={editar} usuarios={distinct(list, "usuario")} onClose={() => setEditar(null)} />

      <Dialog open={!!detalle} onOpenChange={(o) => !o && setDetalle(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {detalle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {detalle.id} · {detalle.tipo} <EstadoBadge estado={detalle.estado} />
                </DialogTitle>
              </DialogHeader>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {COLUMNAS.filter((c) => c.key !== "id" && c.key !== "estado").map((c) => (
                  <div key={c.key}>
                    <dt className="text-xs text-muted-foreground">{c.label}</dt>
                    <dd className="text-sm">{c.key === "fechaEntrega" ? formatFecha(detalle[c.key]) : detalle[c.key] || "—"}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
