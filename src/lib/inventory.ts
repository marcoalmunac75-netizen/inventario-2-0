import { useSyncExternalStore } from "react";

export const TIPOS = ["Notebook", "Monitor", "Desktop", "Impresora", "Periférico"] as const;
export const ESTADOS = ["Operativo", "En reparación", "En bodega", "De baja"] as const;
export const UBICACIONES = ["Casa matriz", "Sucursal Norte", "Sucursal Sur", "Bodega TI"] as const;

export type Tipo = (typeof TIPOS)[number];
export type Estado = (typeof ESTADOS)[number];

export interface Activo {
  id: string;
  codigo: string;
  tipo: Tipo;
  marca: string;
  modelo: string;
  serie: string;
  estado: Estado;
  responsable: string;
  ubicacion: string;
  fechaCompra: string;
  creado: string;
}

export type NuevoActivo = Omit<Activo, "id" | "codigo" | "creado">;

const STORAGE_KEY = "inventario-ti:v1";

const MARCAS: Record<Tipo, [string, string][]> = {
  Notebook: [["Lenovo", "ThinkPad E14"], ["Dell", "Latitude 5440"], ["HP", "ProBook 440"]],
  Monitor: [["Samsung", 'S24 24"'], ["LG", '27MP400 27"'], ["Dell", 'P2422H 24"']],
  Desktop: [["Lenovo", "ThinkCentre M70"], ["HP", "EliteDesk 800"]],
  Impresora: [["Brother", "HL-L5100"], ["HP", "LaserJet M404"]],
  Periférico: [["Logitech", "MK270"], ["Jabra", "Evolve 20"]],
};
const NOMBRES = ["Ana Rojas", "Pedro Soto", "Camila Muñoz", "Diego Pérez", "Valentina Díaz", "Jorge Contreras", "Francisca Silva", "Matías González", "Javiera Morales", "Felipe Araya"];
const PREFIJO: Record<Tipo, string> = { Notebook: "NB", Monitor: "MN", Desktop: "PC", Impresora: "IM", Periférico: "PF" };

/** Datos de ejemplo determinísticos (147 notebooks, 92 monitores, 162 operativos). */
export function buildSeed(): Activo[] {
  let s = 42;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const counts: [Tipo, number][] = [["Notebook", 147], ["Monitor", 92], ["Desktop", 18], ["Impresora", 11], ["Periférico", 14]];
  const list: Activo[] = [];
  const perTipo: Record<string, number> = {};
  for (const [tipo, n] of counts) {
    for (let i = 0; i < n; i++) {
      perTipo[tipo] = (perTipo[tipo] ?? 0) + 1;
      const [marca, modelo] = MARCAS[tipo][Math.floor(rnd() * MARCAS[tipo].length)];
      const year = 2020 + Math.floor(rnd() * 6);
      const month = 1 + Math.floor(rnd() * 12);
      list.push({
        id: `${PREFIJO[tipo]}-${perTipo[tipo]}`,
        codigo: `${PREFIJO[tipo]}-${String(perTipo[tipo]).padStart(4, "0")}`,
        tipo,
        marca,
        modelo,
        serie: Math.floor(rnd() * 1e10).toString(36).toUpperCase().padStart(8, "X"),
        estado: "Operativo",
        responsable: NOMBRES[Math.floor(rnd() * NOMBRES.length)],
        ubicacion: UBICACIONES[Math.floor(rnd() * UBICACIONES.length)],
        fechaCompra: `${year}-${String(month).padStart(2, "0")}-15`,
        creado: `${year}-${String(month).padStart(2, "0")}-15T12:00:00.000Z`,
      });
    }
  }
  const order = list.map((a, i) => ({ i, r: rnd() })).sort((a, b) => a.r - b.r);
  const others: Estado[] = ["En reparación", "En bodega", "De baja"];
  order.forEach(({ i }, k) => {
    list[i].estado = k < 162 ? "Operativo" : others[k % 3];
  });
  return list;
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      emit();
    }
  } catch {
    /* ignore */
  }
}

export function addActivo(data: NuevoActivo): Activo {
  const pref = PREFIJO[data.tipo];
  const max = state
    .filter((a) => a.tipo === data.tipo)
    .reduce((m, a) => Math.max(m, parseInt(a.codigo.split("-")[1] ?? "0", 10) || 0), 0);
  const activo: Activo = {
    ...data,
    id: crypto.randomUUID(),
    codigo: `${pref}-${String(max + 1).padStart(4, "0")}`,
    creado: new Date().toISOString(),
  };
  state = [activo, ...state];
  persist();
  emit();
  return activo;
}

export function updateEstado(id: string, estado: Estado) {
  state = state.map((a) => (a.id === id ? { ...a, estado } : a));
  persist();
  emit();
}

export function removeActivo(id: string) {
  state = state.filter((a) => a.id !== id);
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
    const v = String(a[key]);
    out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

export function toCsv(list: Activo[]): string {
  const cols: (keyof Activo)[] = ["codigo", "tipo", "marca", "modelo", "serie", "estado", "responsable", "ubicacion", "fechaCompra"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [cols.join(","), ...list.map((a) => cols.map((c) => esc(String(a[c]))).join(","))].join("\n");
}
