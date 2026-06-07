# OmniPay AI

**Omniston-powered invoice checkout for TON.**

OmniPay AI lets a merchant create a USDT invoice and lets a payer cover it from TON or another Omniston-supported asset when a route is available. The project is built for the **STON.fi Vibe Coding Hackathon Cohort #2** and focuses on a clear end-to-end product flow:

```txt
Create invoice → connect wallet → parse payment intent → Omniston quote/route → safe simulation or real wallet preview → merchant dashboard
```

## Why it fits the STON.fi track

The core product depends on STON.fi Omniston v1beta8:

- live STON.fi asset list
- real Omniston quote/RFQ
- visible route and expected input/output
- `tonBuildSwap` transaction preparation for real mainnet preview
- TON Connect wallet connection and transaction request

## Product pages

```txt
/              Landing and product pitch
/create        Merchant invoice builder
/pay/[id]      Checkout page
/dashboard     Merchant invoice and payment history
```

## Demo safety

The checkout has two modes:

1. **Safe simulation** — uses the real invoice fields, connected wallet, payment intent and live Omniston quote, but does **not** build or broadcast a TON transaction.
2. **Real mainnet preview** — builds the actual Omniston transaction and opens Tonkeeper through TON Connect. Confirming in Tonkeeper spends real TON.

For a judge-safe video, use **Safe simulation** or open the real Tonkeeper preview and cancel before signing.

## Storage

The app works immediately without a backend:

- invoices are encoded in the checkout URL
- invoices and payments are also saved to browser `localStorage`
- the dashboard merges browser records with optional backend records

For a stronger deployment, connect Supabase by setting:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Supabase SQL schema

Create these tables in Supabase if you want persistent backend storage:

```sql
create table if not exists invoices (
  id text primary key,
  amount text not null,
  target_token text not null,
  recipient text not null,
  description text,
  status text default 'unpaid',
  tx_hash text,
  created_at timestamptz default now()
);

create table if not exists payments (
  id text primary key,
  invoice_id text references invoices(id) on delete cascade,
  mode text not null,
  status text not null,
  payer_address text,
  recipient_address text,
  source_token text not null,
  target_token text not null,
  input_amount text not null,
  output_amount text not null,
  quote_id text,
  boc text,
  simulation_id text,
  created_at timestamptz default now()
);
```

## Intent parser / AI layer

The current STON.fi-track submission does not depend on any external AI service being available. The public UI calls this an **AI intent parser**:

```txt
"Pay this invoice with TON" → sourceToken: TON, targetToken: USDT, intent: pay_invoice
```

The app includes an optional external intent endpoint hook:

```env
INTENT_FLOW_ENDPOINT=
INTENT_API_KEY=
```

If these variables are empty, the app uses a deterministic local parser so the demo remains reliable.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```txt
http://localhost:3000
```

## TON Connect local mobile testing

Mobile Tonkeeper cannot connect to `localhost`. Use ngrok:

```bash
npm run dev
ngrok http 3000
```

Then set in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://your-ngrok-domain.ngrok-free.app
```

Restart Next.js and open the ngrok URL. Confirm the manifest:

```txt
https://your-ngrok-domain.ngrok-free.app/tonconnect-manifest.json
```

It must not contain `localhost`.

## Submission checklist

- Functional working app
- STON.fi Omniston v1beta8 integration
- TON Connect wallet connection
- Clear invoice checkout use case
- Merchant dashboard and payment history
- Safe simulation mode for judges
- Real mainnet transaction preview for technical proof
- GitHub repository
- Live production URL
- Video presentation

## Current limitations

- Automatic on-chain merchant settlement verification is the next production step.
- Supabase is optional; without env keys, storage falls back to browser localStorage and URL payloads.
- The most stable tested route is TON → USDT.
