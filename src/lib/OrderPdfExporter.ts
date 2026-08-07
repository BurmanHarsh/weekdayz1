import { formatPrice } from "@/lib/format";
import { escapeHtml } from "@/lib/security";

interface OrderItem {
  id: string;
  title_snapshot?: string | null;
  size?: string;
  color?: string | null;
  quantity: number;
  unit_price_cents: number;
  image_snapshot?: string | null;
  custom_designs?: {
    base_color?: string;
  } | null;
}

interface OrderExportData {
  id: string;
  created_at: string;
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  tracking_number?: string | null;
  shipping_details?: any;
  order_items?: OrderItem[];
}

export function exportOrderToPdf(order: OrderExportData) {
  const shipping = order.shipping_details ?? {};
  const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Order Manifest #${escapeHtml(order.id.slice(0, 8).toUpperCase())} — WEEKDAYZ</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; line-height: 1.5; font-size: 13px; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
          .sub { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #666; }
          .order-id { font-family: monospace; font-size: 16px; font-weight: bold; margin-top: 5px; }
          .grid { display: flex; gap: 30px; margin-bottom: 25px; }
          .col { flex: 1; border: 1px solid #e2e8f0; padding: 15px; background: #fafafa; }
          .col h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #555; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #475569; padding: 8px; border-bottom: 2px solid #e2e8f0; background: #f1f5f9; }
          td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
          .item-title { font-weight: 600; }
          .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #94a3b8; }
          .total-row { display: flex; justify-content: flex-end; font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="background: #000; color: #fff; border: none; padding: 10px 18px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="logo">WEEKDAYZ</div>
            <div class="sub">Official Order Manifest</div>
          </div>
          <div style="text-align: right;">
            <div class="sub">Order ID</div>
            <div class="order-id">#${escapeHtml(order.id.slice(0, 8).toUpperCase())}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">${escapeHtml(formattedDate)}</div>
          </div>
        </div>

        <div class="grid">
          <div class="col">
            <h3>Shipping Details</h3>
            <div><strong>${escapeHtml(shipping.full_name || "Customer")}</strong></div>
            <div>${escapeHtml(shipping.phone || "")}</div>
            <div>${escapeHtml(shipping.line1 || "")} ${escapeHtml(shipping.line2 || "")}</div>
            <div>${escapeHtml(shipping.city || "")}, ${escapeHtml(shipping.state || "")} ${escapeHtml(shipping.postal_code || "")}</div>
            <div>${escapeHtml(shipping.country || "India")}</div>
          </div>
          <div class="col">
            <h3>Order Status & Tracking</h3>
            <div>Payment: <span class="badge">${escapeHtml(order.payment_status)}</span></div>
            <div style="margin-top: 6px;">Fulfillment: <span class="badge">${escapeHtml(order.fulfillment_status)}</span></div>
            <div style="margin-top: 6px;">Tracking ID: <strong>${escapeHtml(order.tracking_number || "Pending")}</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Size</th>
              <th>Color</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.order_items || [])
              .map(
                (it) => `
              <tr>
                <td>
                  <div class="item-title">${escapeHtml(it.title_snapshot || "T-Shirt Item")}</div>
                  ${it.custom_designs?.base_color ? `<div style="font-size: 10px; color: #64748b;">Custom print base: ${escapeHtml(it.custom_designs.base_color)}</div>` : ""}
                </td>
                <td>${escapeHtml(it.size || "—")}</td>
                <td>${escapeHtml(it.color || "—")}</td>
                <td>${it.quantity}</td>
                <td>${formatPrice(it.unit_price_cents)}</td>
                <td style="text-align: right;">${formatPrice(it.unit_price_cents * it.quantity)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="total-row">
          <span>Order Total: ${formatPrice(order.total_cents)}</span>
        </div>

        <div class="footer">
          Weekdayz Apparel Co. · Thank you for shopping with us!
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); }, 400);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
