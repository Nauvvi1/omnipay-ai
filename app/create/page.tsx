import { Header } from "@/components/Header";
import { CreateInvoiceForm } from "@/components/CreateInvoiceForm";

export default function CreatePage() {
  return (
    <>
      <Header />
      <main className="shell section">
        <div className="grid grid-2">
          <div>
            <span className="eyebrow"><b>Merchant mode</b> · create payment link</span>
            <h1>Create a TON invoice.</h1>
            <p className="lead">
              Generate a checkout link that asks the customer to deliver a target amount in USDT.
              The payer can then use TON or another supported token through Omniston routing.
            </p>
          </div>
          <CreateInvoiceForm />
        </div>
      </main>
    </>
  );
}
