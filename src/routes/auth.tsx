import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY_DOMAIN, isCompanyEmail, safeRedirect } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Iniciar sesión · Inventario TI" },
      { name: "description", content: "Acceso al inventario de activos de la Gerencia de Informática." },
      { property: "og:title", content: "Iniciar sesión · Inventario TI" },
      { property: "og:description", content: "Acceso al inventario de activos de la Gerencia de Informática." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const goNext = () => navigate({ to: safeRedirect(redirect), replace: true });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) goNext();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!isCompanyEmail(mail)) {
      toast.error(`Usa tu correo @${COMPANY_DOMAIN}`);
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error) {
          toast.error(error.message.includes("confirmed") ? "Primero confirma tu correo con el enlace que te enviamos." : "Correo o contraseña incorrectos");
          return;
        }
        goNext();
      } else if (mode === "signup") {
        if (!nombre.trim()) {
          toast.error("Ingresa tu nombre completo");
          return;
        }
        if (password.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: nombre.trim().toUpperCase() } },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        setSent(`Te enviamos un correo a ${mail}. Abre el enlace para confirmar tu cuenta y luego inicia sesión.`);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(mail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        setSent(`Si ${mail} tiene cuenta, recibirás un enlace para crear una nueva contraseña.`);
      }
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<Mode, string> = {
    login: "Iniciar sesión",
    signup: "Crear cuenta",
    forgot: "Recuperar contraseña",
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-t-2xl bg-shell px-6 py-5 text-shell-foreground">
          <div className="text-lg font-bold leading-tight">Inventario TI</div>
          <div className="text-xs text-shell-muted">Gerencia de Informática</div>
        </div>
        <div className="panel rounded-t-none">
          <h1 className="text-xl font-bold">{titles[mode]}</h1>
          <p className="mb-4 text-sm text-muted-foreground">Solo para correos @{COMPANY_DOMAIN}</p>

          {sent ? (
            <div className="space-y-4">
              <p className="text-sm">{sent}</p>
              <Button variant="outline" className="w-full" onClick={() => { setSent(null); setMode("login"); }}>
                Volver a iniciar sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`nombre@${COMPANY_DOMAIN}`} autoComplete="email" required />
              </div>
              {mode !== "forgot" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {mode === "login" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Enviar enlace"}
              </Button>
            </form>
          )}

          {!sent && (
            <div className="mt-4 flex flex-col gap-1 text-sm">
              {mode === "login" ? (
                <>
                  <button type="button" className="text-left text-primary hover:underline" onClick={() => setMode("signup")}>¿No tienes cuenta? Crear una</button>
                  <button type="button" className="text-left text-primary hover:underline" onClick={() => setMode("forgot")}>Olvidé mi contraseña</button>
                </>
              ) : (
                <button type="button" className="text-left text-primary hover:underline" onClick={() => setMode("login")}>Ya tengo cuenta, iniciar sesión</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
