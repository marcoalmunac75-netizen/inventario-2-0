import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ESTADOS, TIPOS, UBICACIONES, addActivo, type NuevoActivo } from "@/lib/inventory";

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
  tipo: "Notebook",
  marca: "",
  modelo: "",
  serie: "",
  estado: "Operativo",
  responsable: "",
  ubicacion: "Casa matriz",
  fechaCompra: "",
};

function Nuevo() {
  const [form, setForm] = useState<NuevoActivo>(empty);
  const navigate = useNavigate();
  const set = <K extends keyof NuevoActivo>(k: K, v: NuevoActivo[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.marca.trim() || !form.modelo.trim() || !form.serie.trim()) {
      toast.error("Completa marca, modelo y número de serie");
      return;
    }
    const a = addActivo({ ...form, marca: form.marca.trim(), modelo: form.modelo.trim(), serie: form.serie.trim().toUpperCase() });
    toast.success(`Activo ${a.codigo} registrado`);
    navigate({ to: "/inventario" });
  };

  return (
    <>
      <PageTitle title="Nuevo activo" subtitle="Registrar un equipo en el inventario" />
      <form onSubmit={submit} className="panel grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <Select value={form.tipo} onValueChange={(v) => set("tipo", v as NuevoActivo["tipo"])}>
            <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
            <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={form.estado} onValueChange={(v) => set("estado", v as NuevoActivo["estado"])}>
            <SelectTrigger id="estado"><SelectValue /></SelectTrigger>
            <SelectContent>{ESTADOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Marca *"><Input id="marca" value={form.marca} onChange={(e) => set("marca", e.target.value)} placeholder="Lenovo" /></Field>
        <Field label="Modelo *"><Input id="modelo" value={form.modelo} onChange={(e) => set("modelo", e.target.value)} placeholder="ThinkPad E14" /></Field>
        <Field label="N° de serie *"><Input id="serie" value={form.serie} onChange={(e) => set("serie", e.target.value)} /></Field>
        <Field label="Responsable"><Input id="responsable" value={form.responsable} onChange={(e) => set("responsable", e.target.value)} /></Field>
        <Field label="Ubicación">
          <Select value={form.ubicacion} onValueChange={(v) => set("ubicacion", v)}>
            <SelectTrigger id="ubicacion"><SelectValue /></SelectTrigger>
            <SelectContent>{UBICACIONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Fecha de compra"><Input id="fecha" type="date" value={form.fechaCompra} onChange={(e) => set("fechaCompra", e.target.value)} /></Field>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">Guardar activo</Button>
          <Button type="button" variant="outline" onClick={() => setForm(empty)}>Limpiar</Button>
        </div>
      </form>
    </>
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
