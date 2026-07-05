/**
 * Generates a deterministic 8-digit numeric suffix based on Firestore document ID
 */
export function getOrderSuffix(id: string): string {
  if (!id) return "00000000";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const p1 = String(Math.abs(hash) % 10000).padStart(4, "0");
  const p2 = String(Math.abs(hash * 31) % 10000).padStart(4, "0");
  return `${p1}${p2}`;
}

/**
 * Generates a systematic, purely numeric local order number.
 */
export function getOrderNumber(order: { id: string; time: number; paymentMethod?: string }): string {
  const payMethod = (order.paymentMethod || "COD").toLowerCase();
  
  let prefixNum = "3154"; // COD (C=3, O=15, D=4)
  if (payMethod.includes("bkash") || payMethod.includes("pay")) {
    prefixNum = "2111"; // BKA (B=2, K=11, A=1)
  } else if (payMethod.includes("nagad")) {
    prefixNum = "1417"; // NAG (N=14, A=1, G=7)
  }

  const d = new Date(order.time || Date.now());
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const dateStr = `${dd}${mm}${yy}`; // e.g. 020626

  const suffix = getOrderSuffix(order.id);

  return `${prefixNum}${dateStr}${suffix}`;
}

/**
 * Generates a human-friendly systematic tracking number.
 */
export function getTrackingNumber(order: { id: string; time: number; paymentMethod?: string; trackingNumber?: string }): string {
  // If a tracking number is already manually saved and matches format, preserve it:
  if (order.trackingNumber && order.trackingNumber.trim() && order.trackingNumber.includes("-")) {
    return order.trackingNumber;
  }

  const payMethod = (order.paymentMethod || "COD").toLowerCase();
  let prefix = "COD";
  if (payMethod.includes("bkash") || payMethod.includes("pay")) {
    prefix = "BKA";
  } else if (payMethod.includes("nagad")) {
    prefix = "NAG";
  }

  const d = new Date(order.time || Date.now());
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const dateStr = `${dd}${mm}${yy}`; // e.g. 020626

  const suffix = getOrderSuffix(order.id);

  return `${prefix}-${dateStr}-${suffix}`;
}
