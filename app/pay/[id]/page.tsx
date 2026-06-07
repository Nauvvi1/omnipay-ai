import { Header } from "@/components/Header";
import { PayInvoiceClient } from "@/components/PayInvoiceClient";

export default function PayPage({ params, searchParams }: { params: { id: string }; searchParams: { i?: string } }) {
  return (
    <>
      <Header />
      <PayInvoiceClient id={params.id} encodedInvoice={searchParams?.i} />
    </>
  );
}
