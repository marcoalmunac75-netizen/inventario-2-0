import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/** Valores estandarizados tomados de la planilla "Inventario TI" de la Gerencia de Informática. */
export const TIPOS = [
  "NOTEBOOK",
  "MONITOR",
  "IMPRESORA",
  "PC",
  "UPS",
  "SWITCH",
  "IMPRESORA DE CHEQUES",
  "NVR",
  "MINI PC",
  "FIREWALL / SEGURIDAD DE RED",
  "ACCESS POINT",
  "CELULAR",
] as const;

export const ESTADOS = [
  "OPERATIVO",
  "EQUIPO NUEVO",
  "REACONDICIONADO",
  "GESTION CAMBIO DE EQUIPO",
  "EN BODEGA",
  "PENDIENTE DE VALIDAR",
  "DAÑADO",
  "BAJA",
] as const;

export const UBICACIONES = ["SANTIAGO", "BODEGA SANTIAGO", "ANTOFAGASTA", "CONCEPCION", "CALAMA"] as const;

export const EMPRESAS = [
  "CABAL SERVICIOS SPA",
  "COMERCIAL BRASIL BUSES LTDA",
  "COMPAÑÍA DE COMBUSTIBLE CABAL S.A.",
  "VIS SPA",
  "JETZ AGENCIA SPA",
] as const;

export type Estado = (typeof ESTADOS)[number];

export interface Activo {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
  serie: string;
  nInventario: string;
  usuario: string;
  area: string;
  ubicacion: string;
  estado: string;
  fechaEntrega: string;
  garantia: string;
  so: string;
  ram: string;
  disco: string;
  ip: string;
  mac: string;
  responsable: string;
  observaciones: string;
  empresa: string;
}

export type NuevoActivo = Omit<Activo, "id" | "nInventario">;

type Row = Database["public"]["Tables"]["activos"]["Row"];
type Insert = Database["public"]["Tables"]["activos"]["Insert"];

export function fromRow(r: Row): Activo {
  return {
    id: r.id,
    tipo: r.tipo,
    marca: r.marca,
    modelo: r.modelo,
    serie: r.serie,
    nInventario: r.n_inventario,
    usuario: r.usuario,
    area: r.area,
    ubicacion: r.ubicacion,
    estado: r.estado,
    fechaEntrega: r.fecha_entrega,
    garantia: r.garantia,
    so: r.so,
    ram: r.ram,
    disco: r.disco,
    ip: r.ip,
    mac: r.mac,
    responsable: r.responsable,
    observaciones: r.observaciones,
    empresa: r.empresa,
  };
}

export function toInsert(a: NuevoActivo): Insert {
  const { fechaEntrega, ...rest } = a;
  // id vacío: la base de datos asigna el siguiente ID ACTIVO y N° de inventario.
  return { ...rest, fecha_entrega: fechaEntrega, id: "", n_inventario: "" };
}

export const ACTIVOS_KEY = ["activos"] as const;

async function fetchActivos(): Promise<Activo[]> {
  const out: Activo[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase.from("activos").select("*").order("id").range(from, from + size - 1);
    if (error) throw error;
    out.push(...data.map(fromRow));
    if (data.length < size) return out;
  }
}

const EMPTY: Activo[] = [];

export function useInventory(): Activo[] {
  const { data } = useQuery({ queryKey: ACTIVOS_KEY, queryFn: fetchActivos });
  return data ?? EMPTY;
}

export function useInventoryStatus() {
  return useQuery({ queryKey: ACTIVOS_KEY, queryFn: fetchActivos });
}

export function useAddActivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: NuevoActivo) => {
      const { data, error } = await supabase.from("activos").insert(toInsert(a)).select().single();
      if (error) throw error;
      return fromRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACTIVOS_KEY }),
  });
}

export function useUpdateEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("activos").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onMutate: ({ id, estado }) => {
      qc.setQueryData<Activo[]>(ACTIVOS_KEY, (l) => l?.map((a) => (a.id === id ? { ...a, estado } : a)));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ACTIVOS_KEY }),
  });
}

export function useRemoveActivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("activos").delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ACTIVOS_KEY }),
  });
}

export function countBy<K extends keyof Activo>(list: Activo[], key: K): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of list) {
    const v = a[key] || "SIN INFORMACIÓN";
    out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

/** Valores presentes en los datos, ordenados por frecuencia. */
export function distinct(list: Activo[], key: keyof Activo): string[] {
  const c = countBy(list, key);
  return Object.keys(c)
    .filter((k) => k !== "SIN INFORMACIÓN")
    .sort((a, b) => (c[b] ?? 0) - (c[a] ?? 0));
}

export function formatFecha(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : v || "—";
}

export const COLUMNAS: { key: keyof Activo; label: string }[] = [
  { key: "id", label: "ID ACTIVO" },
  { key: "tipo", label: "TIPO DE ACTIVO" },
  { key: "marca", label: "MARCA" },
  { key: "modelo", label: "MODELO" },
  { key: "serie", label: "N° DE SERIE" },
  { key: "nInventario", label: "N° DE INVENTARIO" },
  { key: "usuario", label: "USUARIO" },
  { key: "area", label: "ÁREA" },
  { key: "ubicacion", label: "UBICACIÓN" },
  { key: "estado", label: "ESTADO" },
  { key: "fechaEntrega", label: "FECHA DE ENTREGA" },
  { key: "garantia", label: "GARANTÍA" },
  { key: "so", label: "SISTEMA OPERATIVO" },
  { key: "ram", label: "RAM (GB)" },
  { key: "disco", label: "DISCO (GB)" },
  { key: "ip", label: "IP" },
  { key: "mac", label: "MAC" },
  { key: "responsable", label: "RESPONSABLE" },
  { key: "observaciones", label: "OBSERVACIONES" },
  { key: "empresa", label: "EMPRESA" },
];

export function toCsv(list: Activo[]): string {
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    COLUMNAS.map((c) => esc(c.label)).join(";"),
    ...list.map((a) => COLUMNAS.map((c) => esc(a[c.key])).join(";")),
  ].join("\n");
}
