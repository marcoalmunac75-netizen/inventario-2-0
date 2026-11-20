import {
  COLUMNAS,
  EMPRESAS,
  ESTADOS,
  TIPOS,
  UBICACIONES,
  parseFecha,
  type Activo,
  type NuevoActivo,
} from "@/lib/inventory";

export type Celda = string | number | boolean | null | undefined;

/** Hoja ya dividida en encabezado y filas de datos. */
export interface Hoja {
  nombre: string;
  /** Fila (1-based, tal como se ve en Excel) que contiene el encabezado. */
  filaEncabezado: number;
  encabezados: string[];
  filas: Celda[][];
}

export const CAMPOS = [
  "id",
  "tipo",
  "marca",
  "modelo",
  "serie",
  "nInventario",
  "usuario",
  "area",
  "ubicacion",
  "estado",
  "fechaEntrega",
  "garantia",
  "so",
  "ram",
  "disco",
  "ip",
  "mac",
  "responsable",
  "observaciones",
  "empresa",
] as const;

export type Campo = (typeof CAMPOS)[number];
export type Mapeo = Partial<Record<Campo, number>>;

export const ETIQUETAS = Object.fromEntries(COLUMNAS.map((c) => [c.key, c.label])) as Record<Campo, string>;

/** Columnas de la base de datos que no se escriben desde el archivo. */
const NO_ESCRIBIBLES: Campo[] = ["id", "nInventario"];

const ALIAS: Record<Campo, string[]> = {
  id: ["id activo", "id", "activo", "codigo activo"],
  tipo: ["tipo de activo", "tipo", "tipo equipo"],
  marca: ["marca"],
  modelo: ["modelo", "modelo equipo"],
  serie: ["n de serie", "numero de serie", "n serie", "serie", "serial"],
  nInventario: ["n de inventario", "numero de inventario", "n inventario", "inventario", "nro inventario"],
  usuario: ["usuario", "nombre usuario", "persona"],
  area: ["area", "departamento", "unidad"],
  ubicacion: ["ubicacion", "localizacion", "sede", "sitio"],
  estado: ["estado", "estado del activo", "condicion"],
  fechaEntrega: ["fecha de entrega", "fecha entrega", "fecha"],
  garantia: ["garantia", "fecha garantia", "vencimiento garantia"],
  so: ["sistema operativo", "so", "s o", "sistema operatico"],
  ram: ["ram", "ram gb", "memoria ram"],
  disco: ["disco", "disco gb", "almacenamiento", "disco duro"],
  ip: ["ip", "direccion ip"],
  mac: ["mac", "direccion mac"],
  responsable: ["responsable", "responsable area"],
  observaciones: ["observaciones", "observacion", "comentarios", "notas"],
  empresa: ["empresa", "compania", "sociedad", "razon social"],
};

