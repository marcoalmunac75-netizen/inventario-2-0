import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Solo cuentas con correo de este dominio pueden ver el inventario. */
export const COMPANY_DOMAIN = "grupocabal.cl";

export function isCompanyEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 && !!parts[0] && parts[1] === COMPANY_DOMAIN;
}

/** Acepta solo rutas internas para volver después de iniciar sesión. */
export function safeRedirect(v: unknown): string {
  if (typeof v !== "string" || !v.startsWith("/") || v.startsWith("//")) return "/";
  return v;
}

export function useIsAdmin(userId: string | undefined) {
  const q = useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: userId!, _role: "admin" });
      if (error) throw error;
      return !!data;
    },
  });
  return q.data ?? false;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("full_name, email").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  }).data;
}

export async function signOut(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}
