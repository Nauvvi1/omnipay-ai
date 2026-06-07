"use client";

import { useEffect, useMemo, useState } from "react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Omniston, OmnistonProvider, WebSocketTransport } from "@ston-fi/omniston-sdk-react";
import { Buffer } from "buffer";
import { NavigationOverlay } from "@/components/NavigationOverlay";

function cleanUrl(value?: string) {
  return value?.replace(/\/$/, "");
}

function getManifestUrl(origin?: string) {
  const explicitManifestUrl = cleanUrl(process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL);
  if (explicitManifestUrl) return explicitManifestUrl;

  // Important for ngrok/local tunnel testing: when the app is opened through
  // an HTTPS tunnel, the wallet must see the tunnel URL, not localhost.
  if (origin) return `${cleanUrl(origin)}/tonconnect-manifest.json`;

  const publicAppUrl = cleanUrl(process.env.NEXT_PUBLIC_APP_URL);
  return `${publicAppUrl || "http://localhost:3000"}/tonconnect-manifest.json`;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [manifestUrl, setManifestUrl] = useState(getManifestUrl());

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!(window as any).Buffer) (window as any).Buffer = Buffer;
      setManifestUrl(getManifestUrl(window.location.origin));
    }
  }, []);

  const omniston = useMemo(() => {
    const apiUrl = process.env.NEXT_PUBLIC_OMNISTON_WS || "wss://omni-ws.ston.fi";
    const transport = new WebSocketTransport(apiUrl);
    return new Omniston({ apiUrl, transport });
  }, []);

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <OmnistonProvider omniston={omniston}>
        <NavigationOverlay />
        {children}
      </OmnistonProvider>
    </TonConnectUIProvider>
  );
}
