"use client";

import { useQuery, useMutation } from "@apollo/client";
import { useState } from "react";
import CreateStoreModal from "@/components/CreateStoreModal";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem, scaleIn } from "@/lib/motion";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo aos Cupons!",
      description: "Aqui você cria e gerencia cupons de desconto para seus clientes. Vou te mostrar como funciona.",
    },
  },
  {
    element: '[data-tour="create-coupon-btn"]',
    popover: {
      title: "Criar cupom",
      description: "Crie códigos de desconto para compartilhar com seus clientes. Defina valor, validade e limite de uso.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="coupon-list"]',
    popover: {
      title: "✅ Seus cupons",
      description: "Gerencie todos os cupons criados. Ative, desative ou edite qualquer cupom a qualquer momento.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Cupons'.",
      side: "top",
      align: "start",
    },
  },
];
import {
  GET_MY_STORES,
  GET_MY_PLAN,
  GET_STORE_COUPONS,
  CREATE_COUPON,
  TOGGLE_COUPON_ACTIVE,
  DELETE_COUPON,
} from "@/lib/graphql";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minimumOrder: number | null;
  maxDiscount: number | null;
  maxUses: number;
  usesCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function CouponsPage() {
  const { startTour, hasSeenTour } = useTour("coupons", TOUR_STEPS);
  const { data: planData } = useQuery(GET_MY_PLAN);
  const { data: storesData } = useQuery(GET_MY_STORES);
  const stores = storesData?.myStores || [];
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [selectedStore, setSelectedStore] = useState("");
  const storeId = selectedStore || stores[0]?.id || "";

  const { data: couponsData, refetch } = useQuery(GET_STORE_COUPONS, {
    variables: { storeId },
    skip: !storeId,
  });
  const coupons: Coupon[] = couponsData?.storeCoupons || [];

  const [createCoupon, { loading: creating }] = useMutation(CREATE_COUPON, {
    // L6: refetch coupons after creation
    refetchQueries: storeId ? [{ query: GET_STORE_COUPONS, variables: { storeId } }] : [],
  });
  const [toggleActive] = useMutation(TOGGLE_COUPON_ACTIVE);
  const [deleteCoupon] = useMutation(DELETE_COUPON);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT",
    discountValue: "",
    minimumOrder: "",
    maxDiscount: "",
    maxUses: "",
    expiresAt: "",
  });
  const [error, setError] = useState("");

  const plan = planData?.meVendor?.vendorPlan || "FREE";
  const canUseCoupons = plan !== "FREE";

  if (!canUseCoupons) {
    return (
      <div>
        <PageHeader title="Cupons de Desconto" />
        <EmptyState
          icon={Ticket}
          title="Cupons de Desconto"
          description="Os cupons estão disponíveis a partir do plano Pro. Faça upgrade para criar cupons de desconto para seus clientes."
          action={{
            label: "Ver planos",
            onClick: () => { window.location.href = "/dashboard/plan"; },
          }}
        />
      </div>
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const discountVal = parseFloat(form.discountValue);
    if (form.discountType === "PERCENT" && (discountVal <= 0 || discountVal > 100)) {
      setError("Desconto percentual deve ser entre 1% e 100%.");
      return;
    }
    if (discountVal <= 0) {
      setError("Valor do desconto deve ser maior que zero.");
      return;
    }
    try {
      await createCoupon({
        variables: {
          input: {
            code: form.code,
            discountType: form.discountType,
            discountValue: discountVal,
            minimumOrder: form.minimumOrder ? parseFloat(form.minimumOrder) : null,
            maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
            maxUses: form.maxUses ? parseInt(form.maxUses) : 0,
            expiresAt: form.expiresAt || null,
            storeId,
          },
        },
      });
      setForm({ code: "", discountType: "PERCENT", discountValue: "", minimumOrder: "", maxDiscount: "", maxUses: "", expiresAt: "" });
      setShowForm(false);
      refetch();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleActive({ variables: { id } });
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao alterar cupom.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;
    try {
      await deleteCoupon({ variables: { id } });
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir cupom.");
    }
  }

  if (!storesData) {
    return <SkeletonGrid count={3} />;
  }

  if (stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => window.location.reload()} />
        <div className="text-center mt-20">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja cadastrada</h2>
          <p className="text-[var(--text-secondary)] mb-6">Crie sua primeira loja para começar a criar cupons</p>
          <button onClick={() => setShowCreateStore(true)} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 transition">
            Criar loja
          </button>
        </div>
      </>
    );
  }

  return (
    <motion.div {...fadeIn} className="max-w-5xl mx-auto">
      <PageHeader
        title="Cupons de Desconto"
        onTourStart={startTour}
        tourNotSeen={!hasSeenTour}
        actions={
          <div className="flex items-center gap-3">
            {stores.length > 1 && (
              <select
                value={storeId}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-[var(--bg-input)] text-[var(--text-primary)]"
              >
                {stores.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <button
              data-tour="create-coupon-btn"
              onClick={() => setShowForm(!showForm)}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium transition cursor-pointer active:scale-95"
            >
              {showForm ? "Cancelar" : "+ Novo Cupom"}
            </button>
          </div>
        }
      />

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm mb-6 space-y-4 pb-20">
          <h2 className="font-semibold text-lg text-[var(--text-primary)]">Criar Cupom</h2>

          {error && <p className="text-[var(--status-error-text)] text-sm bg-[var(--status-error-bg)] p-3 rounded-xl">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Codigo do Cupom</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Ex: DESCONTO10"
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Tipo de Desconto</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
              >
                <option value="PERCENT">Percentual (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                Valor do Desconto {form.discountType === "PERCENT" ? "(%)" : "(R$)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === "PERCENT" ? "Ex: 10" : "Ex: 5.00"}
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Pedido Minimo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minimumOrder}
                onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })}
                placeholder="Opcional"
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
              />
            </div>

            {form.discountType === "PERCENT" && (
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Desconto Maximo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  placeholder="Opcional - teto do desconto"
                  className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Limite de Usos</label>
              <input
                type="number"
                min="0"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="0 = ilimitado"
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Expira em</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {creating ? "Criando..." : "Criar Cupom"}
          </button>
        </form>
      )}

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Nenhum cupom criado ainda"
          description="Crie cupons para atrair mais clientes!"
        />
      ) : (
        <motion.div data-tour="coupon-list" variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4">
          {coupons.map((c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const maxedOut = c.maxUses > 0 && c.usesCount >= c.maxUses;
            return (
              <motion.div
                key={c.id}
                variants={staggerItem}
                className={`bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm border-l-4 ${
                  !c.isActive || expired || maxedOut
                    ? "border-[var(--border-color)] opacity-70"
                    : "border-orange-400"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-lg font-bold bg-[var(--bg-muted)] px-3 py-1 rounded-lg">
                        {c.code}
                      </span>
                      {c.isActive && !expired && !maxedOut && (
                        <span className="text-xs bg-[var(--status-success-bg)] text-[var(--status-success-text)] px-2 py-0.5 rounded-full font-medium">Ativo</span>
                      )}
                      {!c.isActive && (
                        <span className="text-xs bg-[var(--bg-muted)] text-[var(--text-muted)] px-2 py-0.5 rounded-full font-medium">Desativado</span>
                      )}
                      {expired && (
                        <span className="text-xs bg-[var(--status-error-bg)] text-[var(--status-error-text)] px-2 py-0.5 rounded-full font-medium">Expirado</span>
                      )}
                      {maxedOut && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Esgotado</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] flex-wrap">
                      <span>
                        {c.discountType === "PERCENT"
                          ? `${c.discountValue}% de desconto`
                          : `R$ ${Number(c.discountValue).toFixed(2)} de desconto`}
                      </span>
                      {c.minimumOrder && (
                        <span>Min: R$ {Number(c.minimumOrder).toFixed(2)}</span>
                      )}
                      {c.maxDiscount && c.discountType === "PERCENT" && (
                        <span>Max: R$ {Number(c.maxDiscount).toFixed(2)}</span>
                      )}
                      <span>
                        {c.maxUses > 0
                          ? `${c.usesCount}/${c.maxUses} usos`
                          : `${c.usesCount} usos`}
                      </span>
                      {c.expiresAt && (
                        <span>Expira: {new Date(c.expiresAt).toLocaleDateString("pt-BR")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer active:scale-95 ${
                        c.isActive
                          ? "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          : "bg-[var(--status-success-bg)] text-[var(--status-success-text)] hover:bg-[var(--status-success-bg)]"
                      }`}
                    >
                      {c.isActive ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--status-error-bg)] text-[var(--status-error-text)] hover:bg-[var(--status-error-bg)] transition cursor-pointer active:scale-95"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
