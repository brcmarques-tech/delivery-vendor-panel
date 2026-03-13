"use client";

import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { GET_MY_STORES, GET_STORE_ORDERS, UPDATE_ORDER_STATUS, ORDER_CREATED_SUB, ORDER_UPDATED_SUB, ADJUST_ORDER_ITEM_WEIGHT } from "@/lib/graphql";
import { useState, useEffect } from "react";

const statusLabels: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: "Aguardando pagamento", color: "bg-orange-100 text-orange-700" },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  ACCEPTED: { label: "Aceito", color: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "Preparando", color: "bg-indigo-100 text-indigo-700" },
  READY: { label: "Pronto", color: "bg-green-100 text-green-700" },
  PICKED_UP: { label: "Coletado", color: "bg-teal-100 text-teal-700" },
  DELIVERING: { label: "A caminho", color: "bg-cyan-100 text-cyan-700" },
  DELIVERED: { label: "Entregue", color: "bg-gray-100 text-gray-700" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

const nextStatus: Record<string, string> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "PICKED_UP",
  PICKED_UP: "DELIVERING",
  DELIVERING: "DELIVERED",
};

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

export default function OrdersPage() {
  const { data: storesData } = useQuery(GET_MY_STORES);
  const stores = storesData?.myStores || [];
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);

  const { data: ordersData, loading, refetch } = useQuery(GET_STORE_ORDERS, {
    variables: { storeId: selectedStore },
    skip: !selectedStore,
  });

  // Real-time: refetch on new orders or status changes
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

  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS);
  const [adjustWeight] = useMutation(ADJUST_ORDER_ITEM_WEIGHT);
  const [weightEdit, setWeightEdit] = useState<{ itemId: string; value: string } | null>(null);
  const orders = ordersData?.storeOrders || [];

  async function handleAdvanceStatus(orderId: string, currentStatus: string) {
    const next = nextStatus[currentStatus];
    if (!next) return;
    await updateStatus({ variables: { id: orderId, status: next } });
    refetch();
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

  return (
    <div>
      {notification && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-orange-500 text-white px-6 py-4 rounded-2xl shadow-lg z-50 animate-bounce">
          <p className="font-bold">{notification}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        {stores.length > 1 && (
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800 bg-white"
          >
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 text-center mt-20">Nenhum pedido ainda</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const status = statusLabels[order.status] || { label: order.status, color: "bg-gray-100" };
            const canAdvance = !!nextStatus[order.status];

            return (
              <div key={order.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                  <div>
                    <span className="font-bold text-gray-800">#{order.orderNumber}</span>
                    <span className="text-sm text-gray-500 sm:ml-3">
                      {order.customer.name} - {order.customer.phone}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3 mb-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-1 items-center gap-2">
                      <span className="text-gray-700 flex items-center gap-1.5 flex-wrap">
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
                                className="w-24 px-2 py-0.5 border border-orange-300 rounded-lg text-xs text-gray-800 focus:ring-1 focus:ring-orange-200 outline-none"
                              />
                              <span className="text-xs text-gray-400">g</span>
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
                      <span className="text-gray-500 flex-shrink-0">
                        R$ {Number(item.totalPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-bold text-lg text-gray-800">
                    R$ {Number(order.total).toFixed(2)}
                  </span>
                  {canAdvance && (
                    <button
                      onClick={() => handleAdvanceStatus(order.id, order.status)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition"
                    >
                      {order.status === "PENDING" && "Aceitar pedido"}
                      {order.status === "ACCEPTED" && "Iniciar preparo"}
                      {order.status === "PREPARING" && "Marcar como pronto"}
                      {order.status === "READY" && "Saiu para entrega"}
                      {order.status === "PICKED_UP" && "A caminho"}
                      {order.status === "DELIVERING" && "Entregue"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
