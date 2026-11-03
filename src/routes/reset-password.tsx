import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña · Inventario TI" },
      { name: "description", content: "Crea una nueva contraseña para el inventario TI." },
      { property: "og:title", content: "Nueva contraseña · Inventario TI" },
      { property: "og:description", content: "Crea una nueva contraseña para el inventario TI." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("El enlace expiró o no es válido. Pide uno nuevo.");
      return;
    }
    toast.success("Contraseña actualizada");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="panel w-full max-w-sm space-y-3">
        <h1 className="text-xl font-bold">Nueva contraseña</h1>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Contraseña nueva</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>Guardar contraseña</Button>
      </form>
    </div>
  );
}
