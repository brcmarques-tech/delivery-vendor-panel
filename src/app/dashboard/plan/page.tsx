"use client";

import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_PLAN,
  GET_MY_STORES,
  GET_AVAILABLE_PLANS,
  GET_BADGE_CONFIG,
  CREATE_PLAN_UPGRADE,
  ACCEPT_SUBSCRIPTION_TERMS,
} from "@/lib/graphql";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import TermsModal from "@/components/TermsModal";
import SubscriptionManager from "@/components/SubscriptionManager";
import CardForm from "@/components/CardForm";
import { CreditCard, QrCode, ChevronLeft, ChevronRight, Check, X, Award, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";

const planLabels: Record<string, string> = {
  FREE: "Gratuito",
  PRO: "Pro",
  PREMIUM: "Premium",
  ENTERPRISE: "Enterprise",
  CUSTOM: "Personalizado",
};

const priorityLabels: Record<number, string> = {
  0: "Sem destaque",
  1: "Destaque normal",
  2: "Destaque alto",
  3: "Destaque premium",
};

const supportLabels: Record<string, string> = {
  normal: "Suporte normal",
  priority: "Suporte prioritario",
  dedicated: "Suporte dedicado",
};

const billingOptions = [
  { key: "monthly", label: "Mensal", shortLabel: "1 mes", discount: 0 },
  { key: "quarterly", label: "Trimestral", shortLabel: "3 meses", discount: 10 },
  { key: "semiannual", label: "Semestral", shortLabel: "6 meses", discount: 20 },
  { key: "annual", label: "Anual", shortLabel: "12 meses", discount: 30 },
];

const billingDiscount: Record<string, number> = {
  monthly: 0,
  quarterly: 10,
  semiannual: 20,
  annual: 30,
};

function getPrice(plan: any, billing: string): number {
  switch (billing) {
    case "quarterly": return Number(plan.quarterlyPrice);
    case "semiannual": return Number(plan.semiannualPrice);
    case "annual": return Number(plan.annualPrice);
    default: return Number(plan.monthlyPrice);
  }
}

function getBillingLabel(billing: string): string {
  switch (billing) {
    case "quarterly": return "/trimestre";
    case "semiannual": return "/semestre";
    case "annual": return "/ano";
    default: return "/mes";
  }
}

export default function PlanPage() {
  return (
    <Suspense fallback={<SkeletonGrid count={4} />}>
      <PlanContent />
    </Suspense>
  );
}

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo ao Meu Plano!",
      description: "Aqui você vê seu plano atual e pode fazer upgrade para desbloquear mais recursos.",
    },
  },
  {
    element: '[data-tour="current-plan"]',
    popover: {
      title: "Seu plano atual",
      description: "Aqui está seu plano com todos os benefícios incluídos: lojas, produtos, promoções e suporte.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="available-plans"]',
    popover: {
      title: "✅ Comparar planos",
      description: "Escolha o plano ideal para o seu negócio. Faça upgrade a qualquer momento sem perder seus dados.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Meu Plano'.",
      side: "top",
      align: "start",
    },
  },
];

