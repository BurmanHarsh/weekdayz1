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
        <title>Order Manifest #${escapeHtml(order.id.slice(0, 8).toUpperCase())} — WEEKDAYZZ</title>
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
            <div class="logo">WEEKDAYZZ</div>
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
          Weekdayzz Apparel Co. · Thank you for shopping with us!
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

/* ─── Export Monthly Profit Statement PDF (aero-gym-flow style) ─── */

export interface MonthlyProfitDataForExport {
  monthLabel: string;
  monthKey: string;
  revenue_cents: number;
  cost_cents: number;
  net_profit_cents: number;
  margin_pct: number;
  order_count: number;
  channel_breakdown: Record<string, { revenue_cents: number; order_count: number }>;
}

export function exportMonthlyProfitPdf(summary: MonthlyProfitDataForExport) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const revInr = summary.revenue_cents / 100;
  const costInr = summary.cost_cents / 100;
  const netInr = summary.net_profit_cents / 100;
  const marginPct = summary.margin_pct;

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Monthly Profit Statement - ${escapeHtml(summary.monthLabel)} — WEEKDAYZZ</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.5; font-size: 13px; margin: 0; padding: 25px; background: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
          .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; margin: 0; color: #0f172a; }
          .brand-subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-top: 3px; }
          .report-tag { background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 6px 14px; display: inline-block; }
          
          .month-header { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #0f172a; padding: 18px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .month-title { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin: 0; }
          .generated-meta { font-size: 11px; color: #64748b; text-align: right; }

          .grid-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .kpi-card { border: 1px solid #cbd5e1; padding: 14px; background: #fafafa; border-radius: 4px; }
          .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 6px; }
          .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; }
          .kpi-val.profit { color: #16a34a; }
          .kpi-val.cost { color: #dc2626; }
          .kpi-badge { display: inline-block; margin-top: 4px; font-size: 10px; font-weight: 700; background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 2px; }

          .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #334155; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #475569; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; background: #f1f5f9; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .channel-name { font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }

          .sign-block { display: flex; justify-content: space-between; margin-top: 50px; pt: 30px; border-top: 1px border-border; }
          .sign-box { text-align: center; width: 200px; border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; }

          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #0f172a; color: #ffffff; border: none; padding: 12px 24px; font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; border-radius: 4px;">
            📄 Save / Print PDF Statement
          </button>
        </div>

        <div class="header">
          <div>
            <h1 class="brand-title">WEEKDAYZZ</h1>
            <div class="brand-subtitle">Financial Analytics & Profit Auditor</div>
          </div>
          <div style="text-align: right;">
            <div class="report-tag">Monthly Financial Report</div>
          </div>
        </div>

        <div class="month-header">
          <div>
            <span style="font-size: 10px; uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700;">Statement Period</span>
            <h2 class="month-title">${escapeHtml(summary.monthLabel)}</h2>
          </div>
          <div class="generated-meta">
            <div>Total Orders Processed: <strong>${summary.order_count}</strong></div>
            <div>Report Generated: <strong>${escapeHtml(generatedDate)}</strong></div>
          </div>
        </div>

        <div class="section-title">Executive Financial Summary</div>
        <div class="grid-summary">
          <div class="kpi-card">
            <div class="kpi-label">Gross Revenue</div>
            <div class="kpi-val">${formatPrice(summary.revenue_cents)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cost of Goods (COGS)</div>
            <div class="kpi-val cost">${formatPrice(summary.cost_cents)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Net Profit</div>
            <div class="kpi-val profit">${formatPrice(summary.net_profit_cents)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Profit Margin</div>
            <div class="kpi-val">${marginPct}%</div>
            <div class="kpi-badge">Net Return</div>
          </div>
        </div>

        <div class="section-title">Multi-Channel Sales Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Sales Channel</th>
              <th style="text-align: center;">Orders Count</th>
              <th style="text-align: right;">Revenue Generated</th>
              <th style="text-align: right;">Revenue Share %</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(summary.channel_breakdown)
              .map(([channelKey, channelVal]) => {
                const chRev = channelVal.revenue_cents / 100;
                const chOrders = channelVal.order_count;
                const sharePct = revInr > 0 ? ((chRev / revInr) * 100).toFixed(1) : "0";
                
                const channelDisplayNames: Record<string, string> = {
                  app: "Web App Store",
                  instagram: "Instagram DMs Direct",
                  whatsapp: "WhatsApp Direct Chat",
                  facebook: "Facebook Storefront",
                  offline: "Offline & Exhibition Store",
                  other: "Other Sales Channels",
                };

                return `
                  <tr>
                    <td class="channel-name">${escapeHtml(channelDisplayNames[channelKey] || channelKey)}</td>
                    <td style="text-align: center; font-weight: 600;">${chOrders}</td>
                    <td style="text-align: right; font-weight: 700;">${formatPrice(channelVal.revenue_cents)}</td>
                    <td style="text-align: right; font-weight: 700; color: #64748b;">${sharePct}%</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>

        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 40px; display: flex; justify-content: space-between;">
          <div class="sign-box">Prepared By (Manager)</div>
          <div class="sign-box">Authorized Financial Officer</div>
        </div>

        <div class="footer">
          Weekdayzz Apparel Co. · Confidential Financial Statement · Generated automatically
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

