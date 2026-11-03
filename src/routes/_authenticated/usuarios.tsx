import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios · Inventario TI" },
      { name: "description", content: "Administra quién puede editar el inventario TI." },
      { property: "og:title", content: "Usuarios · Inventario TI" },
      { property: "og:description", content: "Administra quién puede editar el inventario TI." },
    ],
  }),
  component: Usuarios,
});

function Usuarios() {
  const { user } = Route.useRouteContext();
  const isAdmin = useIsAdmin(user.id);
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").order("full_name"),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
      ]);
      if (p.error) throw p.error;
      if (r.error) throw r.error;
      const admins = new Set(r.data.map((x) => x.user_id));
      return p.data.map((u) => ({ ...u, admin: admins.has(u.id) }));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, admin }: { id: string; admin: boolean }) => {
      const res = admin
        ? await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin")
        : await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Permisos actualizados");
    },
    onError: () => toast.error("No se pudieron cambiar los permisos"),
  });

  return (
    <>
      <PageTitle title="Usuarios" subtitle="Los administradores pueden crear, editar y eliminar activos. El resto solo puede ver." />
      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Nombre</th>
              <th className="px-3 py-3">Correo</th>
              <th className="px-3 py-3">Permiso</th>
              {isAdmin && <th className="px-3 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2.5">{u.full_name || "—"}</td>
                <td className="px-3 py-2.5 text-xs">{u.email}</td>
                <td className="px-3 py-2.5">{u.admin ? "Administrador" : "Solo lectura"}</td>
                {isAdmin && (
                  <td className="px-3 py-2.5 text-right">
                    {u.id !== user.id && (
                      <Button size="sm" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: u.id, admin: u.admin })}>
                        {u.admin ? "Quitar administrador" : "Hacer administrador"}
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {!isLoading && data.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
