"use client";

import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_STORES, TOGGLE_STORE_OPEN, GET_MY_PLAN, REQUEST_VENDOR_STORE_DELETE } from "@/lib/graphql";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem, scaleIn } from "@/lib/motion";
import {
  Mail, ChevronRight, CreditCard, Package, LayoutGrid, Plus, Pencil, Trash2,
  Store, Truck, Clock, MapPin, Phone, DollarSign, ShoppingBag, Award,
  CalendarDays, ShieldCheck, Percent, Gift
} from "lucide-react";
import CreateStoreModal from "@/components/CreateStoreModal";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonStats } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import StatusBadge from "@/components/ui/StatusBadge";

export default function DashboardPage() {
  return (
    <Suspense fallback={<SkeletonStats count={4} />}>
      <DashboardContent />
    </Suspense>
  );
}

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo à Visão Geral!",
      description: "Aqui você acompanha todas as suas lojas em um só lugar. Deixa eu te mostrar o que tem disponível.",
    },
  },
  {
    element: '[data-tour="store-card"]',
    popover: {
      title: "Sua loja",
      description: "Cada loja tem um card com status, métricas e ações. Você pode ter várias lojas no mesmo painel.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="store-stats"]',
    popover: {
      title: "📊 Métricas da loja",
      description: "Veja em tempo real: produtos ativos, categorias, total de vendas e informações de entrega.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="store-status-btn"]',
    popover: {
      title: "🔄 Status da loja",
      description: "Abra ou feche sua loja com um clique. Lojas fechadas não recebem novos pedidos.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="new-store-btn"]',
    popover: {
      title: "✅ Criar nova loja",
      description: "Clique aqui para criar uma nova loja! Um tutorial vai te guiar pelo processo de criação.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título.",
      side: "bottom",
      align: "start",
    },
  },
];

const FIRST_ACCESS_TOUR: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo ao seu Painel!",
      description: "Esse é o painel onde você gerencia suas lojas, produtos, pedidos e muito mais.\n\nNo menu à esquerda você encontra todas as seções do sistema.",
    },
  },
  {
    popover: {
      title: "📦 Como funciona?",
      description: "1. Crie sua loja\n2. Cadastre produtos ou serviços\n3. Comece a receber pedidos!\n\nVamos começar criando sua primeira loja.",
    },
  },
  {
    element: '[data-tour="new-store-btn"]',
    popover: {
      title: "🏪 Crie sua primeira loja!",
      description: "Clique aqui para começar. São só 4 passos rápidos.",
      side: "top",
      align: "center",
    },
  },
];

const STORE_TYPE_LABELS: Record<string, string> = {
  PRODUCTS: "Produtos",
  SERVICES: "Serviços",
  BOTH: "Produtos e Serviços",
};

const VERIFICATION_LABELS: Record<string, { label: string; variant: "success" | "warning" | "info" | "neutral" }> = {
  VERIFIED: { label: "Verificada", variant: "success" },
  PENDING: { label: "Em análise", variant: "warning" },
  UNVERIFIED: { label: "Não verificada", variant: "neutral" },
};

