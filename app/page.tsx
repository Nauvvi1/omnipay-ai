import Link from "next/link";
import { Header } from "@/components/Header";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="shell">
        <section className="hero">
          <div>
            <span className="eyebrow"><b>STON.fi track</b> · Omniston v1beta8 checkout</span>
            <h1>Pay TON invoices with any supported token.</h1>
            <p className="lead">
              OmniPay AI turns a normal invoice into a smart checkout. Mira parses the payer intent,
              Omniston finds the route, and TON Connect lets the user review and sign the transaction.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-large" href="/create">Create live invoice</Link>
              <Link className="btn btn-large" href="/pay/demo">Open demo checkout</Link>
            </div>
          </div>

          <div className="card glass checkout-preview">
            <div className="invoice-top">
              <span className="badge badge-green"><span className="status-dot" /> Live checkout flow</span>
              <span className="badge">Omniston quote</span>
            </div>
            <h3>Dinner bill</h3>
            <div className="amount">25 USDT</div>
            <p>Customer has TON. Merchant wants USDT. OmniPay routes the payment instead of forcing manual swaps.</p>
            <div className="mock-input">Pay this invoice with TON</div>
            <div className="route">
              <div className="route-node"><b>TON</b><br /><small>Payer</small></div>
              <div className="route-arrow">→</div>
              <div className="route-node"><b>Omniston</b><br /><small>route + quote</small></div>
              <div className="route-arrow">→</div>
              <div className="route-node"><b>USDT</b><br /><small>Merchant</small></div>
            </div>
            <button className="btn btn-green btn-wide">Review in wallet</button>
          </div>
        </section>

        <section className="section grid grid-3">
          <div className="card card-tight kpi"><span>1</span><div><strong>Clear use case</strong><small>Invoice payment instead of generic swap UI.</small></div></div>
          <div className="card card-tight kpi"><span>2</span><div><strong>Real STON.fi core</strong><small>Omniston handles routing, quote and transfer building.</small></div></div>
          <div className="card card-tight kpi"><span>3</span><div><strong>AI with a job</strong><small>Mira turns natural language into a payment intent.</small></div></div>
        </section>

        <section id="flow" className="section">
          <h2>One finished demo flow</h2>
          <p className="lead">The judge can follow the whole product path without reading docs.</p>
          <div className="flow-steps">
            {[
              ["Invoice", "Merchant creates a USDT invoice and payment link."],
              ["Wallet", "Payer connects Tonkeeper or another TON Connect wallet."],
              ["Mira", "Natural-language command becomes structured payment intent."],
              ["Omniston", "The app requests a live quote and builds the swap route."],
              ["Pay", "TON Connect opens the wallet for review and signing."]
            ].map(([title, text], index) => (
              <div className="card card-tight flow-step" key={title}>
                <span className="num">{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section grid grid-2">
          <div className="card">
            <span className="badge badge-blue">Submission-ready</span>
            <h2>Why judges get it fast</h2>
            <p>
              This is not an assistant that only talks. It is a checkout that performs a concrete action:
              route a payment from the payer token to the merchant requested token.
            </p>
          </div>
          <div className="card">
            <span className="badge badge-orange">Weekend-safe scope</span>
            <h2>Focused MVP</h2>
            <p>
              The live demo focuses on TON → USDT invoice checkout. The architecture already supports adding more
              Omniston-supported assets from the STON.fi asset list.
            </p>
          </div>
        </section>
      </main>
      <footer className="footer shell">
        <span>Built for STON.fi Vibe Coding Hackathon Cohort #2</span>
        <span>Next.js · TON Connect · Omniston · Mira</span>
      </footer>
    </>
  );
}
