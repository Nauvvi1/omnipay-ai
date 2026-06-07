"use client";

import { useEffect, useMemo, useState } from "react";
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { StonApiClient, AssetTag, type AssetInfoV2 } from "@ston-fi/api";
import {
  Blockchain,
  GaslessSettlement,
  SettlementMethod,
  useOmniston,
  useRfq,
  type QuoteResponseEvent_QuoteUpdated
} from "@ston-fi/omniston-sdk-react";
import { DEMO_INVOICE, decodeInvoice, displayAddress, Invoice, isValidTonAddress } from "@/lib/invoices";
import { fromBaseUnits, toBaseUnits } from "@/lib/amounts";
import { assetSymbol, findAssetBySymbol, sortPreferredAssets } from "@/lib/tokens";
import type { PaymentIntent } from "@/lib/mira";

export function PayInvoiceClient({ id, encodedInvoice }: { id: string; encodedInvoice?: string }) {
  const invoice = useMemo<Invoice>(() => decodeInvoice(encodedInvoice) || { ...DEMO_INVOICE, id }, [encodedInvoice, id]);

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
  const [aiProvider, setAiProvider] = useState("local-fallback");

  const [txState, setTxState] = useState<"idle" | "building" | "wallet" | "submitted" | "failed">("idle");
  const [txBoc, setTxBoc] = useState<string>("");
  const [txError, setTxError] = useState<string>("");

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

  const quoteRequestEnabled = Boolean(fromAsset?.contractAddress && targetAsset?.contractAddress && askUnits !== "0" && txState !== "submitted");

  const { data: quoteEvent, isLoading: quoteLoading, error: quoteError } = useRfq({
    settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
    bidAssetAddress: fromAsset?.contractAddress
      ? { blockchain: Blockchain.TON, address: fromAsset.contractAddress }
      : undefined,
    askAssetAddress: targetAsset?.contractAddress
      ? { blockchain: Blockchain.TON, address: targetAsset.contractAddress }
      : undefined,
    amount: { askUnits },
    settlementParams: {
      gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
      maxPriceSlippageBps: 100
    }
  }, { enabled: quoteRequestEnabled });

  const quote = quoteEvent && quoteEvent.type === "quoteUpdated" ? quoteEvent.quote : null;
  const recipientIsReal = isValidTonAddress(invoice.recipient);
  const destinationAddress = recipientIsReal ? invoice.recipient : walletAddress;
  const safeDemoMode = !recipientIsReal;

  async function parseWithMira() {
    setAiLoading(true);
    setTxError("");
    try {
      const response = await fetch("/api/mira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, invoice, supportedTokens: assets.slice(0, 20).map((asset) => assetSymbol(asset)) })
      });
      const json = await response.json();
      setIntent(json.intent);
      setAiProvider(json.provider || "local-fallback");
      if (json.intent?.sourceToken) setSourceSymbol(json.intent.sourceToken);
    } catch (error) {
      setTxError(error instanceof Error ? error.message : String(error));
    } finally {
      setAiLoading(false);
    }
  }

  async function buildAndSend(willTradedQuote: QuoteResponseEvent_QuoteUpdated | undefined) {
    if (!willTradedQuote || !walletAddress) {
      setTxError("Connect wallet and wait for a valid Omniston quote first.");
      return;
    }
    if (!destinationAddress) {
      setTxError("A real recipient address is required for payment mode.");
      return;
    }

    setTxError("");
    setTxState("building");
    try {
      const tx = await omniston.buildTransfer({
        quote: willTradedQuote.quote,
        sourceAddress: { blockchain: Blockchain.TON, address: walletAddress },
        destinationAddress: { blockchain: Blockchain.TON, address: destinationAddress },
        gasExcessAddress: { blockchain: Blockchain.TON, address: walletAddress },
        refundAddress: { blockchain: Blockchain.TON, address: walletAddress },
        useRecommendedSlippage: true
      });
      const messages = tx.ton?.messages || [];
      if (!messages.length) throw new Error("Omniston returned no TON messages for this quote.");

      setTxState("wallet");
      const result = await tonConnect.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: messages.map((message: any) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload: message.payload
        }))
      });
      setTxBoc(result.boc || "submitted");
      setTxState("submitted");
    } catch (error) {
      console.error(error);
      setTxError(error instanceof Error ? error.message : String(error));
      setTxState("failed");
    }
  }

  const quoteUpdated = quoteEvent?.type === "quoteUpdated" ? quoteEvent as QuoteResponseEvent_QuoteUpdated : undefined;
  const fromDecimals = fromAsset?.meta?.decimals ?? 9;
  const toDecimals = targetAsset?.meta?.decimals ?? 6;
  const bidDisplay = quote ? fromBaseUnits(quote.bidUnits, fromDecimals, 6) : "—";
  const askDisplay = quote ? fromBaseUnits(quote.askUnits, toDecimals, 6) : invoice.amount;

  return (
    <main className="shell invoice-layout">
      <aside className="card glass">
        <div className="invoice-top">
          <span className="badge badge-blue">Invoice #{invoice.id}</span>
          <span className={`badge ${txState === "submitted" ? "badge-green" : "badge-orange"}`}>{txState === "submitted" ? "submitted" : "unpaid"}</span>
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
            <span className="badge badge-orange">Demo invoice routes output back to the connected wallet. Create a real invoice to set merchant recipient.</span>
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
              Mira payment command
              <div className="ai-row">
                <input className="input" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Pay this invoice with TON" />
                <button className="btn btn-primary" onClick={parseWithMira} disabled={aiLoading}>{aiLoading ? "Parsing…" : "Parse intent"}</button>
              </div>
            </label>
            {intent && (
              <div className="card card-tight">
                <div className="invoice-top">
                  <span className="badge badge-blue">{aiProvider === "mira" ? "Mira AI" : "Mira-compatible parser"}</span>
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
          {quoteEvent?.type === "noQuote" && <p className="error">No Omniston quote for this pair right now. Try TON → USDT.</p>}
          <div className="divider" />
          <button className="btn btn-green btn-large btn-wide" onClick={() => buildAndSend(quoteUpdated)} disabled={!walletAddress || !quoteUpdated || txState === "building" || txState === "wallet"}>
            {txState === "building" ? "Building Omniston transfer…" : txState === "wallet" ? "Confirm in wallet…" : "Review & Pay with TON Connect"}
          </button>
          {txError && <p className="error">{txError}</p>}
          {txState === "submitted" && (
            <div className="card card-tight" style={{ marginTop: 14 }}>
              <span className="badge badge-green">Transaction submitted</span>
              <p>The wallet accepted the transaction. Merchant settlement can be tracked with Omniston trade status in the next production step.</p>
              <div className="copy-box code">{displayAddress(txBoc, 18)}</div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