function PlanContent() {
  const { startTour, hasSeenTour } = useTour("plan", TOUR_STEPS);
  const { data: userData, loading: loadingUser, refetch: refetchPlan } = useQuery(GET_MY_PLAN, {
    fetchPolicy: "network-only", // M2: always fetch fresh plan data
  });
  const { data: plansData, loading: loadingPlans } = useQuery(GET_AVAILABLE_PLANS);
  const { data: storesData } = useQuery(GET_MY_STORES);
  const { data: badgeData } = useQuery(GET_BADGE_CONFIG);
  const [createUpgrade] = useMutation(CREATE_PLAN_UPGRADE, {
    refetchQueries: [{ query: GET_MY_PLAN }], // M2: refetch plan after upgrade mutation
  });
  const [acceptSubTerms, { loading: acceptingSub }] = useMutation(ACCEPT_SUBSCRIPTION_TERMS);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billing, setBilling] = useState("monthly");
  const [showSubTerms, setShowSubTerms] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [planError, setPlanError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false); // H1: double-click prevention guard
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentStatus = searchParams.get("status");

  // M1: confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{ plan: string; price: number; billingLabel: string } | null>(null);

  // H4: Track plan at mount to verify payment status
  const [planAtMount, setPlanAtMount] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  // Show card form inside confirm modal
  const [showCardInModal, setShowCardInModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');

  // H4: When status=success, refetch plan and verify it actually changed
  useEffect(() => {
    if (paymentStatus === "success") {
      const currentPlanAtMount = userData?.meVendor?.vendorPlan || "FREE";
      if (!planAtMount) {
        setPlanAtMount(currentPlanAtMount);
      }
      refetchPlan().then(({ data }) => {
        const newPlan = data?.meVendor?.vendorPlan || "FREE";
        // Only show success if plan actually changed or is not FREE
        if (newPlan !== "FREE" && newPlan !== planAtMount) {
          setPaymentVerified(true);
        } else if (planAtMount && newPlan === planAtMount) {
          // Plan didn't change — payment may not have been processed yet or URL was spoofed
          setPaymentVerified(false);
        } else {
          setPaymentVerified(true);
        }
      });
    }
  }, [paymentStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear URL params after 10 seconds to prevent stale banners
  useEffect(() => {
    if (paymentStatus) {
      const timer = setTimeout(() => {
        router.replace("/dashboard/plan", { scroll: false });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, router]);

  if (loadingUser || loadingPlans) {
    return <SkeletonGrid count={4} />;
  }

  const user = userData?.meVendor;
  const plans = plansData?.availablePlans || [];
  const currentPlan = user?.vendorPlan || "FREE";
  const storeCount = user?.stores?.length || 0;

  // L5: Calculate badge subscription discount with try/catch for JSON.parse
  let badgeDiscount = 0;
  let badgeLevel = "";
  const stores = storesData?.myStores || [];
  let badgeConfig: any = null;
  try {
    badgeConfig = badgeData?.badgeConfig ? JSON.parse(badgeData.badgeConfig) : null;
  } catch {
    // L5: Malformed badgeConfig JSON — ignore gracefully
    badgeConfig = null;
  }
  if (badgeConfig) {
    for (const store of stores) {
      if (store.badgeClaimCount >= 2 && store.verificationLevel && store.verificationLevel !== "NONE") {
        const rewards = badgeConfig.rewards?.[store.verificationLevel];
        if (rewards?.subscriptionDiscount > badgeDiscount) {
          badgeDiscount = rewards.subscriptionDiscount;
          badgeLevel = store.verificationLevel;
        }
      }
    }
  }

  const hasAcceptedSubTerms = !!user?.acceptedSubscriptionTermsAt;

  function handleUpgrade(plan: string) {
    // H1: double-click prevention
    if (processingRef.current) return;

    if (!hasAcceptedSubTerms) {
      setPendingPlan(plan);
      setShowSubTerms(true);
      return;
    }

    // M1: Show confirmation modal instead of proceeding directly
    const planData = plans.find((p: any) => p.plan === plan);
    const price = planData ? getPrice(planData, billing) : 0;
    const billingLabel = billingOptions.find((b) => b.key === billing)?.label || "Mensal";
    setConfirmModal({ plan, price, billingLabel });
  }

  async function handleAcceptSubTerms() {
    try {
      await acceptSubTerms();
      setShowSubTerms(false);
      if (pendingPlan) {
        // M1: Show confirmation modal after accepting terms
        const planData = plans.find((p: any) => p.plan === pendingPlan);
        const price = planData ? getPrice(planData, billing) : 0;
        const billingLabel = billingOptions.find((b) => b.key === billing)?.label || "Mensal";
        setConfirmModal({ plan: pendingPlan, price, billingLabel });
        setPendingPlan(null);
      }
    } catch (err: any) {
      setPlanError(err.message || "Erro ao aceitar termos.");
    }
  }

  async function proceedUpgrade(plan: string, cardToken?: string) {
    // H1: double-click prevention
    if (processingRef.current) return;
    processingRef.current = true;

    setUpgrading(plan);
    setPlanError("");
    try {
      await createUpgrade({
        variables: { plan, billingPeriod: billing, cardToken: cardToken || null, paymentMethod },
      });
      setConfirmModal(null);
      setShowCardInModal(false);
      refetchPlan();
      setPlanError("");
      // Show success inline
      setPaymentVerified(true);
      router.replace("/dashboard/plan?status=success", { scroll: false });
    } catch (err: any) {
      setPlanError(err.message || "Erro ao criar assinatura.");
      setUpgrading(null);
    } finally {
      processingRef.current = false; // H1: reset guard
    }
  }

  // Separate positive and negative features for ordering
  function getFeatures(plan: any) {
    const positives: { label: string }[] = [];
    const negatives: { label: string }[] = [];

    // Max stores - always positive
    const storeLabel = `Ate ${plan.maxStores} loja(s)` +
      (storeCount > 0 && plan.plan === currentPlan ? ` (${storeCount} usada(s))` : "");
    positives.push({ label: storeLabel });

    // Commission
    if (Number(plan.commissionPercent) === 0) {
      positives.push({ label: "Sem comissao" });
    } else {
      negatives.push({ label: `${Number(plan.commissionPercent)}% de comissao` });
    }

    // Free promos per week
    if (plan.freePromosPerWeek > 0) {
      positives.push({ label: `${plan.freePromosPerWeek} promocoes gratis/semana` });
    } else {
      negatives.push({ label: "Sem promocoes gratis" });
    }

    // Max products per store
    if (plan.maxProductsPerStore === 0) {
      positives.push({ label: "Produtos ilimitados" });
    } else {
      positives.push({ label: `Ate ${plan.maxProductsPerStore} produtos/loja` });
    }

    // Max emails per month
    if (plan.maxEmailsPerMonth === 0) {
      positives.push({ label: "Emails ilimitados" });
    } else if (plan.maxEmailsPerMonth > 0) {
      positives.push({ label: `${plan.maxEmailsPerMonth} emails/mes` });
    } else {
      negatives.push({ label: "Sem emails" });
    }

    // Highlight days
    if (plan.highlightDaysPerMonth >= 30) {
      positives.push({ label: `${priorityLabels[plan.listingPriority] ?? "Destaque"} o mes todo` });
    } else if (plan.highlightDaysPerMonth > 0) {
      positives.push({ label: `${priorityLabels[plan.listingPriority] ?? "Destaque"} ${plan.highlightDaysPerMonth} dias/mes` });
    } else {
      negatives.push({ label: "Sem destaque" });
    }

    // Support level
    positives.push({ label: supportLabels[plan.supportLevel] ?? "Suporte normal" });

    // Coupons
    if (plan.canUseCoupons) {
      positives.push({ label: "Cupons de desconto" });
    } else {
      negatives.push({ label: "Sem cupons de desconto" });
    }

    // Analytics
    if (plan.hasAnalytics) {
      positives.push({ label: "Analytics" });
    } else {
      negatives.push({ label: "Sem analytics" });
    }

    return { positives, negatives };
  }

  return (
    <motion.div {...fadeIn}>
      {showSubTerms && (
        <TermsModal
          type="subscription"
          onAccept={handleAcceptSubTerms}
          loading={acceptingSub}
          userName={userData?.meVendor?.name}
          userCpf={userData?.meVendor?.cpf}
        />
      )}

      {/* M1: Confirmation modal with card form */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              {showCardInModal ? "Dados do Cartao" : "Confirmar Assinatura"}
            </h3>

            {!showCardInModal ? (
              <>
                <div className="space-y-2 mb-4">
                  <p className="text-[var(--text-secondary)]">
                    Plano: <span className="font-semibold text-[var(--brand-primary)]">{planLabels[confirmModal.plan]}</span>
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    Periodo: <span className="font-semibold">{confirmModal.billingLabel}</span>
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    Preco base: <span className="font-semibold">R$ {confirmModal.price.toFixed(2)}</span>
                  </p>
                  {badgeDiscount > 0 && (
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      O desconto de {badgeDiscount}% do selo sera aplicado automaticamente (sujeito a confirmacao).
                    </p>
                  )}
                </div>

                {/* Payment method selector */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Forma de pagamento:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                        paymentMethod === 'credit_card'
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)]'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      Cartao
                    </button>
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                        paymentMethod === 'pix'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-600'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-teal-300'
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                      PIX
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {paymentMethod === 'credit_card'
                    ? 'A cobranca sera recorrente no cartao de credito. Voce pode cancelar a qualquer momento.'
                    : 'A cada ciclo, um novo QR Code PIX sera gerado para pagamento. Voce pode cancelar a qualquer momento.'
                  }
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (paymentMethod === 'pix') {
                        proceedUpgrade(confirmModal.plan);
                      } else {
                        setShowCardInModal(true);
                      }
                    }}
                    disabled={upgrading !== null}
                    className="flex-1 py-3 bg-[var(--brand-primary)] text-white rounded-xl font-semibold hover:bg-[var(--brand-primary-hover)] transition cursor-pointer disabled:opacity-50"
                  >
                    {upgrading ? "Processando..." : "Continuar"}
                  </button>
                  <button
                    onClick={() => { setConfirmModal(null); setShowCardInModal(false); }}
                    className="px-4 py-3 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl font-semibold hover:bg-[var(--bg-hover)] transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 rounded-lg bg-[var(--bg-muted)]">
                  <p className="text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--brand-primary)]">{planLabels[confirmModal.plan]}</span>
                    {" — "}{confirmModal.billingLabel}{" — "}
                    R$ {confirmModal.price.toFixed(2)}
                  </p>
                </div>
                <CardForm
                  onTokenGenerated={(token) => proceedUpgrade(confirmModal.plan, token)}
                  onCancel={() => { setConfirmModal(null); setShowCardInModal(false); }}
                  loading={upgrading !== null}
                  submitLabel={upgrading ? "Processando..." : "Assinar Agora"}
                />
              </>
            )}
          </div>
        </div>
      )}

      <PageHeader title="Meu Plano" onTourStart={startTour} tourNotSeen={!hasSeenTour} />

      {planError && (
        <div className="bg-[var(--status-error-bg)] border border-[var(--status-error-text)]/20 text-[var(--status-error-text)] px-4 py-3 rounded-xl text-sm mb-4">
          {planError}
        </div>
      )}

      {badgeDiscount > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Award className="w-7 h-7 text-purple-500" />
          <div>
            <p className="text-purple-800 dark:text-purple-300 font-semibold">
              Desconto de {badgeDiscount}% na assinatura (Selo {badgeLevel})
            </p>
            <p className="text-purple-600 dark:text-purple-400 text-sm">
              {/* H2: Clarify that badge discount is applied by the backend at checkout */}
              O desconto do selo sera aplicado automaticamente no checkout (preco base exibido abaixo).
            </p>
          </div>
        </div>
      )}

      {/* H4: Only show success banner if payment was verified */}
      {paymentStatus === "success" && paymentVerified && (
        <div className="bg-[var(--status-success-bg)] border border-[var(--status-success-text)]/20 rounded-2xl p-4 mb-6">
          <p className="text-green-800 font-semibold">
            Pagamento aprovado! Seu plano foi atualizado com sucesso.
          </p>
        </div>
      )}
      {paymentStatus === "success" && !paymentVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <p className="text-yellow-800 font-semibold">
            Pagamento pendente de confirmacao. Aguarde a verificacao do seu plano.
          </p>
        </div>
      )}
      {paymentStatus === "failure" && (
        <div className="bg-[var(--status-error-bg)] border border-[var(--status-error-text)]/20 rounded-2xl p-4 mb-6">
          <p className="text-red-800 font-semibold">
            Pagamento recusado. Tente novamente.
          </p>
        </div>
      )}
      {paymentStatus === "pending" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <p className="text-yellow-800 font-semibold">
            Pagamento pendente. Seu plano sera ativado apos a confirmacao.
          </p>
        </div>
      )}

      <p data-tour="current-plan" className="text-[var(--text-secondary)] mb-4">
        Voce esta no plano{" "}
        <span className="font-semibold text-[var(--brand-primary)]">
          {planLabels[currentPlan]}
        </span>
        {user?.planExpiresAt && (
          <span>
            {" "}
            (expira em{" "}
            {new Date(user.planExpiresAt).toLocaleDateString("pt-BR")})
          </span>
        )}
      </p>

      {/* Active subscription management */}
      {currentPlan !== "FREE" && (
        <div className="mb-6">
          <SubscriptionManager />
        </div>
      )}

      {/* Billing period selector */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1.5 inline-flex gap-1 mb-6">
        {billingOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setBilling(opt.key)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              billing === opt.key
                ? "bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/25"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <span className="block">{opt.label}</span>
            {opt.discount > 0 && (
              <span className={`block text-xs mt-0.5 font-bold ${
                billing === opt.key ? "text-orange-200" : "text-green-500"
              }`}>
                {opt.discount}% OFF
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Plan cards carousel */}
      <div data-tour="available-plans" className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-full shadow-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--brand-primary-light)] hover:border-[var(--brand-primary)] transition cursor-pointer hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-full shadow-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--brand-primary-light)] hover:border-[var(--brand-primary)] transition cursor-pointer hidden md:flex"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <motion.div
          ref={scrollRef}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex gap-6 overflow-x-auto scroll-smooth pt-4 pb-4 snap-x snap-mandatory md:px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {plans.map((plan: any) => {
            const isCurrent = plan.plan === currentPlan;
            const isContactSales = plan.isContactSales;
            const price = getPrice(plan, billing);
            const { positives, negatives } = getFeatures(plan);

            return (
              <motion.div
                variants={staggerItem}
                key={plan.plan}
                className={`bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 transition min-w-[280px] w-[280px] shrink-0 snap-center flex flex-col relative ${
                  isCurrent
                    ? "border-2 border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary-muted)]"
                    : plan.plan === "CUSTOM"
                    ? "border-emerald-400 hover:border-emerald-500"
                    : plan.plan === "ENTERPRISE"
                    ? "border-amber-400 hover:border-amber-500"
                    : plan.plan === "PRO"
                    ? "border-blue-400 hover:border-blue-500 ring-2 ring-blue-400/20"
                    : "hover:border-[var(--brand-primary)]"
                }`}
              >
                {/* Badge: mais popular */}
                {plan.plan === "PRO" && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
                    <Flame className="w-3.5 h-3.5" /> MAIS POPULAR
                  </span>
                )}
                {isCurrent && (
                  <span className="bg-[var(--brand-primary)] text-white text-xs font-bold px-3 py-1 rounded-full self-start">
                    PLANO ATUAL
                  </span>
                )}

                <h3 className="text-xl font-bold text-[var(--text-primary)] mt-3">
                  {planLabels[plan.plan]}
                </h3>

                <div className="mt-2">
                  {isContactSales ? (
                    <p className="text-3xl font-bold text-[var(--brand-primary)]">Sob consulta</p>
                  ) : price === 0 ? (
                    <p className="text-3xl font-bold text-[var(--brand-primary)]">Gratis</p>
                  ) : (() => {
                    const discountedPrice = badgeDiscount > 0
                      ? Math.round(price * (1 - badgeDiscount / 100) * 100) / 100
                      : price;
                    return (
                      <>
                        {badgeDiscount > 0 && (
                          <p className="text-sm text-[var(--text-muted)] line-through">
                            R$ {price.toFixed(2)}
                          </p>
                        )}
                        <p className="text-3xl font-bold text-[var(--brand-primary)]">
                          R$ {discountedPrice.toFixed(2)}
                          <span className="text-sm font-normal text-[var(--text-muted)]">
                            {getBillingLabel(billing)}
                          </span>
                        </p>
                        {badgeDiscount > 0 && (
                          <p className="text-xs text-purple-600 font-semibold mt-1 flex items-center gap-1">
                            {/* H2: clarify that the discounted price is subject to backend confirmation */}
                            <Award className="w-3.5 h-3.5 inline" /> -{badgeDiscount}% selo {badgeLevel} (sujeito a confirmacao)
                          </p>
                        )}
                        {billing !== "monthly" && (
                          <p className="text-xs text-[var(--status-success-text)] font-semibold mt-1">
                            Economia de {billingDiscount[billing]}%
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                {isContactSales ? (
                  <p className="mt-6 text-sm text-[var(--text-muted)] flex-1">
                    Entre em contato para montar um plano sob medida para o seu negocio.
                  </p>
                ) : (
                  <ul className="mt-6 space-y-3 flex-1">
                    {/* Positive features first */}
                    {positives.map((f, i) => (
                      <li key={`p-${i}`} className="flex items-center gap-2 text-sm py-1.5">
                        <Check className="w-4 h-4 text-[var(--status-success-text)] shrink-0" />
                        <span className="text-[var(--text-secondary)]">{f.label}</span>
                      </li>
                    ))}
                    {/* Negative features last */}
                    {negatives.map((f, i) => (
                      <li key={`n-${i}`} className="flex items-center gap-2 text-sm py-1.5">
                        <X className="w-4 h-4 text-[var(--status-error-text)] shrink-0" />
                        <span className="text-[var(--text-muted)]">{f.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Action button */}
                {!isCurrent && (
                  isContactSales ? (
                    <a
                      href="https://wa.me/5553984424244?text=Ol%C3%A1%2C%20tenho%20interesse%20no%20plano%20personalizado."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition cursor-pointer block text-center"
                    >
                      Falar conosco
                    </a>
                  ) : price > 0 ? (
                    <button
                      onClick={() => handleUpgrade(plan.plan)}
                      disabled={upgrading !== null}
                      className="mt-6 w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl font-semibold hover:bg-[var(--brand-primary-hover)] transition cursor-pointer disabled:opacity-50"
                    >
                      {upgrading === plan.plan ? "Processando..." : "Fazer Upgrade"}
                    </button>
                  ) : null
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="mt-8 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-[var(--card-shadow)] p-6">
        <h3 className="font-semibold text-[var(--text-primary)]">Como funciona?</h3>
        <ul className="mt-2 text-sm text-[var(--text-secondary)] space-y-1">
          <li>&bull; Escolha o periodo: mensal, trimestral (-10%), semestral (-20%) ou anual (-30%)</li>
          <li>&bull; Pague com cartao de credito (recorrente) ou PIX (QR Code por ciclo)</li>
          <li>&bull; A cobranca e automatica — voce pode cancelar a qualquer momento</li>
          <li>&bull; Ao cancelar, voce mantem o acesso ate o fim do periodo pago</li>
          <li>&bull; Planos superiores permitem mais lojas e funcionalidades</li>
          <li>&bull; Para o plano Personalizado, entre em contato pelo WhatsApp</li>
        </ul>
      </div>
    </motion.div>
  );
}
