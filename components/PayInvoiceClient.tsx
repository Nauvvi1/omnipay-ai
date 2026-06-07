"use client";

import { useEffect, useMemo, useState } from "react";
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { StonApiClient, AssetTag, type AssetInfoV2 } from "@ston-fi/api";
import {
  useOmniston,
  useRfq,
  type AssetId,
  type ChainAddress,
  type Quote
} from "@ston-fi/omniston-sdk-react";
import { DEMO_INVOICE, decodeInvoice, displayAddress, generatePaymentId, Invoice, isValidTonAddress, PaymentRecord } from "@/lib/invoices";
import { fromBaseUnits, toBaseUnits } from "@/lib/amounts";
import { assetSymbol, findAssetBySymbol, sortPreferredAssets } from "@/lib/tokens";
import type { PaymentIntent } from "@/lib/intent";
import { getLocalInvoices, saveLocalInvoice, saveLocalPayment, updateLocalInvoiceStatus } from "@/lib/storage";


type QuoteUpdatedEvent = {
  $case: "quoteUpdated";
  rfqId?: string;
  value: Quote;
};

type ExecutionMode = "simulation" | "real";

function tonAddress(address: string): ChainAddress {
  return { chain: { $case: "ton", value: address } };
}

function tonAssetId(asset?: AssetInfoV2): AssetId | undefined {
  if (!asset) return undefined;
  if (asset.kind === "Ton") {
    return { chain: { $case: "ton", value: { kind: { $case: "native", value: {} } } } };
  }
  if (asset.kind === "Jetton" || asset.kind === "Wton") {
    return { chain: { $case: "ton", value: { kind: { $case: "jetton", value: asset.contractAddress } } } };
  }
  return undefined;
}

function toTonConnectPayload(payload?: string) {
  if (!payload) return undefined;
  // Omniston returns TON payload/stateInit as hex BoC, while TON Connect expects base64 BoC.
  if (/^[0-9a-fA-F]+$/.test(payload)) {
    return Buffer.from(payload, "hex").toString("base64");
  }
  return payload;
}

function makeSimulationId() {
  return `SIM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function tonviewerAddress(address?: string) {
  return address ? `https://tonviewer.com/${address}` : undefined;
}

