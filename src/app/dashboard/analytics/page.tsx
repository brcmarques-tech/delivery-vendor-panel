"use client";

import { useQuery } from "@apollo/client";
import { GET_MY_STORES, GET_STORE_ORDERS, GET_MY_PLAN, GET_AVAILABLE_PLANS, GET_STORE_CART_SUMMARY } from "@/lib/graphql";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonStats, SkeletonCard } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";
import EmptyState from "@/components/ui/EmptyState";
import {
  BarChart3, DollarSign, Receipt, TrendingUp, Users,
  ShoppingCart, XCircle, Clock, Trophy, Package, Tag, Percent,
  ChevronRight, Search,
} from "lucide-react";

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

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon?: React.ElementType }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary-muted)] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>
        )}
      </div>
    </div>
  );
}

const PODIUM_COLORS = [
  { bar: "from-yellow-500 to-amber-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10", text: "text-yellow-500" },
  { bar: "from-slate-400 to-slate-300", border: "border-[var(--border-color)]", bg: "bg-[var(--bg-muted)]", text: "text-[var(--text-muted)]" },
  { bar: "from-amber-700 to-amber-600", border: "border-amber-600/30", bg: "bg-amber-600/10", text: "text-amber-600" },
  { bar: "from-blue-500 to-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5", text: "text-blue-400" },
  { bar: "from-purple-500 to-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/5", text: "text-purple-400" },
];
// Heights: 1st=tallest, 2nd, 3rd, 4th, 5th
const PODIUM_HEIGHTS = [160, 120, 96, 72, 56];
// Podium order: 4th, 2nd, 1st, 3rd, 5th (Olympic style)
const PODIUM_ORDER = [3, 1, 0, 2, 4];

function PodiumChart({ title, items, valueLabel }: {
  title: string;
  items: { name: string; value: string; sub: string; imageUrl?: string }[];
  valueLabel?: string;
}) {
  if (items.length === 0) return null;
  const count = Math.min(items.length, 5);
  // Reorder for podium: [4th, 2nd, 1st, 3rd, 5th]
  // FILTRAR antes, não fatiar: `slice(0,count)` cortava a ordem de exibição e
  // depois o filtro descartava os índices válidos — com poucos itens o pódio
  // sumia ou omitia o 1º colocado (1 item -> vazio; 2 -> só o 2º; 3 -> sem o 3º).
  const podiumSlots = PODIUM_ORDER.filter((i) => i < count);

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
      <h3 className="font-semibold text-[var(--text-primary)] mb-6">{title}</h3>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 sm:gap-3 mb-4" style={{ minHeight: 220 }}>
        {podiumSlots.map((idx) => {
          const item = items[idx];
          const colors = PODIUM_COLORS[idx];
          const height = PODIUM_HEIGHTS[idx];
          const position = idx + 1;

          return (
            <div key={idx} className="flex flex-col items-center flex-1 max-w-[110px]">
              {/* Image thumbnail */}
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[var(--border-light)] mb-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] border-2 border-[var(--border-light)] flex items-center justify-center mb-1">
                  <span className="text-sm font-bold text-[var(--text-secondary)]">{item.name.charAt(0)}</span>
                </div>
              )}
              {/* Name above bar */}
              <p className="text-xs text-[var(--text-secondary)] text-center truncate w-full mb-1.5 px-0.5" title={item.name}>
                {item.name}
              </p>
              {/* Value */}
              <p className={`text-xs font-bold ${colors.text} mb-1`}>{item.value}</p>
              {/* Bar */}
              <div
                className={`w-full rounded-t-xl bg-gradient-to-t ${colors.bar} relative flex flex-col items-center justify-start pt-2 transition-all duration-500`}
                style={{ height }}
              >
                {/* Position number with trophy for top 3 */}
                {idx < 3 ? (
                  <div className="flex items-center gap-0.5">
                    <Trophy className="w-4 h-4 text-white/90" />
                    <span className="text-sm font-bold text-white/90">{position}</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-white/70">{position}</span>
                )}
                {/* Sub info */}
                <p className="text-[10px] text-white/70 mt-1 text-center px-1">{item.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
};

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo ao Analytics!",
      description: "Aqui você acompanha o desempenho das suas lojas com gráficos e métricas detalhadas.",
    },
  },
  {
    element: '[data-tour="analytics-stats"]',
    popover: {
      title: "Resumo de desempenho",
      description: "Veja em um relance: faturamento total, número de pedidos, ticket médio e taxa de conclusão.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="analytics-charts"]',
    popover: {
      title: "✅ Gráficos detalhados",
      description: "Analise a evolução das vendas por período. Use os filtros para comparar semanas, meses ou anos.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Analytics'.",
      side: "top",
      align: "start",
    },
  },
];

