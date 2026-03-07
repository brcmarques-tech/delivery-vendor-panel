"use client";

import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_STORES,
  GET_MY_PLAN,
  GET_ACTIVE_PROMOTIONS,
  CREATE_PROMOTION,
} from "@/lib/graphql";
import { useState } from "react";

export default function PromotionsPage() {
  const { data: userData } = useQuery(GET_MY_PLAN);
  const { data: storesData } = useQuery(GET_MY_STORES);
  const { data: promosData, loading, refetch } = useQuery(GET_ACTIVE_PROMOTIONS);
  const [createPromotion] = useMutation(CREATE_PROMOTION);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    storeId: "",
    startDate: "",
    endDate: "",
    price: "",
  });
  const [error, setError] = useState("");

  const currentPlan = userData?.me?.vendorPlan || "FREE";
  const canPromote = currentPlan === "PRO" || currentPlan === "PREMIUM";
  const stores = storesData?.myStores || [];
  const promotions = promosData?.activePromotions || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.storeId) {
      setError("Selecione uma loja");
      return;
    }

    try {
      await createPromotion({
        variables: {
          input: {
            title: form.title,
            description: form.description || null,
            imageUrl: form.imageUrl || null,
            storeId: form.storeId,
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            price: parseFloat(form.price),
          },
        },
      });
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        imageUrl: "",
        storeId: "",
        startDate: "",
        endDate: "",
        price: "",
      });
      refetch();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  if (!canPromote) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Promoções</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <p className="text-lg text-yellow-800 font-semibold">
            Funcionalidade disponível apenas para planos Pro e Premium
          </p>
          <p className="text-yellow-700 mt-2">
            Faça upgrade do seu plano para criar promoções e destacar sua loja
            no app.
          </p>
          <a
            href="/dashboard/plan"
            className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
          >
            Ver Planos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Promoções</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer"
        >
          {showForm ? "Cancelar" : "Nova Promoção"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Loja
            </label>
            <select
              required
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="">Selecione...</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Valor da Promoção (R$)
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer"
          >
            Criar Promoção
          </button>
        </form>
      )}

      {promotions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-500 text-lg">Nenhuma promoção ativa</p>
          <p className="text-gray-400 text-sm mt-2">
            Crie uma promoção para destacar sua loja no app
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo: any) => (
            <div
              key={promo.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              {promo.imageUrl && (
                <img
                  src={promo.imageUrl}
                  alt={promo.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800">
                  {promo.title}
                </h3>
                {promo.description && (
                  <p className="text-gray-500 text-sm mt-1">
                    {promo.description}
                  </p>
                )}
                <div className="mt-3 text-sm text-gray-500 space-y-1">
                  <p>Loja: {promo.store?.name}</p>
                  <p>Valor: R$ {Number(promo.price).toFixed(2)}</p>
                  <p>
                    {new Date(promo.startDate).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(promo.endDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      promo.isPaid
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {promo.isPaid ? "Pago" : "Aguardando pagamento"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
