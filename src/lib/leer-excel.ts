import type * as XLSXType from "xlsx";
import type { Celda } from "@/lib/importar";

export interface HojaCruda {
  nombre: string;
  grid: Celda[][];
}

const LIMITE_MB = 15;

function relleno(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Texto de una celda: se conserva el formato tal como se ve (así "00123" no pierde los ceros).
 * Las fechas se pasan a AAAA-MM-DD.
 */
function textoCelda(cell: XLSXType.CellObject | undefined): Celda {
  if (!cell) return "";
  if (cell.t === "d" || cell.v instanceof Date) {
    const d = cell.v instanceof Date ? cell.v : new Date(Number(cell.v));
    if (!Number.isNaN(d.getTime())) return `${d.getUTCFullYear()}-${relleno(d.getUTCMonth() + 1)}-${relleno(d.getUTCDate())}`;
  }
  if (typeof cell.w === "string") return cell.w;
  if (cell.v == null) return "";
  if (typeof cell.v === "number" || typeof cell.v === "boolean") return cell.v;
  return String(cell.v);
}

function gridDeHoja(ws: XLSXType.WorkSheet): Celda[][] {
  const ref = ws["!ref"] as string | undefined;
  if (!ref) return [];
  const rango = XLSXType.utils.decode_range(ref);
  const grid: Celda[][] = [];
  for (let r = rango.s.r; r <= rango.e.r; r++) {
    const fila: Celda[] = [];
    for (let c = rango.s.c; c <= rango.e.c; c++) {
      fila.push(textoCelda(ws[XLSXType.utils.encode_cell({ r, c })] as XLSXType.CellObject | undefined));
    }
    grid.push(fila);
  }
  return grid;
}

/** Lee .xlsx, .xls o .csv y devuelve cada hoja como una rejilla de celdas. */
export async function leerArchivo(file: File): Promise<HojaCruda[]> {
  if (file.size > LIMITE_MB * 1024 * 1024) {
    throw new Error(`El archivo pesa más de ${LIMITE_MB} MB. Recórtalo o dividilo en varios.`);
  }
  const XLSX = await import("xlsx");
  const csv = /\.(csv|txt|tsv)$/i.test(file.name);
  const libro: XLSXType.WorkBook = csv
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });

  const hojas = libro.SheetNames.map((nombre) => ({
    nombre,
    grid: gridDeHoja(libro.Sheets[nombre] as XLSXType.WorkSheet),
  })).filter((h) => h.grid.length > 0);

  if (!hojas.length) throw new Error("El archivo no tiene filas con datos.");
  return hojas;
}
