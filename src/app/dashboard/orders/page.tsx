"use client";

import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { GET_MY_STORES, GET_STORE_ORDERS, UPDATE_ORDER_STATUS, ORDER_CREATED_SUB, ORDER_UPDATED_SUB, ADJUST_ORDER_ITEM_WEIGHT, REJECT_ORDER, VENDOR_CONFIRM_PICKUP } from "@/lib/graphql";
import { useState, useEffect, useMemo, useCallback } from "react";
import CreateStoreModal from "@/components/CreateStoreModal";

const statusLabels: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: "Aguardando pagamento", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  ACCEPTED: { label: "Aceito", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  PREPARING: { label: "Preparando", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  READY: { label: "Pronto", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  PICKED_UP: { label: "Coletado", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
  DELIVERING: { label: "A caminho", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  DELIVERED: { label: "Entregue", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  EXPIRED: { label: "Expirado", color: "bg-red-100 text-red-400 dark:bg-red-900/30 dark:text-red-400" },
  VENDOR_CONFIRMED_PICKUP: { label: "Aguardando entregador confirmar", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  DELIVERER_CONFIRMED_DELIVERY: { label: "Aguardando cliente confirmar", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  COMPLETED: { label: "Finalizado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  DISPUTED: { label: "Em disputa", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};

const nextStatus: Record<string, string> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
};

// Active = in progress orders, Completed = delivered/completed, Incomplete = cancelled/expired/awaiting_payment/rejected
const ACTIVE_STATUSES = ["PENDING", "ACCEPTED", "PREPARING", "READY", "PICKED_UP", "DELIVERING", "VENDOR_CONFIRMED_PICKUP", "DELIVERER_CONFIRMED_DELIVERY"];
const COMPLETED_STATUSES = ["DELIVERED", "COMPLETED"];
const INCOMPLETE_STATUSES = ["CANCELLED", "EXPIRED", "AWAITING_PAYMENT", "REJECTED", "DISPUTED"];

type TabKey = "active" | "completed" | "incomplete";
type DateFilter = "today" | "week" | "month" | "year" | "all";

function playNotificationSound() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.frequency.value = 880;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);

  setTimeout(() => {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1100;
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.3, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.5);
  }, 200);
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

function PendingTimer({ createdAt }: { createdAt: string }) {
  const [remaining, setRemaining] = useState<number>(() => {
    const expiresAt = new Date(createdAt).getTime() + PENDING_EXPIRY_MINUTES * 60 * 1000;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const expiresAt = new Date(createdAt).getTime() + PENDING_EXPIRY_MINUTES * 60 * 1000;
      const secs = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining < 120;

  if (remaining <= 0) {
    return <span className="text-xs font-semibold text-red-500 dark:text-red-400">Expirado</span>;
  }

  return (
    <span className={`text-xs font-semibold ${isUrgent ? "text-red-500 dark:text-red-400" : "text-[var(--text-secondary)]"}`}>
      Expira em {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

export default function OrdersPage() {
  const { data: storesData } = useQuery(GET_MY_STORES);
  const stores = storesData?.myStores || [];
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");

  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);

  const { data: ordersData, loading, refetch } = useQuery(GET_STORE_ORDERS, {
    variables: { storeId: selectedStore },
    skip: !selectedStore,
  });

  useSubscription(ORDER_CREATED_SUB, {
    variables: { storeId: selectedStore },
    skip: !selectedStore,
    onData: ({ data: subData }) => {
      if (subData?.data?.orderCreated) {
        playNotificationSound();
        const o = subData.data.orderCreated;
        setNotification(`Novo pedido #${o.orderNumber}!`);
        setTimeout(() => setNotification(null), 5000);
        refetch();
      }
    },
  });

  useSubscription(ORDER_UPDATED_SUB, {
    variables: { storeId: selectedStore },
    skip: !selectedStore,
    onData: () => { refetch(); },
  });

  const [updateStatus, { loading: advancingStatus }] = useMutation(UPDATE_ORDER_STATUS);
  const [adjustWeight] = useMutation(ADJUST_ORDER_ITEM_WEIGHT);
  const [rejectOrderMut] = useMutation(REJECT_ORDER);
  const [vendorConfirmPickupMut] = useMutation(VENDOR_CONFIRM_PICKUP);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [weightEdit, setWeightEdit] = useState<{ itemId: string; value: string } | null>(null);
  const [rejectState, setRejectState] = useState<{ orderId: string; reason: string } | null>(null);
  const allOrders = ordersData?.storeOrders || [];

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

  async function handleAdvanceStatus(orderId: string, currentStatus: string) {
    const next = nextStatus[currentStatus];
    if (!next) return;
    setStatusError(null);
    try {
      await updateStatus({ variables: { id: orderId, status: next } });
      refetch();
    } catch (err: any) {
      setStatusError(err.message || "Erro ao atualizar status do pedido.");
      setTimeout(() => setStatusError(null), 5000);
    }
  }

  async function handleRejectOrder(orderId: string, reason: string) {
    if (!reason.trim()) return;
    try {
      await rejectOrderMut({ variables: { orderId, reason: reason.trim() } });
      setRejectState(null);
      refetch();
    } catch (err: any) {
      console.error("Erro ao rejeitar pedido:", err);
    }
  }

  async function handleVendorConfirmPickup(orderId: string) {
    try {
      await vendorConfirmPickupMut({ variables: { orderId } });
      refetch();
    } catch (err: any) {
      console.error("Erro ao confirmar entrega:", err);
    }
  }

  async function handleAdjustWeight(itemId: string, grams: string) {
    const parsed = parseInt(grams);
    if (!parsed || parsed <= 0) return;
    try {
      await adjustWeight({ variables: { orderItemId: itemId, actualWeightGrams: parsed } });
      setWeightEdit(null);
      refetch();
    } catch (err: any) {
      console.error("Erro ao ajustar peso:", err);
    }
  }

  if (!storesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => { storesData && window.location.reload(); }} />
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja cadastrada</h2>
          <p className="text-[var(--text-secondary)] mb-6">Crie sua primeira loja para começar a receber pedidos</p>
          <button onClick={() => setShowCreateStore(true)} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
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
    <div>
      {notification && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-orange-500 text-white px-6 py-4 rounded-2xl shadow-lg z-50 animate-bounce">
          <p className="font-bold">{notification}</p>
        </div>
      )}
      {statusError && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-red-500 text-white px-6 py-4 rounded-2xl shadow-lg z-50">
          <p className="font-semibold text-sm">{statusError}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pedidos</h1>
        {stores.length > 1 && (
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]"
          >
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[var(--bg-input)] rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === tab.key
                ? "bg-orange-500 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? "bg-orange-600" : "bg-[var(--bg-hover)]"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Date filter - only for completed and incomplete */}
      {activeTab !== "active" && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {dateFilters.map((df) => (
            <button
              key={df.key}
              onClick={() => setDateFilter(df.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                dateFilter === df.key
                  ? "bg-orange-500 text-white"
                  : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-[var(--text-secondary)]">Carregando...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-center mt-20">
          {activeTab === "active" && "Nenhum pedido ativo"}
          {activeTab === "completed" && "Nenhum pedido concluído neste período"}
          {activeTab === "incomplete" && "Nenhum pedido não concluído neste período"}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: any) => {
            const status = statusLabels[order.status] || { label: order.status, color: "bg-gray-100" };
            const canAdvance = !!nextStatus[order.status];

            return (
              <div key={order.id} className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">#{order.orderNumber}</span>
                    <span className="text-sm text-[var(--text-secondary)] sm:ml-3">
                      {order.customer.name} - {order.customer.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(order.createdAt)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[var(--border-light)] pt-3 mb-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-1 items-center gap-2">
                      <span className="text-[var(--text-primary)] flex items-center gap-1.5 flex-wrap">
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
                                className="w-24 px-2 py-0.5 border border-orange-300 rounded-lg text-xs text-[var(--text-primary)] bg-[var(--bg-input)] focus:ring-1 focus:ring-orange-200 outline-none"
                              />
                              <span className="text-xs text-[var(--text-muted)]">g</span>
                              <button
                                onClick={() => handleAdjustWeight(item.id, weightEdit!.value)}
                                className="px-2 py-0.5 bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition"
                              >OK</button>
                              <button
                                onClick={() => setWeightEdit(null)}
                                className="px-1.5 py-0.5 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                              >&#10005;</button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setWeightEdit({ itemId: item.id, value: String(item.weightGrams || "") })}
                              className="p-0.5 rounded text-gray-400 hover:text-orange-500 cursor-pointer transition"
                              title="Ajustar peso"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
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
                      R$ {Number(order.total).toFixed(2)}
                    </span>
                    {order.status === "PENDING" && (
                      <PendingTimer createdAt={order.createdAt} />
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
                            className="bg-red-500 text-white px-3 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-600 active:scale-95 transition"
                          >
                            Confirmar
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
                          className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-600 active:scale-95 transition"
                        >
                          Rejeitar
                        </button>
                      )
                    )}

                    {/* Confirm pickup button for READY orders */}
                    {order.status === "READY" && (
                      <button
                        onClick={() => handleVendorConfirmPickup(order.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-600 active:scale-95 transition"
                      >
                        Confirmar Entrega ao Entregador
                      </button>
                    )}

                    {/* Advance status button */}
                    {canAdvance && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, order.status)}
                        disabled={advancingStatus}
                        className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition disabled:opacity-50"
                      >
                        {order.status === "PENDING" && "Aceitar pedido"}
                        {order.status === "ACCEPTED" && "Iniciar preparo"}
                        {order.status === "PREPARING" && "Marcar como pronto"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
