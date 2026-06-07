# OmniPay AI

AI-powered Omniston checkout for TON invoices.

OmniPay AI lets a merchant create a USDT invoice and lets the payer cover it with TON or another supported TON asset. Mira AI parses the user's natural-language payment request, STON.fi Omniston v1beta8 returns the route and quote, and TON Connect opens the wallet for transaction review.

## Why it exists

TON users often hold multiple assets, while real payments usually request one exact asset like USDT. OmniPay AI makes the swap invisible inside the payment experience:

```txt
invoice → wallet → Mira intent → Omniston quote/route → TON Connect review → submitted payment
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
9. Click `Review & Pay with TON Connect`.
10. Confirm the generated transaction in the wallet.

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
/api/tonconnect-manifest
```

`public/tonconnect-manifest.json` is also included as a static fallback. For production, set `NEXT_PUBLIC_APP_URL` to your Vercel URL so wallets see the correct app origin.

## Important safety behavior

`/pay/demo` uses a safe demo invoice. Because it has no real merchant address, the output token is routed back to the connected wallet. Real invoices created through `/create` use the merchant recipient address.

## What is real in the current app

- Live STON.fi asset loading
- Live Omniston RFQ request
- Omniston quote display
- Omniston `buildTransfer` transaction preparation
- TON Connect wallet connection
- TON Connect wallet transaction request
- Mira-compatible payment intent parsing

## Production next steps

- Add TonAPI/Toncenter settlement verification.
- Store invoices in Supabase instead of URL payloads.
- Track Omniston `trackTrade` status after extracting outgoing tx hash.
- Add merchant dashboard.
- Add Telegram Mini App wrapper.
- Add more supported source tokens and balance-aware token suggestions.

## Submission wording

OmniPay AI is an Omniston-powered checkout for TON invoices. A merchant requests a target asset such as USDT, while the payer can use TON or another supported asset. Mira converts natural-language payment commands into structured payment intent. STON.fi Omniston provides the live quote, route and transaction payload. TON Connect keeps execution non-custodial.
