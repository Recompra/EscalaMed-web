import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("Webhook recebido:", JSON.stringify(body));

  const type = body.type;
  const paymentId = body.data?.id;

  if (type !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true });
  }

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
  });

  const payment = await mpRes.json();
  console.log("Pagamento:", JSON.stringify(payment));

  if (payment.status === "approved") {
    const email = payment.payer?.email;

    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_premium: true,
          premium_since: new Date().toISOString(),
          plan: payment.description ?? "premium"
        })
        .eq("user_id", user.id);

      if (error) console.error("Erro ao atualizar premium:", error);
    }
  }

  return NextResponse.json({ ok: true });
}