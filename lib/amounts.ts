export function toBaseUnits(amount: string, decimals = 9) {
  const [wholeRaw, fractionRaw = ""] = String(amount || "0").trim().replace(",", ".").split(".");
  const whole = wholeRaw.replace(/\D/g, "") || "0";
  const fraction = fractionRaw.replace(/\D/g, "").slice(0, decimals).padEnd(decimals, "0");
  const result = `${whole}${fraction}`.replace(/^0+(?=\d)/, "");
  return result || "0";
}

export function fromBaseUnits(baseUnits?: string, decimals = 9, maxFraction = 4) {
  if (!baseUnits) return "0";
  const raw = String(baseUnits);
  const negative = raw.startsWith("-");
  const digits = raw.replace("-", "").padStart(decimals + 1, "0");
  const whole = digits.slice(0, -decimals) || "0";
  const fraction = digits.slice(-decimals).replace(/0+$/g, "").slice(0, maxFraction);
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function safeNumber(value: string) {
  return Number(String(value || "0").replace(",", "."));
}
