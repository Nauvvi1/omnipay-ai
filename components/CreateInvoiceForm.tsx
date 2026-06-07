"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { encodeInvoice, generateInvoiceId, Invoice, isValidTonAddress } from "@/lib/invoices";

export function CreateInvoiceForm() {
  const [amount, setAmount] = useState("25");
  const [targetToken, setTargetToken] = useState("USDT");
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("Dinner bill / service invoice");
  const [touched, setTouched] = useState(false);

  const invoice = useMemo<Invoice>(() => ({
    id: generateInvoiceId(),
    amount: amount || "0",
    targetToken,
    recipient: recipient.trim(),
    description,
    createdAt: new Date().toISOString(),
    status: "unpaid"
  }), [amount, targetToken, recipient, description]);

  const encoded = encodeInvoice(invoice);
  const url = `/pay/${invoice.id}?i=${encoded}`;
  const canCreate = Number(amount) > 0 && targetToken.trim().length >= 2 && isValidTonAddress(recipient);

  return (
    <div className="card glass">
      <div className="invoice-top">
        <span className="badge badge-green">Invoice builder</span>
        <span className="badge">No backend required</span>
      </div>
      <div className="form">
        <label className="label">
          Target amount
          <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25" inputMode="decimal" />
        </label>
        <label className="label">
          Target token
          <select className="select" value={targetToken} onChange={(e) => setTargetToken(e.target.value)}>
            <option value="USDT">USDT</option>
            <option value="TON">TON</option>
          </select>
          <span className="help">For the strongest demo, keep target token as USDT and pay with TON.</span>
        </label>
        <label className="label">
          Merchant recipient address
          <input
            className="input"
            value={recipient}
            onBlur={() => setTouched(true)}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="EQ... or UQ..."
          />
          {touched && recipient && !isValidTonAddress(recipient) && (
            <span className="error">Enter a valid user-friendly TON address starting with EQ or UQ.</span>
          )}
        </label>
        <label className="label">
          Description
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="divider" />
        <div className="copy-box code">{canCreate ? `${typeof window !== "undefined" ? window.location.origin : ""}${url}` : "Add a valid TON recipient to generate the checkout link."}</div>
        <div className="grid grid-2">
          <Link className={`btn btn-primary btn-wide ${!canCreate ? "disabled" : ""}`} href={canCreate ? url : "#"} onClick={(e) => !canCreate && e.preventDefault()}>
            Open checkout
          </Link>
          <button className="btn btn-wide" disabled={!canCreate} onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${url}`)}>
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
