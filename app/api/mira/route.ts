import { NextResponse } from "next/server";
import { localParsePaymentIntent, PaymentIntentSchema } from "@/lib/mira";

export async function POST(request: Request) {
  const body = await request.json();
  const { command = "", invoice = {}, supportedTokens = [] } = body;

  const endpoint = process.env.MIRA_FLOW_ENDPOINT;
  const apiKey = process.env.MIRA_API_KEY;

  if (endpoint && apiKey) {
    try {
      const miraResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          task: "Parse the user command into a strict TON payment intent JSON.",
          command,
          invoice,
          supportedTokens,
          requiredOutput: {
            intent: "pay_invoice",
            sourceToken: "TON | USDT | DOGS | NOT | supported token symbol",
            targetToken: invoice.targetToken || "USDT",
            targetAmount: invoice.amount || "0",
            confidence: "number 0..1",
            riskExplanation: "plain-language slippage/risk note",
            paymentSummary: "short user-facing summary"
          }
        })
      });

      if (miraResponse.ok) {
        const data = await miraResponse.json();
        const candidate = data.intent || data.output || data.result || data;
        const parsed = PaymentIntentSchema.safeParse(candidate);
        if (parsed.success) return NextResponse.json({ provider: "mira", intent: parsed.data });
      }
    } catch (error) {
      console.error("Mira endpoint failed, using local parser", error);
    }
  }

  const intent = localParsePaymentIntent(command, invoice);
  return NextResponse.json({ provider: "local-fallback", intent });
}
