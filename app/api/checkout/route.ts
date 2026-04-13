import { NextResponse } from "next/server";

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

const PLAN_IDS: Record<string, string> = {
  mensal:    process.env.MP_PLAN_ID_MENSAL!,
  semestral: process.env.MP_PLAN_ID_SEMESTRAL!,
  anual:     process.env.MP_PLAN_ID_ANUAL!,
};

export async function POST(req: Request) {
  try {
    const { plan, payer_email } = await req.json();

    if (!PLAN_IDS[plan]) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    if (!payer_email) {
      return NextResponse.json({ error: "Email do pagador é obrigatório" }, { status: 400 });
    }

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preapproval_plan_id: PLAN_IDS[plan],
        payer_email,
        back_url: "https://escalamed.app.br/home?status=success",
        notification_url: "https://escalamed.app.br/api/webhook",
      }),
    });

    const data = await response.json();
    console.log("MP RESPONSE:", data);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro Mercado Pago", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ init_point: data.init_point });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar assinatura" }, { status: 500 });
  }
}
