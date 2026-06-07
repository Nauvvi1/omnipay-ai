# OmniPay AI

AI-powered Omniston checkout for TON invoices.

OmniPay AI lets a merchant create a USDT invoice and lets the payer cover it with TON or another supported TON asset. Mira AI parses the user's natural-language payment request, STON.fi Omniston v1beta8 returns the route and quote, and TON Connect opens the wallet for transaction review.

## Why it exists

TON users often hold multiple assets, while real payments usually request one exact asset like USDT. OmniPay AI makes the swap invisible inside the payment experience:

```txt
invoice → wallet → Mira intent → Omniston quote/route → safe simulation or TON Connect preview → payment result
```

## Hackathon track

Primary submission track: **STON.fi**

Reason: the core feature uses Omniston SDK v1beta8 for quote, route and transaction building. Mira is integrated as the AI intent layer, but the product is positioned as an Omniston-powered checkout.

## Tech stack

- Next.js App Router
- React
- TON Connect via `@tonconnect/ui-react`
- STON.fi Omniston via `@ston-fi/omniston-sdk-react`
- STON.fi API via `@ston-fi/api` for live asset list
- Mira-compatible intent parser endpoint
- Vercel deployment-ready

## Main demo flow

1. Open `/create`.
2. Create an invoice: `25 USDT`, recipient TON address, description.
3. Open the generated `/pay/[id]?i=...` checkout link.
4. Connect a TON wallet.
5. Type: `Pay this invoice with TON`.
6. Click `Parse intent`.
7. The app selects TON as the source token.
8. Omniston returns a live quote for paying the target invoice amount.
9. For a judge-safe walkthrough, keep `Safe simulation` selected and click `Run safe payment simulation`.
10. For a real mainnet preview, switch to `Real mainnet preview` on a real invoice and open Tonkeeper. Stop before signing unless you intentionally want to execute the swap.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

```bash
NEXT_PUBLIC_OMNISTON_WS=wss://omni-ws.ston.fi
NEXT_PUBLIC_APP_URL=http://localhost:3000
MIRA_FLOW_ENDPOINT=
MIRA_API_KEY=
```

The app works without Mira credentials using a deterministic parser that returns the same JSON shape as the Mira flow. To connect a real Mira flow, deploy a Mira flow HTTP wrapper and set `MIRA_FLOW_ENDPOINT` + `MIRA_API_KEY`.

## TON Connect manifest

The app uses a dynamic manifest at:

```txt
/tonconnect-manifest.json
```

The manifest is generated dynamically from the current HTTPS origin, so it works with Vercel and ngrok. The icon is served from `/icon.png`.

## Important safety behavior

`/pay/demo` uses a safe demo invoice and defaults to **Safe simulation**. It still loads assets, parses intent and requests a live Omniston quote, but it does not build or broadcast a TON transaction. Real invoices created through `/create` can use **Real mainnet preview**, which opens Tonkeeper with a real transaction. Confirm only if you intentionally want to spend TON.

## What is real in the current app

- Live STON.fi asset loading
- Live Omniston RFQ request
- Omniston quote display
- Omniston transaction preparation through `tonBuildSwap` when real preview is selected
- TON Connect wallet connection
- TON Connect wallet transaction request when real preview is selected
- Safe simulation mode for demos without spending funds
- Mira-compatible payment intent parsing, with optional real Mira Flow endpoint via env vars

## Production next steps

- Add TonAPI/Toncenter settlement verification.
- Store invoices in Supabase instead of URL payloads.
- Track Omniston `trackTrade` status after extracting outgoing tx hash.
- Add merchant dashboard.
- Add Telegram Mini App wrapper.
- Add more supported source tokens and balance-aware token suggestions.

## Submission wording

OmniPay AI is an Omniston-powered checkout for TON invoices. A merchant requests a target asset such as USDT, while the payer can use TON or another supported asset. Mira converts natural-language payment commands into structured payment intent. STON.fi Omniston provides the live quote and route. The app supports a safe simulation mode for demos and a real TON Connect mainnet preview for non-custodial execution.

## TON Connect local mobile testing

Mobile wallets cannot reliably connect to a dApp whose manifest URL is `localhost` or plain HTTP. For QR testing with Tonkeeper, use either a deployed Vercel URL or a public HTTPS tunnel.

Example with localtunnel:

```bash
npm install -g localtunnel
npm run dev
lt --port 3000
```

Then set `.env.local` to the tunnel URL and restart Next.js:

```bash
NEXT_PUBLIC_APP_URL=https://your-tunnel.loca.lt
```

Open the tunnel URL in your desktop browser and scan the QR again. The manifest is served at:

```txt
https://your-tunnel.loca.lt/tonconnect-manifest.json
```

The manifest icon must be PNG/ICO, not SVG; this project uses `/icon.png`.