// Receita que o VENDEDOR de fato recebe por um pedido: subtotal menos o
// desconto do cupom. NAO inclui a taxa de entrega (essa vai para o entregador),
// que era somada antes e inflava o faturamento exibido.
function receitaVendedor(o: any): number {
  const sub = Number(o?.subtotal);
  const base = Number.isFinite(sub) ? sub : Number(o?.total) || 0;
  const desc = Number(o?.discount) || 0;
  return Math.max(base - desc, 0);
}

export default function AnalyticsPage() {
  const { startTour, hasSeenTour } = useTour("analytics", TOUR_STEPS);
  const { data: userData, loading: loadingUser, error: userError, refetch: refetchUser } = useQuery(GET_MY_PLAN);
  const { data: plansData, error: plansError, refetch: refetchPlans } = useQuery(GET_AVAILABLE_PLANS);
  const { data: storesData, loading: loadingStores, error: storesError, refetch: refetchStores } = useQuery(GET_MY_STORES);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [showCart, setShowCart] = useState(false);
  const [cartSearch, setCartSearch] = useState("");

  // Read CSS var for chart theming
  const [chartColors, setChartColors] = useState({
    primary: '#f97316',
    secondary: '#3b82f6',
    tertiary: '#8b5cf6',
    quaternary: '#06b6d4',
  });

  useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim();
    if (raw) {
      setChartColors((prev) => ({ ...prev, primary: raw }));
    }
  }, []);

  const COLORS = [chartColors.primary, chartColors.secondary, "#10b981", chartColors.tertiary, "#ec4899", "#f59e0b", chartColors.quaternary, "#ef4444", "#84cc16", "#6366f1"];

  const vendorPlan = userData?.meVendor?.vendorPlan || "FREE";
  const plans = plansData?.availablePlans || [];
  const currentPlanConfig = plans.find((p: any) => p.plan === vendorPlan);
  const hasAnalytics = currentPlanConfig?.hasAnalytics ?? false;

  const stores = storesData?.myStores || [];
  const storeId = selectedStore || stores[0]?.id;

  const { data: ordersData, loading: loadingOrders, error: ordersError, refetch: refetchOrders } = useQuery(GET_STORE_ORDERS, {
    variables: { storeId },
    skip: !storeId || !hasAnalytics,
  });

  const { data: cartData } = useQuery(GET_STORE_CART_SUMMARY, {
    variables: { storeId },
    skip: !storeId || !hasAnalytics,
  });
  const cartSummary = cartData?.storeCartSummary || [];

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

    const delivered = orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED");
    const cancelled = orders.filter((o) => o.status === "CANCELLED");
    // BUGFIX: usava `o.total`, que INCLUI a taxa de entrega (dinheiro do
    // entregador, nao do vendedor) — o faturamento aparecia inflado por todas as
    // taxas de entrega, e divergia da tela de Pedidos, que mostra o subtotal do
    // mesmo pedido. A receita do vendedor e o subtotal menos o desconto do cupom.
    const totalRevenue = delivered.reduce((sum, o) => sum + receitaVendedor(o), 0);
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
      dailyMap[key].revenue += receitaVendedor(o);
      dailyMap[key].orders += 1;
    });

    const dailyData = Object.entries(dailyMap).map(([day, data]) => ({
      day,
      revenue: Math.round(data.revenue * 100) / 100,
      pedidos: data.orders,
    }));

    // Top products (for bar chart)
    const productSales: Record<string, { name: string; qty: number; revenue: number; imageUrl?: string }> = {};
    delivered.forEach((o) => {
      (o.items || []).forEach((item: any) => {
        const name = item.product?.name || "Removido";
        if (!productSales[name]) productSales[name] = { name, qty: 0, revenue: 0, imageUrl: item.product?.imageUrl };
        productSales[name].qty += item.quantity;
        productSales[name].revenue += Number(item.totalPrice);
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));

    // Hourly distribution (delivered orders only)
    const hourlyMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
    delivered.forEach((o) => {
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

    // Top customers by spending
    const customerMap: Record<string, { name: string; orders: number; total: number; items: number; avatarUrl?: string }> = {};
    delivered.forEach((o) => {
      const name = o.customer?.name || "Desconhecido";
      const id = o.customer?.id || name;
      if (!customerMap[id]) customerMap[id] = { name, orders: 0, total: 0, items: 0, avatarUrl: o.customer?.avatarUrl };
      customerMap[id].orders += 1;
      customerMap[id].total += receitaVendedor(o);
      customerMap[id].items += (o.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0);
    });
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((c) => ({ ...c, total: Math.round(c.total * 100) / 100 }));

    // Most popular items by quantity (delivered orders only)
    const itemPopularity: Record<string, { name: string; qty: number; orders: number; imageUrl?: string }> = {};
    delivered.forEach((o) => {
      const seen = new Set<string>();
      (o.items || []).forEach((item: any) => {
        const name = item.product?.name || "Removido";
        if (!itemPopularity[name]) itemPopularity[name] = { name, qty: 0, orders: 0, imageUrl: item.product?.imageUrl };
        itemPopularity[name].qty += item.quantity;
        if (!seen.has(name)) {
          itemPopularity[name].orders += 1;
          seen.add(name);
        }
      });
    });
    const popularItems = Object.values(itemPopularity)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // Best seller (product #1 by revenue)
    const bestSeller = topProducts.length > 0 ? topProducts[0] : null;

    // Least selling products (reverse of topProducts, only products with sales)
    const leastSelling = Object.values(productSales)
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 5)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));

    // --- Coupon impact ---
    const ordersWithCoupon = delivered.filter((o) => o.couponCode);
    const ordersWithoutCoupon = delivered.filter((o) => !o.couponCode);
    const totalDiscountGiven = delivered.reduce((sum, o) => sum + Number(o.discount || 0), 0);
    const avgTicketWithCoupon = ordersWithCoupon.length > 0
      ? ordersWithCoupon.reduce((sum, o) => sum + receitaVendedor(o), 0) / ordersWithCoupon.length : 0;
    const avgTicketWithoutCoupon = ordersWithoutCoupon.length > 0
      ? ordersWithoutCoupon.reduce((sum, o) => sum + receitaVendedor(o), 0) / ordersWithoutCoupon.length : 0;
    // Coupon usage by code
    const couponUsage: Record<string, { code: string; uses: number; totalDiscount: number; totalRevenue: number }> = {};
    ordersWithCoupon.forEach((o) => {
      const code = o.couponCode!;
      if (!couponUsage[code]) couponUsage[code] = { code, uses: 0, totalDiscount: 0, totalRevenue: 0 };
      couponUsage[code].uses += 1;
      couponUsage[code].totalDiscount += Number(o.discount || 0);
      couponUsage[code].totalRevenue += receitaVendedor(o);
    });
    const couponBreakdown = Object.values(couponUsage)
      .sort((a, b) => b.uses - a.uses)
      .map((c) => ({ ...c, totalDiscount: Math.round(c.totalDiscount * 100) / 100, totalRevenue: Math.round(c.totalRevenue * 100) / 100 }));

    const couponStats = {
      ordersWithCoupon: ordersWithCoupon.length,
      ordersWithoutCoupon: ordersWithoutCoupon.length,
      totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
      avgTicketWithCoupon: Math.round(avgTicketWithCoupon * 100) / 100,
      avgTicketWithoutCoupon: Math.round(avgTicketWithoutCoupon * 100) / 100,
      breakdown: couponBreakdown,
    };

    // --- Promotional items impact ---
    let promoItemsRevenue = 0;
    let promoItemsSaved = 0; // how much customer saved (regular - promo) * qty
    let promoItemsQty = 0;
    let regularItemsRevenue = 0;
    let regularItemsQty = 0;
    const promoProductMap: Record<string, { name: string; revenue: number; saved: number; qty: number; weightKg: number; imageUrl?: string }> = {};

    delivered.forEach((o) => {
      (o.items || []).forEach((item: any) => {
        const product = item.product;
        if (!product) return;
        const regularPrice = Number(product.price || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const qty = item.quantity || 0;
        const isPromo = regularPrice > 0 && unitPrice < regularPrice;
        const totalPrice = Number(item.totalPrice || 0);
        const isWeight = product.isVariableWeight;
        const weightKg = isWeight && item.weightGrams ? item.weightGrams / 1000 : 0;

        if (isPromo) {
          promoItemsRevenue += totalPrice;
          const savedPerUnit = regularPrice - unitPrice;
          const savedTotal = isWeight ? savedPerUnit * weightKg : savedPerUnit * qty;
          promoItemsSaved += savedTotal;
          promoItemsQty += isWeight ? weightKg : qty;

          const name = product.name || "Removido";
          if (!promoProductMap[name]) promoProductMap[name] = { name, revenue: 0, saved: 0, qty: 0, weightKg: 0, imageUrl: product.imageUrl };
          promoProductMap[name].revenue += totalPrice;
          promoProductMap[name].saved += savedTotal;
          if (isWeight) {
            promoProductMap[name].weightKg += weightKg;
          } else {
            promoProductMap[name].qty += qty;
          }
        } else {
          regularItemsRevenue += totalPrice;
          regularItemsQty += isWeight ? (item.weightGrams ? item.weightGrams / 1000 : 0) : qty;
        }
      });
    });

    const promoProducts = Object.values(promoProductMap)
      .sort((a, b) => b.revenue - a.revenue)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100, saved: Math.round(p.saved * 100) / 100 }));

    const promoStats = {
      promoItemsRevenue: Math.round(promoItemsRevenue * 100) / 100,
      promoItemsSaved: Math.round(promoItemsSaved * 100) / 100,
      promoItemsQty: Math.round(promoItemsQty * 100) / 100,
      regularItemsRevenue: Math.round(regularItemsRevenue * 100) / 100,
      regularItemsQty: Math.round(regularItemsQty * 100) / 100,
      promoProducts,
      promoSharePercent: totalRevenue > 0 ? Math.round((promoItemsRevenue / totalRevenue) * 1000) / 10 : 0,
    };

    return {
      totalOrders: orders.length,
      delivered: delivered.length,
      cancelled: cancelled.length,
      totalRevenue,
      avgTicket,
      byStatus,
      dailyData,
      topProducts,
      leastSelling,
      hourlyData,
      uniqueCustomers,
      conversionRate,
      topCustomers,
      popularItems,
      bestSeller,
      couponStats,
      promoStats,
    };
  }, [ordersData, period]);

  if (loadingUser || loadingStores) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <SkeletonStats count={4} />
      </div>
    );
  }

  // ANTES do gate de plano: `hasAnalytics` depende de meVendor + availablePlans;
  // com qualquer uma delas falhando o fallback e `false` e a tela mostrava
  // "disponivel a partir do plano Pro" para quem ja paga Pro. O gate nao mudou.
  if ((userError && !userData) || (plansError && !plansData)) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <ErrorState
          title="Nao foi possivel carregar seu plano."
          description="Verifique sua conexao e tente novamente."
          onRetry={() => { if (userError) refetchUser(); if (plansError) refetchPlans(); }}
        />
      </div>
    );
  }

  // ANTES do empty state de lojas.
  if (storesError && !storesData) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <ErrorState
          title="Nao foi possivel carregar suas lojas."
          description="Verifique sua conexao e tente novamente."
          onRetry={() => refetchStores()}
        />
      </div>
    );
  }

  if (!hasAnalytics) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <EmptyState
          icon={BarChart3}
          title="Analytics"
          description="O Analytics esta disponivel a partir do plano Pro. Faca upgrade para acessar graficos e estatisticas detalhadas sobre suas vendas, produtos e clientes."
          action={{
            label: "Ver planos",
            onClick: () => { window.location.href = "/dashboard/plan"; },
          }}
        />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <EmptyState
          icon={BarChart3}
          title="Nenhuma loja encontrada"
          description="Crie uma loja primeiro para ver o analytics."
        />
      </div>
    );
  }

  return (
    <motion.div {...fadeIn}>
      <PageHeader
        title="Analytics"
        onTourStart={startTour}
        tourNotSeen={!hasSeenTour}
        actions={
          <div className="flex gap-2 flex-wrap">
            {stores.length > 1 && (
              <select
                value={storeId || ""}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
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
                    ? "bg-[var(--brand-primary)] text-white"
                    : "bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : p === "90d" ? "90 dias" : "Tudo"}
              </button>
            ))}
          </div>
        }
      />

      {loadingOrders ? (
        <div className="space-y-6">
          <SkeletonStats count={4} />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : ordersError && !ordersData ? (
        /* ANTES do empty state: sem isto a falha virava "Nenhum dado
           disponivel" e, no periodo anterior, R$ 0,00 de faturamento. */
        <ErrorState
          title="Nao foi possivel carregar os dados de vendas."
          description="Isto nao significa que voce nao vendeu — a consulta falhou. Verifique sua conexao e tente novamente."
          onRetry={() => refetchOrders()}
        />
      ) : !analytics ? (
        <EmptyState
          icon={BarChart3}
          title="Nenhum dado disponivel"
          description="Ainda nao ha dados suficientes para exibir o analytics."
        />
      ) : (
        <>
          {/* Financeiro */}
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">Financeiro</h2>
          <motion.div data-tour="analytics-stats" variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div variants={staggerItem}><StatCard label="Faturamento" value={`R$ ${analytics.totalRevenue.toFixed(2)}`} icon={DollarSign} sub={`${analytics.delivered} entregue(s)`} /></motion.div>
            <motion.div variants={staggerItem}><StatCard label="Ticket Medio" value={`R$ ${analytics.avgTicket.toFixed(2)}`} icon={Receipt} /></motion.div>
            <motion.div variants={staggerItem}><StatCard label="Taxa de Conversao" value={`${analytics.conversionRate.toFixed(1)}%`} sub="entregues / total" icon={TrendingUp} /></motion.div>
            <motion.div variants={staggerItem}><StatCard label="Clientes Unicos" value={String(analytics.uniqueCustomers)} icon={Users} /></motion.div>
          </motion.div>

          {/* Pedidos */}
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">Pedidos</h2>
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div variants={staggerItem}><StatCard label="Total de Pedidos" value={String(analytics.totalOrders)} icon={ShoppingCart} /></motion.div>
            <motion.div variants={staggerItem}><StatCard label="Entregues" value={String(analytics.delivered)} icon={Package} /></motion.div>
            <motion.div variants={staggerItem}><StatCard label="Em Andamento" value={String(analytics.totalOrders - analytics.delivered - analytics.cancelled)} icon={Clock} /></motion.div>
            <motion.div variants={staggerItem}><StatCard label="Cancelados" value={String(analytics.cancelled)} icon={XCircle} /></motion.div>
          </motion.div>

          {/* Revenue area chart */}
          <motion.div data-tour="analytics-charts" {...fadeIn} className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Faturamento por Dia</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={analytics.dailyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, "Faturamento"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Area type="monotone" dataKey="revenue" stroke={chartColors.primary} strokeWidth={2} fill="url(#colorRevenue)" name="Faturamento" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Orders per day bar chart */}
          <motion.div {...fadeIn} className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Pedidos por Dia</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [value, "Pedidos"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="pedidos" fill={chartColors.secondary} radius={[6, 6, 0, 0]} name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status pie chart */}
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
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
                    contentStyle={TOOLTIP_STYLE}
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
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Horarios de Pico</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="hora" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any) => [value, "Pedidos"]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="pedidos" fill={chartColors.tertiary} radius={[4, 4, 0, 0]} name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Podium: Top Products by Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PodiumChart
              title="Top Produtos (Receita)"
              items={analytics.topProducts.slice(0, 5).map((p: any) => ({
                name: p.name,
                value: `R$ ${p.revenue.toFixed(2)}`,
                sub: `${p.qty} un.`,
                imageUrl: p.imageUrl,
              }))}
            />

            {/* Podium: Most Popular Items by Quantity */}
            <PodiumChart
              title="Itens Mais Pedidos"
              items={analytics.popularItems.slice(0, 5).map((p: any) => ({
                name: p.name,
                value: `${p.qty} un.`,
                sub: `${p.orders} pedido${p.orders > 1 ? "s" : ""}`,
                imageUrl: p.imageUrl,
              }))}
            />
          </div>

          {/* Podium: Top Customers + Least Selling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PodiumChart
              title="Clientes que Mais Compraram"
              items={analytics.topCustomers.slice(0, 5).map((c: any) => ({
                name: c.name,
                value: `R$ ${c.total.toFixed(2)}`,
                sub: `${c.orders} pedido${c.orders > 1 ? "s" : ""}`,
                imageUrl: c.avatarUrl,
              }))}
            />

            {/* Least selling products */}
            {analytics.leastSelling && analytics.leastSelling.length > 0 && (
              <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Produtos que Menos Vendem</h3>
                <div className="space-y-3">
                  {analytics.leastSelling.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-xs font-bold text-red-400">{i + 1}</span>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center">
                          <span className="text-xs font-bold text-[var(--text-secondary)]">{p.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{p.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {p.qty} un. vendida{p.qty !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-red-400">R$ {p.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                {analytics.leastSelling.length > 0 && (
                  <p className="text-xs text-[var(--text-muted)] mt-4 italic">
                    Considere criar promocoes ou cupons para esses produtos
                  </p>
                )}
              </div>
            )}
          </div>

          {/* --- Coupon Impact --- */}
          {analytics.couponStats && (analytics.couponStats.ordersWithCoupon > 0 ) && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Impacto dos Cupons</h2>
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                <motion.div variants={staggerItem}><StatCard
                  label="Pedidos com Cupom"
                  value={String(analytics.couponStats.ordersWithCoupon)}
                  icon={Tag}
                  sub={`de ${analytics.couponStats.ordersWithCoupon + analytics.couponStats.ordersWithoutCoupon} entregues`}
                /></motion.div>
                <motion.div variants={staggerItem}><StatCard
                  label="Total em Descontos"
                  value={`R$ ${analytics.couponStats.totalDiscountGiven.toFixed(2)}`}
                  icon={Percent}
                /></motion.div>
                <motion.div variants={staggerItem}><StatCard
                  label="Ticket Medio c/ Cupom"
                  value={`R$ ${analytics.couponStats.avgTicketWithCoupon.toFixed(2)}`}
                  icon={Receipt}
                /></motion.div>
                <motion.div variants={staggerItem}><StatCard
                  label="Ticket Medio s/ Cupom"
                  value={`R$ ${analytics.couponStats.avgTicketWithoutCoupon.toFixed(2)}`}
                  icon={Receipt}
                /></motion.div>
              </motion.div>

              {analytics.couponStats.breakdown.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Coupon comparison bar */}
                  <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">Comparativo: Com vs Sem Cupom</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[
                        { name: "Com Cupom", pedidos: analytics.couponStats.ordersWithCoupon, ticket: analytics.couponStats.avgTicketWithCoupon },
                        { name: "Sem Cupom", pedidos: analytics.couponStats.ordersWithoutCoupon, ticket: analytics.couponStats.avgTicketWithoutCoupon },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="pedidos" fill="#22c55e" radius={[6, 6, 0, 0]} name="Pedidos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Coupon breakdown by code */}
                  <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">Desempenho por Cupom</h3>
                    <ResponsiveContainer width="100%" height={Math.max(analytics.couponStats.breakdown.length * 50, 200)}>
                      <BarChart data={analytics.couponStats.breakdown} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis type="category" dataKey="code" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} width={100} />
                        <Tooltip
                          formatter={(value: any, name: any) => {
                            if (name === "uses") return [value, "Usos"];
                            if (name === "totalRevenue") return [`R$ ${Number(value).toFixed(2)}`, "Receita gerada"];
                            if (name === "totalDiscount") return [`R$ ${Number(value).toFixed(2)}`, "Desconto dado"];
                            return [value, name];
                          }}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <Bar dataKey="totalRevenue" fill="#22c55e" radius={[0, 6, 6, 0]} name="totalRevenue" />
                        <Bar dataKey="totalDiscount" fill="#ef4444" radius={[0, 6, 6, 0]} name="totalDiscount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Promotional Items Impact --- */}
          {analytics.promoStats && (analytics.promoStats.promoItemsRevenue > 0 ) && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Impacto das Promocoes</h2>
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                <motion.div variants={staggerItem}><StatCard
                  label="Receita Promocional"
                  value={`R$ ${analytics.promoStats.promoItemsRevenue.toFixed(2)}`}
                  icon={DollarSign}
                  sub={`${analytics.promoStats.promoSharePercent}% do total`}
                /></motion.div>
                <motion.div variants={staggerItem}><StatCard
                  label="Economia p/ Clientes"
                  value={`R$ ${analytics.promoStats.promoItemsSaved.toFixed(2)}`}
                  icon={Tag}
                  sub="desconto total dado"
                /></motion.div>
                <motion.div variants={staggerItem}><StatCard
                  label="Itens em Promo Vendidos"
                  value={String(analytics.promoStats.promoItemsQty)}
                  icon={Package}
                /></motion.div>
                <motion.div variants={staggerItem}><StatCard
                  label="Receita Preco Normal"
                  value={`R$ ${analytics.promoStats.regularItemsRevenue.toFixed(2)}`}
                  icon={Receipt}
                /></motion.div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Promo vs Regular pie */}
                <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4">Receita: Promocional vs Normal</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Preco promocional", value: analytics.promoStats.promoItemsRevenue },
                          { name: "Preco normal", value: analytics.promoStats.regularItemsRevenue },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={3} dataKey="value" nameKey="name"
                      >
                        <Cell fill={chartColors.primary} />
                        <Cell fill="var(--text-muted)" />
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2)}`, name]}
                        contentStyle={TOOLTIP_STYLE}
                      />
                      <Legend
                        verticalAlign="bottom" iconType="circle" iconSize={8}
                        formatter={(value) => <span className="text-xs text-[var(--text-secondary)]">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Top promo products */}
                {analytics.promoStats.promoProducts.length > 0 && (
                  <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">Produtos em Promocao</h3>
                    <div className="space-y-3">
                      {analytics.promoStats.promoProducts.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-[var(--brand-primary-muted)] flex items-center justify-center text-xs font-bold text-[var(--brand-primary)]">{i + 1}</span>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center">
                              <span className="text-xs font-bold text-[var(--text-secondary)]">{p.name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text-primary)] truncate">{p.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {p.weightKg > 0 ? `${p.weightKg.toFixed(1)}kg` : `${p.qty} un.`} vendida{p.qty !== 1 && p.weightKg === 0 ? "s" : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-500">R$ {p.revenue.toFixed(2)}</p>
                            <p className="text-[10px] text-[var(--brand-primary)]">-R$ {p.saved.toFixed(2)} desc.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- Plan visibility info --- */}
          {vendorPlan !== "FREE" && (
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 mb-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Visibilidade do Plano {vendorPlan}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Seu plano atual da prioridade na listagem de lojas e produtos para os clientes.
                Quanto maior o plano, mais destaque voce recebe nas buscas e na tela inicial do app.
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {currentPlanConfig && (
                  <>
                    <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                      <p className="text-xs text-[var(--text-secondary)]">Prioridade de Listagem</p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">{currentPlanConfig.listingPriority || 1}x</p>
                    </div>
                    <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                      <p className="text-xs text-[var(--text-secondary)]">Destaque Mensal</p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">{currentPlanConfig.highlightDaysPerMonth || 0} dias</p>
                    </div>
                    <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                      <p className="text-xs text-[var(--text-secondary)]">Promos Gratis/Semana</p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">{currentPlanConfig.freePromosPerWeek || 0}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Full product revenue chart */}
          {analytics.topProducts.length > 0 && (
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 mb-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Produtos por Receita</h3>
              <ResponsiveContainer width="100%" height={Math.max(analytics.topProducts.length * 45, 200)}>
                <BarChart data={analytics.topProducts} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `R$${v}`} />
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
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="revenue" fill={chartColors.primary} radius={[0, 6, 6, 0]} name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Nos carrinhos -- por ultimo, com toggle */}
          {cartSummary.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowCart(!showCart)}
                className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)] mb-3 cursor-pointer hover:text-[var(--brand-primary)] transition"
              >
                <ChevronRight className={`w-5 h-5 transition-transform ${showCart ? "rotate-90" : ""}`} />
                Nos Carrinhos Agora
                <span className="text-sm font-normal text-[var(--text-secondary)]">({cartSummary.length} produto{cartSummary.length !== 1 ? "s" : ""})</span>
              </button>
              {showCart && (
              <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={cartSearch}
                    onChange={(e) => setCartSearch(e.target.value)}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-light)] rounded-xl pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
                <div className="space-y-3">
                  {cartSummary.filter((item: any) => item.productName.toLowerCase().includes(cartSearch.toLowerCase())).map((item: any, i: number) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[var(--brand-primary-muted)] flex items-center justify-center text-xs font-bold text-[var(--brand-primary)]">{i + 1}</span>
                      {item.productImageUrl ? (
                        <img src={item.productImageUrl} alt={item.productName} className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center">
                          <span className="text-xs font-bold text-[var(--text-secondary)]">{item.productName.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{item.productName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--brand-primary)]">{item.totalPeople} pessoa{item.totalPeople !== 1 ? "s" : ""}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{item.totalQuantity} un. total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
