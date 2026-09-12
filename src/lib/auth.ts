import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "./labels";

export const ACTIVE_ROLE_KEY = "nutridiario.activeRole";

export const sessionQuery = queryOptions({
  queryKey: ["auth", "session"],
  queryFn: async () => (await supabase.auth.getSession()).data.session,
  staleTime: 60_000,
});

export type Me = {
  userId: string;
  email: string;
  profile: Profile;
  roles: AppRole[];
  nutritionist: { id: string; full_name: string } | null;
};

export const meQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["auth", "me", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<Me> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("No autenticado");
      const [{ data: profile }, { data: roles }, { data: link }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("patient_links").select("nutritionist_id").eq("patient_id", user.id).maybeSingle(),
      ]);
      let nutritionist: Me["nutritionist"] = null;
      if (link?.nutritionist_id) {
        const { data: n } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", link.nutritionist_id)
          .maybeSingle();
        if (n) nutritionist = n;
      }
      return {
        userId: user.id,
        email: user.email ?? "",
        profile: profile ?? {
          id: user.id,
          full_name: (user.user_metadata?.full_name as string) ?? "",
          invite_code: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        roles: (roles ?? []).map((r) => r.role),
        nutritionist,
      };
    },
  });

export function useMe() {
  const session = useQuery(sessionQuery);
  const me = useQuery(meQuery(session.data?.user.id));
  return { ...me, session: session.data, isPending: session.isPending || me.isPending };
}

export function getActiveRole(): AppRole | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(ACTIVE_ROLE_KEY);
  return v === "patient" || v === "nutritionist" ? v : null;
}

export function setActiveRole(role: AppRole) {
  if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_ROLE_KEY, role);
}

export const roleHome = (role: AppRole) => (role === "patient" ? "/paciente" : "/nutricionista");

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}
