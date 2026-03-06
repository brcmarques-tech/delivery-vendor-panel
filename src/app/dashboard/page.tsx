"use client";

import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_STORES, TOGGLE_STORE_OPEN } from "@/lib/graphql";

export default function DashboardPage() {
  const { data, loading, refetch } = useQuery(GET_MY_STORES);
  const [toggleOpen] = useMutation(TOGGLE_STORE_OPEN);

  const stores = data?.myStores || [];

  async function handleToggle(storeId: string) {
    await toggleOpen({ variables: { id: storeId } });
    refetch();
  }

  if (loading) {
    return <p className="text-gray-500">Carregando...</p>;
  }

  if (stores.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Nenhuma loja cadastrada
        </h2>
        <p className="text-gray-500 mb-6">
          Crie sua primeira loja para comecar a vender
        </p>
        <a
          href="/dashboard/settings"
          className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition"
        >
          Criar loja
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Visao Geral</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store: any) => (
          <div key={store.id} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{store.name}</h2>
              <button
                onClick={() => handleToggle(store.id)}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  store.isOpen
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {store.isOpen ? "Aberta" : "Fechada"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {store.products?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Produtos</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {store.categories?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Categorias</p>
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>
                Taxa de entrega: R${" "}
                {Number(store.deliveryFee).toFixed(2)}
              </p>
              <p>Tempo estimado: {store.estimatedDeliveryMinutes} min</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
