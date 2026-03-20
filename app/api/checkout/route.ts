import { NextResponse } from "next/server";

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    const plans = {
      mensal: {
        title: "EscalaMed Premium - Mensal",
        price: 59.90,
      },
      semestral: {
        title: "EscalaMed Premium - Semestral",
        price: 299.90,
      },
      anual: {
        title: "EscalaMed Premium - Anual",
        price: 479.90,
      },
    };

    const selected = plans[plan as keyof typeof plans];

    if (!selected) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: selected.title,
            quantity: 1,
            unit_price: selected.price,
          },
        ],
      }),
    });

    const data = await response.json();

    return NextResponse.json({ url: data.init_point });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 });
  }
}