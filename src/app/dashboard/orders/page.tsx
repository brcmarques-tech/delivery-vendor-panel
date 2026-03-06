"use client";

import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_STORES, GET_STORE_ORDERS, UPDATE_ORDER_STATUS } from "@/lib/graphql";
import { useState, useEffect } from "react";

const statusLabels: Record<string, { label: string; color: string }> = {
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
};

export default function OrdersPage() {
  const { data: storesData } = useQuery(GET_MY_STORES);
  const stores = storesData?.myStores || [];
  const [selectedStore, setSelectedStore] = useState<string>("");

  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);

  const { data: ordersData, loading, refetch } = useQuery(GET_STORE_ORDERS, {
    variables: { storeId: selectedStore },
    skip: !selectedStore,
    pollInterval: 10000,
  });

  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS);
  const orders = ordersData?.storeOrders || [];

  async function handleAdvanceStatus(orderId: string, currentStatus: string) {
    const next = nextStatus[currentStatus];
    if (!next) return;
    await updateStatus({ variables: { id: orderId, status: next } });
    refetch();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
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
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-gray-800">#{order.orderNumber}</span>
                    <span className="text-sm text-gray-500 ml-3">
                      {order.customer.name} - {order.customer.phone}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3 mb-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-700">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="text-gray-500">
                        R$ {Number(item.totalPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg text-gray-800">
                    R$ {Number(order.total).toFixed(2)}
                  </span>
                  {canAdvance && (
                    <button
                      onClick={() => handleAdvanceStatus(order.id, order.status)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition"
                    >
                      {order.status === "PENDING" && "Aceitar pedido"}
                      {order.status === "ACCEPTED" && "Iniciar preparo"}
                      {order.status === "PREPARING" && "Marcar como pronto"}
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
