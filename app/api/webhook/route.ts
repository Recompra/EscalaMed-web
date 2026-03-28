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
    const description = (payment.description || "").toLowerCase();

    // ✅ Busca direta por email na tabela profiles
    const { data: profile, error: profileLookupError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (profileLookupError) {
      console.error("Erro ao buscar usuário:", profileLookupError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    if (!profile) {
      console.warn("Usuário não encontrado para o email:", email);
      return NextResponse.json({ ok: true });
    }

    const userId = profile.user_id;

    // Deduplicação
    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("payment_id", String(paymentId))
      .maybeSingle();

    if (existingPaymentError) {
      console.error("Erro ao verificar payment_id:", existingPaymentError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    if (existingPayment) {
      console.log("Pagamento já processado:", paymentId);
      return NextResponse.json({ ok: true });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    let plan = "mensal";

    if (description.includes("anual")) {
      plan = "anual";
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (description.includes("semestral")) {
      plan = "semestral";
      endDate.setMonth(endDate.getMonth() + 6);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const { error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        payment_id: String(paymentId),
      });

    if (subError) {
      console.error("Erro ao criar subscription:", subError);
      return NextResponse.json({ ok: false, error: "subscription_error" }, { status: 500 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_premium: true,
        premium_since: startDate.toISOString(),
        plan: plan,
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Erro ao atualizar premium:", profileError);
    }
  }

  return NextResponse.json({ ok: true });
}