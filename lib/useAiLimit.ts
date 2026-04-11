import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const FREE_LIMIT = 30;

export function useAiLimit() {
  const [loading, setLoading] = useState(true);
  const [used, setUsed] = useState(0);
  const [remaining, setRemaining] = useState(FREE_LIMIT);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    async function checkLimit() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("ai_requests_used, ai_requests_reset_at, plan")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        console.error("Erro ao verificar limite da IA:", error);
        setLoading(false);
        return;
      }

      if (profile.plan === "premium") {
        setUsed(0);
        setRemaining(Infinity);
        setLimitReached(false);
      } else {
        const currentUsed = profile.ai_requests_used || 0;
        setUsed(currentUsed);
        const remainingRequests = FREE_LIMIT - currentUsed;
        setRemaining(remainingRequests);
        setLimitReached(remainingRequests <= 0);
      }

      setLoading(false);
    }

    checkLimit();
  }, []);

  return {
    loading,
    used,
    remaining,
    limitReached,
    FREE_LIMIT,
  };
}