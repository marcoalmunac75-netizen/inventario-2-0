import { describe, expect, it } from "vitest";
import { isCompanyEmail } from "@/lib/auth";
import { toInsert } from "@/lib/inventory";

describe("acceso solo para correos de la empresa", () => {
  it("acepta @grupocabal.cl", () => expect(isCompanyEmail("marco.almuna@grupocabal.cl")).toBe(true));
  it("rechaza otros dominios", () => expect(isCompanyEmail("alguien@gmail.com")).toBe(false));
  it("rechaza subdominios falsos", () => expect(isCompanyEmail("x@grupocabal.cl.evil.com")).toBe(false));
});

describe("nuevo activo", () => {
  it("deja el ID vacío para que la base asigne el siguiente", () => {
    const r = toInsert({ fechaEntrega: "2026-01-02" } as never);
    expect(r.id).toBe("");
    expect(r.fecha_entrega).toBe("2026-01-02");
  });
});
