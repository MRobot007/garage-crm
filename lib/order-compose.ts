// Pure helpers to auto-compose a purchase-order email. Usable on client
// (live preview / mailto) and server (persisted copy). No Node/DB deps.

export interface ComposeItem {
  name: string;
  qty: number;
}

export function composeOrderSubject(
  businessName: string,
  orderNo?: string,
): string {
  const ref = orderNo ? ` ${orderNo}` : "";
  return `Purchase Order${ref} — ${businessName}`;
}

export function composeOrderBody(params: {
  businessName: string;
  supplierName: string;
  items: ComposeItem[];
}): string {
  const { businessName, supplierName, items } = params;
  const lines = items
    .filter((i) => i.name.trim())
    .map((i) => `  - ${i.qty} x ${i.name}`)
    .join("\n");

  return [
    `Hello ${supplierName || "there"},`,
    ``,
    `We would like to place an order for the following:`,
    ``,
    lines || `  - (no items yet)`,
    ``,
    `Please confirm availability, unit prices, and the earliest delivery date.`,
    ``,
    `Thank you,`,
    businessName,
  ].join("\n");
}

/** Build a Gmail compose URL — opens Gmail with To/Subject/Body pre-filled. */
export function buildGmailCompose(
  to: string,
  subject: string,
  body: string,
): string {
  const params = new URLSearchParams({
    view: "cm", // compose
    fs: "1", // full screen
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** Build a mailto: URL (default mail app) — kept as a secondary fallback. */
export function buildMailto(
  to: string,
  subject: string,
  body: string,
): string {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}
