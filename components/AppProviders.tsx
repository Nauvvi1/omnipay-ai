"use client";

import { useEffect, useMemo, useState } from "react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Omniston, OmnistonProvider, WebSocketTransport } from "@ston-fi/omniston-sdk-react";
import { Buffer } from "buffer";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [manifestUrl, setManifestUrl] = useState("/tonconnect-manifest.json");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!(window as any).Buffer) (window as any).Buffer = Buffer;
      setManifestUrl(`${window.location.origin}/api/tonconnect-manifest`);
    }
  }, []);

  const omniston = useMemo(() => {
    const apiUrl = process.env.NEXT_PUBLIC_OMNISTON_WS || "wss://omni-ws.ston.fi";
    const transport = new WebSocketTransport(apiUrl);
    return new Omniston({ apiUrl, transport });
  }, []);

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl} actionsConfiguration={{ twaReturnUrl: "https://t.me" }}>
      <OmnistonProvider omniston={omniston}>{children}</OmnistonProvider>
    </TonConnectUIProvider>
  );
}
