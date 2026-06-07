# OmniPay AI

**OmniPay AI is an Omniston-powered checkout for TON invoices.**

A merchant can create a USDT invoice, while the payer can use TON through STON.fi Omniston routing. The app shows a live quote, payment route, TON Connect wallet flow, safe simulation mode, and a merchant dashboard with invoice/payment history.

This project was built for the **STON.fi Vibe Coding Hackathon Cohort 2**.

---

## Live Demo

**App:** https://meshshift.com  
**Video demo:** https://www.youtube.com/watch?v=kfBisUnqP9Q

---

## Why I built this

TON users often hold TON or different jettons, while merchants usually want to receive a specific token like USDT.

Today, this creates friction:

1. The user has to manually open a DEX.
2. Swap the token.
3. Return to the merchant.
4. Complete the payment separately.

**OmniPay AI turns this into one checkout flow.**

The idea is simple:

> A merchant requests USDT.  
> The payer has TON.  
> Omniston finds the route.  
> TON Connect opens the wallet flow.  
> The merchant can track the invoice.

I really enjoyed building this because it feels like something that can become more than a weekend hackathon project. My goal is to continue developing it into a real TON payment product for merchants, mini apps, creators, and services that want to accept crypto payments without forcing users to manually swap tokens first.

---

## What it does

OmniPay AI lets a merchant create a payment invoice and lets a payer go through a smooth checkout flow.

Current flow:

1. Merchant creates a USDT invoice.
2. Payer opens the checkout link.
3. Payer connects a TON wallet with TON Connect.
4. The app parses the payment command into a payment intent.
5. STON.fi Omniston returns a live TON → USDT quote.
6. The payer can either:
   - run a safe simulation, or
   - open a real mainnet Tonkeeper transaction preview.
7. The merchant can view invoices and payment history in the dashboard.

---

## Key features

- **Invoice creation**
  - Amount
  - Target token
  - Recipient wallet address
  - Description

- **Omniston-powered checkout**
  - Live quote
  - Route preview
  - Expected input/output
  - Quote ID

- **TON Connect wallet flow**
  - Wallet connection
  - Real transaction preview mode
  - Safe demo mode for judging and testing

- **Merchant dashboard**
  - Created invoices
  - Payment attempts
  - Simulated/real payment flow history

- **Safe simulation mode**
  - Shows the full checkout experience
  - Does not send a real transaction
  - Useful for demos and judging

---

## STON.fi integration

The main integration is **STON.fi Omniston SDK v1beta8**.

Omniston is used for:

- fetching a live quote;
- showing the TON → USDT route;
- calculating expected input/output;
- preparing the real transaction preview flow.

This is not just a static UI. The checkout uses real Omniston routing data.

---

## Why this matters

This is not meant to be “another swap interface”.

The goal is to use STON.fi infrastructure as invisible payment routing:

> Instead of asking users to understand swaps, pools, routes, and slippage, the merchant simply creates an invoice and the payer goes through a checkout.

That is the product direction I want to keep building after the hackathon.

Future versions could support:

- more Omniston-supported tokens;
- merchant accounts;
- Telegram Mini App checkout;
- automatic on-chain settlement verification;
- payment links for creators and services;
- subscriptions and recurring invoices.

---

## Tech stack

- **Next.js**
- **React**
- **TypeScript**
- **TON Connect**
- **STON.fi Omniston SDK v1beta8**
- **Nginx**
- **Ubuntu server deployment**
- **systemd production process**

---

## How to run locally

Clone the repository:

```bash
git clone https://github.com/Nauvvi1/omnipay-ai.git
cd omnipay-ai
