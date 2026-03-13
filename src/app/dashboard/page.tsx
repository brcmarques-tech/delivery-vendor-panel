"use client";

import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { GET_MY_STORES, TOGGLE_STORE_OPEN, UPDATE_STORE, UPLOAD_IMAGE, GET_MY_PLAN, GET_MP_CONNECT_URL, DISCONNECT_MP } from "@/lib/graphql";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

  const searchParams = useSearchParams();
  const [mpToast, setMpToast] = useState(false);

  const mpConnected = planData?.me?.mpConnected ?? false;

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (loading) {
    return <p className="text-[var(--text-secondary)]">Carregando...</p>;
  }

  if (stores.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja cadastrada</h2>
        <p className="text-[var(--text-secondary)] mb-6">Crie sua primeira loja para começar a vender</p>
        <a href="/dashboard/settings" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
          Criar loja
        </a>
      </div>
    );
  }

  return (
    <div>
      {!mpConnected && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-white text-2xl mt-0.5">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-white text-base mb-2">Conta Mercado Pago não conectada</h3>
              <ul className="space-y-1 mb-4">
                <li className="text-white/90 text-sm flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  Sua loja só pode receber pagamento na entrega
                </li>
                <li className="text-white/90 text-sm flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  Entregadores autônomos do app não estão disponíveis para sua loja
                </li>
                <li className="text-white/90 text-sm flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  Conecte sua conta para aceitar PIX, cartão e ter acesso a entregadores
                </li>
              </ul>
              <button
                onClick={handleConnectMp}
                disabled={mpUrlLoading}
                className="px-5 py-2.5 bg-white text-orange-600 rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-50 active:scale-95 disabled:opacity-50 transition"
              >
                {mpUrlLoading ? "Carregando..." : "Conectar agora"}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Visão Geral</h1>

      {mpToast && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <p className="text-green-700 font-medium text-sm">Mercado Pago conectado com sucesso!</p>
          <button onClick={() => setMpToast(false)} className="text-green-400 hover:text-green-600 text-lg cursor-pointer">✕</button>
        </div>
      )}

      {mpConnected && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <div>
                <h3 className="font-bold text-green-700 text-sm mb-1">Mercado Pago conectado</h3>
                <p className="text-green-600 text-sm">Você recebe pagamentos diretamente na sua conta.</p>
              </div>
            </div>
            <button
              onClick={handleDisconnectMp}
              disabled={disconnecting}
              className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-xl text-sm font-semibold cursor-pointer hover:bg-green-100 disabled:opacity-50 transition"
            >
              {disconnecting ? "..." : "Desconectar"}
            </button>
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
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.hasOwnDelivery ? "translate-x-6" : ""}`} />
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
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.freeDelivery ? "translate-x-6" : ""}`} />
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
