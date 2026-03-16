"use client";

import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { GET_MY_STORES, TOGGLE_STORE_OPEN, UPDATE_STORE, UPLOAD_IMAGE, GET_MY_PLAN, GET_MP_CONNECT_URL, DISCONNECT_MP, REQUEST_VENDOR_STORE_DELETE } from "@/lib/graphql";
import { useState, useRef, useEffect, Suspense } from "react";
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
  const [updateStore] = useMutation(UPDATE_STORE);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const [getMpConnectUrl, { loading: mpUrlLoading }] = useLazyQuery(GET_MP_CONNECT_URL, { fetchPolicy: "network-only" });
  const [disconnectMp, { loading: disconnecting }] = useMutation(DISCONNECT_MP);
  const [requestStoreDelete] = useMutation(REQUEST_VENDOR_STORE_DELETE);

  const searchParams = useSearchParams();
  const [mpToast, setMpToast] = useState(false);

  const mpConnected = planData?.meVendor?.mpConnected ?? false;

  useEffect(() => {
    if (searchParams.get("mp") === "connected") {
      setMpToast(true);
      refetchPlan();
      const timer = setTimeout(() => setMpToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, refetchPlan]);

  async function handleConnectMp() {
    const { data: urlData } = await getMpConnectUrl();
    const url = urlData?.mpConnectUrl;
    if (url) {
      window.location.href = url;
    }
  }

  async function handleDisconnectMp() {
    await disconnectMp();
    refetchPlan();
  }

  const stores = data?.myStores || [];
  const [showCreateStore, setShowCreateStore] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete store
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function startEdit(store: any) {
    setEditingId(store.id);
    setForm({
      name: store.name || "",
      description: store.description || "",
      phone: store.phone || "",
      street: store.street || "",
      number: store.number || "",
      complement: store.complement || "",
      neighborhood: store.neighborhood || "",
      city: store.city || "",
      state: store.state || "",
      zipCode: store.zipCode || "",
      hasOwnDelivery: store.hasOwnDelivery || false,
      freeDelivery: store.freeDelivery || false,
      estimatedDeliveryMinutes: String(store.estimatedDeliveryMinutes || "30"),
      minimumOrder: String(store.minimumOrder || "0"),
      deliveryStartTime: store.deliveryStartTime || "",
      deliveryEndTime: store.deliveryEndTime || "",
      freeDeliveryAbove: store.freeDeliveryAbove ? String(store.freeDeliveryAbove) : "",
    });
    setLogoPreview(store.logoUrl || null);
    setLogoBase64(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({});
    setLogoPreview(null);
    setLogoBase64(null);
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setLogoBase64(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!editingId) return;
    setSaving(true);
    try {
      let logoUrl: string | undefined;
      if (logoBase64) {
        const { data: uploadData } = await uploadImage({ variables: { base64: logoBase64, folder: "stores" } });
        logoUrl = uploadData?.uploadImage;
      }

      await updateStore({
        variables: {
          input: {
            id: editingId,
            name: form.name,
            description: form.description || undefined,
            phone: form.phone,
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            hasOwnDelivery: form.hasOwnDelivery,
            freeDelivery: form.freeDelivery,
            deliveryStartTime: form.deliveryStartTime || undefined,
            deliveryEndTime: form.deliveryEndTime || undefined,
            freeDeliveryAbove: form.freeDeliveryAbove ? parseFloat(form.freeDeliveryAbove) : undefined,
            estimatedDeliveryMinutes: parseInt(form.estimatedDeliveryMinutes),
            minimumOrder: parseFloat(form.minimumOrder),
            ...(logoUrl ? { logoUrl } : {}),
          },
        },
      });
      await refetch();
      cancelEdit();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

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
      <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => refetch()} />

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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Visão Geral</h1>
        <button onClick={() => setShowCreateStore(true)} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Nova loja
        </button>
      </div>

      {mpToast && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <p className="text-green-700 font-medium text-sm">Mercado Pago conectado com sucesso!</p>
          <button onClick={() => setMpToast(false)} className="text-green-400 hover:text-green-600 text-lg cursor-pointer">✕</button>
        </div>
      )}

      {/* Delete store modal */}
      {deletingStoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeDeleteModal}>
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
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
            {editingId === store.id ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Editar loja</h2>
                  <button onClick={cancelEdit} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xl cursor-pointer">✕</button>
                </div>

                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">Logo</label>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-orange-400 transition overflow-hidden"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[var(--text-muted)] text-2xl">+</span>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                    <span className="text-sm text-[var(--text-muted)]">Clique para alterar</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-sm text-[var(--text-secondary)]">Nome</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-[var(--text-secondary)]">Descrição</label>
                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Telefone</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                </div>

                <h3 className="font-bold text-[var(--text-primary)] text-sm pt-2">Endereço</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Rua</label>
                    <input type="text" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Número</label>
                    <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Complemento</label>
                    <input type="text" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Bairro</label>
                    <input type="text" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Cidade</label>
                    <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Estado</label>
                    <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">CEP</label>
                    <input type="text" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                </div>

                <h3 className="font-bold text-[var(--text-primary)] text-sm pt-2">Entrega</h3>
                <div className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, hasOwnDelivery: !form.hasOwnDelivery })}
                    className={`relative w-12 h-6 rounded-full transition cursor-pointer ${form.hasOwnDelivery ? "bg-orange-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--bg-card)] rounded-full transition-transform ${form.hasOwnDelivery ? "translate-x-6" : ""}`} />
                  </button>
                  <span className="text-sm text-[var(--text-primary)]">
                    {form.hasOwnDelivery ? "Entrega própria" : "Não possui entrega própria"}
                  </span>
                </div>
                {form.hasOwnDelivery ? (
                  <p className="text-xs text-[var(--text-muted)]">Seus próprios entregadores farão as entregas.</p>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
                    <p className="text-xs text-blue-600">O app disponibilizará entregadores autônomos para realizar as entregas dos seus pedidos.</p>
                  </div>
                )}

                <div className="flex items-center gap-3 py-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, freeDelivery: !form.freeDelivery })}
                    className={`relative w-12 h-6 rounded-full transition cursor-pointer ${form.freeDelivery ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--bg-card)] rounded-full transition-transform ${form.freeDelivery ? "translate-x-6" : ""}`} />
                  </button>
                  <span className="text-sm text-[var(--text-primary)]">Entrega grátis</span>
                </div>

                {!form.freeDelivery && (
                  <div className="mt-1">
                    <label className="text-sm text-[var(--text-secondary)]">Grátis acima de (R$)</label>
                    <input type="number" step="0.01" placeholder="Opcional" value={form.freeDeliveryAbove} onChange={(e) => setForm({ ...form, freeDeliveryAbove: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Início entregas</label>
                    <input type="time" value={form.deliveryStartTime} onChange={(e) => setForm({ ...form, deliveryStartTime: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Fim entregas</label>
                    <input type="time" value={form.deliveryEndTime} onChange={(e) => setForm({ ...form, deliveryEndTime: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                </div>
                {form.hasOwnDelivery && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Tempo (min)</label>
                    <input type="number" value={form.estimatedDeliveryMinutes} onChange={(e) => setForm({ ...form, estimatedDeliveryMinutes: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Mínimo (R$)</label>
                    <input type="number" step="0.01" value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]" />
                  </div>
                </div>
                )}
                {!form.hasOwnDelivery && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">Tempo estimado calculado automaticamente pela distancia.</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : null}
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{store.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(store)}
                      className="px-3 py-1 rounded-full text-sm font-semibold cursor-pointer bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition"
                    >
                      ✏️ Editar
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
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
