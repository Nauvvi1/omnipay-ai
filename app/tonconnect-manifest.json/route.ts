import { NextResponse } from "next/server";

function cleanUrl(value?: string | null) {
  return value?.replace(/\/$/, "");
}

export async function GET(request: Request) {
  // Use the real request origin so ngrok/Vercel/custom domains work without
  // rebuilding or changing env variables. Tonkeeper must receive a public HTTPS
  // URL when the page is opened through a tunnel.
  const origin = cleanUrl(new URL(request.url).origin);

  return NextResponse.json({
    url: origin,
    name: "OmniPay AI",
    iconUrl: `${origin}/icon.png`
  });
}
