import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const FREE_LIMIT = 30;

export function useAiLimit() {
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
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

      const today = new Date();
      const resetDate = new Date(profile.ai_requests_reset_at);

      // Reinicia o contador a cada mês
      if (
        today.getMonth() !== resetDate.getMonth() ||
        today.getFullYear() !== resetDate.getFullYear()
      ) {
        await supabase
          .from("profiles")
          .update({
            ai_requests_used: 0,
            ai_requests_reset_at: today.toISOString(),
          })
          .eq("id", user.id);

        profile.ai_requests_used = 0;
      }

      const used = profile.ai_requests_used || 0;
      const premium = profile.plan === "premium";

      setIsPremium(premium);

      if (premium) {
        setRemaining(Infinity);
        setLimitReached(false);
      } else {
        const remainingRequests = FREE_LIMIT - used;
        setRemaining(remainingRequests);
        setLimitReached(remainingRequests <= 0);
      }

      setLoading(false);
    }

    checkLimit();
  }, []);

  return {
    loading,
    remaining,
    isPremium,
    limitReached,
    FREE_LIMIT,
  };
}