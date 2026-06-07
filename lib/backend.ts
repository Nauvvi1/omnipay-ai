import type { Invoice, PaymentRecord } from "@/lib/invoices";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isBackendConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function headers(extra?: HeadersInit): HeadersInit {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY || "",
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function invoiceToRow(invoice: Invoice) {
  return {
    id: invoice.id,
    amount: invoice.amount,
    target_token: invoice.targetToken,
    recipient: invoice.recipient,
    description: invoice.description,
    status: invoice.status || "unpaid",
    tx_hash: invoice.txHash || null,
    created_at: invoice.createdAt
  };
}

function rowToInvoice(row: any): Invoice {
  return {
    id: row.id,
    amount: String(row.amount),
    targetToken: row.target_token,
    recipient: row.recipient,
    description: row.description || "",
    status: row.status || "unpaid",
    txHash: row.tx_hash || undefined,
    createdAt: row.created_at
  };
}

function paymentToRow(payment: PaymentRecord) {
  return {
    id: payment.id,
    invoice_id: payment.invoiceId,
    mode: payment.mode,
    status: payment.status,
    payer_address: payment.payerAddress || null,
    recipient_address: payment.recipientAddress || null,
    source_token: payment.sourceToken,
    target_token: payment.targetToken,
    input_amount: payment.inputAmount,
    output_amount: payment.outputAmount,
    quote_id: payment.quoteId || null,
    boc: payment.boc || null,
    simulation_id: payment.simulationId || null,
    created_at: payment.createdAt
  };
}

function rowToPayment(row: any): PaymentRecord {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    mode: row.mode,
    status: row.status,
    payerAddress: row.payer_address || undefined,
    recipientAddress: row.recipient_address || undefined,
    sourceToken: row.source_token,
    targetToken: row.target_token,
    inputAmount: row.input_amount,
    outputAmount: row.output_amount,
    quoteId: row.quote_id || undefined,
    boc: row.boc || undefined,
    simulationId: row.simulation_id || undefined,
    createdAt: row.created_at
  };
}

async function supabaseFetch(path: string, init?: RequestInit) {
  if (!isBackendConfigured()) throw new Error("Supabase backend is not configured.");
  const url = `${SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/${path}`;
  const response = await fetch(url, { ...init, headers: headers(init?.headers), cache: "no-store" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${text}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function createInvoice(invoice: Invoice) {
  const rows = await supabaseFetch("invoices", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(invoiceToRow(invoice))
  });
  return rowToInvoice(rows?.[0] || invoiceToRow(invoice));
}

export async function listInvoices() {
  const rows = await supabaseFetch("invoices?select=*&order=created_at.desc", { method: "GET" });
  return (rows || []).map(rowToInvoice) as Invoice[];
}

export async function getInvoice(id: string) {
  const rows = await supabaseFetch(`invoices?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { method: "GET" });
  return rows?.[0] ? rowToInvoice(rows[0]) : null;
}

export async function updateInvoiceStatus(id: string, status: Invoice["status"], txHash?: string) {
  const body: Record<string, any> = { status };
  if (txHash) body.tx_hash = txHash;
  const rows = await supabaseFetch(`invoices?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body)
  });
  return rows?.[0] ? rowToInvoice(rows[0]) : null;
}

export async function createPayment(payment: PaymentRecord) {
  const rows = await supabaseFetch("payments", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(paymentToRow(payment))
  });
  return rowToPayment(rows?.[0] || paymentToRow(payment));
}

export async function listPayments() {
  const rows = await supabaseFetch("payments?select=*&order=created_at.desc", { method: "GET" });
  return (rows || []).map(rowToPayment) as PaymentRecord[];
}
