import { Invoice } from "@/lib/invoices";

export type PaymentIntent = {
  intent: "pay_invoice";
  sourceToken: string;
  targetToken: string;
  targetAmount: string;
  confidence: number;
  riskExplanation: string;
  paymentSummary: string;
};

function findToken(command: string, supportedTokens: string[]) {
  const normalized = command.toLowerCase();
  const preferred = ["TON", "USDT", "DOGS", "NOT"];
  for (const symbol of [...preferred, ...supportedTokens]) {
    if (normalized.includes(symbol.toLowerCase())) return symbol.toUpperCase();
  }
  return "TON";
}

export function parsePaymentIntentLocal(command: string, invoice: Invoice, supportedTokens: string[] = []): PaymentIntent {
  const sourceToken = findToken(command, supportedTokens);
  const targetToken = invoice.targetToken || "USDT";
  const targetAmount = invoice.amount || "0";
  return {
    intent: "pay_invoice",
    sourceToken,
    targetToken,
    targetAmount,
    confidence: 0.93,
    paymentSummary: `Pay ${targetAmount} ${targetToken} using ${sourceToken}.`,
    riskExplanation: `Payment intent: swap ${sourceToken} into ${targetToken} for this invoice. Review the Omniston quote, slippage, destination and wallet transaction before signing.`
  };
}
