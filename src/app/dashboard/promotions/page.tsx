"use client";

import { useQuery, useMutation } from "@apollo/client";
import CreateStoreModal from "@/components/CreateStoreModal";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Megaphone, Package, RefreshCw, Trash2, X } from "lucide-react";
import {
  GET_MY_STORES,
  GET_MY_PLAN,
  MY_PROMOTIONS,
  CREATE_PROMOTION,
  DELETE_PROMOTION,
  GET_PROMO_PRICE_PER_DAY,
  SWAP_PROMOTION_PRODUCT,
} from "@/lib/graphql";
import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem, scaleIn } from "@/lib/motion";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo às Promoções!",
      description: "Aqui você cria promoções para atrair mais clientes para suas lojas. Vou te mostrar como funciona.",
    },
  },
  {
    element: '[data-tour="create-promo-btn"]',
    popover: {
      title: "Criar promoção",
      description: "Crie promoções por tempo limitado para atrair mais clientes. Defina desconto, validade e produtos incluídos.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="promo-list"]',
    popover: {
      title: "✅ Promoções ativas",
      description: "Veja todas as suas promoções. Promoções ativas aparecem no app para os clientes da sua região.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Promoções'.",
      side: "top",
      align: "start",
    },
  },
];

export default function PromotionsPage() {
  const { startTour, hasSeenTour } = useTour("promotions", TOUR_STEPS);
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
  const submittingRef = useRef(false); // M8: double-click prevention guard

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

  // L2: endDate for display only — actual dates computed at submission time
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
    // M8: double-click prevention
    if (submittingRef.current) return;

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

    submittingRef.current = true; // M8: lock
    try {
      // L2: Compute startDate and endDate at submission time to avoid stale values
      const freshStartDate = new Date().toISOString();
      const freshEnd = new Date();
      freshEnd.setDate(freshEnd.getDate() + totalDays);
      const freshEndDate = freshEnd.toISOString();

      const { data } = await createPromotion({
        variables: {
          input: {
            title: form.title,
            description: form.description || null,
            storeId: form.storeId,
            productId: form.productId,
            promotionalPrice: parseFloat(form.promotionalPrice),
            startDate: freshStartDate,
            endDate: freshEndDate,
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
    } finally {
      submittingRef.current = false; // M8: unlock
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
    const promo = promotions.find((p: any) => p.id === swapId);
    const promoStore = stores.find((s: any) => s.id === promo?.store?.id);
    const product = promoStore?.products?.find((p: any) => p.id === swapForm.productId);
    if (product && parseFloat(swapForm.promotionalPrice) >= Number(product.price)) {
      setError("O preço promocional deve ser menor que o preço original do produto.");
      return;
    }
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

  function getStatus(promo: any): { label: string; variant: "success" | "warning" | "error" | "info" | "neutral" } {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    if (!promo.isPaid) return { label: "Aguardando pagamento", variant: "warning" };
    if (!promo.isActive) return { label: "Desativada", variant: "error" };
    if (now < start) return { label: "Agendada", variant: "info" };
    if (now > end) return { label: "Expirada", variant: "error" };
    return { label: "Ativa", variant: "success" };
  }

  if (loading) return <SkeletonGrid count={3} />;

  if (!canPromote) {
    return (
      <div>
        <PageHeader title="Promoções" />
        <EmptyState
          icon={Megaphone}
          title="Promoções"
          description="As promoções estão disponíveis a partir do plano Pro. Faça upgrade para criar promoções e destacar sua loja no app."
          action={{
            label: "Ver planos",
            onClick: () => { window.location.href = "/dashboard/plan"; },
          }}
        />
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
            className="w-8 h-8 rounded-lg bg-[var(--brand-primary-muted)] text-[var(--brand-primary)] font-bold text-lg flex items-center justify-center hover:bg-[var(--brand-primary-muted)] transition cursor-pointer"
          >
            +
          </button>
        </div>
        {disc && <span className="text-[10px] text-green-600 font-semibold mt-1">{disc}</span>}
      </div>
    );
  }

  if (!storesData) {
    return <SkeletonGrid count={3} />;
  }

  if (!stores || stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => window.location.reload()} />
        <div className="text-center mt-20">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja cadastrada</h2>
          <p className="text-[var(--text-secondary)] mb-6">Crie sua primeira loja para começar a criar promoções</p>
          <button onClick={() => setShowCreateStore(true)} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 transition">
            Criar loja
          </button>
        </div>
      </>
    );
  }

  return (
    <motion.div {...fadeIn}>
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          {success}
        </div>
      )}
      <PageHeader
        title="Promoções"
        onTourStart={startTour}
        tourNotSeen={!hasSeenTour}
        actions={
          <button
            data-tour="create-promo-btn"
            onClick={() => setShowForm(!showForm)}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium transition cursor-pointer"
          >
            {showForm ? "Cancelar" : "+ Nova Promoção"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Loja</label>
              <select
                required
                value={form.storeId}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
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
                className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)] disabled:opacity-50"
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
                <div className="w-16 h-16 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center"><Package className="w-6 h-6 text-[var(--text-muted)]" /></div>
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
                className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
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
                className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Descrição (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes da promoção..."
              className="w-full border border-[var(--border-color)] rounded-xl px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
              rows={2}
            />
          </div>

          {/* Duration counter */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Período de exibição no app</label>
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
                      <p className="text-2xl font-bold text-[var(--brand-primary)]">R$ {finalCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-[var(--status-error-text)] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={creating || totalDays <= 0}
            className="w-full py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl font-medium transition cursor-pointer disabled:opacity-50"
          >
            {creating ? "Criando..." : totalDays > 0 && finalCost === 0 ? "Criar Promocao Gratis" : `Criar Promocao${totalDays > 0 ? ` • R$ ${finalCost.toFixed(2)}` : ""}`}
          </button>
        </form>
      )}

      {promotions.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma promoção criada"
          description="Crie uma promoção para destacar seus produtos no app"
          action={{ label: "+ Nova Promoção", onClick: () => setShowForm(true) }}
        />
      ) : (
        <motion.div data-tour="promo-list" variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
          {promotions.map((promo: any) => {
            const status = getStatus(promo);
            const imgUrl = promo.product?.imageUrl || promo.imageUrl;
            const isSwapping = swapId === promo.id;
            const promoStoreProducts = stores.find((s: any) => s.id === promo.store?.id)?.products || [];
            const swapSelectedProduct = promoStoreProducts.find((p: any) => p.id === swapForm.productId);
            const isExpired = new Date(promo.endDate) < new Date();

            return (
              <motion.div key={promo.id} variants={staggerItem} className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] overflow-hidden hover:shadow-[var(--card-shadow-hover)] transition-shadow">
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {imgUrl ? (
                    <img src={imgUrl} alt={promo.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-8 h-8 text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[var(--text-primary)] truncate">{promo.title}</h3>
                      <StatusBadge variant={status.variant} dot>{status.label}</StatusBadge>
                    </div>
                    {promo.product && (
                      <p className="text-sm text-[var(--text-secondary)]">
                        {promo.product.name}: <span className="line-through">R$ {Number(promo.product.price).toFixed(2)}</span>{" "}
                        <span className="text-[var(--brand-primary)] font-semibold">R$ {Number(promo.promotionalPrice).toFixed(2)}</span>
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
                        className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] cursor-pointer p-2 transition text-sm font-semibold inline-flex items-center gap-1"
                        title="Trocar produto"
                      >
                        {isSwapping ? <X className="w-4 h-4" /> : <><RefreshCw className="w-4 h-4" /> Trocar</>}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-[var(--status-error-text)]/60 hover:text-[var(--status-error-text)] cursor-pointer p-2 transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isSwapping && (
                  <div className="border-t border-[var(--border-light)] bg-[var(--brand-primary-light)] p-4 space-y-3">
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
                          className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
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
                          className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Título</label>
                        <input
                          type="text"
                          value={swapForm.title}
                          onChange={(e) => setSwapForm({ ...swapForm, title: e.target.value })}
                          className="w-full border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] bg-[var(--bg-input)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>
                    </div>
                    {swapSelectedProduct && (
                      <div className="flex items-center gap-3 bg-[var(--bg-card)] rounded-lg p-2">
                        {swapSelectedProduct.imageUrl ? (
                          <img src={swapSelectedProduct.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center"><Package className="w-5 h-5 text-[var(--text-muted)]" /></div>
                        )}
                        <span className="text-sm text-[var(--text-primary)] font-medium">{swapSelectedProduct.name}</span>
                        <span className="text-xs text-[var(--text-secondary)]">R$ {Number(swapSelectedProduct.price).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSwap}
                        disabled={swapping || !swapForm.productId || !swapForm.promotionalPrice}
                        className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium text-sm transition cursor-pointer disabled:opacity-50"
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
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
