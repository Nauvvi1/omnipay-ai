import { NextResponse } from "next/server";
import { getInvoice, isBackendConfigured, updateInvoiceStatus } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!isBackendConfigured()) {
    return NextResponse.json({ invoice: null, storage: "browser-local-fallback" });
  }
  try {
    const invoice = await getInvoice(params.id);
    return NextResponse.json({ invoice, storage: "supabase" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json() as { status?: string; txHash?: string };
  if (!body.status) return NextResponse.json({ error: "Status is required." }, { status: 400 });
  if (!isBackendConfigured()) {
    return NextResponse.json({ invoice: null, storage: "browser-local-fallback" });
  }
  try {
    const invoice = await updateInvoiceStatus(params.id, body.status as any, body.txHash);
    return NextResponse.json({ invoice, storage: "supabase" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
