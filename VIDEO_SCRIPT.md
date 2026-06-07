# 90-second video script

## 0–10 sec — Problem
TON users often hold different assets, but invoices usually request a specific token like USDT. Paying manually means swapping first, checking slippage, then returning to the merchant.

## 10–20 sec — Solution
OmniPay AI is an Omniston-powered checkout. It lets users pay TON invoices with a supported asset from their wallet.

## 20–65 sec — Demo
1. Create a 25 USDT invoice.
2. Open the checkout link.
3. Connect a TON wallet.
4. Type: `Pay this invoice with TON`.
5. Mira parses the command into payment intent.
6. Omniston returns the quote and route.
7. The UI shows how much TON will be paid and how much USDT the merchant receives.
8. Click Preview / simulate payment and confirm in the wallet.

## 65–80 sec — Tech
Built with Next.js, TON Connect, STON.fi Omniston SDK v1beta8, STON.fi API and Mira-compatible intent parsing.

## 80–90 sec — Closing
OmniPay AI turns STON.fi from a DEX interface into invisible payment infrastructure for everyday TON invoices.


## Safety line for the demo

For safety, stop before confirming in Tonkeeper: the wallet screen proves that Omniston and TON Connect prepared a real mainnet transaction, but no funds are spent unless the transaction is signed.


## Updated demo safety note

Use `/pay/demo` for the video. It defaults to Safe simulation: real wallet connection, real Omniston quote, no mainnet broadcast. Then optionally show a real invoice and click Real mainnet preview to prove Tonkeeper opens a real transaction, but cancel before signing.
