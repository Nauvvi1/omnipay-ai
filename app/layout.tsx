import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";

export const metadata: Metadata = {
  title: "OmniPay AI — TON invoice checkout",
  description:
    "AI-powered Omniston checkout that lets users pay TON invoices with supported tokens.",
  openGraph: {
    title: "OmniPay AI",
    description: "Pay TON invoices with any supported token using Mira AI + STON.fi Omniston.",
    images: ["/og.svg"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
