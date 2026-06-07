import { NextResponse } from "next/server";
import { createInvoice, isBackendConfigured, listInvoices } from "@/lib/backend";
import type { Invoice } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isBackendConfigured()) {
    return NextResponse.json({ invoices: [], storage: "browser-local-fallback" });
  }
  try {
    const invoices = await listInvoices();
    return NextResponse.json({ invoices, storage: "supabase" });
  } catch (error) {
    return NextResponse.json({ invoices: [], storage: "supabase-error", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const invoice = await request.json() as Invoice;
  if (!invoice?.id || !invoice.amount || !invoice.targetToken || !invoice.recipient) {
    return NextResponse.json({ error: "Invalid invoice payload." }, { status: 400 });
  }
  if (!isBackendConfigured()) {
    return NextResponse.json({ invoice, storage: "browser-local-fallback" });
  }
  try {
    const saved = await createInvoice(invoice);
    return NextResponse.json({ invoice: saved, storage: "supabase" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
