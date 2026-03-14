"use client";

import { useQuery } from "@apollo/client";
import { GET_MY_STORES, GET_STORE_ORDERS, GET_MY_PLAN, GET_AVAILABLE_PLANS } from "@/lib/graphql";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#06b6d4", "#ef4444", "#84cc16", "#6366f1"];

const statusLabels: Record<string, string> = {
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  PREPARING: "Preparando",
  READY: "Pronto",
  PICKING_UP: "Coletando",
  DELIVERING: "Entregando",
  AWAITING_PAYMENT: "Aguardando",
};

const statusColors: Record<string, string> = {
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
  PENDING: "#eab308",
  ACCEPTED: "#3b82f6",
  PREPARING: "#8b5cf6",
  READY: "#6366f1",
  PICKING_UP: "#06b6d4",
  DELIVERING: "#0ea5e9",
  AWAITING_PAYMENT: "#f59e0b",
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5">
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || "text-[var(--text-primary)]"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: userData, loading: loadingUser } = useQuery(GET_MY_PLAN);
  const { data: plansData } = useQuery(GET_AVAILABLE_PLANS);
  const { data: storesData, loading: loadingStores } = useQuery(GET_MY_STORES);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const vendorPlan = userData?.meVendor?.vendorPlan || "FREE";
  const plans = plansData?.availablePlans || [];
  const currentPlanConfig = plans.find((p: any) => p.plan === vendorPlan);
  const hasAnalytics = currentPlanConfig?.hasAnalytics ?? false;

  const stores = storesData?.myStores || [];
  const storeId = selectedStore || stores[0]?.id;

  const { data: ordersData, loading: loadingOrders } = useQuery(GET_STORE_ORDERS, {
    variables: { storeId },
    skip: !storeId || !hasAnalytics,
  });

  const analytics = useMemo(() => {
    if (!ordersData?.storeOrders) return null;

    const allOrders = ordersData.storeOrders as any[];
    const now = new Date();
    let cutoff: Date | null = null;
    if (period === "7d") cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (period === "30d") cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (period === "90d") cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const orders = cutoff
      ? allOrders.filter((o) => new Date(o.createdAt) >= cutoff!)
      : allOrders;

    const delivered = orders.filter((o) => o.status === "DELIVERED");
    const cancelled = orders.filter((o) => o.status === "CANCELLED");
    const totalRevenue = delivered.reduce((sum, o) => sum + Number(o.total), 0);
    const avgTicket = delivered.length > 0 ? totalRevenue / delivered.length : 0;

    // Orders by status (for pie chart)
    const byStatus: { name: string; value: number; color: string }[] = [];
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        byStatus.push({
          name: statusLabels[status] || status,
          value: count,
          color: statusColors[status] || "#9ca3af",
        });
      });

    // Revenue + orders by day (for area/bar chart)
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};

    // Fill in all days in the period
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 0;
    if (days > 0) {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        dailyMap[key] = { revenue: 0, orders: 0 };
      }
    }

    delivered.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!dailyMap[key]) dailyMap[key] = { revenue: 0, orders: 0 };
      dailyMap[key].revenue += Number(o.total);
      dailyMap[key].orders += 1;
    });

    const dailyData = Object.entries(dailyMap).map(([day, data]) => ({
      day,
      revenue: Math.round(data.revenue * 100) / 100,
      pedidos: data.orders,
    }));

    // Top products (for bar chart)
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    delivered.forEach((o) => {
      (o.items || []).forEach((item: any) => {
        const name = item.product?.name || "Removido";
        if (!productSales[name]) productSales[name] = { name, qty: 0, revenue: 0 };
        productSales[name].qty += item.quantity;
        productSales[name].revenue += Number(item.totalPrice);
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));

    // Hourly distribution
    const hourlyMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
    orders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      hourlyMap[hour]++;
    });
    const hourlyData = Object.entries(hourlyMap).map(([hour, count]) => ({
      hora: `${hour}h`,
      pedidos: count,
    }));

    // Unique customers
    const uniqueCustomers = new Set(orders.map((o) => o.customer?.name).filter(Boolean)).size;
    const conversionRate = orders.length > 0 ? (delivered.length / orders.length) * 100 : 0;

    return {
      totalOrders: orders.length,
      delivered: delivered.length,
      cancelled: cancelled.length,
      totalRevenue,
      avgTicket,
      byStatus,
      dailyData,
      topProducts,
      hourlyData,
      uniqueCustomers,
      conversionRate,
    };
  }, [ordersData, period]);

  if (loadingUser || loadingStores) {
    return <p className="text-[var(--text-muted)]">Carregando...</p>;
  }

  if (!hasAnalytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Analytics</h2>
        <p className="text-[var(--text-muted)] text-center max-w-md mb-6">
          O Analytics esta disponivel a partir do plano Pro. Faca upgrade para acessar
          graficos e estatisticas detalhadas sobre suas vendas, produtos e clientes.
        </p>
        <Link
          href="/dashboard/plan"
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-muted)]">Crie uma loja primeiro para ver o analytics.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>

        <div className="flex gap-2 flex-wrap">
          {stores.length > 1 && (
            <select
              value={storeId || ""}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-400"
            >
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {(["7d", "30d", "90d", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                period === p
                  ? "bg-orange-500 text-white"
                  : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : p === "90d" ? "90 dias" : "Tudo"}
            </button>
          ))}
        </div>
      </div>

      {loadingOrders ? (
        <p className="text-[var(--text-muted)]">Carregando dados...</p>
      ) : !analytics ? (
        <p className="text-[var(--text-muted)]">Nenhum dado disponivel.</p>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total de Pedidos" value={String(analytics.totalOrders)} />
            <StatCard label="Faturamento" value={`R$ ${analytics.totalRevenue.toFixed(2)}`} color="text-green-600" sub={`${analytics.delivered} entregue(s)`} />
            <StatCard label="Ticket Medio" value={`R$ ${analytics.avgTicket.toFixed(2)}`} color="text-blue-600" />
            <StatCard label="Clientes Unicos" value={String(analytics.uniqueCustomers)} color="text-purple-600" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Taxa de Conversao" value={`${analytics.conversionRate.toFixed(1)}%`} sub="entregues / total" />
            <StatCard label="Entregues" value={String(analytics.delivered)} color="text-green-600" />
            <StatCard label="Cancelados" value={String(analytics.cancelled)} color="text-red-500" />
            <StatCard label="Em Andamento" value={String(analytics.totalOrders - analytics.delivered - analytics.cancelled)} color="text-orange-500" />
          </div>

          {/* Revenue area chart */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Faturamento por Dia</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={analytics.dailyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, "Faturamento"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#colorRevenue)" name="Faturamento" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders per day bar chart */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Pedidos por Dia</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [value, "Pedidos"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                />
                <Bar dataKey="pedidos" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status pie chart */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Pedidos por Status</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={analytics.byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {analytics.byStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [value, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-[var(--text-secondary)]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Hourly distribution */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Horarios de Pico</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="hora" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any) => [value, "Pedidos"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="pedidos" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top products */}
          {analytics.topProducts.length > 0 && (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 mb-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Top Produtos</h3>
              <ResponsiveContainer width="100%" height={Math.max(analytics.topProducts.length * 45, 200)}>
                <BarChart data={analytics.topProducts} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `R$${v}`} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === "revenue") return [`R$ ${Number(value).toFixed(2)}`, "Receita"];
                      return [value, name];
                    }}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="revenue" fill="#f97316" radius={[0, 6, 6, 0]} name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
