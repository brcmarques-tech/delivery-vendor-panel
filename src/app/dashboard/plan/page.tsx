"use client";

import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_PLAN,
  GET_MY_STORES,
  GET_AVAILABLE_PLANS,
  GET_BADGE_CONFIG,
  CREATE_PLAN_UPGRADE,
  ACCEPT_SUBSCRIPTION_TERMS,
  MY_SUBSCRIPTION,
} from "@/lib/graphql";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import TermsModal from "@/components/TermsModal";
import SubscriptionManager from "@/components/SubscriptionManager";
import CardForm from "@/components/CardForm";
import { CreditCard, QrCode, ChevronLeft, ChevronRight, Check, X, Award, Flame, Copy } from "lucide-react";
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
  const { data: subData } = useQuery(MY_SUBSCRIPTION);
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
  // Concessão do plano agora é assíncrona (só no webhook invoice.paid). No cartão
  // o webhook chega em segundos; enquanto isso ficamos "confirmando" em vez de
  // cravar sucesso/pendência na hora.
  const [confirming, setConfirming] = useState(false);

  // Show card form inside confirm modal
  const [showCardInModal, setShowCardInModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');

  // Modal do QR Code PIX (plano avulso por ciclo)
  const [pixModal, setPixModal] = useState<{ qrCode: string; qrCodeUrl: string; plan: string } | null>(null);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const pixPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Faz polling do plano enquanto o modal PIX está aberto. Detecta o pagamento
  // por (a) o plano mudar para um pago (nova assinatura) OU (b) a expiração
  // avançar (renovação do mesmo plano — o plano não muda, mas planExpiresAt sim).
  function startPixPolling(baselinePlan: string, baselineExpiry?: string | null) {
    const baseMs = baselineExpiry ? new Date(baselineExpiry).getTime() : 0;
    let attempts = 0;
    const poll = async () => {
      attempts++;
      const { data } = await refetchPlan();
      const newPlan = data?.meVendor?.vendorPlan || "FREE";
      const newExpMs = data?.meVendor?.planExpiresAt ? new Date(data.meVendor.planExpiresAt).getTime() : 0;
      const upgraded = newPlan !== "FREE" && newPlan !== baselinePlan;
      const renewed = newPlan !== "FREE" && newExpMs > baseMs + 1000;
      if (upgraded || renewed) {
        setPixPaid(true);
        setPaymentVerified(true);
        return; // pago — para o polling
      }
      if (attempts >= 150) return; // ~12min de janela
      pixPollRef.current = setTimeout(poll, 5000);
    };
    poll();
  }

  function closePixModal() {
    if (pixPollRef.current) clearTimeout(pixPollRef.current);
    setPixModal(null);
    setPixPaid(false);
    refetchPlan();
  }

  function copyPix() {
    if (pixModal?.qrCode) {
      navigator.clipboard?.writeText(pixModal.qrCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  }

  // H4: When status=success, poll the plan until the invoice.paid webhook grants
  // it (cartão: segundos). Só marca sucesso quando o vendorPlan realmente muda
  // para um plano pago — isso também barra um ?status=success forjado na URL,
  // que nunca concede plano de verdade.
  useEffect(() => {
    if (paymentStatus !== "success") return;
    // Baseline = plano no momento em que a confirmação começou.
    const baseline = planAtMount ?? (userData?.meVendor?.vendorPlan || "FREE");
    if (planAtMount == null) setPlanAtMount(baseline);

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 8; // ~24s cobre a chegada do webhook do cartão
    setConfirming(true);
    setPaymentVerified(false);

    const poll = async () => {
      attempts++;
      const { data } = await refetchPlan();
      if (cancelled) return;
      const newPlan = data?.meVendor?.vendorPlan || "FREE";
      if (newPlan !== "FREE" && newPlan !== baseline) {
        setPaymentVerified(true);
        setConfirming(false);
        return;
      }
      if (attempts >= MAX_ATTEMPTS) {
        // Ainda não confirmou (PIX aguardando pagamento, ou webhook atrasado).
        // Não é falha — fica pendente e o plano ativa assim que o pagamento cair.
        setConfirming(false);
        return;
      }
      setTimeout(poll, 3000);
    };
    poll();
    return () => { cancelled = true; };
  }, [paymentStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpa os params da URL, mas só depois de confirmar (senão o banner sumia no
  // meio da confirmação). Enquanto "confirming", mantém a URL.
  useEffect(() => {
    if (paymentStatus && !confirming) {
      const timer = setTimeout(() => {
        router.replace("/dashboard/plan", { scroll: false });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, confirming, router]);

  if (loadingUser || loadingPlans) {
    return <SkeletonGrid count={4} />;
  }

  const user = userData?.meVendor;
  const plans = plansData?.availablePlans || [];
  const currentPlan = user?.vendorPlan || "FREE";
  const storeCount = user?.stores?.length || 0;

  // Plano MANUAL (PIX): tem plano pago mas NÃO tem assinatura recorrente ativa no
  // Pagar.me (cartão renova sozinho; PIX não). Nesse caso avisamos perto do fim.
  const hasActiveSubscription = subData?.mySubscription?.status === "active";
  const isManualPlan = currentPlan !== "FREE" && !hasActiveSubscription;
  const expiresAtDate = user?.planExpiresAt ? new Date(user.planExpiresAt) : null;
  const daysToExpiry = expiresAtDate
    ? Math.ceil((expiresAtDate.getTime() - Date.now()) / 86400000)
    : null;
  const showRenewWarning = isManualPlan && daysToExpiry !== null && daysToExpiry <= 5;

  // Gera um novo PIX para RENOVAR o plano atual (mesmo plano, por PIX).
  async function renewPix() {
    if (processingRef.current) return;
    processingRef.current = true;
    setPlanError("");
    try {
      const res = await createUpgrade({
        variables: { plan: currentPlan, billingPeriod: billing, cardToken: null, paymentMethod: "pix" },
      });
      const payment = res?.data?.createPlanUpgrade;
      if (payment?.qrCode) {
        setPixModal({ qrCode: payment.qrCode, qrCodeUrl: payment.qrCodeUrl || "", plan: currentPlan });
        startPixPolling(currentPlan, user?.planExpiresAt);
      } else {
        setPlanError("Nao foi possivel gerar o PIX. Tente novamente.");
      }
    } catch (err: any) {
      setPlanError(err.message || "Erro ao gerar PIX de renovacao.");
    } finally {
      processingRef.current = false;
    }
  }

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
      const res = await createUpgrade({
        variables: { plan, billingPeriod: billing, cardToken: cardToken || null, paymentMethod },
      });
      const payment = res?.data?.createPlanUpgrade;
      setConfirmModal(null);
      setShowCardInModal(false);
      setPlanError("");
      const baseline = user?.vendorPlan || "FREE";
      setPlanAtMount(baseline);

      if (paymentMethod === "pix" && payment?.qrCode) {
        // PIX: mostra o QR Code para o lojista pagar; faz polling até o webhook
        // do pagamento conceder o plano. A concessão é assíncrona.
        setPixModal({ qrCode: payment.qrCode, qrCodeUrl: payment.qrCodeUrl || "", plan });
        startPixPolling(baseline, user?.planExpiresAt);
      } else {
        // Cartão: concessão assíncrona (webhook). O efeito de ?status=success
        // faz polling até o plano mudar.
        router.replace("/dashboard/plan?status=success", { scroll: false });
      }
    } catch (err: any) {
      setPlanError(err.message || "Erro ao criar assinatura.");
    } finally {
      // Antes o reset de `upgrading` só rodava no catch: após um upgrade com
      // sucesso os botões ficavam presos em "Processando..." (disabled) até dar
      // reload. No finally, limpa nos dois caminhos.
      setUpgrading(null);
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

                {/* Forma de pagamento. Cartão = assinatura recorrente (Pagar.me
                    cobra sozinho). PIX = cobrança avulsa por ciclo (o Pagar.me NÃO
                    faz PIX recorrente), então a cada período o lojista paga um QR
                    novo — o painel avisa perto do vencimento (ver banner acima). */}
                <div className="mb-3">
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
                    ? 'Cobranca recorrente no cartao. Voce pode cancelar a qualquer momento.'
                    : 'Voce paga um QR Code PIX a cada ciclo. Avisamos quando estiver perto de vencer para gerar o proximo.'}
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

      {/* Modal do QR Code PIX — plano avulso por ciclo */}
      {pixModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto">
            {pixPaid ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-9 h-9 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">Pagamento confirmado!</h3>
                <p className="text-[var(--text-secondary)] mb-5">Seu plano <b>{pixModal.plan}</b> ja esta ativo.</p>
                <button onClick={closePixModal} className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl font-semibold cursor-pointer">
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <QrCode className="w-6 h-6 text-teal-500" />
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Pague com PIX para ativar</h3>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Escaneie o QR Code no app do seu banco ou use o codigo copia-e-cola. O plano <b>{pixModal.plan}</b> ativa automaticamente apos o pagamento.
                </p>
                {pixModal.qrCodeUrl && (
                  <div className="bg-white rounded-xl p-3 mb-4 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pixModal.qrCodeUrl} alt="QR Code PIX" className="w-52 h-52 object-contain" />
                  </div>
                )}
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Copia e cola:</p>
                <div className="flex gap-2 mb-4">
                  <input
                    readOnly
                    value={pixModal.qrCode}
                    className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  />
                  <button onClick={copyPix} className="px-3 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1 cursor-pointer shrink-0">
                    <Copy className="w-4 h-4" />
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
                  <span className="inline-block w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  Aguardando pagamento...
                </div>
                <button onClick={closePixModal} className="w-full py-2.5 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl font-semibold cursor-pointer">
                  Fechar (o plano ativa quando o PIX for pago)
                </button>
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

      {/* Aviso de vencimento do plano PIX/manual (faltando <= 5 dias) + botão de
          gerar o PIX de renovação. Cartão renova sozinho, então não aparece. */}
      {showRenewWarning && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <QrCode className="w-8 h-8 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 dark:text-amber-300 font-semibold">
              {daysToExpiry !== null && daysToExpiry <= 0
                ? "Seu plano venceu"
                : `Seu plano vence em ${daysToExpiry} dia${daysToExpiry === 1 ? "" : "s"}`}
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              Como voce paga por PIX, gere um novo QR Code para renovar o plano {currentPlan} e nao perder os recursos.
            </p>
          </div>
          <button
            onClick={renewPix}
            disabled={processingRef.current}
            className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <QrCode className="w-5 h-5" />
            Gerar PIX de renovacao
          </button>
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

      {/* H4: Só mostra sucesso quando o plano foi verificado (webhook concedeu) */}
      {paymentStatus === "success" && paymentVerified && (
        <div className="bg-[var(--status-success-bg)] border border-[var(--status-success-text)]/20 rounded-2xl p-4 mb-6">
          <p className="text-green-800 font-semibold">
            Pagamento aprovado! Seu plano foi atualizado com sucesso.
          </p>
        </div>
      )}
      {paymentStatus === "success" && !paymentVerified && confirming && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-800 font-semibold">
            Confirmando seu pagamento... isso leva alguns segundos.
          </p>
        </div>
      )}
      {paymentStatus === "success" && !paymentVerified && !confirming && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <p className="text-yellow-800 font-semibold">
            Pagamento pendente de confirmacao. Assim que for aprovado seu plano sera ativado automaticamente (no PIX pode levar mais alguns minutos).
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
          <li>&bull; Pague com cartao de credito (cobranca recorrente)</li>
          <li>&bull; A cobranca e automatica — voce pode cancelar a qualquer momento</li>
          <li>&bull; Ao cancelar, voce mantem o acesso ate o fim do periodo pago</li>
          <li>&bull; Planos superiores permitem mais lojas e funcionalidades</li>
          <li>&bull; Para o plano Personalizado, entre em contato pelo WhatsApp</li>
        </ul>
      </div>
    </motion.div>
  );
}
