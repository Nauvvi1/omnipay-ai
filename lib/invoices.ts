import { Buffer } from "buffer";
export type InvoiceStatus = "unpaid" | "ready" | "submitted" | "paid" | "failed";

export type Invoice = {
  id: string;
  amount: string;
  targetToken: string;
  recipient: string;
  description: string;
  createdAt: string;
  status?: InvoiceStatus;
  txHash?: string;
};

export const DEMO_INVOICE: Invoice = {
  id: "demo",
  amount: "0.01",
  targetToken: "USDT",
  recipient: "demo-safe-recipient",
  description: "Safe demo invoice — micro checkout for Cohort #2 judges",
  createdAt: new Date("2026-06-04T15:00:00Z").toISOString(),
  status: "unpaid"
};

export function generateInvoiceId() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export function encodeInvoice(invoice: Invoice) {
  const json = JSON.stringify(invoice);
  if (typeof window !== "undefined") {
    return window
      .btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeInvoice(encoded?: string | null): Invoice | null {
  if (!encoded) return null;
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    if (typeof window !== "undefined") {
      const json = decodeURIComponent(escape(window.atob(normalized)));
      return JSON.parse(json);
    }
    return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function isValidTonAddress(value: string) {
  return /^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(value.trim());
}

export function displayAddress(value: string, size = 6) {
  if (!value) return "—";
  if (value.length <= size * 2 + 3) return value;
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}
