"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { encodeInvoice, generateInvoiceId, Invoice, isValidTonAddress, TON_ADDRESS_ERROR } from "@/lib/invoices";
import { saveLocalInvoice } from "@/lib/storage";

export function CreateInvoiceForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("25");
  const [targetToken, setTargetToken] = useState("USDT");
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("Dinner bill / service invoice");
  const [showRecipientError, setShowRecipientError] = useState(false);
  const [origin, setOrigin] = useState("");
  const [saving, setSaving] = useState(false);
  const [storageNote, setStorageNote] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
  const fullUrl = `${origin}${url}`;
  const amountIsValid = Number(amount) > 0;
  const recipientIsValid = isValidTonAddress(recipient);
  const canCreate = amountIsValid && targetToken.trim().length >= 2 && recipientIsValid;

  async function saveInvoice() {
    saveLocalInvoice(invoice);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice)
      });
      const json = await response.json();
      setStorageNote(json.storage === "supabase" ? "Saved to Supabase backend." : "Saved in browser storage. Supabase env is optional.");
    } catch {
      setStorageNote("Saved in browser storage. Backend sync was skipped.");
    }
  }

  async function handleOpen() {
    setShowRecipientError(!recipientIsValid);
    if (!canCreate) return;
    setSaving(true);
    await saveInvoice();
    setSaving(false);
    router.push(url);
  }

  async function handleCopy() {
    setShowRecipientError(!recipientIsValid);
    if (!canCreate) return;
    setSaving(true);
    await saveInvoice();
    setSaving(false);
    await navigator.clipboard?.writeText(fullUrl);
    setStorageNote("Checkout link copied and invoice saved.");
  }

  return (
    <div className="card glass">
      <div className="invoice-top">
        <span className="badge badge-green">Invoice builder</span>
        <span className="badge">Dashboard-ready</span>
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
            onBlur={() => setShowRecipientError(!isValidTonAddress(recipient))}
            onChange={(e) => {
              setRecipient(e.target.value);
              if (showRecipientError) setShowRecipientError(!isValidTonAddress(e.target.value));
            }}
            placeholder="EQ... or UQ..."
          />
          {showRecipientError && <span className="error">{TON_ADDRESS_ERROR}</span>}
        </label>
        <label className="label">
          Description
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="divider" />
        <div className="copy-box code">{canCreate ? fullUrl : "Add a valid TON recipient to generate the checkout link."}</div>
        <div className="grid grid-2">
          <button className="btn btn-primary btn-wide" disabled={saving} onClick={handleOpen} type="button">
            {saving ? "Saving…" : "Open checkout"}
          </button>
          <button className="btn btn-wide" disabled={saving} onClick={handleCopy} type="button">
            Copy link
          </button>
        </div>
        {storageNote && <p className="success">{storageNote}</p>}
      </div>
    </div>
  );
}
