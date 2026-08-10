import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingUp,
  IndianRupee,
  Instagram,
  MessageCircle,
  Share2,
  Smartphone,
  Store,
  Plus,
  Download,
  Calendar,
  X,
  FileSpreadsheet,
  PieChart as PieIcon,
  BarChart3,
  Percent,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

import {
  getProfitAnalyticsData,
  recordExternalSale,
  OrderSource,
} from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { exportMonthlyProfitPdf } from "@/lib/OrderPdfExporter";

const CHANNEL_COLORS: Record<OrderSource, string> = {
  app: "#6366f1", // Indigo / Web App
  instagram: "#e1306c", // Instagram Pink/Red
  whatsapp: "#25d366", // WhatsApp Green
  facebook: "#1877f2", // Facebook Blue
  offline: "#f59e0b", // Amber / Store
  other: "#8b5cf6", // Purple
};

const CHANNEL_NAMES: Record<OrderSource, string> = {
  app: "Web App Store",
  instagram: "Instagram DMs",
  whatsapp: "WhatsApp Direct",
  facebook: "Facebook Shop",
  offline: "Offline Store",
  other: "Other Channels",
};

export default function ProfitAnalyticsSection() {
  const qc = useQueryClient();
  const getAnalyticsFn = useServerFn(getProfitAnalyticsData);
  const [showLogModal, setShowLogModal] = useState(false);
  const [viewMode, setViewMode] = useState<"trend" | "channel">("trend");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-profit-analytics"],
    queryFn: () => getAnalyticsFn(),
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent mx-auto rounded-full" />
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Calculating Month-Wise Profit & Revenue…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border border-red-500/30 bg-red-500/5 p-6 text-center text-sm text-red-400">
        Failed to calculate profit analytics: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  const { monthlyData, summary } = data;

  // Prepare chart data in Rupees for easy rendering
  const chartData = monthlyData.map((m) => ({
    month: m.monthLabel,
    Revenue: Math.round(m.revenue_cents / 100),
    Cost: Math.round(m.cost_cents / 100),
    NetProfit: Math.round(m.net_profit_cents / 100),
    Margin: m.margin_pct,
    AppRevenue: Math.round(m.channel_breakdown.app.revenue_cents / 100),
    InstagramRevenue: Math.round(m.channel_breakdown.instagram.revenue_cents / 100),
    WhatsAppRevenue: Math.round(m.channel_breakdown.whatsapp.revenue_cents / 100),
    FacebookRevenue: Math.round(m.channel_breakdown.facebook.revenue_cents / 100),
    OfflineRevenue: Math.round(m.channel_breakdown.offline.revenue_cents / 100),
  }));

  // Channel share data for Pie Chart
  const pieData = (Object.keys(summary.channel_totals) as OrderSource[])
    .map((ch) => ({
      name: CHANNEL_NAMES[ch],
      value: Math.round(summary.channel_totals[ch].revenue_cents / 100),
      orders: summary.channel_totals[ch].order_count,
      color: CHANNEL_COLORS[ch],
      key: ch,
    }))
    .filter((item) => item.value > 0);

  // CSV Export handler
  const exportCsv = () => {
    const headers = [
      "Month",
      "Orders Count",
      "Total Revenue (INR)",
      "Cost of Goods (INR)",
      "Net Profit (INR)",
      "Margin (%)",
      "App Revenue (INR)",
      "Instagram Revenue (INR)",
      "WhatsApp Revenue (INR)",
      "Offline Revenue (INR)",
    ];

    const rows = monthlyData.map((m) => [
      m.monthLabel,
      m.order_count,
      (m.revenue_cents / 100).toFixed(2),
      (m.cost_cents / 100).toFixed(2),
      (m.net_profit_cents / 100).toFixed(2),
      m.margin_pct.toFixed(1),
      (m.channel_breakdown.app.revenue_cents / 100).toFixed(2),
      (m.channel_breakdown.instagram.revenue_cents / 100).toFixed(2),
      (m.channel_breakdown.whatsapp.revenue_cents / 100).toFixed(2),
      (m.channel_breakdown.offline.revenue_cents / 100).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Weekdayz_Profit_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Profit report exported as CSV");
  };

  return (
    <div className="space-y-8">
      {/* ── Title & Quick Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">Multi-Channel Financials</span>
          <h2 className="text-display text-3xl sm:text-4xl mt-0.5">Profit & Revenue Analytics</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Month-wise revenue calculations & automated profit tracking across Web App, Instagram, WhatsApp & Social Channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 border border-border px-3.5 py-2 text-xs uppercase tracking-widest font-semibold hover:border-accent hover:text-accent transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Export CSV
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 text-xs uppercase tracking-widest font-bold shadow-lg hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" /> Log External Sale
          </button>
        </div>
      </div>

      {/* ── Key Financial KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border p-5 bg-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Lifetime Revenue</span>
            <div className="p-2 bg-accent/10 text-accent rounded">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold mt-3">{formatPrice(summary.lifetime_revenue_cents)}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{summary.total_orders} total orders recorded</span>
          </div>
        </div>

        <div className="border border-border p-5 bg-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Net Profit</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold mt-3 text-emerald-400">{formatPrice(summary.lifetime_profit_cents)}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
              {summary.lifetime_margin_pct}% Margin
            </span>
            <span className="text-muted-foreground">after COGS</span>
          </div>
        </div>

        <div className="border border-border p-5 bg-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Social Media Sales</span>
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded">
              <Instagram className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold mt-3">{formatPrice(summary.social_vs_app_ratio.social_revenue_cents)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Instagram & WhatsApp direct sales</span>
          </div>
        </div>

        <div className="border border-border p-5 bg-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Top Performing Channel</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-3 uppercase tracking-wider text-accent">
            {CHANNEL_NAMES[summary.top_channel]}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>{formatPrice(summary.channel_totals[summary.top_channel].revenue_cents)} revenue</span>
          </div>
        </div>
      </div>

      {/* ── Interactive Financial Charts Section ── */}
      <div className="border border-border bg-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h3 className="text-lg font-bold">Month-Wise Financial Performance</h3>
            <p className="text-xs text-muted-foreground">
              Compare Monthly Gross Revenue vs COGS Expenses vs Net Profit
            </p>
          </div>

          <div className="flex items-center gap-1 bg-secondary/50 border border-border p-1">
            <button
              onClick={() => setViewMode("trend")}
              className={`px-3 py-1 text-xs uppercase tracking-widest font-semibold transition-colors ${
                viewMode === "trend" ? "bg-accent text-accent-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Revenue & Profit Trend
            </button>
            <button
              onClick={() => setViewMode("channel")}
              className={`px-3 py-1 text-xs uppercase tracking-widest font-semibold transition-colors ${
                viewMode === "channel" ? "bg-accent text-accent-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Channel Split
            </button>
          </div>
        </div>

        {viewMode === "trend" ? (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "4px",
                    color: "var(--foreground)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="NetProfit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
                <Area type="monotone" dataKey="Cost" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCost)" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="AppRevenue" name="Web App" stackId="a" fill={CHANNEL_COLORS.app} />
                <Bar dataKey="InstagramRevenue" name="Instagram" stackId="a" fill={CHANNEL_COLORS.instagram} />
                <Bar dataKey="WhatsAppRevenue" name="WhatsApp" stackId="a" fill={CHANNEL_COLORS.whatsapp} />
                <Bar dataKey="OfflineRevenue" name="Offline Store" stackId="a" fill={CHANNEL_COLORS.offline} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Channel Share Breakdown & Social Media Selling Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart / Share Breakdown */}
        <div className="border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-accent" /> Revenue Share by Channel
            </h3>
          </div>

          {pieData.length > 0 ? (
            <div className="h-60 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">No channel breakdown data yet</div>
          )}

          <div className="space-y-2 pt-2 border-t border-border/60">
            {pieData.map((p) => {
              const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
              const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
              return (
                <div key={p.key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{p.orders} orders</span>
                    <span className="font-bold">{formatPrice(p.value * 100)}</span>
                    <span className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded font-mono">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Social Media Selling Quick Overview */}
        <div className="lg:col-span-2 border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Share2 className="h-4 w-4 text-pink-500" /> Multi-App Sales Integration
              </h3>
              <p className="text-xs text-muted-foreground">Track Instagram DMs, WhatsApp, & Offline direct store sales alongside the Web App</p>
            </div>
            <button
              onClick={() => setShowLogModal(true)}
              className="bg-accent text-accent-foreground px-3 py-1.5 text-xs uppercase tracking-widest font-bold inline-flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Record Sale
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="border border-border p-4 bg-secondary/20 space-y-2">
              <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider">
                <Instagram className="h-4 w-4" /> Instagram Sales
              </div>
              <p className="text-2xl font-bold">
                {formatPrice(summary.channel_totals.instagram.revenue_cents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.channel_totals.instagram.order_count} direct Instagram DM & Story sales logged
              </p>
            </div>

            <div className="border border-border p-4 bg-secondary/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <MessageCircle className="h-4 w-4" /> WhatsApp Direct Sales
              </div>
              <p className="text-2xl font-bold">
                {formatPrice(summary.channel_totals.whatsapp.revenue_cents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.channel_totals.whatsapp.order_count} WhatsApp chat orders processed
              </p>
            </div>

            <div className="border border-border p-4 bg-secondary/20 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Smartphone className="h-4 w-4" /> Web App Store
              </div>
              <p className="text-2xl font-bold">
                {formatPrice(summary.channel_totals.app.revenue_cents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.channel_totals.app.order_count} automated online checkout orders
              </p>
            </div>

            <div className="border border-border p-4 bg-secondary/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Store className="h-4 w-4" /> Offline & Exhibitions
              </div>
              <p className="text-2xl font-bold">
                {formatPrice(summary.channel_totals.offline.revenue_cents)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.channel_totals.offline.order_count} in-person cash & store sales
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Month-Wise Financial Statement Table ── */}
      <div className="border border-border bg-card space-y-4">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Month-Wise Profit Statement Table</h3>
            <p className="text-xs text-muted-foreground">Complete breakdown of monthly revenue, expenses & profit margins</p>
          </div>
          <span className="text-xs font-mono bg-secondary border border-border px-2.5 py-1 text-muted-foreground">
            {monthlyData.length} Months Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-3">Month</th>
                <th className="text-center px-4 py-3">Orders</th>
                <th className="text-right px-4 py-3">Gross Revenue</th>
                <th className="text-right px-4 py-3">Cost of Goods (COGS)</th>
                <th className="text-right px-4 py-3">Net Profit</th>
                <th className="text-right px-4 py-3">Margin %</th>
                <th className="text-left px-4 py-3">Channel Breakdown</th>
                <th className="text-right px-4 py-3">PDF Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {monthlyData.map((m) => (
                <tr key={m.monthKey} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3.5 font-bold flex items-center gap-2">
                    <span>{m.monthLabel}</span>
                    {m.monthKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` && (
                      <span className="bg-accent/20 text-accent text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-accent/30">
                        Current Month
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono text-xs">{m.order_count}</td>
                  <td className="px-4 py-3.5 text-right font-semibold">{formatPrice(m.revenue_cents)}</td>
                  <td className="px-4 py-3.5 text-right text-red-400/90 font-mono text-xs">
                    {formatPrice(m.cost_cents)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                    {formatPrice(m.net_profit_cents)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className={`inline-block font-mono text-xs px-2 py-0.5 rounded font-bold ${
                        m.margin_pct >= 50
                          ? "bg-emerald-500/20 text-emerald-300"
                          : m.margin_pct >= 30
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {m.margin_pct}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {Object.entries(m.channel_breakdown).map(([ch, val]) => {
                        if (val.revenue_cents <= 0) return null;
                        return (
                          <span
                            key={ch}
                            className="inline-flex items-center gap-1 border border-border px-2 py-0.5 rounded text-[10px] uppercase font-semibold"
                            style={{ borderColor: CHANNEL_COLORS[ch as OrderSource] + "60" }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: CHANNEL_COLORS[ch as OrderSource] }}
                            />
                            {ch}: {formatPrice(val.revenue_cents)}
                          </span>
                        );
                      })}
                      {Object.values(m.channel_breakdown).every((v) => v.revenue_cents <= 0) && (
                        <span className="text-xs text-muted-foreground italic">No sales recorded yet</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => exportMonthlyProfitPdf(m)}
                      className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1 text-xs uppercase tracking-wider font-bold bg-secondary/50 hover:bg-accent hover:text-accent-foreground transition-all shadow-sm"
                      title={`Export ${m.monthLabel} PDF Statement`}
                    >
                      <FileText className="h-3.5 w-3.5 text-accent" /> PDF Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Log External Sale Modal ── */}
      <AnimatePresence>
        {showLogModal && (
          <LogSaleModal
            onClose={() => setShowLogModal(false)}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ["admin-profit-analytics"] });
              qc.invalidateQueries({ queryKey: ["admin-orders"] });
              qc.invalidateQueries({ queryKey: ["admin-stats"] });
              setShowLogModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Log External / Social Media Sale Modal Component ─── */

function LogSaleModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const recordFn = useServerFn(recordExternalSale);
  const [loading, setLoading] = useState(false);

  const [channel, setChannel] = useState<OrderSource>("instagram");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [productName, setProductName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const sellAmountCents = Math.round(Number(sellingPrice || 0) * 100);
  const costAmountCents = Math.round(Number(costPrice || 0) * 100);
  const estProfitCents = sellAmountCents - costAmountCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      toast.error("Please enter a valid selling price");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    setLoading(true);
    try {
      await recordFn({
        data: {
          order_source: channel,
          customer_name: customerName,
          customer_email: customerEmail || undefined,
          total_cents: sellAmountCents,
          cost_cents: costAmountCents,
          product_name: productName || "Social Media Order",
          quantity: Number(quantity) || 1,
          notes: notes || undefined,
          created_at: saleDate ? new Date(saleDate).toISOString() : undefined,
        },
      });

      toast.success(`Logged ${CHANNEL_NAMES[channel]} sale successfully!`);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-card border border-border p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold uppercase tracking-wider flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" /> Log External / Social Media Sale
            </h3>
            <p className="text-xs text-muted-foreground">Record sales from Instagram DMs, WhatsApp, or Offline store</p>
          </div>
          <button onClick={onClose} className="p-1 hover:text-accent text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Sales Channel selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Sales Channel / App Source
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-400" },
                { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-400" },
                { id: "facebook", label: "Facebook", icon: Share2, color: "text-blue-400" },
                { id: "offline", label: "Offline Store", icon: Store, color: "text-amber-400" },
                { id: "app", label: "Web App", icon: Smartphone, color: "text-indigo-400" },
                { id: "other", label: "Other", icon: Plus, color: "text-purple-400" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannel(c.id as OrderSource)}
                  className={`p-2.5 border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    channel === c.id
                      ? "border-accent bg-accent/15 text-foreground shadow"
                      : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Customer Email / Handle</label>
              <input
                type="text"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="@instagram_handle or email"
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:border-accent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Product Title / Item Description</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Oversized Acid Wash Hoodie - Black"
              className="w-full bg-background border border-border px-3 py-2 text-sm focus:border-accent outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value);
                  if (!costPrice && e.target.value) {
                    setCostPrice(String(Math.round(Number(e.target.value) * 0.45)));
                  }
                }}
                placeholder="1499"
                className="w-full bg-background border border-border px-3 py-2 text-sm font-semibold focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="650"
                className="w-full bg-background border border-border px-3 py-2 text-sm text-red-400 font-semibold focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:border-accent outline-none"
              />
            </div>
          </div>

          {/* Realtime estimated profit display */}
          {sellAmountCents > 0 && (
            <div className="bg-secondary/40 border border-border p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Estimated Net Profit Calculation:</span>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-emerald-400 text-sm">{formatPrice(estProfitCents)}</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[11px]">
                  {sellAmountCents > 0 ? ((estProfitCents / sellAmountCents) * 100).toFixed(1) : 0}% Margin
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Date of Sale</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Notes / Tracking</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paid via UPI / GPay"
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:border-accent outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-border px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-accent-foreground px-6 py-2 text-xs uppercase tracking-widest font-bold hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Recording…" : "Save External Order"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
