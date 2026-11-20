import { describe, expect, it } from "vitest";
import { isCompanyEmail } from "@/lib/auth";
import { parseFecha, toInsert } from "@/lib/inventory";
import { slugEmpresa } from "@/routes/_authenticated/reportes";
import { formatFechaHora } from "@/routes/_authenticated/historial";

describe("fechas de la planilla", () => {
  it("mantiene las fechas AAAA-MM-DD", () => {
    expect(parseFecha("2026-11-02")).toBe("2026-11-02");
  });
  it("ordena bien las escritas mes-día-año", () => {
    expect(parseFecha("02-20-2025")).toBe("2025-02-20");
  });
  it("rechaza un día que no existe", () => {
    expect(parseFecha("31/06/2025")).toBeNull();
  });
  it("rechaza fechas mal escritas y vacías", () => {
    expect(parseFecha("02--07-025")).toBeNull();
    expect(parseFecha("")).toBeNull();
  });
  it("muestra fecha y hora del cambio", () => {
    expect(formatFechaHora("2026-11-20T16:41:00Z")).toMatch(/^\d{2}-\d{2}-2026 \d{2}:\d{2}$/);
    expect(formatFechaHora("sin fecha")).toBe("sin fecha");
  });
});

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
