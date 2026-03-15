"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface UserContext {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
}

export function useUserContext() {
  const [ctx, setCtx] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await sb
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const { data: credits } = await sb
        .from("credits")
        .select("balance, plan")
        .eq("user_id", user.id)
        .single();

      setCtx({
        id: user.id,
        name: profile?.full_name || user.email?.split("@")[0] || "você",
        email: user.email || "",
        plan: credits?.plan || "free",
        credits: credits?.balance || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  return { ctx, loading };
}