export function quitarAcentos(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Minúsculas, sin acentos, solo letras y números separados por un espacio. */
export function normalizarTexto(s: string): string {
  return quitarAcentos(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Celda convertida a texto limpio, lista para guardar. */
export function texto(c: Celda): string {
  if (c == null) return "";
  if (typeof c === "boolean") return c ? "SI" : "NO";
  return String(c).replace(/\s+/g, " ").trim();
}

function canonicos(vals: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of vals) out[normalizarTexto(v)] = v;
  return out;
}

const MAPA_ESTADO = canonicos(ESTADOS);
const MAPA_TIPO = canonicos(TIPOS);
const MAPA_UBICACION = canonicos(UBICACIONES);
const MAPA_EMPRESA = canonicos(EMPRESAS);

/** Lleva el valor a la lista estándar si se reconoce (aun con acentos o mayúsculas distintas). */
function resolver(v: string, mapa: Record<string, string>): string {
  if (!v) return "";
  return mapa[normalizarTexto(v)] ?? v.toUpperCase();
}

export const normalizarEstado = (v: Celda) => resolver(texto(v), MAPA_ESTADO);
export const normalizarTipo = (v: Celda) => resolver(texto(v), MAPA_TIPO);

/** "ACT-0001", "1" y "0001" dan la misma clave. Sin dígitos, el texto normalizado. */
export function claveNumero(s: string): string {
  const digitos = s.replace(/\D/g, "");
  if (digitos) return String(parseInt(digitos, 10));
  const t = normalizarTexto(s);
  return t ? t.toUpperCase() : "";
}

/** Series con espacios o guantes distintos se consideran la misma. */
export function claveSerie(s: string): string {
  return quitarAcentos(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export interface Indice {
  porId: Map<string, Activo>;
  porInventario: Map<string, Activo>;
  porSerie: Map<string, Activo>;
}

export function construirIndice(list: Activo[]): Indice {
  const idx: Indice = { porId: new Map(), porInventario: new Map(), porSerie: new Map() };
  for (const a of list) {
    const k = claveNumero(a.id);
    if (k && !idx.porId.has(k)) idx.porId.set(k, a);
    const ki = claveNumero(a.nInventario);
    if (ki && !idx.porInventario.has(ki)) idx.porInventario.set(ki, a);
    const ks = claveSerie(a.serie);
    if (ks && !idx.porSerie.has(ks)) idx.porSerie.set(ks, a);
  }
  return idx;
}

/** División hoja → encabezado + datos, con la numeración de fila real de Excel. */
export function construirHoja(nombre: string, grid: Celda[][], filaEncabezado: number): Hoja {
  return {
    nombre,
    filaEncabezado,
    encabezados: (grid[filaEncabezado - 1] ?? []).map(texto),
    filas: grid.slice(filaEncabezado),
  };
}

/** Primera fila con al menos 3 celdas con texto. */
export function detectarEncabezado(grid: Celda[][]): number {
  for (let i = 0; i < Math.min(grid.length, 25); i++) {
    if ((grid[i] ?? []).filter((c) => !!texto(c)).length >= 3) return i + 1;
  }
  return 1;
}

/** Sugiere qué columna va con cada campo; cada columna se usa una sola vez. */
export function adivinarMapeo(encabezados: string[]): Mapeo {
  const norm = encabezados.map(normalizarTexto);
  const usados = new Set<number>();
  const mapeo: Mapeo = {};
  const buscar = (candidato: (alias: string, h: string) => boolean) => {
    for (const campo of CAMPOS) {
      if (mapeo[campo] !== undefined) continue;
      const i = norm.findIndex((h, idx) => !usados.has(idx) && ALIAS[campo].some((a) => candidato(a, h)));
      if (i >= 0) {
        mapeo[campo] = i;
        usados.add(i);
      }
    }
  };
  buscar((a, h) => h === a);
  buscar((a, h) => !!a && (h.includes(a) || a.includes(h)));
  return mapeo;
}

export function mapeoCampos(mapeo: Mapeo): [Campo, number][] {
  const out: [Campo, number][] = [];
  for (const c of CAMPOS) {
    const i = mapeo[c];
    if (typeof i === "number" && i >= 0) out.push([c, i]);
  }
  return out;
}

function valoresDe(celdas: Celda[], campos: [Campo, number][]): Record<Campo, string> {
  const v = {} as Record<Campo, string>;
  for (const c of CAMPOS) v[c] = "";
  for (const [c, i] of campos) v[c] = texto(celdas[i]);
  return v;
}

function esIdentificable(v: Record<Campo, string>): boolean {
  return !!(v.id || v.nInventario || v.serie || v.marca || v.modelo || v.tipo);
}

function buscarExistente(v: Record<Campo, string>, idx: Indice): Activo | null {
  const porId = v.id ? idx.porId.get(claveNumero(v.id)) : undefined;
  if (porId) return porId;
  const porInv = v.nInventario ? idx.porInventario.get(claveNumero(v.nInventario)) : undefined;
  if (porInv) return porInv;
  const porSerie = v.serie ? idx.porSerie.get(claveSerie(v.serie)) : undefined;
  return porSerie ?? null;
}

/** Clave que identifica la fila dentro del propio archivo. */
function claveFila(v: Record<Campo, string>): string {
  const s = claveSerie(v.serie);
  if (s) return `S:${s}`;
  const i = claveNumero(v.nInventario);
  if (i) return `I:${i}`;
  const d = claveNumero(v.id);
  return d ? `D:${d}` : "";
}

/** Columna de la base para cada campo; el resto coincide con el nombre del campo. */
const COLUMNA: Partial<Record<Campo, string>> = { nInventario: "n_inventario", fechaEntrega: "fecha_entrega" };
export const columnaDe = (c: Campo): string => COLUMNA[c] ?? c;

/** Diferencias reales entre la fila y lo que ya está guardado. Las celdas vacías no borran nada. */
export function calcularCambios(v: Record<Campo, string>, a: Activo): [string, string][] {
  const out: [string, string][] = [];
  for (const c of CAMPOS) {
    if (NO_ESCRIBIBLES.includes(c)) continue;
    const nuevo = v[c];
    if (!nuevo) continue;
    const actual = a[c];
    if (c === "fechaEntrega") {
      const n = parseFecha(nuevo) ?? nuevo;
      const o = parseFecha(actual) ?? actual;
      if (n !== o) out.push([columnaDe(c), n]);
      continue;
    }
    const valor = c === "estado" ? normalizarEstado(nuevo) : c === "tipo" ? normalizarTipo(nuevo) : nuevo;
    if (valor !== actual) out.push([columnaDe(c), valor]);
  }
  return out;
}

function nuevoActivo(v: Record<Campo, string>): NuevoActivo {
  return {
    tipo: resolver(v.tipo, MAPA_TIPO),
    marca: v.marca,
    modelo: v.modelo,
    serie: v.serie,
    usuario: v.usuario,
    area: v.area,
    ubicacion: resolver(v.ubicacion, MAPA_UBICACION),
    estado: resolver(v.estado, MAPA_ESTADO),
    fechaEntrega: parseFecha(v.fechaEntrega) ?? v.fechaEntrega,
    garantia: v.garantia,
    so: v.so,
    ram: v.ram,
    disco: v.disco,
    ip: v.ip,
    mac: v.mac,
    responsable: v.responsable,
    observaciones: v.observaciones,
    empresa: resolver(v.empresa, MAPA_EMPRESA),
  };
}

export type Accion = "nuevo" | "actualizar" | "igual" | "sin datos" | "duplicado";

export interface FilaVista {
  fila: number;
  accion: Accion;
  id: string;
  equipo: string;
  detalle: string;
}

export interface Cambio {
  id: string;
  cambios: Record<string, string>;
}

export interface Resumen {
  filasTotales: number;
  nuevos: NuevoActivo[];
  actualizaciones: Cambio[];
  sinCambios: number;
  invalidas: number;
  duplicados: number;
  vacias: number;
  vista: FilaVista[];
}

function etiquetaEquipo(v: Record<Campo, string>, a: Activo | null): string {
  if (a) return [a.marca, a.modelo].filter(Boolean).join(" ") || a.tipo || a.id;
  return [v.marca, v.modelo].filter(Boolean).join(" ") || v.tipo || v.serie || "—";
}

/**
 * Repasa la hoja y decide, fila por fila, si es un equipo nuevo, una actualización
 * de uno ya registrado, si queda igual o si hay que descartarla.
 */
export function previsualizar(hoja: Hoja, mapeo: Mapeo, existentes: Activo[]): Resumen {
  const campos = mapeoCampos(mapeo);
  if (!campos.length) throw new Error("Mapea al menos una columna.");
  const idx = construirIndice(existentes);
  const vistos = new Set<string>();
  const nuevos: NuevoActivo[] = [];
  const actualizaciones: Cambio[] = [];
  const vista: FilaVista[] = [];
  let sinCambios = 0;
  let invalidas = 0;
  let duplicados = 0;
  let vacias = 0;

  hoja.filas.forEach((celdas, i) => {
    const fila = hoja.filaEncabezado + i + 1;
    const v = valoresDe(celdas, campos);
    if (Object.values(v).every((x) => !x)) {
      vacias++;
      return;
    }
    if (!esIdentificable(v)) {
      invalidas++;
      vista.push({ fila, accion: "sin datos", id: "", equipo: "—", detalle: "Falta ID, serie, N° de inventario o marca" });
      return;
    }
    const existente = buscarExistente(v, idx);
    if (existente) {
      const cambios = calcularCambios(v, existente);
      if (!cambios.length) {
        sinCambios++;
        vista.push({ fila, accion: "igual", id: existente.id, equipo: etiquetaEquipo(v, existente), detalle: "Sin cambios" });
        return;
      }
      actualizaciones.push({ id: existente.id, cambios: Object.fromEntries(cambios) });
      vista.push({
        fila,
        accion: "actualizar",
        id: existente.id,
        equipo: etiquetaEquipo(v, existente),
        detalle: cambios.map(([c]) => c).join(", "),
      });
      return;
    }
    const clave = claveFila(v);
    if (clave && vistos.has(clave)) {
      duplicados++;
      vista.push({ fila, accion: "duplicado", id: "", equipo: etiquetaEquipo(v, null), detalle: "Se repite en el archivo" });
      return;
    }
    if (clave) vistos.add(clave);
    nuevos.push(nuevoActivo(v));
    vista.push({ fila, accion: "nuevo", id: "", equipo: etiquetaEquipo(v, null), detalle: v.serie || v.nInventario || "—" });
  });

  return { filasTotales: hoja.filas.length, nuevos, actualizaciones, sinCambios, invalidas, duplicados, vacias, vista };
}

export function trozos<T>(arr: T[], tam: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += tam) out.push(arr.slice(i, i + tam));
  return out;
}
