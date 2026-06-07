export default function Loading() {
  return (
    <main className="shell route-loading-page">
      <div className="card glass route-loading-card">
        <span className="navigation-spinner" />
        <div>
          <h2>Loading checkout</h2>
          <p>Preparing the next OmniPay screen…</p>
        </div>
      </div>
    </main>
  );
}
