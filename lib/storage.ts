"use client";

import type { Invoice, PaymentRecord } from "@/lib/invoices";

const INVOICE_KEY = "omnipay.invoices.v1";
const PAYMENT_KEY = "omnipay.payments.v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalInvoices() {
  return readJson<Invoice[]>(INVOICE_KEY, []);
}

export function saveLocalInvoice(invoice: Invoice) {
  const invoices = getLocalInvoices();
  const withoutCurrent = invoices.filter((item) => item.id !== invoice.id);
  const next = [{ ...invoice }, ...withoutCurrent];
  writeJson(INVOICE_KEY, next);
  return next;
}

export function updateLocalInvoiceStatus(invoiceId: string, status: Invoice["status"], txHash?: string) {
  const invoices = getLocalInvoices();
  const next = invoices.map((invoice) => invoice.id === invoiceId ? { ...invoice, status, txHash: txHash || invoice.txHash } : invoice);
  writeJson(INVOICE_KEY, next);
}

export function getLocalPayments() {
  return readJson<PaymentRecord[]>(PAYMENT_KEY, []);
}

export function saveLocalPayment(payment: PaymentRecord) {
  const payments = getLocalPayments();
  const withoutCurrent = payments.filter((item) => item.id !== payment.id);
  const next = [{ ...payment }, ...withoutCurrent];
  writeJson(PAYMENT_KEY, next);
  return next;
}
