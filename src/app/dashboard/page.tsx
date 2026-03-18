"use client";

import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_STORES, TOGGLE_STORE_OPEN, GET_MY_PLAN, DISCONNECT_PAYMENT, REQUEST_VENDOR_STORE_DELETE } from "@/lib/graphql";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CreateStoreModal from "@/components/CreateStoreModal";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-[var(--text-secondary)]">Carregando...</p>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { data, loading, refetch } = useQuery(GET_MY_STORES);
  const { data: planData, refetch: refetchPlan } = useQuery(GET_MY_PLAN);
  const [toggleOpen] = useMutation(TOGGLE_STORE_OPEN);
  const [disconnectPaymentMut, { loading: disconnecting }] = useMutation(DISCONNECT_PAYMENT);
  const [requestStoreDelete] = useMutation(REQUEST_VENDOR_STORE_DELETE);

  const searchParams = useSearchParams();
  const [paymentToast, setPaymentToast] = useState(false);

  const paymentConnected = planData?.meVendor?.paymentConnected ?? false;

  useEffect(() => {
    if (searchParams.get("mp") === "connected") {
      setPaymentToast(true);
      refetchPlan();
      const timer = setTimeout(() => setPaymentToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, refetchPlan]);

  async function handleDisconnectPayment() {
    await disconnectPaymentMut();
    refetchPlan();
  }

  const stores = data?.myStores || [];
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);

  // Delete store
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleToggle(storeId: string) {
    await toggleOpen({ variables: { id: storeId } });
    refetch();
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
    return <p className="text-[var(--text-secondary)]">Carregando...</p>;
  }

  if (stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => refetch()} />
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja cadastrada</h2>
          <p className="text-[var(--text-secondary)] mb-6">Crie sua primeira loja para começar a vender</p>
          <button onClick={() => setShowCreateStore(true)} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
            Criar loja
          </button>
        </div>
      </>
    );
  }

  const emailVerified = planData?.meVendor?.emailVerified ?? true;

  return (
    <div>
      {/* Modal para criar/editar loja */}
      <CreateStoreModal
        open={showCreateStore || !!editingStore}
        onClose={() => { setShowCreateStore(false); setEditingStore(null); }}
        onCreated={() => refetch()}
        store={editingStore}
      />

      {!emailVerified && (
        <a href="/dashboard/settings" className="block bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 hover:bg-amber-100 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#F59E0B" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Verifique seu email</p>
              <p className="text-xs text-amber-600">Verifique seu email nas configuracoes para receber notificacoes importantes.</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#F59E0B" className="w-5 h-5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </a>
      )}

      {!paymentConnected && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#65A300" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">Configure seu Pagamento</p>
              <p className="text-xs text-green-600">Cadastre seus dados bancarios para aceitar pagamentos online.</p>
            </div>
            <a
              href="/dashboard/earnings"
              className="px-4 py-2 bg-[#65A300] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#568a00] active:scale-95 transition flex-shrink-0"
            >
              Configurar
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Visão Geral</h1>
        <button onClick={() => setShowCreateStore(true)} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Nova loja
        </button>
      </div>

      {paymentToast && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <p className="text-green-700 dark:text-green-300 font-medium text-sm">Pagamento conectado com sucesso!</p>
          <button onClick={() => setPaymentToast(false)} className="text-green-400 hover:text-green-600 text-lg cursor-pointer">✕</button>
        </div>
      )}

      {/* Delete store modal */}
      {deletingStoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeDeleteModal}>
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {deleteSuccess ? (
              <>
                <h3 className="text-lg font-bold text-green-600 mb-2">Email enviado!</h3>
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
                  <div className="mb-4 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm">{deleteError}</div>
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
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-red-600 disabled:opacity-50 transition">
                    {deleteLoading ? "Verificando..." : "Confirmar exclusao"}
                  </button>
                  <button onClick={closeDeleteModal}
                    className="flex-1 py-2.5 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl text-sm font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {stores.map((store: any) => (
          <div key={store.id} className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-3">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : null}
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{store.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingStore(store)}
                  className="px-3 py-1 rounded-full text-sm font-semibold cursor-pointer bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleToggle(store.id)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold cursor-pointer active:scale-95 transition ${
                    store.isOpen
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-red-100 text-red-600 hover:bg-red-200"
                  }`}
                >
                  {store.isOpen ? "Aberta" : "Fechada"}
                </button>
                <button
                  onClick={() => setDeletingStoreId(store.id)}
                  className="px-3 py-1 rounded-full text-sm font-semibold cursor-pointer active:scale-95 transition bg-red-50 text-red-500 hover:bg-red-100"
                >
                  Excluir
                </button>
              </div>
            </div>

            {store.description && (
              <p className="text-sm text-[var(--text-secondary)] mb-4">{store.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[var(--bg-muted)] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{store.products?.length || 0}</p>
                <p className="text-xs text-[var(--text-secondary)]">Produtos</p>
              </div>
              <div className="bg-[var(--bg-muted)] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{store.categories?.length || 0}</p>
                <p className="text-xs text-[var(--text-secondary)]">Categorias</p>
              </div>
            </div>

            <div className="text-sm text-[var(--text-secondary)] space-y-1">
              <p>Entrega: {store.hasOwnDelivery ? "Própria" : "Entregadores do app"}</p>
              {store.freeDelivery ? (
                <p className="text-green-600 font-medium">Entrega grátis</p>
              ) : store.freeDeliveryAbove ? (
                <p>Grátis acima de R$ {Number(store.freeDeliveryAbove).toFixed(2)}</p>
              ) : null}
              <p>Tempo estimado: {store.estimatedDeliveryMinutes} min</p>
              {store.deliveryStartTime && store.deliveryEndTime && (
                <p>Horário de entrega: {store.deliveryStartTime} - {store.deliveryEndTime}</p>
              )}
              {Number(store.minimumOrder) > 0 && (
                <p>Pedido mínimo: R$ {Number(store.minimumOrder).toFixed(2)}</p>
              )}
              {store.phone && <p>Telefone: {store.phone}</p>}
              {store.street && (
                <p>Endereço: {store.street}, {store.number}{store.complement ? ` - ${store.complement}` : ""} - {store.neighborhood}, {store.city}/{store.state}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
