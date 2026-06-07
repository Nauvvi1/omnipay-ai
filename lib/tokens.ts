export type MinimalAsset = {
  contractAddress: string;
  meta?: {
    symbol?: string;
    displayName?: string;
    decimals?: number;
    imageUrl?: string;
  };
};

export function normalizeSymbol(value = "") {
  return value.toUpperCase().replace("USD₮", "USDT").replace("TONCOIN", "TON").trim();
}

export function assetSymbol(asset?: MinimalAsset) {
  const raw = asset?.meta?.symbol || asset?.meta?.displayName || "TOKEN";
  return normalizeSymbol(raw);
}

export function displayAssetText(value = "") {
  return value.replace(/USD₮/gi, "USDT");
}

export function findAssetBySymbol(assets: MinimalAsset[], symbol: string) {
  const wanted = normalizeSymbol(symbol);
  return assets.find((asset) => {
    const s = normalizeSymbol(asset.meta?.symbol || "");
    const n = normalizeSymbol(asset.meta?.displayName || "");
    if (wanted === "TON") return s === "TON" || n.includes("TONCOIN");
    if (wanted === "USDT") return s === "USDT" || s === "USD₮" || n.includes("TETHER") || n.includes("USDT");
    return s === wanted || n === wanted;
  });
}

export function sortPreferredAssets<T extends MinimalAsset>(assets: T[]) {
  const score = (asset: T) => {
    const s = normalizeSymbol(asset.meta?.symbol || asset.meta?.displayName || "");
    if (s === "TON") return 0;
    if (s === "USDT" || s === "USD₮") return 1;
    if (s === "NOT") return 2;
    if (s === "DOGS") return 3;
    return 20;
  };
  return [...assets].sort((a, b) => score(a) - score(b));
}
