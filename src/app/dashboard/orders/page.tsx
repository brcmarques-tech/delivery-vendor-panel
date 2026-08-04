"use client";

import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { devLog } from "@/lib/devLog"; // KAN-256
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";
import { GET_MY_STORES, GET_STORE_ORDERS, UPDATE_ORDER_STATUS, ORDER_CREATED_SUB, ORDER_UPDATED_SUB, ADJUST_ORDER_ITEM_WEIGHT, REJECT_ORDER, VENDOR_CANCEL_ORDER, VENDOR_CONFIRM_PICKUP, REQUEST_CANCEL_DISPUTE } from "@/lib/graphql";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MessageCircle, MapPin, Check, Pencil, ClipboardList, CheckCircle } from "lucide-react";
import CreateStoreModal from "@/components/CreateStoreModal";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem, scaleIn } from "@/lib/motion";

const statusLabels: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: "Aguardando pagamento", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  PAYMENT_REVIEW: { label: "Análise de pagamento", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  ACCEPTED: { label: "Aceito", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  PREPARING: { label: "Preparando", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  READY: { label: "Pronto - Aguardando entregador", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  PICKED_UP: { label: "Coletado", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
  DELIVERING: { label: "A caminho", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  DELIVERED: { label: "Entregue", color: "bg-[var(--bg-muted)] text-[var(--text-secondary)]" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  EXPIRED: { label: "Não aceito (expirado)", color: "bg-red-100 text-red-400 dark:bg-red-900/30 dark:text-red-400" },
  VENDOR_CONFIRMED_PICKUP: { label: "Aguardando entregador confirmar", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  DELIVERER_CONFIRMED_DELIVERY: { label: "Aguardando cliente confirmar", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  COMPLETED: { label: "Finalizado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  DISPUTED: { label: "Em reclamação", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'PENDING':
    case 'AWAITING_PAYMENT':
    case 'PAYMENT_REVIEW':
    case 'DISPUTED':
      return 'warning';
    case 'ACCEPTED':
    case 'PREPARING':
    case 'READY':
    case 'PICKED_UP':
    case 'DELIVERING':
    case 'OUT_FOR_DELIVERY':
    case 'VENDOR_CONFIRMED_PICKUP':
    case 'DELIVERER_CONFIRMED_DELIVERY':
      return 'info';
    case 'DELIVERED':
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
    case 'EXPIRED':
    case 'REJECTED':
      return 'error';
    default:
      return 'neutral';
  }
}

const nextStatus: Record<string, string> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
};

// Retirada no local e loja com frota propria NAO tem entregador do app: o pedido
// morria em READY porque nao havia quem disparasse READY->DELIVERED, e o dinheiro
// ficava em custodia para sempre. Nesses casos o proprio lojista fecha a entrega.
function proximoStatus(order: any): string | undefined {
  if (order.status === "READY" && semEntregadorDoApp(order)) return "DELIVERED";
  return nextStatus[order.status];
}

function semEntregadorDoApp(order: any): boolean {
  return order?.isPickup === true || order?.store?.hasOwnDelivery === true;
}

// Active = in progress orders, Completed = delivered/completed, Incomplete = cancelled/expired/awaiting_payment/rejected
const ACTIVE_STATUSES = ["AWAITING_PAYMENT", "PAYMENT_REVIEW", "PENDING", "ACCEPTED", "PREPARING", "READY", "PICKED_UP", "DELIVERING", "VENDOR_CONFIRMED_PICKUP", "DELIVERER_CONFIRMED_DELIVERY"];
const COMPLETED_STATUSES = ["DELIVERED", "COMPLETED"];
const INCOMPLETE_STATUSES = ["CANCELLED", "EXPIRED", "REJECTED", "DISPUTED"];

type TabKey = "active" | "completed" | "incomplete";
type DateFilter = "today" | "week" | "month" | "year" | "all";

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo aos Pedidos!",
      description: "Aqui você gerencia todos os pedidos recebidos nas suas lojas. Vou te mostrar como funciona.",
    },
  },
  {
    element: '[data-tour="orders-tabs"]',
    popover: {
      title: "Filtrar pedidos",
      description: "Navegue entre pedidos ativos, histórico e pedidos por status. A aba ativa é destacada automaticamente.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="orders-filters"]',
    popover: {
      title: "Filtros avançados",
      description: "Filtre por período, status ou loja para encontrar pedidos rapidamente.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="orders-list"]',
    popover: {
      title: "✅ Gerenciar pedidos",
      description: "Todos os pedidos aparecem aqui. Clique em um pedido para ver os detalhes e atualizar o status.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Pedidos'.",
      side: "top",
      align: "start",
    },
  },
];

// KAN-243: um unico AudioContext reutilizado.
//
// Antes cada pedido novo fazia `new AudioContext()` e nunca chamava close().
// Navegadores limitam ~6 AudioContext simultaneos por pagina, entao numa loja
// movimentada com a aba de pedidos aberta o dia todo o som simplesmente parava
// de tocar ("Failed to construct 'AudioContext': number of hardware contexts
// reached maximum") — justamente o alerta que o lojista usa para nao perder
// pedido.
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  // Navegadores iniciam o contexto suspenso ate haver interacao do usuario.
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

function beep(ctx: AudioContext, frequency: number, startAt: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.3, startAt);
  gain.gain.exponentialRampToValueAtTime(0.01, startAt + 0.5);
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.5);
}

function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  // Agenda os dois tons pelo relogio do audio (mais preciso que setTimeout, e
  // evita o bug antigo de ler ctx.currentTime ja adiantado dentro do timeout).
  const now = ctx.currentTime;
  beep(ctx, 880, now);
  beep(ctx, 1100, now + 0.2);
}

function getDateRange(filter: DateFilter): Date | null {
  const now = new Date();
  switch (filter) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
      return null;
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const PENDING_EXPIRY_MINUTES = 10;

function PendingTimer({ createdAt, onExpired }: { createdAt: string | number; onExpired?: () => void }) {
  const parseTs = (ts: string | number): number => {
    if (typeof ts === "number") return ts;
    const s = /[Z+]/.test(ts) ? ts : ts + "Z";
    return new Date(s).getTime();
  };

  const getRemaining = () => {
    const tsMs = parseTs(createdAt);
    const nowMs = Date.now();
    const elapsed = Math.floor((nowMs - tsMs) / 1000);
    const total = PENDING_EXPIRY_MINUTES * 60;
    const r = total - elapsed;
    if (r <= 0 || r > total) return 0;
    return r;
  };

  const [remaining, setRemaining] = useState(getRemaining);

  // KAN-256: o intervalo capturava o `onExpired` do render em que o efeito
  // rodou. Hoje isso é inofensivo (o callback é `() => refetch()` e o `refetch`
  // do Apollo é estável), mas é frágil: no dia em que esse callback fechar
  // sobre algum estado, o timer chamaria a versão velha silenciosamente.
  // O ref garante que sempre dispara a mais recente — e é o motivo honesto pelo
  // qual `onExpired` não precisa estar nas deps.
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    const interval = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpiredRef.current?.();
      }
    }, 1000);
    return () => clearInterval(interval);
    // `getRemaining` fecha apenas sobre `createdAt`, então re-rodar por ele basta.

  }, [createdAt]);

  if (remaining <= 0) {
    return <span className="text-xs font-semibold text-red-500 dark:text-red-400">Expirado</span>;
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining < 120;

  return (
    <span className={`text-xs font-semibold ${isUrgent ? "text-red-500 dark:text-red-400" : "text-[var(--text-secondary)]"}`}>
      Expira em {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

export default function OrdersPage() {
  const { startTour, hasSeenTour } = useTour("orders", TOUR_STEPS);
  const { data: storesData, error: storesError, refetch: refetchStores } = useQuery(GET_MY_STORES);
  const stores = storesData?.myStores || [];
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [zoomedAvatar, setZoomedAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);

  const { data: ordersData, loading, error: ordersError, refetch } = useQuery(GET_STORE_ORDERS, {
    variables: { storeId: selectedStore },
    skip: !selectedStore,
  });

  useSubscription(ORDER_CREATED_SUB, {
    variables: { storeId: selectedStore },
    skip: !selectedStore,
    onData: ({ data: subData }) => {
      if (subData?.data?.orderCreated) {
        const o = subData.data.orderCreated;
        devLog(`[VENDOR-SUB] orderCreated: #${o.orderNumber}, status=${o.status}, id=${o.id}`);
        playNotificationSound();
        setNotification(`Novo pedido #${o.orderNumber}!`);
        setTimeout(() => setNotification(null), 5000);
        refetch();
      }
    },
  });

  useSubscription(ORDER_UPDATED_SUB, {
    variables: { storeId: selectedStore },
    skip: !selectedStore,
    onData: ({ data: subData }) => {
      const o = subData?.data?.orderUpdated;
      devLog(`[VENDOR-SUB] orderUpdated: #${o?.orderNumber || '?'}, status=${o?.status || '?'}, id=${o?.id || '?'}`);
      refetch();
    },
  });

  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS);
  const [adjustWeight] = useMutation(ADJUST_ORDER_ITEM_WEIGHT);
  const [rejectOrderMut] = useMutation(REJECT_ORDER);
  const [vendorCancelOrderMut] = useMutation(VENDOR_CANCEL_ORDER);
  const [vendorConfirmPickupMut] = useMutation(VENDOR_CONFIRM_PICKUP);
  const [requestCancelDisputeMut] = useMutation(REQUEST_CANCEL_DISPUTE);
  const [requestingDispute, setRequestingDispute] = useState<Set<string>>(new Set());
  const [statusError, setStatusError] = useState<string | null>(null);
  const [weightEdit, setWeightEdit] = useState<{ itemId: string; value: string } | null>(null);
  const [rejectState, setRejectState] = useState<{ orderId: string; reason: string } | null>(null);
  // M6: per-order advancing state instead of single boolean
  const [advancingOrders, setAdvancingOrders] = useState<Set<string>>(new Set());
  // L7: per-operation loading tracking for reject/pickup/weight
  const [rejectingOrders, setRejectingOrders] = useState<Set<string>>(new Set());
  const [cancelState, setCancelState] = useState<{ orderId: string; reason: string } | null>(null);
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set());
  const [pickupOrders, setPickupOrders] = useState<Set<string>>(new Set());
  const [weightAdjusting, setWeightAdjusting] = useState<Set<string>>(new Set());
  // M5: confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; action: string; label: string } | null>(null);
  // KAN-129: Checklist de separação de produtos
  const [separatedItems, setSeparatedItems] = useState<Record<string, string[]>>({});
  const separatedItemsRef = useRef(separatedItems);
  separatedItemsRef.current = separatedItems;

  useEffect(() => {
    try {
      const saved = localStorage.getItem('separatedItems');
      if (saved) setSeparatedItems(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleSeparatedItem = useCallback((orderId: string, itemId: string) => {
    setSeparatedItems(prev => {
      const orderItems = prev[orderId] || [];
      const next = orderItems.includes(itemId)
        ? { ...prev, [orderId]: orderItems.filter(id => id !== itemId) }
        : { ...prev, [orderId]: [...orderItems, itemId] };
      localStorage.setItem('separatedItems', JSON.stringify(next));
      return next;
    });
  }, []);

  const allOrders = ordersData?.storeOrders || [];

  // KAN-256: poda o checklist de separação de pedidos que já saíram de
  // ACCEPTED/PREPARING. Antes nada era removido: ao longo de meses de operação
  // o objeto acumulava uma entrada por orderId já processado, inchando o
  // localStorage e deixando o JSON.parse do mount cada vez mais lento.
  useEffect(() => {
    const activeIds = new Set(
      allOrders
        .filter((o: any) => o.status === "ACCEPTED" || o.status === "PREPARING")
        .map((o: any) => o.id),
    );
    setSeparatedItems((prev) => {
      const entries = Object.entries(prev);
      const kept = entries.filter(([orderId]) => activeIds.has(orderId));
      if (kept.length === entries.length) return prev; // nada a podar
      const next = Object.fromEntries(kept);
      try {
        localStorage.setItem("separatedItems", JSON.stringify(next));
      } catch {}
      return next;
    });
    // Depende do resultado da query (referência estável por resposta), não do
    // array recriado a cada render.
  }, [ordersData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter orders by tab and date
  const filteredOrders = useMemo(() => {
    let statusList: string[];
    switch (activeTab) {
      case "active": statusList = ACTIVE_STATUSES; break;
      case "completed": statusList = COMPLETED_STATUSES; break;
      case "incomplete": statusList = INCOMPLETE_STATUSES; break;
    }

    let orders = allOrders.filter((o: any) => statusList.includes(o.status));

    // Apply date filter only for completed and incomplete tabs
    if (activeTab !== "active") {
      const minDate = getDateRange(dateFilter);
      if (minDate) {
        orders = orders.filter((o: any) => new Date(o.createdAt) >= minDate);
      }
    }

    return orders;
  }, [allOrders, activeTab, dateFilter]);

  // Count for tab badges
  const counts = useMemo(() => ({
    active: allOrders.filter((o: any) => ACTIVE_STATUSES.includes(o.status)).length,
    completed: allOrders.filter((o: any) => COMPLETED_STATUSES.includes(o.status)).length,
    incomplete: allOrders.filter((o: any) => INCOMPLETE_STATUSES.includes(o.status)).length,
  }), [allOrders]);

  async function handleAdvanceStatus(order: any) {
    const orderId = order.id;
    const currentStatus = order.status;
    const next = proximoStatus(order);
    if (!next) return;
    devLog(`[VENDOR-ADVANCE] orderId=${orderId}, ${currentStatus} -> ${next}`);

    // M5: For PENDING->ACCEPTED (payment capture) and READY->vendor confirm, require confirmation
    if (currentStatus === "PENDING") {
      devLog(`[VENDOR-ADVANCE] Showing confirm dialog for PENDING->ACCEPTED`);
      setConfirmAction({ orderId, action: "advance", label: "Aceitar este pedido? Isso ira capturar o pagamento do cliente." });
      return;
    }

    // Fechar a entrega no balcao tambem merece confirmacao: e o passo que
    // dispara a liberacao do pagamento (apos a confirmacao do cliente).
    if (next === "DELIVERED") {
      setConfirmAction({
        orderId,
        action: "advance",
        label: order.isPickup
          ? "Confirmar que o cliente retirou o pedido?"
          : "Confirmar que o pedido foi entregue?",
      });
      return;
    }

    await doAdvanceStatus(order);
  }

  async function doAdvanceStatus(order: any) {
    if (!order) return;
    const orderId = order.id;
    const currentStatus = order.status;
    const next = proximoStatus(order);
    if (!next) return;
    // Block if already advancing this order
    if (advancingOrders.has(orderId)) return;
    devLog(`[VENDOR-ADVANCE] Executing: orderId=${orderId}, ${currentStatus} -> ${next}`);
    // M6: per-order advancing
    setAdvancingOrders((prev) => new Set(prev).add(orderId));
    setStatusError(null);
    setConfirmAction(null);
    try {
      await updateStatus({ variables: { id: orderId, status: next } });
      devLog(`[VENDOR-ADVANCE] SUCCESS: orderId=${orderId}, now ${next}`);
      await refetch();
    } catch (err: any) {
      console.error(`[VENDOR-ADVANCE] FAILED: orderId=${orderId}, ${currentStatus} -> ${next}:`, err.message);
      // Ignore race condition: order already advanced
      if (err.message?.includes('Nao pode mudar de') && err.message?.includes(next)) {
        refetch();
      } else {
        setStatusError(err.message || "Erro ao atualizar status do pedido.");
        setTimeout(() => setStatusError(null), 5000);
      }
    } finally {
      setAdvancingOrders((prev) => { const s = new Set(prev); s.delete(orderId); return s; });
    }
  }

  async function handleRejectOrder(orderId: string, reason: string) {
    if (!reason.trim()) return;
    devLog(`[VENDOR-REJECT] orderId=${orderId}, reason="${reason.trim()}"`);
    // L7: per-operation loading
    setRejectingOrders((prev) => new Set(prev).add(orderId));
    try {
      await rejectOrderMut({ variables: { orderId, reason: reason.trim() } });
      devLog(`[VENDOR-REJECT] SUCCESS: orderId=${orderId}`);
      setRejectState(null);
      refetch();
    } catch (err: any) {
      console.error(`[VENDOR-REJECT] FAILED: orderId=${orderId}:`, err.message);
      // M7: show error to user instead of silent console.error
      setStatusError(err.message || "Erro ao rejeitar pedido.");
      setTimeout(() => setStatusError(null), 5000);
    } finally {
      setRejectingOrders((prev) => { const s = new Set(prev); s.delete(orderId); return s; });
    }
  }

  async function handleVendorCancelOrder(orderId: string, reason: string) {
    if (!reason.trim()) return;
    devLog(`[VENDOR-CANCEL] orderId=${orderId}, reason="${reason.trim()}"`);
    setCancellingOrders((prev) => new Set(prev).add(orderId));
    try {
      await vendorCancelOrderMut({ variables: { orderId, reason: reason.trim() } });
      devLog(`[VENDOR-CANCEL] SUCCESS: orderId=${orderId}`);
      setCancelState(null);
      refetch();
    } catch (err: any) {
      console.error(`[VENDOR-CANCEL] FAILED: orderId=${orderId}:`, err.message);
      setStatusError(err.message || "Erro ao cancelar pedido.");
      setTimeout(() => setStatusError(null), 5000);
    } finally {
      setCancellingOrders((prev) => { const s = new Set(prev); s.delete(orderId); return s; });
    }
  }

  async function handleVendorConfirmPickup(orderId: string) {
    devLog(`[VENDOR-PICKUP] Showing confirm dialog: orderId=${orderId}`);
    // M5: confirmation dialog for pickup
    setConfirmAction({ orderId, action: "pickup", label: "Confirmar entrega ao entregador?" });
  }

  async function doVendorConfirmPickup(orderId: string) {
    devLog(`[VENDOR-PICKUP] Executing: orderId=${orderId}`);
    // L7: per-operation loading
    setPickupOrders((prev) => new Set(prev).add(orderId));
    setConfirmAction(null);
    try {
      await vendorConfirmPickupMut({ variables: { orderId } });
      devLog(`[VENDOR-PICKUP] SUCCESS: orderId=${orderId}`);
      refetch();
    } catch (err: any) {
      console.error(`[VENDOR-PICKUP] FAILED: orderId=${orderId}:`, err.message);
      // M7: show error to user instead of silent console.error
      setStatusError(err.message || "Erro ao confirmar entrega.");
      setTimeout(() => setStatusError(null), 5000);
    } finally {
      setPickupOrders((prev) => { const s = new Set(prev); s.delete(orderId); return s; });
    }
  }

  async function handleAdjustWeight(itemId: string, grams: string) {
    const parsed = parseInt(grams);
    if (!parsed || parsed <= 0) return;
    devLog(`[VENDOR-WEIGHT] itemId=${itemId}, grams=${parsed}`);
    // L7: per-operation loading
    setWeightAdjusting((prev) => new Set(prev).add(itemId));
    try {
      await adjustWeight({ variables: { orderItemId: itemId, actualWeightGrams: parsed } });
      devLog(`[VENDOR-WEIGHT] SUCCESS: itemId=${itemId}`);
      setWeightEdit(null);
      refetch();
    } catch (err: any) {
      console.error(`[VENDOR-WEIGHT] FAILED: itemId=${itemId}:`, err.message);
      // M7: show error to user instead of silent console.error
      setStatusError(err.message || "Erro ao ajustar peso.");
      setTimeout(() => setStatusError(null), 5000);
    } finally {
      setWeightAdjusting((prev) => { const s = new Set(prev); s.delete(itemId); return s; });
    }
  }

  // ANTES do spinner e do empty state: com `!storesData` sozinho o spinner
  // girava para sempre quando a query falhava, sem mensagem nem retry.
  if (storesError && !storesData) {
    return (
      <ErrorState
        title="Nao foi possivel carregar suas lojas."
        description="Suas lojas continuam salvas. Verifique sua conexao e tente novamente."
        onRetry={() => refetchStores()}
      />
    );
  }

  if (!storesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)]" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => window.location.reload()} />
        <div className="text-center mt-20">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja cadastrada</h2>
          <p className="text-[var(--text-secondary)] mb-6">Crie sua primeira loja para começar a receber pedidos</p>
          <button onClick={() => setShowCreateStore(true)} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-6 py-3 rounded-xl font-bold cursor-pointer active:scale-95 transition">
            Criar loja
          </button>
        </div>
      </>
    );
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "active", label: "Ativos", count: counts.active },
    { key: "completed", label: "Concluídos", count: counts.completed },
    { key: "incomplete", label: "Não concluídos", count: counts.incomplete },
  ];

  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mês" },
    { key: "year", label: "Ano" },
    { key: "all", label: "Todos" },
  ];

  return (
    <motion.div {...fadeIn}>
      {/* M5: Confirmation dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div {...scaleIn} className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Confirmar Acao</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">{confirmAction.label}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirmAction.action === "advance") {
                    doAdvanceStatus(allOrders.find((o: any) => o.id === confirmAction.orderId));
                  } else if (confirmAction.action === "pickup") {
                    doVendorConfirmPickup(confirmAction.orderId);
                  }
                }}
                className="flex-1 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl font-semibold transition cursor-pointer"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-3 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl font-semibold hover:bg-[var(--bg-hover)] transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {notification && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-[var(--brand-primary)] text-white px-6 py-4 rounded-2xl shadow-lg z-50 animate-bounce">
          <p className="font-bold">{notification}</p>
        </div>
      )}
      {statusError && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-red-500 text-white px-6 py-4 rounded-2xl shadow-lg z-50">
          <p className="font-semibold text-sm">{statusError}</p>
        </div>
      )}

      <PageHeader
        title="Pedidos"
        onTourStart={startTour}
        tourNotSeen={!hasSeenTour}
        actions={
          stores.length > 1 ? (
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]"
            >
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div data-tour="orders-tabs" className="flex gap-1 mb-4 bg-[var(--bg-input)] rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === tab.key
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? "bg-[var(--brand-primary-hover)]" : "bg-[var(--bg-hover)]"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Date filter - only for completed and incomplete */}
      {activeTab !== "active" && (
        <div data-tour="orders-filters" className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {dateFilters.map((df) => (
            <button
              key={df.key}
              onClick={() => setDateFilter(df.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                dateFilter === df.key
                  ? "bg-[var(--brand-primary)] text-white"
                  : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : ordersError && !ordersData ? (
        /* ANTES do empty state: uma falha aqui virava "Nenhum pedido ativo" e o
           vendedor deixava de atender pedidos que existiam de verdade. */
        <ErrorState
          title="Nao foi possivel carregar os pedidos."
          description="Isto nao significa que nao ha pedidos — a consulta falhou. Verifique sua conexao e tente novamente."
          onRetry={() => refetch()}
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            activeTab === "active" ? "Nenhum pedido ativo" :
            activeTab === "completed" ? "Nenhum pedido concluído neste período" :
            "Nenhum pedido não concluído neste período"
          }
          description="Os pedidos aparecerão aqui quando forem recebidos."
        />
      ) : (
        <div data-tour="orders-list" className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] overflow-hidden">
          <div className="overflow-x-auto">
          {filteredOrders.map((order: any, orderIndex: number) => {
            let status = statusLabels[order.status] || { label: order.status, color: "bg-[var(--bg-muted)]" };
            // "Pronto - Aguardando entregador" era exibido tambem em retirada e
            // em loja com frota propria, onde entregador do app nunca aparece.
            if (order.status === "READY" && semEntregadorDoApp(order)) {
              status = {
                ...status,
                label: order.isPickup ? "Pronto - Aguardando retirada" : "Pronto - Saiu para entrega",
              };
            }
            const canAdvance = !!proximoStatus(order);

            return (
              <div key={order.id} className={`p-4 sm:p-6 hover:bg-[var(--bg-hover)] transition-colors ${orderIndex > 0 ? "border-t border-[var(--border-light)]" : ""}`}>
                <div className="flex items-start justify-between mb-3 gap-4">
                  <div>
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(order.createdAt)}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)]">#{order.orderNumber}</span>
                      {stores.length > 1 && order.store?.name && (
                        <StatusBadge variant="info">{order.store.name}</StatusBadge>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {order.customer?.name ?? "Cliente removido"} - {order.customer?.phone ?? ""}
                      </span>
                    </div>
                  </div>
                  {order.delivery?.deliverer ? (
                    <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 shrink-0">
                      <div className="flex items-center gap-3">
                        {order.delivery.deliverer.phone && (
                          <a
                            href={`https://wa.me/55${order.delivery.deliverer.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                            title="WhatsApp do entregador"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        {order.delivery.deliverer.profilePhotoUrl ? (
                          <img
                            src={order.delivery.deliverer.profilePhotoUrl}
                            alt=""
                            className="w-14 h-14 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-purple-400 transition"
                            onClick={() => setZoomedAvatar(order.delivery.deliverer.profilePhotoUrl)}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-lg">
                            {order.delivery.deliverer.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        {order.delivery.currentLatitude && order.deliveryLatitude ? (
                          <a
                            href={`https://www.google.com/maps/dir/${order.delivery.currentLatitude},${order.delivery.currentLongitude}/${order.deliveryLatitude},${order.deliveryLongitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                            title="Ver no mapa"
                          >
                            <MapPin className="w-4 h-4" />
                          </a>
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{order.delivery.deliverer.name}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        {order.status === "COMPLETED" || order.status === "DELIVERED" ? "Entrega concluída" : order.status === "DELIVERING" ? "Saiu para entrega" : order.status === "DELIVERER_CONFIRMED_DELIVERY" ? "Entrega confirmada" : "Entregador a caminho"}
                      </p>
                    </div>
                  ) : (
                    <StatusBadge variant={getStatusVariant(order.status)} dot className="shrink-0">
                      {status.label}
                    </StatusBadge>
                  )}
                </div>

                <div className="border-t border-[var(--border-light)] pt-3 mb-3">
                  {["ACCEPTED", "PREPARING"].includes(order.status) && (() => {
                    const separated = separatedItems[order.id] || [];
                    const total = order.items.length;
                    const done = separated.filter((id: string) => order.items.some((i: any) => i.id === id)).length;
                    const allDone = done === total && total > 0;
                    return (
                      <div className="flex items-center gap-2 mb-2">
                        {allDone ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Todos separados &#10003;
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)]">
                            {done} de {total} itens separados
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-1 items-center gap-2">
                      <span className="text-[var(--text-primary)] flex items-center gap-1.5 flex-wrap">
                        {["ACCEPTED", "PREPARING"].includes(order.status) && (
                          <button
                            onClick={() => toggleSeparatedItem(order.id, item.id)}
                            className="flex-shrink-0 cursor-pointer"
                            title="Marcar como separado"
                          >
                            {(separatedItems[order.id] || []).includes(item.id) ? (
                              <span className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full border-2 border-[var(--border-color)] inline-block" />
                            )}
                          </button>
                        )}
                        {item.product?.isVariableWeight && item.weightGrams
                          ? <span>{(item.weightGrams / 1000).toFixed(2)}kg</span>
                          : <span>{item.quantity}x</span>
                        }
                        {item.product?.name || 'Produto removido'}
                        {item.product?.isVariableWeight && order.status === "PENDING" && (
                          weightEdit?.itemId === item.id && weightEdit ? (
                            <span className="flex items-center gap-1 ml-1">
                              <input
                                type="number"
                                min="1"
                                autoFocus
                                value={weightEdit.value}
                                onChange={(e) => setWeightEdit({ itemId: item.id, value: e.target.value })}
                                onKeyDown={(e) => { if (e.key === "Enter") handleAdjustWeight(item.id, weightEdit!.value); if (e.key === "Escape") setWeightEdit(null); }}
                                placeholder="gramas"
                                className="w-24 px-2 py-0.5 border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] bg-[var(--bg-input)] focus:ring-1 focus:ring-[var(--brand-primary-muted)] outline-none"
                              />
                              <span className="text-xs text-[var(--text-muted)]">g</span>
                              <button
                                onClick={() => handleAdjustWeight(item.id, weightEdit!.value)}
                                className="px-2 py-0.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg text-xs font-bold cursor-pointer active:scale-95 transition"
                              >OK</button>
                              <button
                                onClick={() => setWeightEdit(null)}
                                className="px-1.5 py-0.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer text-xs"
                              >&#10005;</button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setWeightEdit({ itemId: item.id, value: String(item.weightGrams || "") })}
                              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--brand-primary)] cursor-pointer transition"
                              title="Ajustar peso"
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          )
                        )}
                      </span>
                      <span className="text-[var(--text-secondary)] flex-shrink-0">
                        R$ {Number(item.totalPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-[var(--text-primary)]">
                      R$ {Number(order.subtotal).toFixed(2)}
                    </span>
                    {(order.status === "PENDING" || order.status === "AWAITING_PAYMENT" || order.status === "PAYMENT_REVIEW") && (
                      <PendingTimer createdAt={order.createdAt} onExpired={() => refetch()} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Reject button for PENDING orders */}
                    {order.status === "PENDING" && (
                      rejectState?.orderId === order.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={rejectState!.reason}
                            onChange={(e) => setRejectState({ orderId: order.id, reason: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRejectOrder(order.id, rejectState!.reason); if (e.key === "Escape") setRejectState(null); }}
                            placeholder="Motivo da rejeição"
                            className="px-3 py-2 border border-red-300 dark:border-red-700 rounded-xl text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:ring-1 focus:ring-red-300 outline-none w-44"
                          />
                          <button
                            onClick={() => handleRejectOrder(order.id, rejectState!.reason)}
                            disabled={rejectingOrders.has(order.id)}
                            className="bg-[var(--status-error-text)] text-white px-3 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-700 active:scale-[0.98] transition disabled:opacity-50"
                          >
                            {rejectingOrders.has(order.id) ? "Rejeitando..." : "Confirmar"}
                          </button>
                          <button
                            onClick={() => setRejectState(null)}
                            className="px-2 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer text-sm"
                          >
                            &#10005;
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRejectState({ orderId: order.id, reason: "" })}
                          className="bg-[var(--status-error-text)] text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-700 active:scale-[0.98] transition"
                        >
                          Rejeitar
                        </button>
                      )
                    )}

                    {/* Cancel button for ACCEPTED/PREPARING/READY orders (only if no deliverer assigned) */}
                    {["ACCEPTED", "PREPARING", "READY"].includes(order.status) && !order.delivery?.deliverer && (
                      cancelState?.orderId === order.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={cancelState!.reason}
                            onChange={(e) => setCancelState({ orderId: order.id, reason: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") handleVendorCancelOrder(order.id, cancelState!.reason); if (e.key === "Escape") setCancelState(null); }}
                            placeholder="Motivo do cancelamento"
                            className="px-3 py-2 border border-red-300 dark:border-red-700 rounded-xl text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:ring-1 focus:ring-red-300 outline-none w-44"
                          />
                          <button
                            onClick={() => handleVendorCancelOrder(order.id, cancelState!.reason)}
                            disabled={cancellingOrders.has(order.id)}
                            className="bg-[var(--status-error-text)] text-white px-3 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-700 active:scale-[0.98] transition disabled:opacity-50"
                          >
                            {cancellingOrders.has(order.id) ? "Cancelando..." : "Confirmar"}
                          </button>
                          <button
                            onClick={() => setCancelState(null)}
                            className="px-2 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer text-sm"
                          >
                            &#10005;
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancelState({ orderId: order.id, reason: "" })}
                          className="bg-[var(--status-error-text)] text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-700 active:scale-[0.98] transition"
                        >
                          Cancelar pedido
                        </button>
                      )
                    )}

                    {/* Confirm pickup button - appears after deliverer confirms pickup */}
                    {(order.status === "PICKED_UP" || order.status === "DELIVERING") && !order.vendorConfirmedPickupAt && (
                      <button
                        onClick={() => handleVendorConfirmPickup(order.id)}
                        disabled={pickupOrders.has(order.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-600 active:scale-95 transition disabled:opacity-50"
                      >
                        {pickupOrders.has(order.id) ? "Confirmando..." : "Confirmar coleta"}
                      </button>
                    )}
                    {(order.status === "PICKED_UP" || order.status === "DELIVERING") && order.vendorConfirmedPickupAt && (
                      <span className="text-green-500 text-sm font-bold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Coleta confirmada
                      </span>
                    )}

                    {/* Request cancel dispute for DISPUTED orders */}
                    {order.status === "DISPUTED" && (
                      <>
                        {order.customer?.phone && (
                          <a
                            href={`https://wa.me/55${order.customer.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-green-600 active:scale-95 transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </a>
                        )}
                        <button
                          onClick={async () => {
                            setRequestingDispute(prev => new Set(prev).add(order.id));
                            try {
                              await requestCancelDisputeMut({ variables: { orderId: order.id } });
                              setStatusError(null);
                              alert("Solicitação enviada ao cliente!");
                            } catch (err: any) {
                              setStatusError(err?.message || "Erro ao solicitar cancelamento");
                            } finally {
                              setRequestingDispute(prev => { const s = new Set(prev); s.delete(order.id); return s; });
                            }
                          }}
                          disabled={requestingDispute.has(order.id)}
                          className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition disabled:opacity-50"
                        >
                          {requestingDispute.has(order.id) ? "Enviando..." : "Pedir cancelamento"}
                        </button>
                      </>
                    )}

                    {/* Advance status button - M6: per-order disabled */}
                    {canAdvance && (
                      <button
                        onClick={() => handleAdvanceStatus(order)}
                        disabled={advancingOrders.has(order.id)}
                        className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition disabled:opacity-50"
                      >
                        {advancingOrders.has(order.id) ? "Processando..." :
                          order.status === "PENDING" ? "Aceitar pedido" :
                          order.status === "ACCEPTED" ? "Iniciar preparo" :
                          order.status === "PREPARING" ? "Marcar como pronto" : ""}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
      {zoomedAvatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 cursor-pointer"
          onClick={() => setZoomedAvatar(null)}
        >
          <img
            src={zoomedAvatar}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </motion.div>
  );
}
