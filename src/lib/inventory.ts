import { useSyncExternalStore } from "react";
import seedData from "@/data/inventario.json";

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

const STORAGE_KEY = "inventario-ti:v2";

export function buildSeed(): Activo[] {
  return (seedData as Activo[]).map((a) => ({ ...a }));
}

let state: Activo[] = buildSeed();
const listeners = new Set<() => void>();
let loaded = false;

function emit() {
  listeners.forEach((l) => l());
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadInventory() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    localStorage.removeItem("inventario-ti:v1");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      emit();
    }
  } catch {
    /* ignore */
  }
}

const num = (id: string) => parseInt(id.replace(/\D/g, ""), 10) || 0;

export function nextId(list: Activo[]): { id: string; nInventario: string } {
  const max = list.reduce((m, a) => Math.max(m, num(a.id), num(a.nInventario)), 0);
  return { id: `ACT-${String(max + 1).padStart(4, "0")}`, nInventario: String(max + 1) };
}

export function addActivo(data: NuevoActivo): Activo {
  const activo: Activo = { ...data, ...nextId(state) };
  state = [...state, activo];
  persist();
  emit();
  return activo;
}

export function updateEstado(id: string, estado: string) {
  state = state.map((a) => (a.id === id ? { ...a, estado } : a));
  persist();
  emit();
}

export function removeActivo(id: string) {
  state = state.filter((a) => a.id !== id);
  persist();
  emit();
}

export function resetInventory() {
  state = buildSeed();
  persist();
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const seedSnapshot = state;

export function useInventory() {
  return useSyncExternalStore(subscribe, () => state, () => seedSnapshot);
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
    .sort((a, b) => c[b] - c[a]);
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