function DashboardContent() {
  const router = useRouter();
  const { startTour, hasSeenTour } = useTour("dashboard", TOUR_STEPS, false);
  const { startTour: startFirstAccess, hasSeenTour: hasSeenFirst } = useTour("first-access", FIRST_ACCESS_TOUR, false);
  const { data, loading, error, refetch } = useQuery(GET_MY_STORES);
  const { data: planData, refetch: refetchPlan } = useQuery(GET_MY_PLAN);
  const [toggleOpen] = useMutation(TOGGLE_STORE_OPEN);
  const [requestStoreDelete] = useMutation(REQUEST_VENDOR_STORE_DELETE);

  const paymentConnected = planData?.meVendor?.paymentConnected ?? false;

  const stores = data?.myStores || [];

  useEffect(() => {
    // `error` no guard: com a query falhando, stores.length e 0 e o tour de
    // primeiro acesso disparava para um vendedor que ja tem lojas.
    if (loading || error) return;
    const timer = setTimeout(() => {
      if (stores.length === 0 && !hasSeenFirst) {
        startFirstAccess();
      } else if (stores.length > 0 && !hasSeenTour) {
        startTour();
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [loading, error, stores.length, hasSeenFirst, hasSeenTour, startFirstAccess, startTour]);

  const [showCreateStore, setShowCreateStore] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);

  // Delete store
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toggleError, setToggleError] = useState("");

  async function handleToggle(storeId: string) {
    try {
      await toggleOpen({ variables: { id: storeId } });
      refetch();
    } catch (err: any) {
      setToggleError(err.message || "Erro ao alterar status da loja.");
      setTimeout(() => setToggleError(""), 5000);
    }
  }

  async function handleRequestDelete() {
    if (!deletingStoreId || !deletePassword) {
      setDeleteError("Digite sua senha para confirmar");
      return;
    }
    setDeleteError("");
    setDeleteLoading(true);
    try {
      await requestStoreDelete({ variables: { storeId: deletingStoreId, password: deletePassword } });
      setDeleteSuccess(true);
    } catch (err: any) {
      setDeleteError(err?.graphQLErrors?.[0]?.message || err?.message || "Erro ao solicitar exclusao");
    }
    setDeleteLoading(false);
  }

  function closeDeleteModal() {
    setDeletingStoreId(null);
    setDeletePassword("");
    setDeleteError("");
    setDeleteSuccess(false);
  }

  if (loading) {
    return <SkeletonStats count={4} />;
  }

  // ANTES do empty state: sem isto, uma falha na query virava
  // "Nenhuma loja cadastrada / Crie sua primeira loja" e o vendedor
  // acreditava que tinha perdido as lojas dele.
  if (error && !data) {
    return (
      <ErrorState
        title="Nao foi possivel carregar suas lojas."
        description="Suas lojas continuam salvas. Verifique sua conexao e tente novamente."
        onRetry={() => refetch()}
      />
    );
  }

  if (stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={(storeType?: string) => {
          refetch();
          setShowCreateStore(false);
          if (storeType === "SERVICES") {
            router.push("/dashboard/services");
          } else {
            router.push("/dashboard/products");
          }
        }} />
        <div className="text-center mt-20">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja cadastrada</h2>
          <p className="text-[var(--text-secondary)] mb-6">Crie sua primeira loja para começar a vender</p>
          <button data-tour="new-store-btn" onClick={() => setShowCreateStore(true)} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-6 py-3 rounded-xl font-bold cursor-pointer active:scale-95 transition">
            Criar loja
          </button>
        </div>
      </>
    );
  }

  const emailVerified = planData?.meVendor?.emailVerified ?? true;

  return (
    <motion.div {...fadeIn}>
      {/* Modal para criar/editar loja */}
      <CreateStoreModal
        open={showCreateStore || !!editingStore}
        onClose={() => { setShowCreateStore(false); setEditingStore(null); }}
        onCreated={(storeType?: string) => {
          refetch();
          setShowCreateStore(false);
          setEditingStore(null);
          if (storeType === "SERVICES") {
            router.push("/dashboard/services");
          } else {
            router.push("/dashboard/products");
          }
        }}
        store={editingStore}
      />

      {toggleError && (
        <div className="bg-[var(--status-error-bg)] border border-[var(--status-error-text)]/20 text-[var(--status-error-text)] px-4 py-3 rounded-xl text-sm mb-4">
          {toggleError}
        </div>
      )}

      {!emailVerified && (
        <a href="/dashboard/settings" className="block bg-[var(--status-warning-bg)] border border-[var(--status-warning-text)]/20 rounded-2xl p-4 mb-6 hover:opacity-90 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--status-warning-bg)] rounded-xl flex items-center justify-center flex-shrink-0 border border-[var(--status-warning-text)]/20">
              <Mail className="w-5 h-5 text-[var(--status-warning-text)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--status-warning-text)]">Verifique seu email</p>
              <p className="text-xs text-[var(--text-muted)]">Verifique seu email nas configuracoes para receber notificacoes importantes.</p>
            </div>
            <ChevronRight className="w-5 h-5 flex-shrink-0 text-[var(--status-warning-text)]" />
          </div>
        </a>
      )}

      {!paymentConnected && (
        <div className="bg-[var(--status-success-bg)] border border-[var(--status-success-text)]/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--status-success-bg)] rounded-xl flex items-center justify-center flex-shrink-0 border border-[var(--status-success-text)]/20">
              <CreditCard className="w-5 h-5 text-[var(--status-success-text)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--status-success-text)]">Configure seu Pagamento</p>
              <p className="text-xs text-[var(--text-muted)]">Cadastre seus dados bancarios para aceitar pagamentos online.</p>
            </div>
            <a
              href="/dashboard/earnings"
              className="px-4 py-2 bg-[var(--status-success-text)] text-white rounded-xl text-sm font-bold cursor-pointer hover:opacity-90 active:scale-95 transition flex-shrink-0"
            >
              Configurar
            </a>
          </div>
        </div>
      )}

      <PageHeader
        title="Visao Geral"
        onTourStart={startTour}
        tourNotSeen={!hasSeenTour}
        actions={
          <button data-tour="new-store-btn" onClick={() => setShowCreateStore(true)} className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova loja
          </button>
        }
      />

      {/* Delete store modal */}
      {deletingStoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeDeleteModal}>
          <motion.div {...scaleIn} className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {deleteSuccess ? (
              <>
                <h3 className="text-lg font-bold text-[var(--status-success-text)] mb-2">Email enviado!</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Um email de confirmacao foi enviado para voce. Clique no link do email para concluir a exclusao da loja.
                </p>
                <p className="text-xs text-[var(--text-muted)] mb-6">O link expira em 30 minutos.</p>
                <button onClick={closeDeleteModal} className="w-full py-2.5 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition">
                  Fechar
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Excluir loja?</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Esta acao e irreversivel. Todos os produtos, categorias e dados da loja serao removidos. Digite sua senha e confirme pelo email.
                </p>
                {deleteError && (
                  <div className="mb-4 px-3 py-2 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-xl text-sm">{deleteError}</div>
                )}
                <input
                  type="password"
                  placeholder="Sua senha..."
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRequestDelete()}
                  className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-red-400 mb-4"
                />
                <div className="flex gap-2">
                  <button onClick={handleRequestDelete} disabled={deleteLoading}
                    className="flex-1 py-2.5 bg-[var(--status-error-text)] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-red-600 disabled:opacity-50 transition">
                    {deleteLoading ? "Verificando..." : "Confirmar exclusao"}
                  </button>
                  <button onClick={closeDeleteModal}
                    className="flex-1 py-2.5 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl text-sm font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      <motion.div className="space-y-10" variants={staggerContainer} initial="hidden" animate="show">
        {stores.map((store: any, storeIndex: number) => {
          const verif = VERIFICATION_LABELS[store.verificationLevel] || VERIFICATION_LABELS.UNVERIFIED;
          const createdDate = store.createdAt ? new Date(store.createdAt).toLocaleDateString("pt-BR") : null;
          const hasDeliveryHours = store.deliveryStartTime && store.deliveryEndTime;
          const hasAddress = store.street;
          const hasFreight = store.freeDelivery || store.freeDeliveryAbove;
          const hasMinOrder = Number(store.minimumOrder) > 0;
          const activeProducts = store.products?.filter((p: any) => p.isActive)?.length || 0;
          const totalProducts = store.products?.length || 0;

          return (
            <motion.div key={store.id} variants={staggerItem} data-tour={storeIndex === 0 ? "store-card" : undefined} className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] overflow-hidden">
              {/* Store banner / header */}
              {store.bannerUrl && (
                <div className="h-32 sm:h-40 w-full overflow-hidden">
                  <img src={store.bannerUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Store identity section */}
              <div className="p-6 pb-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-[var(--border-light)]" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[var(--brand-primary-muted)] flex items-center justify-center border border-[var(--brand-primary)]/20">
                        <Store className="w-9 h-9 text-[var(--brand-primary)]" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{store.name}</h2>
                        <button
                          data-tour={storeIndex === 0 ? "store-status-btn" : undefined}
                          onClick={() => handleToggle(store.id)}
                          className="cursor-pointer active:scale-95 transition"
                        >
                          <StatusBadge variant={store.isOpen ? "success" : "error"} dot>
                            {store.isOpen ? "Aberta" : "Fechada"}
                          </StatusBadge>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {store.storeType && (
                          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-md">
                            {STORE_TYPE_LABELS[store.storeType] || store.storeType}
                          </span>
                        )}
                        <StatusBadge variant={verif.variant}>
                          {verif.label}
                        </StatusBadge>
                        {createdDate && (
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" /> Desde {createdDate}
                          </span>
                        )}
                      </div>
                      {store.description && (
                        <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-lg">{store.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingStore(store)}
                      className="px-3 py-1.5 rounded-xl text-sm font-semibold cursor-pointer bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => setDeletingStoreId(store.id)}
                      className="px-3 py-1.5 rounded-xl text-sm font-semibold cursor-pointer active:scale-95 transition bg-[var(--status-error-bg)] text-[var(--status-error-text)] hover:opacity-80 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 my-5 border-t border-[var(--border-light)]" />

              {/* Stats grid */}
              <div data-tour={storeIndex === 0 ? "store-stats" : undefined} className="px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatItem
                  icon={Package}
                  iconBg="bg-blue-50 dark:bg-blue-900/30"
                  iconColor="text-blue-500"
                  value={`${activeProducts}/${totalProducts}`}
                  label="Produtos ativos"
                />
                <StatItem
                  icon={LayoutGrid}
                  iconBg="bg-purple-50 dark:bg-purple-900/30"
                  iconColor="text-purple-500"
                  value={String(store.categories?.length || 0)}
                  label="Categorias"
                />
                <StatItem
                  icon={ShoppingBag}
                  iconBg="bg-green-50 dark:bg-green-900/30"
                  iconColor="text-green-500"
                  value={String(store.totalSales || 0)}
                  label="Vendas totais"
                />
                <StatItem
                  icon={Truck}
                  iconBg="bg-orange-50 dark:bg-orange-900/30"
                  iconColor="text-[var(--brand-primary)]"
                  value={store.hasOwnDelivery ? "Propria" : "App"}
                  label="Entrega"
                />
                <StatItem
                  icon={Clock}
                  iconBg="bg-cyan-50 dark:bg-cyan-900/30"
                  iconColor="text-cyan-500"
                  value={`${store.estimatedDeliveryMinutes} min`}
                  label="Tempo estimado"
                />
              </div>

              {/* Divider */}
              <div className="mx-6 my-5 border-t border-[var(--border-light)]" />

              {/* Info grid - replaces the old table */}
              <div className="px-6 pb-6">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Informacoes da loja</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {hasAddress && (
                    <InfoItem
                      icon={MapPin}
                      label="Endereco"
                      value={`${store.street}, ${store.number}${store.complement ? ` - ${store.complement}` : ""} - ${store.neighborhood}, ${store.city}/${store.state}`}
                    />
                  )}
                  {store.phone && (
                    <InfoItem icon={Phone} label="Telefone" value={store.phone} />
                  )}
                  {hasDeliveryHours && (
                    <InfoItem icon={Clock} label="Horario de entrega" value={`${store.deliveryStartTime} - ${store.deliveryEndTime}`} />
                  )}
                  {hasMinOrder && (
                    <InfoItem icon={DollarSign} label="Pedido minimo" value={`R$ ${Number(store.minimumOrder).toFixed(2)}`} />
                  )}
                  {store.freeDelivery ? (
                    <InfoItem icon={Truck} label="Frete" value="Entrega gratis" highlight="success" />
                  ) : store.freeDeliveryAbove ? (
                    <InfoItem icon={Truck} label="Frete gratis acima de" value={`R$ ${Number(store.freeDeliveryAbove).toFixed(2)}`} />
                  ) : store.deliveryFee ? (
                    <InfoItem icon={Truck} label="Taxa de entrega" value={`R$ ${Number(store.deliveryFee).toFixed(2)}`} />
                  ) : null}
                  {store.verificationScore > 0 && (
                    <InfoItem icon={ShieldCheck} label="Score de verificacao" value={`${store.verificationScore} pontos`} />
                  )}
                  {store.commissionReductionPercent > 0 && (
                    <InfoItem
                      icon={Percent}
                      label="Reducao de comissao"
                      value={`${store.commissionReductionPercent}%`}
                      highlight="success"
                    />
                  )}
                  {store.freePromoDaysCredit > 0 && (
                    <InfoItem
                      icon={Gift}
                      label="Dias gratis de promo"
                      value={`${store.freePromoDaysCredit} dias`}
                      highlight="info"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

function StatItem({ icon: Icon, iconBg, iconColor, value, label }: {
  icon: any;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[var(--text-primary)] truncate">{value}</p>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, highlight }: {
  icon: any;
  label: string;
  value: string;
  highlight?: "success" | "info";
}) {
  const highlightClass = highlight === "success"
    ? "text-[var(--status-success-text)] font-semibold"
    : highlight === "info"
    ? "text-[var(--status-info-text)] font-semibold"
    : "text-[var(--text-primary)] font-medium";

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className={`text-sm ${highlightClass} break-words`}>{value}</p>
      </div>
    </div>
  );
}
