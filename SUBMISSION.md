# Submission draft

## Project name
OmniPay AI

## One-line pitch
Pay TON invoices with any supported token: Mira understands the payment intent, STON.fi Omniston finds the route, and TON Connect signs the transaction.

## Track
STON.fi track

## Clear use case
A merchant wants to receive USDT. The payer has TON. OmniPay AI turns the invoice into a checkout where the payer can cover the requested USDT amount from TON through Omniston routing.

## What is integrated
- STON.fi Omniston SDK v1beta8 flow: RFQ, quote/route, buildTransfer
- TON Connect: wallet connection and transaction request
- Mira-compatible AI intent parser: natural language → structured payment intent
- STON.fi API: live supported asset list

## Demo steps
1. Create invoice for 25 USDT.
2. Open the generated checkout link.
3. Connect TON wallet.
4. Type `Pay this invoice with TON`.
5. Mira parser extracts the payment intent.
6. Omniston returns the live route and quote.
7. Click Review & Pay.
8. Wallet opens for transaction confirmation.

## Why this is not just a swap UI
The user is not swapping for trading. The swap is hidden inside an invoice payment workflow. STON.fi becomes payment infrastructure for everyday TON checkout.

## Limitations
- The MVP uses URL-encoded invoices for fast demo deployment.
- `/pay/demo` routes output back to the connected wallet for safety.
- Production settlement verification with TonAPI/Toncenter is the next step.
