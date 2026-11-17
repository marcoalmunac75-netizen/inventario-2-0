import { describe, expect, it } from "vitest";
import { isCompanyEmail } from "@/lib/auth";
import { toInsert } from "@/lib/inventory";
import { slugEmpresa } from "@/routes/_authenticated/reportes";

describe("acceso solo para correos de la empresa", () => {
  it("acepta @grupocabal.cl", () => expect(isCompanyEmail("marco.almuna@grupocabal.cl")).toBe(true));
  it("rechaza otros dominios", () => expect(isCompanyEmail("alguien@gmail.com")).toBe(false));
  it("rechaza subdominios falsos", () => expect(isCompanyEmail("x@grupocabal.cl.evil.com")).toBe(false));
});

describe("exportar por empresa", () => {
  it("genera un nombre de archivo seguro desde el nombre de la empresa", () => {
    expect(slugEmpresa("COMPAÑÍA DE COMBUSTIBLE CABAL S.A.")).toBe("compania-de-combustible-cabal-s-a");
    expect(slugEmpresa("VIS SPA")).toBe("vis-spa");
  });
});

describe("nuevo activo", () => {
  it("deja el ID vacío para que la base asigne el siguiente", () => {
    const r = toInsert({ fechaEntrega: "2026-01-02" } as never);
    expect(r.id).toBe("");
    expect(r.fecha_entrega).toBe("2026-01-02");
  });
});
