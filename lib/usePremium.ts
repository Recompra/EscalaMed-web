import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function usePremium() {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("end_date, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao verificar assinatura:", error);
        router.push("/premium");
        return;
      }

      if (!subscription) {
        router.push("/premium");
        return;
      }

      const now = new Date();
      const endDate = new Date(subscription.end_date);

      if (endDate <= now) {
        router.push("/premium");
        return;
      }

      setIsPremium(true);
    }

    check();
  }, [router]);

  return isPremium;
}