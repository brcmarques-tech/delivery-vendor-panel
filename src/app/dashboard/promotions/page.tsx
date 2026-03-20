"use client";

import { useQuery, useMutation } from "@apollo/client";
import CreateStoreModal from "@/components/CreateStoreModal";
import {
  GET_MY_STORES,
  GET_MY_PLAN,
  MY_PROMOTIONS,
  CREATE_PROMOTION,
  DELETE_PROMOTION,
  GET_PROMO_PRICE_PER_DAY,
  SWAP_PROMOTION_PRODUCT,
} from "@/lib/graphql";
import { useState, useMemo } from "react";

export default function PromotionsPage() {
  const { data: userData } = useQuery(GET_MY_PLAN);
  const { data: storesData } = useQuery(GET_MY_STORES);
  const { data: promosData, loading, refetch } = useQuery(MY_PROMOTIONS);
  const { data: priceData } = useQuery(GET_PROMO_PRICE_PER_DAY);
  const [createPromotion, { loading: creating }] = useMutation(CREATE_PROMOTION);
  const [deletePromotion] = useMutation(DELETE_PROMOTION);
  const [swapProduct, { loading: swapping }] = useMutation(SWAP_PROMOTION_PRODUCT);
  const [swapId, setSwapId] = useState<string | null>(null);
  const [swapForm, setSwapForm] = useState({ productId: "", promotionalPrice: "", title: "" });

  const [showCreateStore, setShowCreateStore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    storeId: "",
    productId: "",
    promotionalPrice: "",
  });
  const [duration, setDuration] = useState({ days: 1, weeks: 0, months: 0, years: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentPlan = userData?.meVendor?.vendorPlan || "FREE";
  const stores = storesData?.myStores || [];
  const hasBadgeCredit = stores.some((s: any) => s.freePromoDaysCredit > 0);
  const canPromote = currentPlan === "PRO" || currentPlan === "PREMIUM" || currentPlan === "ENTERPRISE" || hasBadgeCredit;
  const promotions = promosData?.myPromotions || [];
  const pricePerDay = priceData?.promoPricePerDay ?? 1;

  const selectedStore = stores.find((s: any) => s.id === form.storeId);
  const products = selectedStore?.products || [];
  const selectedProduct = products.find((p: any) => p.id === form.productId);

  // Badge free days from selected store
  const selectedStoreCredit = selectedStore?.freePromoDaysCredit || 0;

  // Calculate total days and discount
  const { totalDays, discount, discountLabel, finalCost, originalCost, freeDaysUsed, paidDays } = useMemo(() => {
    const d = duration.days + duration.weeks * 7 + duration.months * 30 + duration.years * 365;
    const free = Math.min(selectedStoreCredit, d);
    const paid = d - free;
    let disc = 0;
    let label = "";
    if (paid >= 365) { disc = 0.30; label = "30% (anual)"; }
    else if (paid >= 30) { disc = 0.20; label = "20% (mensal)"; }
    else if (paid >= 7) { disc = 0.10; label = "10% (semanal)"; }
    const original = d * pricePerDay;
    const final_ = paid > 0 ? paid * pricePerDay * (1 - disc) : 0;
    return { totalDays: d, discount: disc, discountLabel: label, finalCost: final_, originalCost: original, freeDaysUsed: free, paidDays: paid };
  }, [duration, pricePerDay, selectedStoreCredit]);

  // Calculate dates from duration (1 day = 24h from now)
  const startDate = useMemo(() => {
    return new Date().toISOString();
  }, []);

  const endDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + totalDays);
    return d.toISOString();
  }, [totalDays]);

  function inc(field: keyof typeof duration) {
    setDuration((prev) => ({ ...prev, [field]: prev[field] + 1 }));
  }
  function dec(field: keyof typeof duration) {
    setDuration((prev) => ({ ...prev, [field]: Math.max(0, prev[field] - 1) }));
  }

  function handleStoreChange(storeId: string) {
    setForm({ ...form, storeId, productId: "", promotionalPrice: "" });
  }

  function handleProductChange(productId: string) {
    const product = products.find((p: any) => p.id === productId);
    setForm({
      ...form,
      productId,
      title: product ? `${product.name} em promoção` : form.title,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.storeId) { setError("Selecione uma loja"); return; }
    if (!form.productId) { setError("Selecione um produto"); return; }
    if (!form.promotionalPrice) { setError("Defina o preço promocional"); return; }
    const selectedProduct = products.find((p: any) => p.id === form.productId);
    if (selectedProduct && parseFloat(form.promotionalPrice) >= selectedProduct.price) {
      setError("Preço promocional deve ser menor que o preço original (R$ " + Number(selectedProduct.price).toFixed(2) + ").");
      return;
    }
    if (totalDays <= 0) { setError("Defina o período de exibição"); return; }

    try {
      const { data } = await createPromotion({
        variables: {
          input: {
            title: form.title,
            description: form.description || null,
            storeId: form.storeId,
            productId: form.productId,
            promotionalPrice: parseFloat(form.promotionalPrice),
            startDate,
            endDate,
          },
        },
      });
      const promo = data?.createPromotion;
      if (promo?.checkoutUrl) {
        window.location.href = promo.checkoutUrl;
        return;
      }
      // Free promotion (badge credit) — already active
      setShowForm(false);
      setForm({ title: "", description: "", storeId: "", productId: "", promotionalPrice: "" });
      setDuration({ days: 1, weeks: 0, months: 0, years: 0 });
      setSuccess("Promocao criada com sucesso! Seus dias gratis do selo foram usados.");
      setTimeout(() => setSuccess(""), 5000);
      refetch();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function startSwap(promo: any) {
    const storeProducts = stores.find((s: any) => s.id === promo.store?.id)?.products || [];
    setSwapId(promo.id);
    setSwapForm({
      productId: promo.product?.id || "",
      promotionalPrice: String(promo.promotionalPrice || ""),
      title: promo.title,
    });
  }

  async function handleSwap() {
    if (!swapId || !swapForm.productId || !swapForm.promotionalPrice) return;
    try {
      await swapProduct({
        variables: {
          id: swapId,
          productId: swapForm.productId,
          promotionalPrice: parseFloat(swapForm.promotionalPrice),
          title: swapForm.title,
        },
      });
      setSwapId(null);
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao trocar produto da promoção.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta promoção?")) return;
    try {
      await deletePromotion({ variables: { id } });
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir promoção.");
    }
  }

  function getStatus(promo: any) {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    if (!promo.isPaid) return { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-700" };
    if (!promo.isActive) return { label: "Desativada", color: "bg-gray-100 text-gray-600" };
    if (now < start) return { label: "Agendada", color: "bg-blue-100 text-blue-600" };
    if (now > end) return { label: "Expirada", color: "bg-gray-100 text-gray-500" };
    return { label: "Ativa", color: "bg-green-100 text-green-600" };
  }

  if (loading) return <p className="text-[var(--text-secondary)]">Carregando...</p>;

  if (!canPromote) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Promoções</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <p className="text-lg text-yellow-800 font-semibold">Funcionalidade disponível apenas para planos Pro e Premium</p>
          <p className="text-yellow-700 mt-2">Faça upgrade do seu plano para criar promoções e destacar sua loja no app.</p>
          <a href="/dashboard/plan" className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">Ver Planos</a>
        </div>
      </div>
    );
  }

  function CounterControl({ label, value, onInc, onDec, discount: disc }: { label: string; value: number; onInc: () => void; onDec: () => void; discount?: string }) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-xs text-[var(--text-secondary)] mb-1">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDec}
            className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] text-[var(--text-secondary)] font-bold text-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition cursor-pointer"
          >
            −
          </button>
          <span className="w-10 text-center text-xl font-bold text-[var(--text-primary)]">{value}</span>
          <button
            type="button"
            onClick={onInc}
            className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-bold text-lg flex items-center justify-center hover:bg-orange-200 transition cursor-pointer"
          >
            +
          </button>
        </div>
        {disc && <span className="text-[10px] text-green-600 font-semibold mt-1">{disc}</span>}
      </div>
    );
  }

  if (!storesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => { storesData && window.location.reload(); }} />
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja cadastrada</h2>
          <p className="text-[var(--text-secondary)] mb-6">Crie sua primeira loja para começar a criar promoções</p>
          <button onClick={() => setShowCreateStore(true)} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
            Criar loja
          </button>
        </div>
      </>
    );
  }

  return (
    <div>
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          {success}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Promoções</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer"
        >
          {showForm ? "Cancelar" : "+ Nova Promoção"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Loja</label>
              <select
                required
                value={form.storeId}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-500"
              >
                <option value="">Selecione a loja...</option>
                {stores.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Produto</label>
              <select
                required
                value={form.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                disabled={!form.storeId}
                className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-500 disabled:opacity-50"
              >
                <option value="">Selecione o produto...</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedProduct && (
            <div className="flex items-center gap-4 bg-[var(--bg-muted)] rounded-xl p-3">
              {selectedProduct.imageUrl ? (
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-xl">📦</div>
              )}
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{selectedProduct.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">Preço original: R$ {Number(selectedProduct.price).toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Título da promoção</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Picanha com 20% OFF"
                className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Preço promocional (R$)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={form.promotionalPrice}
                onChange={(e) => setForm({ ...form, promotionalPrice: e.target.value })}
                placeholder={selectedProduct ? `Original: R$ ${Number(selectedProduct.price).toFixed(2)}` : "0.00"}
                className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Descrição (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes da promoção..."
              className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-500"
              rows={2}
            />
          </div>

          {/* Duration counter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Período de exibição no app</label>
            <div className="bg-[var(--bg-muted)] rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                <CounterControl label="Dias" value={duration.days} onInc={() => inc("days")} onDec={() => dec("days")} />
                <div className="text-[var(--text-muted)] text-2xl font-light hidden sm:block">+</div>
                <CounterControl label="Semanas" value={duration.weeks} onInc={() => inc("weeks")} onDec={() => dec("weeks")} discount="-10%" />
                <div className="text-[var(--text-muted)] text-2xl font-light hidden sm:block">+</div>
                <CounterControl label="Meses" value={duration.months} onInc={() => inc("months")} onDec={() => dec("months")} discount="-20%" />
                <div className="text-[var(--text-muted)] text-2xl font-light hidden sm:block">+</div>
                <CounterControl label="Anos" value={duration.years} onInc={() => inc("years")} onDec={() => dec("years")} discount="-30%" />
              </div>

              {totalDays > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">
                        <span className="font-bold text-lg text-[var(--text-primary)]">{totalDays}</span> dia{totalDays > 1 ? "s" : ""} de exibição
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {new Date().toLocaleDateString("pt-BR")} até {new Date(endDate).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">R$ {pricePerDay.toFixed(2)} / dia</p>
                      {freeDaysUsed > 0 && (
                        <p className="text-xs text-green-600 font-semibold mt-0.5">
                          {freeDaysUsed} dia{freeDaysUsed > 1 ? "s" : ""} gratis (premio selo)
                          {paidDays > 0 && <span className="text-[var(--text-muted)] font-normal"> + {paidDays} pago{paidDays > 1 ? "s" : ""}</span>}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {discount > 0 && (
                        <>
                          <p className="text-sm text-[var(--text-muted)] line-through">R$ {originalCost.toFixed(2)}</p>
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-1">{discountLabel}</span>
                        </>
                      )}
                      <p className="text-2xl font-bold text-orange-600">R$ {finalCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={creating || totalDays <= 0}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
          >
            {creating ? "Criando..." : totalDays > 0 && finalCost === 0 ? "Criar Promocao Gratis" : `Criar Promocao${totalDays > 0 ? ` • R$ ${finalCost.toFixed(2)}` : ""}`}
          </button>
        </form>
      )}

      {promotions.length === 0 ? (
        <div className="bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl p-12 text-center">
          <p className="text-[var(--text-secondary)] text-lg">Nenhuma promoção criada</p>
          <p className="text-[var(--text-muted)] text-sm mt-2">Crie uma promoção para destacar seus produtos no app</p>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((promo: any) => {
            const status = getStatus(promo);
            const imgUrl = promo.product?.imageUrl || promo.imageUrl;
            const isSwapping = swapId === promo.id;
            const promoStoreProducts = stores.find((s: any) => s.id === promo.store?.id)?.products || [];
            const swapSelectedProduct = promoStoreProducts.find((p: any) => p.id === swapForm.productId);
            const isExpired = new Date(promo.endDate) < new Date();

            return (
              <div key={promo.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {imgUrl ? (
                    <img src={imgUrl} alt={promo.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-2xl flex-shrink-0">📢</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[var(--text-primary)] truncate">{promo.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    {promo.product && (
                      <p className="text-sm text-[var(--text-secondary)]">
                        {promo.product.name}: <span className="line-through">R$ {Number(promo.product.price).toFixed(2)}</span>{" "}
                        <span className="text-orange-600 font-semibold">R$ {Number(promo.promotionalPrice).toFixed(2)}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-[var(--text-secondary)] mt-1">
                      <span>{promo.store?.name}</span>
                      <span>
                        {new Date(promo.startDate).toLocaleDateString("pt-BR")} - {new Date(promo.endDate).toLocaleDateString("pt-BR")}
                      </span>
                      <span>Anúncio: R$ {Number(promo.adCost).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
                    {!isExpired && (
                      <button
                        onClick={() => isSwapping ? setSwapId(null) : startSwap(promo)}
                        className="text-orange-500 hover:text-orange-700 cursor-pointer p-2 transition text-sm font-semibold"
                        title="Trocar produto"
                      >
                        {isSwapping ? "✕" : "🔄 Trocar"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-red-400 hover:text-red-600 cursor-pointer p-2 transition"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {isSwapping && (
                  <div className="border-t border-[var(--border-light)] bg-orange-50/50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Trocar produto da promoção</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Novo produto</label>
                        <select
                          value={swapForm.productId}
                          onChange={(e) => {
                            const p = promoStoreProducts.find((x: any) => x.id === e.target.value);
                            setSwapForm({
                              ...swapForm,
                              productId: e.target.value,
                              title: p ? `${p.name} em promoção` : swapForm.title,
                            });
                          }}
                          className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] text-sm focus:outline-none focus:border-orange-500"
                        >
                          <option value="">Selecione...</option>
                          {promoStoreProducts.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Preço promocional (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={swapForm.promotionalPrice}
                          onChange={(e) => setSwapForm({ ...swapForm, promotionalPrice: e.target.value })}
                          placeholder={swapSelectedProduct ? `Original: R$ ${Number(swapSelectedProduct.price).toFixed(2)}` : ""}
                          className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] text-sm focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Título</label>
                        <input
                          type="text"
                          value={swapForm.title}
                          onChange={(e) => setSwapForm({ ...swapForm, title: e.target.value })}
                          className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] text-sm focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    {swapSelectedProduct && (
                      <div className="flex items-center gap-3 bg-[var(--bg-card)] rounded-lg p-2">
                        {swapSelectedProduct.imageUrl ? (
                          <img src={swapSelectedProduct.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">📦</div>
                        )}
                        <span className="text-sm text-[var(--text-primary)] font-medium">{swapSelectedProduct.name}</span>
                        <span className="text-xs text-[var(--text-secondary)]">R$ {Number(swapSelectedProduct.price).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSwap}
                        disabled={swapping || !swapForm.productId || !swapForm.promotionalPrice}
                        className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
                      >
                        {swapping ? "Trocando..." : "Confirmar troca"}
                      </button>
                      <button
                        onClick={() => setSwapId(null)}
                        className="px-4 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl text-sm font-semibold hover:bg-[var(--bg-hover)] transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
