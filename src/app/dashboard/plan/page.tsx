"use client";

import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_PLAN,
  GET_AVAILABLE_PLANS,
  CREATE_PLAN_UPGRADE,
} from "@/lib/graphql";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

const planLabels: Record<string, string> = {
  FREE: "Gratuito",
  PRO: "Pro",
  PREMIUM: "Premium",
};

export default function PlanPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Carregando...</p>}>
      <PlanContent />
    </Suspense>
  );
}

function PlanContent() {
  const { data: userData, loading: loadingUser, refetch } = useQuery(GET_MY_PLAN);
  const { data: plansData, loading: loadingPlans } = useQuery(GET_AVAILABLE_PLANS);
  const [createUpgrade] = useMutation(CREATE_PLAN_UPGRADE);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("status");

  if (loadingUser || loadingPlans) {
    return <p className="text-gray-500">Carregando...</p>;
  }

  const user = userData?.me;
  const plans = plansData?.availablePlans || [];
  const currentPlan = user?.vendorPlan || "FREE";
  const storeCount = user?.stores?.length || 0;

  async function handleUpgrade(plan: string) {
    setUpgrading(plan);
    try {
      const { data } = await createUpgrade({ variables: { plan } });
      const checkoutUrl = data?.createPlanUpgrade?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      alert(err.message);
      setUpgrading(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Meu Plano</h1>

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
            Pagamento pendente. Seu plano será ativado após a confirmação.
          </p>
        </div>
      )}

      <p className="text-gray-500 mb-6">
        Você está no plano{" "}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => {
          const isCurrent = plan.plan === currentPlan;

          return (
            <div
              key={plan.plan}
              className={`rounded-2xl p-6 border-2 transition ${
                isCurrent
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-orange-300"
              }`}
            >
              {isCurrent && (
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  PLANO ATUAL
                </span>
              )}

              <h3 className="text-xl font-bold text-gray-800 mt-3">
                {planLabels[plan.plan]}
              </h3>

              <p className="text-3xl font-bold text-gray-800 mt-2">
                {plan.monthlyPrice === 0 ? (
                  "Gratis"
                ) : (
                  <>
                    R$ {Number(plan.monthlyPrice).toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">
                      /mes
                    </span>
                  </>
                )}
              </p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span>
                  Ate {plan.maxStores} loja(s)
                  {storeCount > 0 && isCurrent && (
                    <span className="text-xs text-gray-400">
                      ({storeCount} usada(s))
                    </span>
                  )}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span>
                  Sem comissão por pedido
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  {plan.canPromote ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-400">✗</span>
                  )}
                  <span className={!plan.canPromote ? "text-gray-400" : ""}>
                    Criar promoções
                  </span>
                </li>
              </ul>

              {!isCurrent && plan.monthlyPrice > 0 && (
                <button
                  onClick={() => handleUpgrade(plan.plan)}
                  disabled={upgrading !== null}
                  className="mt-6 w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
                >
                  {upgrading === plan.plan ? "Redirecionando..." : "Fazer Upgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-800">Como funciona?</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>
            • Ao clicar em &quot;Fazer Upgrade&quot;, você será redirecionado para o
            Mercado Pago
          </li>
          <li>
            • Aceita PIX, cartão de crédito e boleto
          </li>
          <li>
            • Após o pagamento, seu plano é ativado automaticamente
          </li>
          <li>
            • Planos superiores permitem mais lojas e funcionalidades
          </li>
        </ul>
      </div>
    </div>
  );
}
