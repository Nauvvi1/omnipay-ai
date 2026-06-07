import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";

export const metadata: Metadata = {
  title: "OmniPay AI — TON invoice checkout",
  description:
    "Omniston-powered invoice checkout for TON payments.",
  openGraph: {
    title: "OmniPay AI",
    description: "Omniston-powered invoice checkout for TON payments.",
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
