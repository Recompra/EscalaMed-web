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
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("user_id", user.id)
        .single();

      if (!profile?.is_premium) {
        router.push("/premium");
        return;
      }

      setIsPremium(true);
    }
    check();
  }, []);

  return isPremium;
}