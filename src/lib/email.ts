/**
 * Transactional email helpers.
 * If RESEND_API_KEY is set, emails are sent via Resend.
 * Otherwise they are logged to console (dev/CI mode).
 */

import { formatEstimatedDeliveryDate, getDtdcTrackingUrl } from "./shipping";
import { escapeHtml } from "./security";

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
      from: process.env.EMAIL_FROM ?? "Weekdayzz <no-reply@weekdayz.in>",
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
  totalCents: number,
  estimatedDeliveryDate?: string
): Promise<void> {
  const deliveryStatus = estimatedDeliveryDate
    ? formatEstimatedDeliveryDate(estimatedDeliveryDate)
    : "Arrives in 3–5 business days";

  const safeOrderId = escapeHtml(orderId.slice(0, 8).toUpperCase());
  const safeDeliveryStatus = escapeHtml(deliveryStatus);

  await sendEmail({
    to,
    subject: `Order confirmed — #${safeOrderId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="font-size:28px;margin-bottom:8px">Order Confirmed ✅</h1>
        <p>Hey! Your order <strong>#${safeOrderId}</strong> for <strong>${formatRupees(totalCents)}</strong> is confirmed and we're getting it ready.</p>
        <p style="font-size:16px;color:#111;margin:16px 0;padding:12px;background:#f7f7f7;border-left:4px solid #000">
          <strong>${safeDeliveryStatus}</strong>
        </p>
        <p style="color:#888">You'll get another email when it ships. Stay fly. 🚀</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:12px;color:#888">Weekdayzz · Built for the always-online generation</p>
      </div>
    `,
  });
}

export async function sendShipped(
  to: string,
  orderId: string,
  trackingId: string
): Promise<void> {
  const safeOrderId = escapeHtml(orderId.slice(0, 8).toUpperCase());
  const safeTrackingId = escapeHtml(trackingId);
  const trackingUrl = getDtdcTrackingUrl(trackingId);

  await sendEmail({
    to,
    subject: `Your order shipped — Track #${safeTrackingId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="font-size:28px;margin-bottom:8px">It's on its way 📦</h1>
        <p>Order <strong>#${safeOrderId}</strong> has shipped via DTDC Express.</p>
        <p>Tracking ID: <strong>${safeTrackingId}</strong></p>
        <p style="margin:16px 0;">
          <a href="${trackingUrl}" target="_blank" style="background-color:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;">Track on DTDC</a>
        </p>
        <p style="color:#888">Should arrive in 5–7 business days.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:12px;color:#888">Weekdayzz · Built for the always-online generation</p>
      </div>
    `,
  });
}

export async function sendDelivered(
  to: string,
  orderId: string
): Promise<void> {
  const safeOrderId = escapeHtml(orderId.slice(0, 8).toUpperCase());
  await sendEmail({
    to,
    subject: `Delivered! Order #${safeOrderId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="font-size:28px;margin-bottom:8px">Delivered 🎉</h1>
        <p>Order <strong>#${safeOrderId}</strong> has been delivered. Hope you love it!</p>
        <p>Drop a review — it means the world to us.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:12px;color:#888">Weekdayzz · Built for the always-online generation</p>
      </div>
    `,
  });
}
