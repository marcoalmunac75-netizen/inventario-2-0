import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMPRESAS, ESTADOS, TIPOS, UBICACIONES, addActivo, distinct, useInventory, type NuevoActivo } from "@/lib/inventory";

export const Route = createFileRoute("/nuevo")({
  head: () => ({
    meta: [
      { title: "Nuevo activo · Inventario TI" },
      { name: "description", content: "Registrar un nuevo activo en el inventario TI." },
      { property: "og:title", content: "Nuevo activo · Inventario TI" },
      { property: "og:description", content: "Registrar un nuevo activo en el inventario TI." },
    ],
  }),
  component: Nuevo,
});

const empty: NuevoActivo = {
  tipo: "NOTEBOOK",
  marca: "",
  modelo: "",
  serie: "",
  usuario: "",
  area: "",
  ubicacion: "SANTIAGO",
  estado: "EQUIPO NUEVO",
  fechaEntrega: "",
  garantia: "SI",
  so: "",
  ram: "",
  disco: "",
  ip: "",
  mac: "",
  responsable: "",
  observaciones: "",
  empresa: "CABAL SERVICIOS SPA",
};

function Nuevo() {
  const list = useInventory();
  const [form, setForm] = useState<NuevoActivo>(empty);
  const navigate = useNavigate();
  const set = (k: keyof NuevoActivo, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const upper = (k: keyof NuevoActivo) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value.toUpperCase());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.marca.trim() || !form.serie.trim()) {
      toast.error("Completa al menos marca y N° de serie");
      return;
    }
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as NuevoActivo;
    const a = addActivo(clean);
    toast.success(`Activo ${a.id} registrado`);
    navigate({ to: "/inventario" });
  };

  const sel = (k: keyof NuevoActivo, opts: readonly string[]) => (
    <Select value={form[k]} onValueChange={(v) => set(k, v)}>
      <SelectTrigger id={k}><SelectValue /></SelectTrigger>
      <SelectContent>{opts.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <>
      <PageTitle title="Nuevo activo" subtitle="El ID y N° de inventario se asignan automáticamente" />
      <form onSubmit={submit} className="space-y-4">
        <Section title="Equipo">
          <Field label="Tipo de activo">{sel("tipo", TIPOS)}</Field>
          <Field label="Estado">{sel("estado", ESTADOS)}</Field>
          <Field label="Marca *"><Input id="marca" value={form.marca} onChange={upper("marca")} placeholder="DELL" /></Field>
          <Field label="Modelo"><Input id="modelo" value={form.modelo} onChange={upper("modelo")} placeholder="LATITUDE 3440" /></Field>
          <Field label="N° de serie *"><Input id="serie" value={form.serie} onChange={upper("serie")} /></Field>
          <Field label="Garantía">{sel("garantia", ["SI", "NO"])}</Field>
        </Section>
        <Section title="Asignación">
          <Field label="Usuario"><Input id="usuario" list="usuarios" value={form.usuario} onChange={upper("usuario")} /></Field>
          <Field label="Responsable"><Input id="responsable" list="usuarios" value={form.responsable} onChange={upper("responsable")} /></Field>
          <Field label="Área"><Input id="area" list="areas" value={form.area} onChange={upper("area")} placeholder="INFORMATICA" /></Field>
          <Field label="Ubicación">{sel("ubicacion", UBICACIONES)}</Field>
          <Field label="Empresa">{sel("empresa", EMPRESAS)}</Field>
          <Field label="Fecha de entrega"><Input id="fecha" type="date" value={form.fechaEntrega} onChange={(e) => set("fechaEntrega", e.target.value)} /></Field>
        </Section>
        <Section title="Datos técnicos">
          <Field label="Sistema operativo">{sel("so", ["", "WINDOWS 11", "WINDOWS 10", "WINDOWS 8"].filter(Boolean))}</Field>
          <Field label="RAM (GB)"><Input id="ram" inputMode="numeric" value={form.ram} onChange={(e) => set("ram", e.target.value)} /></Field>
          <Field label="Disco (GB)"><Input id="disco" inputMode="numeric" value={form.disco} onChange={(e) => set("disco", e.target.value)} /></Field>
          <Field label="IP"><Input id="ip" value={form.ip} onChange={(e) => set("ip", e.target.value)} placeholder="192.168.0.10" /></Field>
          <Field label="MAC"><Input id="mac" value={form.mac} onChange={upper("mac")} /></Field>
          <Field label="Observaciones">{sel("observaciones", ["EQUIPO EN EL DOMINIO CABAL", "EQUIPO NO ESTA DOMINIO CABAL"])}</Field>
        </Section>
        <datalist id="areas">{distinct(list, "area").map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="usuarios">{distinct(list, "usuario").map((v) => <option key={v} value={v} />)}</datalist>
        <div className="flex gap-2">
          <Button type="submit">Guardar activo</Button>
          <Button type="button" variant="outline" onClick={() => setForm(empty)}>Limpiar</Button>
        </div>
      </form>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="panel">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
