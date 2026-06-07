import { NextResponse } from "next/server";
import { createPayment, isBackendConfigured, listPayments } from "@/lib/backend";
import type { PaymentRecord } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isBackendConfigured()) {
    return NextResponse.json({ payments: [], storage: "browser-local-fallback" });
  }
  try {
    const payments = await listPayments();
    return NextResponse.json({ payments, storage: "supabase" });
  } catch (error) {
    return NextResponse.json({ payments: [], storage: "supabase-error", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payment = await request.json() as PaymentRecord;
  if (!payment?.id || !payment.invoiceId) {
    return NextResponse.json({ error: "Invalid payment payload." }, { status: 400 });
  }
  if (!isBackendConfigured()) {
    return NextResponse.json({ payment, storage: "browser-local-fallback" });
  }
  try {
    const saved = await createPayment(payment);
    return NextResponse.json({ payment: saved, storage: "supabase" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
