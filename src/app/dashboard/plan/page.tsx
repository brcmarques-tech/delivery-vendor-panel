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
import { useSearchParams } from "next/navigation";
import { useState, useRef, Suspense } from "react";
import TermsModal from "@/components/TermsModal";

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
    <Suspense fallback={<p className="text-gray-500">Carregando...</p>}>
      <PlanContent />
    </Suspense>
  );
}

function PlanContent() {
  const { data: userData, loading: loadingUser } = useQuery(GET_MY_PLAN);
  const { data: plansData, loading: loadingPlans } = useQuery(GET_AVAILABLE_PLANS);
  const { data: storesData } = useQuery(GET_MY_STORES);
  const { data: badgeData } = useQuery(GET_BADGE_CONFIG);
  const [createUpgrade] = useMutation(CREATE_PLAN_UPGRADE);
  const [acceptSubTerms, { loading: acceptingSub }] = useMutation(ACCEPT_SUBSCRIPTION_TERMS);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billing, setBilling] = useState("monthly");
  const [showSubTerms, setShowSubTerms] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("status");

  if (loadingUser || loadingPlans) {
    return <p className="text-gray-500">Carregando...</p>;
  }

  const user = userData?.me;
  const plans = plansData?.availablePlans || [];
  const currentPlan = user?.vendorPlan || "FREE";
  const storeCount = user?.stores?.length || 0;

  // Calculate badge subscription discount (from stores with badgeClaimCount >= 2)
  let badgeDiscount = 0;
  let badgeLevel = "";
  const stores = storesData?.myStores || [];
  const badgeConfig = badgeData?.badgeConfig ? JSON.parse(badgeData.badgeConfig) : null;
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
    if (!hasAcceptedSubTerms) {
      setPendingPlan(plan);
      setShowSubTerms(true);
      return;
    }
    proceedUpgrade(plan);
  }

  async function handleAcceptSubTerms() {
    try {
      await acceptSubTerms();
      setShowSubTerms(false);
      if (pendingPlan) {
        proceedUpgrade(pendingPlan);
        setPendingPlan(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function proceedUpgrade(plan: string) {
    setUpgrading(plan);
    try {
      const { data } = await createUpgrade({
        variables: { plan, billingPeriod: billing },
      });
      const checkoutUrl = data?.createPlanUpgrade?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      alert(err.message);
      setUpgrading(null);
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
    <div>
      {showSubTerms && (
        <TermsModal
          type="subscription"
          onAccept={handleAcceptSubTerms}
          loading={acceptingSub}
          userName={userData?.me?.name}
          userCpf={userData?.me?.cpf}
        />
      )}

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Meu Plano</h1>

      {badgeDiscount > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🏅</span>
          <div>
            <p className="text-purple-800 font-semibold">
              Desconto de {badgeDiscount}% na assinatura (Selo {badgeLevel})
            </p>
            <p className="text-purple-600 text-sm">
              Premio do selo aplicado automaticamente em todos os planos.
            </p>
          </div>
        </div>
      )}

      {paymentStatus === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <p className="text-green-800 font-semibold">
            Pagamento aprovado! Seu plano foi atualizado com sucesso.
          </p>
        </div>
      )}
      {paymentStatus === "failure" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
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

      <p className="text-[var(--text-secondary)] mb-4">
        Voce esta no plano{" "}
        <span className="font-semibold text-orange-600">
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

      {/* Billing period selector */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1.5 inline-flex gap-1 mb-6">
        {billingOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setBilling(opt.key)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              billing === opt.key
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
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
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-full shadow-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-orange-50 hover:border-orange-300 transition cursor-pointer hidden md:flex"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-full shadow-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-orange-50 hover:border-orange-300 transition cursor-pointer hidden md:flex"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory md:px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {plans.map((plan: any) => {
            const isCurrent = plan.plan === currentPlan;
            const isContactSales = plan.isContactSales;
            const price = getPrice(plan, billing);
            const { positives, negatives } = getFeatures(plan);

            return (
              <div
                key={plan.plan}
                className={`rounded-2xl p-6 border-2 transition min-w-[280px] w-[280px] shrink-0 snap-center flex flex-col relative ${
                  isCurrent
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    : plan.plan === "CUSTOM"
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:border-emerald-500"
                    : plan.plan === "ENTERPRISE"
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20 hover:border-amber-500"
                    : plan.plan === "PRO"
                    ? "border-blue-400 bg-[var(--bg-card)] hover:border-blue-500 ring-2 ring-blue-400/20"
                    : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-orange-300"
                }`}
              >
                {/* Badge: mais popular */}
                {plan.plan === "PRO" && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
                    🔥 MAIS POPULAR
                  </span>
                )}
                {isCurrent && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full self-start">
                    PLANO ATUAL
                  </span>
                )}

                <h3 className="text-xl font-bold text-[var(--text-primary)] mt-3">
                  {planLabels[plan.plan]}
                </h3>

                <div className="mt-2">
                  {isContactSales ? (
                    <p className="text-3xl font-bold text-[var(--text-primary)]">Sob consulta</p>
                  ) : price === 0 ? (
                    <p className="text-3xl font-bold text-[var(--text-primary)]">Gratis</p>
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
                        <p className="text-3xl font-bold text-[var(--text-primary)]">
                          R$ {discountedPrice.toFixed(2)}
                          <span className="text-sm font-normal text-[var(--text-muted)]">
                            {getBillingLabel(billing)}
                          </span>
                        </p>
                        {badgeDiscount > 0 && (
                          <p className="text-xs text-purple-600 font-semibold mt-1 flex items-center gap-1">
                            <span>🏅</span> -{badgeDiscount}% selo {badgeLevel}
                          </p>
                        )}
                        {billing !== "monthly" && (
                          <p className="text-xs text-green-600 font-semibold mt-1">
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
                      <li key={`p-${i}`} className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="text-green-500 shrink-0">&#10003;</span>
                        <span>{f.label}</span>
                      </li>
                    ))}
                    {/* Negative features last */}
                    {negatives.map((f, i) => (
                      <li key={`n-${i}`} className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="text-red-400 shrink-0">&#10007;</span>
                        <span className="text-[var(--text-muted)]">{f.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Action button */}
                {!isCurrent && (
                  isContactSales ? (
                    <a
                      href="https://wa.me/5500000000000"
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
                      className="mt-6 w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
                    >
                      {upgrading === plan.plan ? "Redirecionando..." : "Fazer Upgrade"}
                    </button>
                  ) : null
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
        <h3 className="font-semibold text-[var(--text-primary)]">Como funciona?</h3>
        <ul className="mt-2 text-sm text-[var(--text-secondary)] space-y-1">
          <li>&bull; Escolha o periodo: mensal, trimestral (-10%), semestral (-20%) ou anual (-30%)</li>
          <li>&bull; Ao clicar em &quot;Fazer Upgrade&quot;, voce sera redirecionado para o Mercado Pago</li>
          <li>&bull; Aceita PIX, cartao de credito (com parcelamento) e boleto</li>
          <li>&bull; Apos o pagamento, seu plano e ativado automaticamente</li>
          <li>&bull; Planos superiores permitem mais lojas e funcionalidades</li>
          <li>&bull; Para o plano Personalizado, entre em contato pelo WhatsApp</li>
        </ul>
      </div>
    </div>
  );
}
