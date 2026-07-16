/**
 * Transactional email helpers.
 * If RESEND_API_KEY is set, emails are sent via Resend.
 * Otherwise they are logged to console (dev/CI mode).
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email stub] To: ${payload.to} | Subject: ${payload.subject}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Weekdayz <no-reply@weekdayz.in>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[email] Failed to send: ${body}`);
  }
}

function formatRupees(cents: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(cents / 100);
}

export async function sendOrderConfirmation(
  to: string,
  orderId: string,
  totalCents: number
): Promise<void> {
  await sendEmail({
    to,
    subject: `Order confirmed — #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="font-size:28px;margin-bottom:8px">Order Confirmed ✅</h1>
        <p>Hey! Your order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> for <strong>${formatRupees(totalCents)}</strong> is confirmed and we're getting it ready.</p>
        <p style="color:#888">You'll get another email when it ships. Stay fly. 🚀</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:12px;color:#888">Weekdayz · Built for the always-online generation</p>
      </div>
    `,
  });
}

export async function sendShipped(
  to: string,
  orderId: string,
  trackingId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Your order shipped — Track #${trackingId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="font-size:28px;margin-bottom:8px">It's on its way 📦</h1>
        <p>Order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> has shipped.</p>
        <p>Tracking ID: <strong>${trackingId}</strong></p>
        <p style="color:#888">Should arrive in 3–5 business days.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:12px;color:#888">Weekdayz · Built for the always-online generation</p>
      </div>
    `,
  });
}

export async function sendDelivered(
  to: string,
  orderId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Delivered! Order #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="font-size:28px;margin-bottom:8px">Delivered 🎉</h1>
        <p>Order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> has been delivered. Hope you love it!</p>
        <p>Drop a review — it means the world to us.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:12px;color:#888">Weekdayz · Built for the always-online generation</p>
      </div>
    `,
  });
}
