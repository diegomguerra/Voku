"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface UserContext {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
}

export function useUserContext() {
  const supabase = createClientComponentClient();
  const [ctx, setCtx] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const { data: credits } = await supabase
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
