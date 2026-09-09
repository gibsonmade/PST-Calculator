export function formatCurrency(value, options = {}) {
  const { cents = false } = options;
  const displayValue = cents ? value : value + Math.sign(value) * 0.00001;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents ? 2 : 0,
    minimumFractionDigits: cents ? 2 : 0,
  }).format(displayValue);
}

export function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatFlexible(value, maxDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxDigits,
  }).format(value);
}

export function formatRoiMultiple(value) {
  if (value === null) return "N/A";
  return `${formatNumber(value, 2)}x`;
}

export function formatRoiPercent(value) {
  if (value === null) return "N/A";
  return `${formatNumber(value, 0)}%`;
}

export function formatPercent(value) {
  return `${formatFlexible(value, 1)}%`;
}
