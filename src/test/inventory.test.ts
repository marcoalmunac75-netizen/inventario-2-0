import { describe, expect, it } from "vitest";
import { buildSeed, countBy } from "@/lib/inventory";

describe("datos iniciales del inventario", () => {
  const seed = buildSeed();
  it("tiene 147 notebooks", () => expect(countBy(seed, "tipo")["Notebook"]).toBe(147));
  it("tiene 92 monitores", () => expect(countBy(seed, "tipo")["Monitor"]).toBe(92));
  it("tiene 162 activos operativos", () => expect(countBy(seed, "estado")["Operativo"]).toBe(162));
});
