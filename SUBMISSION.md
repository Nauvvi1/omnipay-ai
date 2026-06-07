# Submission — OmniPay AI

## Track

STON.fi track — uses Omniston crosschain SDK v1beta8.

## One-line pitch

OmniPay AI is an Omniston-powered invoice checkout that lets a merchant request USDT while the payer covers it from TON through live routing and TON Connect.

## What judges can test

1. Open the live site.
2. Create a USDT invoice with a TON recipient address.
3. Open the generated checkout link.
4. Connect Tonkeeper through TON Connect.
5. Parse the command: `Pay this invoice with TON`.
6. See the real Omniston quote and route.
7. Run safe simulation, or switch to real mainnet preview to open Tonkeeper.
8. Open the merchant dashboard and see invoice/payment history.

## STON.fi integration

- STON.fi asset list
- Omniston RFQ quote
- route display
- quote ID display
- real `tonBuildSwap` transaction preparation
- TON Connect transaction request

## Safety

Safe simulation mode does not send a transaction. Real mainnet preview opens a real Tonkeeper transaction; confirming spends TON.
