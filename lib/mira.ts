import { z } from "zod";

export const PaymentIntentSchema = z.object({
  intent: z.literal("pay_invoice"),
  sourceToken: z.string().min(2),
  targetToken: z.string().min(2),
  targetAmount: z.string().min(1),
  confidence: z.number().min(0).max(1),
  riskExplanation: z.string().min(1),
  paymentSummary: z.string().min(1)
});

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;

export function localParsePaymentIntent(command: string, invoice: { amount: string; targetToken: string; description?: string }): PaymentIntent {
  const text = command.toUpperCase();
  const sourceToken = text.includes("DOGS")
    ? "DOGS"
    : text.includes("NOT")
      ? "NOT"
      : text.includes("USDT") && invoice.targetToken.toUpperCase() !== "USDT"
        ? "USDT"
        : "TON";

  const confidence = /PAY|USE|WITH|COVER|INVOICE|BILL|ТОН|ОПЛАТ/.test(text) ? 0.93 : 0.72;
  return {
    intent: "pay_invoice",
    sourceToken,
    targetToken: invoice.targetToken || "USDT",
    targetAmount: invoice.amount,
    confidence,
    riskExplanation: `Mira intent: swap ${sourceToken} into ${invoice.targetToken || "USDT"} for this invoice. Review Omniston quote, slippage, destination and wallet transaction before signing.`,
    paymentSummary: `Pay ${invoice.amount} ${invoice.targetToken || "USDT"} using ${sourceToken}.`
  };
}
