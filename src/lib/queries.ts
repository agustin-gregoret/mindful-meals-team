import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Article, Consultation, MealComment, MealLog, Profile } from "./labels";

// ---------- Meal logs ----------
export const mealLogsQuery = (opts: { patientId: string | undefined; from: string; to: string }) =>
  queryOptions({
    queryKey: ["meal_logs", opts.patientId, opts.from, opts.to],
    enabled: !!opts.patientId,
    queryFn: async (): Promise<MealLog[]> => {
      const { data, error } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("patient_id", opts.patientId!)
        .gte("log_date", opts.from)
        .lte("log_date", opts.to)
        .order("log_date", { ascending: false })
        .order("log_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const recentLogsForPatientsQuery = (patientIds: string[]) =>
  queryOptions({
    queryKey: ["meal_logs", "recent", [...patientIds].sort().join(",")],
    enabled: patientIds.length > 0,
    queryFn: async (): Promise<MealLog[]> => {
      const { data, error } = await supabase
        .from("meal_logs")
        .select("*")
        .in("patient_id", patientIds)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

// ---------- Comments ----------
export const commentsQuery = (patientId: string | undefined) =>
  queryOptions({
    queryKey: ["meal_comments", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<MealComment[]> => {
      const { data, error } = await supabase
        .from("meal_comments")
        .select("*")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

// ---------- Consultations ----------
export const consultationsQuery = (by: { patientId?: string; nutritionistId?: string }) =>
  queryOptions({
    queryKey: ["consultations", by.patientId ?? null, by.nutritionistId ?? null],
    enabled: !!(by.patientId || by.nutritionistId),
    queryFn: async (): Promise<Consultation[]> => {
      let q = supabase.from("consultations").select("*");
      if (by.patientId) q = q.eq("patient_id", by.patientId);
      if (by.nutritionistId) q = q.eq("nutritionist_id", by.nutritionistId);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

// ---------- Articles ----------
export const publishedArticlesQuery = queryOptions({
  queryKey: ["articles", "published"],
  queryFn: async (): Promise<Article[]> => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const articleQuery = (id: string) =>
  queryOptions({
    queryKey: ["articles", "one", id],
    queryFn: async (): Promise<Article | null> => {
      const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const myArticlesQuery = (authorId: string | undefined) =>
  queryOptions({
    queryKey: ["articles", "mine", authorId],
    enabled: !!authorId,
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("author_id", authorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

// ---------- Patients (nutritionist) ----------
export const patientsQuery = (nutritionistId: string | undefined) =>
  queryOptions({
    queryKey: ["patients", nutritionistId],
    enabled: !!nutritionistId,
    queryFn: async (): Promise<(Profile & { linked_at: string })[]> => {
      const { data: links, error } = await supabase
        .from("patient_links")
        .select("patient_id, created_at")
        .eq("nutritionist_id", nutritionistId!);
      if (error) throw error;
      if (!links.length) return [];
      const { data: profiles, error: e2 } = await supabase
        .from("profiles")
        .select("*")
        .in(
          "id",
          links.map((l) => l.patient_id),
        );
      if (e2) throw e2;
      return profiles
        .map((p) => ({
          ...p,
          linked_at: links.find((l) => l.patient_id === p.id)?.created_at ?? p.created_at,
        }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
  });

export const profileQuery = (id: string | undefined) =>
  queryOptions({
    queryKey: ["profile", id],
    enabled: !!id,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

// ---------- Realtime ----------
type RealtimeSpec = { table: string; filter?: string; keys: string[][] };

/**
 * Subscribes to Postgres changes and invalidates the given query keys.
 * RLS decides which rows each subscriber receives.
 */
export function useRealtimeSync(channelName: string, specs: RealtimeSpec[], enabled = true) {
  const queryClient = useQueryClient();
  const signature = JSON.stringify(specs);
  useEffect(() => {
    if (!enabled) return;
    let channel = supabase.channel(channelName);
    for (const spec of specs) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: spec.table, ...(spec.filter ? { filter: spec.filter } : {}) },
        () => {
          for (const key of spec.keys) queryClient.invalidateQueries({ queryKey: key });
        },
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, signature, enabled, queryClient]);
}
