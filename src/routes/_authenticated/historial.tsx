import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import { PageTitle } from "@/components/AppHeader";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatFecha, parseFecha, useInventory, type Activo } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/historial")({
  head: () => ({
    meta: [
      { title: "Historial de Activos · Inventario TI" },
      { name: "description", content: "Busca un equipo y revisa sus entregas y cambios de estado a lo largo del tiempo." },
      { property: "og:title", content: "Historial de Activos · Inventario TI" },
      { property: "og:description", content: "Busca un equipo y revisa sus entregas y cambios de estado a lo largo del tiempo." },
    ],
  }),
  component: Historial,
});

const SEARCH_KEYS: (keyof Activo)[] = ["id", "serie", "nInventario", "usuario", "area", "responsable", "marca", "modelo", "ip", "mac", "empresa"];

const CAMPOS: Record<string, string> = {
  estado: "Estado",
  usuario: "Usuario",
  area: "Área",
  responsable: "Responsable",
  ubicacion: "Ubicación",
  empresa: "Empresa",
};

interface Evento {
  id: number;
  activo_id: string;
  tipo_evento: string;
  campo: string;
  valor_anterior: string;
  valor_nuevo: string;
  usuario_email: string;
  creado_at: string;
}

function Historial() {
  const list = useInventory();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Activo | null>(null);

  const resultados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return list.filter((a) => SEARCH_KEYS.some((k) => a[k].toLowerCase().includes(s))).slice(0, 60);
  }, [list, q]);

  const eventos = useQuery({
    queryKey: ["activo-eventos", sel?.id],
    enabled: !!sel,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activo_eventos")
        .select("*")
        .eq("activo_id", sel?.id ?? "")
        .order("creado_at", { ascending: true })
        .order("id", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Evento[];
    },
  });

  return (
    <>
      <PageTitle title="Historial de Activos" subtitle="Busca un equipo y revisa sus entregas y cambios" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="panel h-fit">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="ID, serie, usuario, IP…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSel(null);
              }}
              aria-label="Buscar equipo"
            />
          </div>
          <ul className="mt-3 max-h-[60vh] divide-y overflow-y-auto">
            {resultados.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className={`w-full px-1 py-2.5 text-left transition-colors hover:bg-muted/60 ${sel?.id === a.id ? "bg-muted" : ""}`}
                  onClick={() => setSel(a)}
                >
                  <div className="font-mono text-xs">{a.id}</div>
                  <div className="text-sm">
                    {a.tipo} · {a.marca} {a.modelo}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.usuario || "Sin usuario"} · {a.ubicacion || "Sin ubicación"}
                  </div>
                </button>
              </li>
            ))}
            {q.trim() && resultados.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Sin coincidencias</li>}
            {!q.trim() && <li className="py-6 text-center text-sm text-muted-foreground">Escribe para buscar un equipo</li>}
          </ul>
        </div>

        <div className="panel">
          {!sel ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <History className="h-7 w-7" />
              <p className="text-sm">Elige un equipo de la lista para ver su historial.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h2 className="font-mono text-sm">{sel.id}</h2>
                  <p className="text-sm">
                    {sel.tipo} · {sel.marca} {sel.modelo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sel.usuario || "Sin usuario"} · {sel.area || "Sin área"} · {sel.ubicacion || "Sin ubicación"} · {sel.empresa || "Sin empresa"}
                  </p>
                </div>
                <EstadoBadge estado={sel.estado} />
              </div>

              <ol className="mt-4 space-y-4">
                <li className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm font-medium">Entrega registrada</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFecha(parseFecha(sel.fechaEntrega) ?? sel.fechaEntrega)} · fecha en la planilla
                    </div>
                  </div>
                </li>

                {eventos.isLoading && <li className="text-sm text-muted-foreground">Cargando historial…</li>}
                {eventos.isError && <li className="text-sm text-destructive">No se pudo leer el historial.</li>}

                {(eventos.data ?? []).map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${e.tipo_evento === "baja" ? "bg-destructive" : e.tipo_evento === "alta" ? "bg-success" : "bg-warning"}`} />
                    <div>
                      <div className="text-sm font-medium">{titulo(e)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFechaHora(e.creado_at)}
                        {e.usuario_email ? ` · ${e.usuario_email}` : ""}
                      </div>
                    </div>
                  </li>
                ))}

                {!eventos.isLoading && !eventos.isError && (eventos.data ?? []).length === 0 && (
                  <li className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                    Sin cambios registrados todavía. Desde ahora queda anotado cada cambio de estado, usuario, área, responsable, ubicación o empresa.
                  </li>
                )}
              </ol>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function titulo(e: Evento): string {
  if (e.tipo_evento === "alta") return `Alta en el inventario${e.valor_nuevo ? ` · ${e.valor_nuevo}` : ""}`;
  if (e.tipo_evento === "baja") return "Baja del inventario";
  const campo = CAMPOS[e.campo] ?? e.campo;
  const antes = e.valor_anterior || "sin dato";
  const ahora = e.valor_nuevo || "sin dato";
  return `Cambio de ${campo}: ${antes} → ${ahora}`;
}

/** "2026-11-20T16:41:00Z" → "20-11-2026 13:41" (hora local de Chile) */
export function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
