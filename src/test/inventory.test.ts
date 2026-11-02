import { describe, expect, it } from "vitest";
import { buildSeed, countBy, nextId } from "@/lib/inventory";

describe("inventario real cargado desde la planilla", () => {
  const seed = buildSeed();
  it("tiene 293 activos", () => expect(seed.length).toBe(293));
  it("tiene 147 notebooks", () => expect(countBy(seed, "tipo")["NOTEBOOK"]).toBe(147));
  it("tiene 92 monitores", () => expect(countBy(seed, "tipo")["MONITOR"]).toBe(92));
  it("tiene 162 activos operativos", () => expect(countBy(seed, "estado")["OPERATIVO"]).toBe(162));
  it("tiene 12 equipos en gestión de cambio", () => expect(countBy(seed, "estado")["GESTION CAMBIO DE EQUIPO"]).toBe(12));
  it("el siguiente activo nuevo es ACT-0294", () => expect(nextId(seed).id).toBe("ACT-0294"));
});
