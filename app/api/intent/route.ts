import { NextResponse } from "next/server";
import { parsePaymentIntentLocal } from "@/lib/intent";
import type { Invoice } from "@/lib/invoices";

export const dynamic = "force-dynamic";

type Body = {
  command?: string;
  invoice?: Invoice;
  supportedTokens?: string[];
};

export async function POST(request: Request) {
  const body = await request.json() as Body;
  const command = body.command || "Pay this invoice with TON";
  const invoice = body.invoice;
  const supportedTokens = body.supportedTokens || [];

  if (!invoice) {
    return NextResponse.json({ error: "Invoice context is required." }, { status: 400 });
  }

  const endpoint = process.env.INTENT_FLOW_ENDPOINT || process.env.MIRA_FLOW_ENDPOINT;
  const apiKey = process.env.INTENT_API_KEY || process.env.MIRA_API_KEY;

  if (endpoint && apiKey) {
    try {
      const miraResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ command, invoice, supportedTokens })
      });

      if (!miraResponse.ok) {
        throw new Error(`Intent endpoint failed with ${miraResponse.status}`);
      }

      const json = await miraResponse.json();
      return NextResponse.json({ intent: json.intent || json, provider: "mira-ready-endpoint" });
    } catch (error) {
      console.error("Configured intent endpoint failed, falling back to local parser", error);
    }
  }

  return NextResponse.json({
    intent: parsePaymentIntentLocal(command, invoice, supportedTokens),
    provider: "local-intent-parser"
  });
}
