// Compose the "your accessory is in stock — come visit" email sent to a
// website enquirer. Branding/hours come from env (the CRM's own businessName
// may differ from the storefront brand, e.g. VOZIDEX).

export function shopBranding() {
  return {
    name: process.env.SHOP_NAME || "our shop",
    hours: process.env.SHOP_HOURS || "our regular business hours",
    address: process.env.SHOP_ADDRESS || "",
    phone: process.env.SHOP_PHONE || "",
  };
}

export function composeLeadAutoReply(params: {
  customerName: string;
  accessory: string;
}): { subject: string; text: string } {
  const { name, hours, address, phone } = shopBranding();
  const first = params.customerName.trim().split(" ")[0] || "there";

  const lines = [
    `Hi ${first},`,
    ``,
    `Thank you for reaching out to ${name} — great choice!`,
    ``,
    `Good news: the "${params.accessory}" you're looking for is in stock and ready at our shop. We'd love for you to come see it in person.`,
    ``,
    `We're open:`,
    hours,
  ];
  if (address) lines.push(address);
  if (phone) lines.push(`Call us: ${phone}`);
  lines.push(
    ``,
    `Have any questions in the meantime? Just reply to this email — we're always happy to help. We look forward to welcoming you!`,
    ``,
    `Warm regards,`,
    `Team ${name}`,
  );

  return {
    subject: `Your ${params.accessory} is in stock at ${name}`,
    text: lines.join("\n"),
  };
}
