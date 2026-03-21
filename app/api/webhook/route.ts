import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const body = await req.json();

  console.log("Webhook recebido:", JSON.stringify(body));

  const type = body.type;
  const paymentId = body.data?.id;

  if (type !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true });
  }

  // Busca o pagamento no Mercado Pago
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
  });

  const payment = await mpRes.json();
  console.log("Pagamento:", JSON.stringify(payment));

  if (payment.status === "approved") {
    const email = payment.payer?.email;

    // Atualiza o usuário no Supabase como premium
    const { error } = await supabase
      .from("users")
      .update({ is_premium: true })
      .eq("email", email);

    if (error) console.error("Erro ao atualizar premium:", error);
  }

  return NextResponse.json({ ok: true });
}