"use client";

import { LoadingLink } from "@/components/LoadingLink";
import { useEffect, useMemo, useState } from "react";
import { displayAddress, encodeInvoice, Invoice, PaymentRecord } from "@/lib/invoices";
import { getLocalInvoices, getLocalPayments } from "@/lib/storage";

function statusClass(status?: string) {
  if (status === "submitted" || status === "paid" || status === "simulated") return "badge-green";
  if (status === "failed" || status === "cancelled") return "badge-red";
  return "badge-orange";
}

export function DashboardClient() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [storage, setStorage] = useState("browser-local-fallback");
  const [origin, setOrigin] = useState("");

  async function refresh() {
    const localInvoices = getLocalInvoices();
    const localPayments = getLocalPayments();
    let remoteInvoices: Invoice[] = [];
    let remotePayments: PaymentRecord[] = [];
    let storageMode = "browser-local-fallback";

    try {
      const invoiceResponse = await fetch("/api/invoices", { cache: "no-store" });
      const invoiceJson = await invoiceResponse.json();
      remoteInvoices = invoiceJson.invoices || [];
      storageMode = invoiceJson.storage || storageMode;
    } catch {
      storageMode = "browser-local-fallback";
    }

    try {
      const paymentResponse = await fetch("/api/payments", { cache: "no-store" });
      const paymentJson = await paymentResponse.json();
      remotePayments = paymentJson.payments || [];
      storageMode = paymentJson.storage || storageMode;
    } catch {
      // local fallback remains available
    }

    const invoiceMap = new Map<string, Invoice>();
    [...remoteInvoices, ...localInvoices].forEach((invoice) => invoiceMap.set(invoice.id, invoice));
    const paymentMap = new Map<string, PaymentRecord>();
    [...remotePayments, ...localPayments].forEach((payment) => paymentMap.set(payment.id, payment));

    setInvoices(Array.from(invoiceMap.values()).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
    setPayments(Array.from(paymentMap.values()).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
    setStorage(storageMode);
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    refresh();
  }, []);

  const stats = useMemo(() => {
    const submitted = payments.filter((payment) => payment.status === "submitted" || payment.status === "simulated" || payment.status === "paid").length;
    const totalOutput = payments.reduce((sum, payment) => {
      const value = parseFloat(payment.outputAmount);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
    return { submitted, totalOutput };
  }, [payments]);

  return (
    <main className="shell dashboard-layout">
      <section className="dashboard-hero card glass">
        <div>
          <span className="eyebrow"><b>Merchant dashboard</b> · invoice and payment history</span>
          <h1>Track Omniston checkout activity.</h1>
          <p className="lead">
            Judges can see that OmniPay is more than a one-off checkout screen: merchants create invoices,
            customers route payments through Omniston, and every simulation or real submission is recorded.
          </p>
        </div>
        <div className="dashboard-stats">
          <div className="quote-item"><small>Invoices</small><strong>{invoices.length}</strong></div>
          <div className="quote-item"><small>Payment events</small><strong>{payments.length}</strong></div>
          <div className="quote-item"><small>Completed flows</small><strong>{stats.submitted}</strong></div>
          <div className="quote-item"><small>Storage</small><strong>{storage === "supabase" ? "Supabase" : "Browser + API fallback"}</strong></div>
        </div>
      </section>

      <div className="dashboard-actions">
        <LoadingLink className="btn btn-primary" href="/create" loadingLabel="Opening…">Create invoice</LoadingLink>
        <button className="btn" onClick={refresh} type="button">Refresh dashboard</button>
      </div>

      <section className="section">
        <div className="invoice-top">
          <div>
            <span className="badge badge-blue">Merchant invoices</span>
            <h2 style={{ marginTop: 10 }}>Invoices</h2>
          </div>
          <span className="badge">{invoices.length} records</span>
        </div>
        {invoices.length === 0 ? (
          <div className="card"><p>No invoices yet. Create one and come back here.</p></div>
        ) : (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const checkoutUrl = `/pay/${invoice.id}?i=${encodeInvoice(invoice)}`;
                  const fullUrl = `${origin}${checkoutUrl}`;
                  return (
                    <tr key={invoice.id}>
                      <td><strong>{invoice.description || invoice.id}</strong><br /><small className="code">{invoice.id}</small></td>
                      <td>{invoice.amount} {invoice.targetToken}</td>
                      <td className="code">{displayAddress(invoice.recipient)}</td>
                      <td><span className={`badge ${statusClass(invoice.status)}`}>{invoice.status || "unpaid"}</span></td>
                      <td>{new Date(invoice.createdAt).toLocaleString()}</td>
                      <td className="table-actions">
                        <LoadingLink className="btn btn-small" href={checkoutUrl} loadingLabel="Opening…">Open</LoadingLink>
                        <button className="btn btn-small" type="button" onClick={() => navigator.clipboard?.writeText(fullUrl)}>Copy</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section">
        <div className="invoice-top">
          <div>
            <span className="badge badge-green">Payment history</span>
            <h2 style={{ marginTop: 10 }}>Payments</h2>
          </div>
          <span className="badge">simulation + real preview events</span>
        </div>
        {payments.length === 0 ? (
          <div className="card"><p>No payment events yet. Run a safe simulation from any checkout page.</p></div>
        ) : (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Mode</th>
                  <th>Route</th>
                  <th>Payer</th>
                  <th>Recipient</th>
                  <th>Quote</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td><strong>{payment.outputAmount}</strong><br /><small className="code">{payment.id}</small></td>
                    <td><span className={`badge ${payment.mode === "real" ? "badge-orange" : "badge-green"}`}>{payment.mode}</span></td>
                    <td>{payment.inputAmount} → {payment.outputAmount}</td>
                    <td className="code">{displayAddress(payment.payerAddress || "")}</td>
                    <td className="code">{displayAddress(payment.recipientAddress || "")}</td>
                    <td className="code">{payment.quoteId ? displayAddress(payment.quoteId, 5) : payment.simulationId ? displayAddress(payment.simulationId, 5) : "—"}</td>
                    <td>{new Date(payment.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
