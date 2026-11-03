import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { COMPANY_DOMAIN, isCompanyEmail, signOut } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!isCompanyEmail(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="panel max-w-md text-center">
          <h1 className="text-xl font-bold">Cuenta sin acceso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            El inventario solo está disponible para correos @{COMPANY_DOMAIN}. Ingresaste como {user.email}.
          </p>
          <Button
            className="mt-4"
            onClick={async () => {
              await signOut(queryClient);
              navigate({ to: "/auth", replace: true });
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