export function PayInvoiceClient({ id, encodedInvoice }: { id: string; encodedInvoice?: string }) {
  const initialInvoice = useMemo<Invoice>(() => decodeInvoice(encodedInvoice) || { ...DEMO_INVOICE, id }, [encodedInvoice, id]);
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);

  useEffect(() => {
    setInvoice(initialInvoice);
  }, [initialInvoice]);

  useEffect(() => {
    if (encodedInvoice || id === "demo") return;
    let alive = true;
    async function loadStoredInvoice() {
      const localInvoice = getLocalInvoices().find((item) => item.id === id);
      if (localInvoice && alive) setInvoice(localInvoice);
      try {
        const response = await fetch(`/api/invoices/${encodeURIComponent(id)}`);
        const json = await response.json();
        if (alive && json.invoice) setInvoice(json.invoice);
      } catch {
        // Browser-local fallback is enough for the hackathon demo.
      }
    }
    loadStoredInvoice();
    return () => { alive = false; };
  }, [encodedInvoice, id]);

  const walletAddress = useTonAddress();
  const [tonConnect] = useTonConnectUI();
  const omniston = useOmniston();

  const [assets, setAssets] = useState<AssetInfoV2[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [sourceSymbol, setSourceSymbol] = useState("TON");
  const [fromAsset, setFromAsset] = useState<AssetInfoV2 | undefined>();
  const [targetAsset, setTargetAsset] = useState<AssetInfoV2 | undefined>();

  const [command, setCommand] = useState("Pay this invoice with TON");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState("local-intent-parser");

  const [txState, setTxState] = useState<"idle" | "building" | "wallet" | "submitted" | "failed" | "cancelled">("idle");
  const [txBoc, setTxBoc] = useState<string>("");
  const [txError, setTxError] = useState<string>("");
  const [simulationId, setSimulationId] = useState<string>("");

  useEffect(() => {
    let alive = true;
    async function loadAssets() {
      try {
        setAssetsLoading(true);
        const client = new StonApiClient();
        const condition = [AssetTag.LiquidityVeryHigh, AssetTag.LiquidityHigh, AssetTag.LiquidityMedium].join(" | ");
        const list = await client.queryAssets({ condition });
        if (!alive) return;
        const sorted = sortPreferredAssets(list as AssetInfoV2[]);
        setAssets(sorted);
        setFromAsset(findAssetBySymbol(sorted, sourceSymbol) as AssetInfoV2 | undefined || sorted[0]);
        setTargetAsset(findAssetBySymbol(sorted, invoice.targetToken) as AssetInfoV2 | undefined || sorted[1]);
      } catch (error) {
        console.error(error);
        if (alive) setAssetsError(error instanceof Error ? error.message : String(error));
      } finally {
        if (alive) setAssetsLoading(false);
      }
    }
    loadAssets();
    return () => { alive = false; };
  }, [invoice.targetToken]);

  useEffect(() => {
    if (!assets.length) return;
    const matched = findAssetBySymbol(assets, sourceSymbol) as AssetInfoV2 | undefined;
    if (matched) setFromAsset(matched);
  }, [sourceSymbol, assets]);

  const askUnits = useMemo(() => {
    const decimals = targetAsset?.meta?.decimals ?? 6;
    return toBaseUnits(invoice.amount, decimals);
  }, [invoice.amount, targetAsset?.meta?.decimals]);

  const inputAsset = useMemo(() => tonAssetId(fromAsset), [fromAsset]);
  const outputAsset = useMemo(() => tonAssetId(targetAsset), [targetAsset]);
  const quoteRequestEnabled = Boolean(inputAsset && outputAsset && askUnits !== "0" && txState !== "submitted");

  const { data: quoteEvent, isLoading: quoteLoading, error: quoteError } = useRfq({
    inputAsset: inputAsset as AssetId,
    outputAsset: outputAsset as AssetId,
    amount: { $case: "outputUnits", value: askUnits },
    settlementParams: [
      {
        params: {
          $case: "swap",
          value: {
            maxPriceSlippagePips: 10_000,
            maxRoutes: 4,
            flexibleIntegratorFee: true
          }
        }
      }
    ]
  }, { enabled: quoteRequestEnabled });

  const quoteUpdated = quoteEvent?.$case === "quoteUpdated" ? quoteEvent as QuoteUpdatedEvent : undefined;
  const quote = quoteUpdated?.value || null;
  const recipientIsReal = isValidTonAddress(invoice.recipient);
  const destinationAddress = recipientIsReal ? invoice.recipient : walletAddress;
  const safeDemoMode = !recipientIsReal;
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(safeDemoMode ? "simulation" : "real");

  useEffect(() => {
    setExecutionMode(safeDemoMode ? "simulation" : "real");
  }, [safeDemoMode]);

  const walletLink = tonviewerAddress(walletAddress);
  const recipientLink = tonviewerAddress(destinationAddress);
  const transactionDisabled = !walletAddress || !quoteUpdated || txState === "building" || txState === "wallet";

  async function parsePaymentIntent() {
    setAiLoading(true);
    setTxError("");
    try {
      const response = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, invoice, supportedTokens: assets.slice(0, 20).map((asset) => assetSymbol(asset)) })
      });
      const json = await response.json();
      setIntent(json.intent);
      setAiProvider(json.provider || "local-intent-parser");
      if (json.intent?.sourceToken) setSourceSymbol(json.intent.sourceToken);
    } catch (error) {
      setTxError(error instanceof Error ? error.message : String(error));
    } finally {
      setAiLoading(false);
    }
  }

  async function persistPayment(payment: PaymentRecord, invoiceStatus: Invoice["status"]) {
    saveLocalInvoice({ ...invoice, status: invoiceStatus, txHash: payment.boc || payment.simulationId });
    saveLocalPayment(payment);
    updateLocalInvoiceStatus(invoice.id, invoiceStatus, payment.boc || payment.simulationId);
    setInvoice((current) => ({ ...current, status: invoiceStatus, txHash: payment.boc || payment.simulationId }));

    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment)
      });
      await fetch(`/api/invoices/${encodeURIComponent(invoice.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: invoiceStatus, txHash: payment.boc || payment.simulationId })
      });
    } catch {
      // Supabase is optional. Local dashboard history is still available.
    }
  }

  async function buildAndSend(willTradedQuote: QuoteUpdatedEvent | undefined) {
    if (!willTradedQuote || !walletAddress) {
      setTxError("Connect wallet and wait for a valid Omniston quote first.");
      return;
    }
    if (!destinationAddress) {
      setTxError("A connected wallet or real recipient address is required.");
      return;
    }

    setTxError("");
    if (executionMode === "simulation") {
      setTxState("building");
      await new Promise((resolve) => setTimeout(resolve, 650));
      const simId = makeSimulationId();
      setSimulationId(simId);
      setTxBoc("simulation-only-no-mainnet-broadcast");
      await persistPayment({
        id: generatePaymentId(),
        invoiceId: invoice.id,
        mode: "simulation",
        status: "simulated",
        payerAddress: walletAddress,
        recipientAddress: destinationAddress,
        sourceToken: assetSymbol(fromAsset),
        targetToken: assetSymbol(targetAsset),
        inputAmount: `${bidDisplay} ${assetSymbol(fromAsset)}`,
        outputAmount: `${askDisplay} ${assetSymbol(targetAsset)}`,
        quoteId: willTradedQuote.value.quoteId,
        simulationId: simId,
        createdAt: new Date().toISOString()
      }, "simulated");
      setTxState("submitted");
      return;
    }

    setTxState("building");
    try {
      const tx = await omniston.tonBuildSwap({
        quoteId: willTradedQuote.value.quoteId,
        transferSrcAddress: tonAddress(walletAddress),
        traderDstAddress: tonAddress(destinationAddress),
        gasExcessAddress: tonAddress(walletAddress),
        refundSrcAddress: tonAddress(walletAddress),
        useRecommendedSlippage: true
      });
      const messages = tx.messages || [];
      if (!messages.length) throw new Error("Omniston returned no TON messages for this quote.");

      setTxState("wallet");
      const result = await tonConnect.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: messages.map((message) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload: toTonConnectPayload(message.payload),
          stateInit: toTonConnectPayload(message.jettonWalletStateInit)
        }))
      });
      const boc = result.boc || "submitted";
      setTxBoc(boc);
      await persistPayment({
        id: generatePaymentId(),
        invoiceId: invoice.id,
        mode: "real",
        status: "submitted",
        payerAddress: walletAddress,
        recipientAddress: destinationAddress,
        sourceToken: assetSymbol(fromAsset),
        targetToken: assetSymbol(targetAsset),
        inputAmount: `${bidDisplay} ${assetSymbol(fromAsset)}`,
        outputAmount: `${askDisplay} ${assetSymbol(targetAsset)}`,
        quoteId: willTradedQuote.value.quoteId,
        boc,
        createdAt: new Date().toISOString()
      }, "submitted");
      setTxState("submitted");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      const cancelled = /reject|declin|cancel|abort|user/i.test(message);
      if (cancelled) {
        setTxError("Wallet preview was cancelled. No funds were spent.");
        setTxState("cancelled");
        return;
      }
      setTxError(message);
      setTxState("failed");
    }
  }

  const fromDecimals = fromAsset?.meta?.decimals ?? 9;
  const toDecimals = targetAsset?.meta?.decimals ?? 6;
  const bidDisplay = quote ? fromBaseUnits(quote.inputUnits, fromDecimals, 6) : "—";
  const askDisplay = quote ? fromBaseUnits(quote.outputUnits, toDecimals, 6) : invoice.amount;

  return (
    <main className="shell invoice-layout">
      <aside className="card glass">
        <div className="invoice-top">
          <span className="badge badge-blue">Invoice #{invoice.id}</span>
          <span className={`badge ${txState === "submitted" ? "badge-green" : "badge-orange"}`}>{txState === "submitted" ? (executionMode === "simulation" ? "simulated" : "submitted") : "unpaid"}</span>
        </div>
        <h3>{invoice.description || "TON invoice"}</h3>
        <div className="amount">{invoice.amount} {invoice.targetToken}</div>
        <p>
          Pay this invoice with a supported TON asset. Omniston will route the swap so the destination receives the target token.
        </p>
        <div className="divider" />
        <div className="list">
          <div className="list-row"><span>Recipient</span><strong>{recipientIsReal ? displayAddress(invoice.recipient) : "safe demo: your wallet"}</strong></div>
          <div className="list-row"><span>Target token</span><strong>{invoice.targetToken}</strong></div>
          <div className="list-row"><span>Created</span><strong>{new Date(invoice.createdAt).toLocaleDateString()}</strong></div>
        </div>
        {safeDemoMode && (
          <>
            <div className="divider" />
            <span className="badge badge-orange">Safe demo: output routes back to the connected wallet. Create a real invoice to set a merchant recipient.</span>
          </>
        )}
      </aside>

      <section className="grid">
        <div className="card glass">
          <div className="invoice-top">
            <span className="badge badge-green"><span className="status-dot" /> Wallet</span>
            <TonConnectButton />
          </div>
          <div className="ai-box">
            <label className="label">
              Payment command
              <div className="ai-row">
                <input
                  className="input"
                  value={command}
                  onChange={(e) => {
                    setCommand(e.target.value);
                    setIntent(null);
                    setTxError("");
                  }}
                  placeholder="Pay this invoice with TON"
                />
                <button className="btn btn-primary" onClick={parsePaymentIntent} disabled={aiLoading || Boolean(intent)}>{aiLoading ? "Parsing…" : intent ? "Intent ready" : "Parse payment intent"}</button>
              </div>
            </label>
            {intent && (
              <div className="card card-tight">
                <div className="invoice-top">
                  <span className="badge badge-blue">{aiProvider === "mira-ready-endpoint" ? "External intent endpoint" : "Payment intent parser"}</span>
                  <span className="badge">confidence {(intent.confidence * 100).toFixed(0)}%</span>
                </div>
                <p><b>{intent.paymentSummary}</b></p>
                <p>{intent.riskExplanation}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card glass">
          <div className="invoice-top">
            <div>
              <span className="badge badge-blue">STON.fi Omniston</span>
              <h2 style={{ marginTop: 10 }}>Quote & route</h2>
            </div>
            <span className="badge">v1beta8 flow</span>
          </div>

          <div className="grid grid-2">
            <label className="label">
              Pay with
              <select className="select" value={fromAsset?.contractAddress || ""} onChange={(e) => {
                const asset = assets.find((item) => item.contractAddress === e.target.value);
                setFromAsset(asset);
                if (asset) setSourceSymbol(assetSymbol(asset));
              }}>
                {assets.map((asset) => <option key={asset.contractAddress} value={asset.contractAddress}>{assetSymbol(asset)}</option>)}
              </select>
            </label>
            <label className="label">
              Merchant receives
              <select className="select" value={targetAsset?.contractAddress || ""} onChange={(e) => {
                const asset = assets.find((item) => item.contractAddress === e.target.value);
                setTargetAsset(asset);
              }}>
                {assets.map((asset) => <option key={asset.contractAddress} value={asset.contractAddress}>{assetSymbol(asset)}</option>)}
              </select>
            </label>
          </div>

          {assetsLoading && <p>Loading STON.fi asset list…</p>}
          {assetsError && <p className="error">Asset list error: {assetsError}</p>}

          <div className="route">
            <div className="route-node"><b>{assetSymbol(fromAsset)}</b><br /><small>Payer asset</small></div>
            <div className="route-arrow">→</div>
            <div className="route-node"><b>Omniston</b><br /><small>{quote?.resolverName || "best resolver"}</small></div>
            <div className="route-arrow">→</div>
            <div className="route-node"><b>{assetSymbol(targetAsset)}</b><br /><small>Invoice asset</small></div>
          </div>

          <div className="quote-grid">
            <div className="quote-item"><small>You pay</small><strong>{quoteLoading ? "Loading…" : `${bidDisplay} ${assetSymbol(fromAsset)}`}</strong></div>
            <div className="quote-item"><small>Recipient gets</small><strong>{quoteLoading ? "Loading…" : `${askDisplay} ${assetSymbol(targetAsset)}`}</strong></div>
            <div className="quote-item"><small>Resolver</small><strong>{quote?.resolverName || "—"}</strong></div>
            <div className="quote-item"><small>Quote ID</small><strong className="code">{quote?.quoteId ? displayAddress(quote.quoteId, 5) : "—"}</strong></div>
          </div>

          {quoteError && <p className="error">Omniston quote error: {String(quoteError)}</p>}
          {quoteEvent?.$case === "noQuote" && <p className="error">No Omniston quote for this pair right now. Try TON → USDT.</p>}
          <div className="divider" />
          <div className="mode-switch">
            <button
              className={`mode-pill ${executionMode === "simulation" ? "mode-pill-active" : ""}`}
              onClick={() => { setExecutionMode("simulation"); setTxState("idle"); setTxBoc(""); setSimulationId(""); setTxError(""); }}
              type="button"
            >
              Safe simulation
            </button>
            <button
              className={`mode-pill ${executionMode === "real" ? "mode-pill-active" : ""}`}
              onClick={() => { setExecutionMode("real"); setTxState("idle"); setTxBoc(""); setSimulationId(""); setTxError(""); }}
              type="button"
              disabled={safeDemoMode}
              title={safeDemoMode ? "Demo invoice routes to your wallet and defaults to simulation." : "Open a real Tonkeeper transaction preview."}
            >
              Preview real wallet transaction
            </button>
          </div>

          {executionMode === "simulation" ? (
            <div className="card card-tight simulation-card" style={{ marginBottom: 14 }}>
              <div className="invoice-top">
                <span className="badge badge-green">Safe demo mode</span>
                <span className="badge">no wallet broadcast</span>
              </div>
              <p style={{ marginTop: 8 }}>
                This mode keeps the real invoice fields and Omniston quote, but does not build or send a TON transaction.
                It simulates the final payment state for a judge-safe product walkthrough.
              </p>
              <p style={{ marginTop: 8 }}>
                Use it for the live demo video. Switch to real preview on a real invoice if you want to open Tonkeeper.
              </p>
            </div>
          ) : (
            <div className="card card-tight" style={{ marginBottom: 14, borderColor: "rgba(255, 209, 102, 0.42)", background: "rgba(255, 209, 102, 0.08)" }}>
              <div className="invoice-top">
                <span className="badge badge-orange">Real wallet transaction preview</span>
                {safeDemoMode && <span className="badge">safe demo recipient</span>}
              </div>
              <p style={{ marginTop: 8 }}>
                This button opens a real Tonkeeper transaction. You can safely cancel in the wallet.
                Confirm only if you want to execute a real mainnet swap and spend TON.
              </p>
              <p style={{ marginTop: 8 }}>
                Tonkeeper may show extra TON for gas, forward fees and contract execution. Unused excess may be returned by the Omniston flow.
              </p>
            </div>
          )}

          <button className="btn btn-green btn-large btn-wide" onClick={() => buildAndSend(quoteUpdated)} disabled={transactionDisabled}>
            {txState === "building"
              ? executionMode === "simulation" ? "Simulating settlement…" : "Building Omniston transfer…"
              : txState === "wallet"
                ? "Waiting for wallet confirmation…"
                : executionMode === "simulation" ? "Run safe payment simulation" : "Preview real wallet transaction"}
          </button>
          {txError && <p className={txState === "cancelled" ? "success" : "error"}>{txError}</p>}
          {txState === "submitted" && (
            <div className="payment-result card card-tight" style={{ marginTop: 14 }}>
              <div className="invoice-top">
                <span className="badge badge-green">{executionMode === "simulation" ? "Simulation complete" : "Transaction submitted"}</span>
                <span className="badge">{executionMode === "simulation" ? "demo-safe" : "mainnet"}</span>
              </div>
              <h3 style={{ marginTop: 12 }}>{executionMode === "simulation" ? "Payment flow completed safely" : "Payment submitted to TON"}</h3>
              <p>
                {executionMode === "simulation"
                  ? "No funds were spent. The app simulated the final checkout result using the live invoice, wallet, intent and Omniston quote."
                  : "The wallet accepted the transaction. This is a real mainnet submission if you confirmed it in Tonkeeper."}
              </p>
              <div className="quote-grid" style={{ marginTop: 14 }}>
                <div className="quote-item"><small>Payer sends</small><strong>{bidDisplay} {assetSymbol(fromAsset)}</strong></div>
                <div className="quote-item"><small>Recipient gets</small><strong>{askDisplay} {assetSymbol(targetAsset)}</strong></div>
                <div className="quote-item"><small>Route</small><strong>{assetSymbol(fromAsset)} → Omniston → {assetSymbol(targetAsset)}</strong></div>
                <div className="quote-item"><small>{executionMode === "simulation" ? "Simulation ID" : "TON Connect BOC"}</small><strong className="code">{executionMode === "simulation" ? simulationId : displayAddress(txBoc, 8)}</strong></div>
              </div>
              <div className="timeline" style={{ marginTop: 14 }}>
                <div className="timeline-row done"><span />Wallet connected</div>
                <div className="timeline-row done"><span />Payment intent parsed</div>
                <div className="timeline-row done"><span />Omniston quote received</div>
                <div className="timeline-row done"><span />{executionMode === "simulation" ? "Payment result simulated" : "TON transaction submitted"}</div>
                <div className="timeline-row pending"><span />Automated merchant settlement verification: next production step</div>
              </div>
              <div className="result-actions">
                {walletLink && <a className="btn" href={walletLink} target="_blank" rel="noreferrer">Open payer in Tonviewer</a>}
                {recipientLink && <a className="btn" href={recipientLink} target="_blank" rel="noreferrer">Open recipient in Tonviewer</a>}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
