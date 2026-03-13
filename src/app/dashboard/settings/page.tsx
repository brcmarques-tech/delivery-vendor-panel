"use client";

import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_STORE, UPDATE_STORE, UPLOAD_IMAGE, GET_MY_STORES,
  GET_MY_PROFILE, UPDATE_PROFILE, GET_MY_PLAN,
} from "@/lib/graphql";
import { useState, useRef, useEffect } from "react";
import TermsModal from "@/components/TermsModal";
import { useTheme } from "@/lib/ThemeProvider";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 mb-6">
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition cursor-pointer ${value ? "bg-orange-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value ? "translate-x-6" : ""}`} />
      </button>
      <span className="text-sm text-[var(--text-primary)] font-medium">{label}</span>
    </div>
  );
}

// ===== PROFILE SECTION =====
function ProfileSection() {
  const { data, loading, refetch } = useQuery(GET_MY_PROFILE);
  const [updateProfile, { loading: saving }] = useMutation(UPDATE_PROFILE);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [passForm, setPassForm] = useState({ current: "", new: "", confirm: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (data?.me) {
      setForm({ name: data.me.name || "", phone: data.me.phone || "" });
    }
  }, [data]);

  async function handleSaveProfile() {
    try {
      await updateProfile({ variables: { name: form.name, phone: form.phone } });
      setMsg("Perfil atualizado!");
      refetch();
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  async function handleChangePassword() {
    if (passForm.new !== passForm.confirm) {
      setMsg("As senhas nao coincidem");
      return;
    }
    if (passForm.new.length < 6) {
      setMsg("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    try {
      await updateProfile({
        variables: { currentPassword: passForm.current, newPassword: passForm.new },
      });
      setMsg("Senha alterada com sucesso!");
      setPassForm({ current: "", new: "", confirm: "" });
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Carregando...</p>;

  return (
    <Section title="Minha Conta">
      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${msg.includes("sucesso") || msg.includes("atualizado") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-[var(--text-secondary)]">Nome</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="text-sm text-[var(--text-secondary)]">Telefone</label>
          <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="text-sm text-[var(--text-secondary)]">Email</label>
          <input type="text" value={data?.me?.email || ""} disabled className="w-full mt-1 px-4 py-2 border border-[var(--border-light)] rounded-xl text-[var(--text-muted)] bg-[var(--bg-muted)]" />
        </div>
      </div>
      <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-50">
        {saving ? "Salvando..." : "Salvar perfil"}
      </button>

      <hr className="my-6 border-[var(--border-light)]" />
      <h3 className="font-semibold text-[var(--text-primary)] mb-3">Alterar senha</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm text-[var(--text-secondary)]">Senha atual</label>
          <input type="password" value={passForm.current} onChange={(e) => setPassForm({ ...passForm, current: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="text-sm text-[var(--text-secondary)]">Nova senha</label>
          <input type="password" value={passForm.new} onChange={(e) => setPassForm({ ...passForm, new: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="text-sm text-[var(--text-secondary)]">Confirmar nova senha</label>
          <input type="password" value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
        </div>
      </div>
      <button onClick={handleChangePassword} disabled={saving} className="px-6 py-2 bg-[var(--text-secondary)] text-white rounded-xl font-semibold hover:opacity-80 transition cursor-pointer disabled:opacity-50">
        Alterar senha
      </button>
    </Section>
  );
}

// ===== STORES SECTION =====
function StoresSection() {
  const { data, loading, refetch } = useQuery(GET_MY_STORES);
  const { data: planData } = useQuery(GET_MY_PLAN);
  const [createStore, { loading: creating }] = useMutation(CREATE_STORE);
  const [updateStore, { loading: updating }] = useMutation(UPDATE_STORE);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const mpConnected = planData?.me?.mpConnected ?? false;

  const [showCreate, setShowCreate] = useState(false);
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [form, setForm] = useState(emptyStoreForm());
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  const stores = data?.myStores || [];

  function emptyStoreForm() {
    return {
      name: "", description: "", phone: "",
      street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "",
      hasOwnDelivery: false, freeDelivery: false,
      estimatedDeliveryMinutes: "30", minimumOrder: "0",
      deliveryStartTime: "", deliveryEndTime: "", freeDeliveryAbove: "",
    };
  }

  function startEdit(store: any) {
    setEditingStore(store.id);
    setShowCreate(false);
    setForm({
      name: store.name || "", description: store.description || "", phone: store.phone || "",
      street: store.street || "", number: store.number || "", complement: store.complement || "",
      neighborhood: store.neighborhood || "", city: store.city || "", state: store.state || "", zipCode: store.zipCode || "",
      hasOwnDelivery: store.hasOwnDelivery || false, freeDelivery: store.freeDelivery || false,
      estimatedDeliveryMinutes: String(store.estimatedDeliveryMinutes || 30),
      minimumOrder: String(store.minimumOrder || 0),
      deliveryStartTime: store.deliveryStartTime || "", deliveryEndTime: store.deliveryEndTime || "",
      freeDeliveryAbove: store.freeDeliveryAbove ? String(store.freeDeliveryAbove) : "",
    });
    setLogoPreview(store.logoUrl || null);
    setBannerPreview(store.bannerUrl || null);
    setLogoBase64(null);
    setBannerBase64(null);
  }

  function startCreate() {
    setEditingStore(null);
    setShowCreate(true);
    setForm(emptyStoreForm());
    setLogoPreview(null);
    setBannerPreview(null);
    setLogoBase64(null);
    setBannerBase64(null);
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === "logo") { setLogoPreview(result); setLogoBase64(result); }
      else { setBannerPreview(result); setBannerBase64(result); }
    };
    reader.readAsDataURL(file);
  }

  async function uploadImg(base64: string | null, folder: string): Promise<string | undefined> {
    if (!base64) return undefined;
    try {
      const { data } = await uploadImage({ variables: { base64, folder: "stores" } });
      return data?.uploadImage;
    } catch { return undefined; }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const logoUrl = await uploadImg(logoBase64, "stores");
    const bannerUrl = await uploadImg(bannerBase64, "stores");

    const input: any = {
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
      estimatedDeliveryMinutes: parseInt(form.estimatedDeliveryMinutes),
      minimumOrder: parseFloat(form.minimumOrder),
      deliveryStartTime: form.deliveryStartTime || undefined,
      deliveryEndTime: form.deliveryEndTime || undefined,
      freeDeliveryAbove: form.freeDeliveryAbove ? parseFloat(form.freeDeliveryAbove) : undefined,
    };
    if (logoUrl) input.logoUrl = logoUrl;
    if (bannerUrl) input.bannerUrl = bannerUrl;

    try {
      if (editingStore) {
        input.id = editingStore;
        await updateStore({ variables: { input } });
        setMsg("Loja atualizada!");
      } else {
        await createStore({ variables: { input } });
        setMsg("Loja criada!");
      }
      refetch();
      setEditingStore(null);
      setShowCreate(false);
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  const isSubmitting = creating || updating;
  const isEditing = showCreate || editingStore;

  return (
    <Section title="Minhas Lojas">
      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${msg.includes("!") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </div>
      )}

      {/* Store list */}
      {!isEditing && (
        <>
          {loading ? (
            <p className="text-[var(--text-muted)] text-sm">Carregando...</p>
          ) : stores.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm mb-4">Nenhuma loja cadastrada.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {stores.map((store: any) => (
                <div key={store.id} className="flex items-center gap-4 p-4 border border-[var(--border-light)] rounded-xl hover:bg-[var(--bg-hover)] transition">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <span className="text-orange-500 text-xl font-bold">{store.name?.[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">{store.name}</p>
                    <p className="text-sm text-[var(--text-muted)] truncate">{store.city} - {store.state}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${store.isOpen ? "bg-green-100 text-green-700" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"}`}>
                    {store.isOpen ? "Aberta" : "Fechada"}
                  </span>
                  <button
                    onClick={() => startEdit(store)}
                    className="px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 rounded-xl transition cursor-pointer"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={startCreate}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer"
          >
            + Nova loja
          </button>
        </>
      )}

      {/* Create / Edit form */}
      {isEditing && (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--text-primary)]">{editingStore ? "Editar loja" : "Nova loja"}</h3>
            <button type="button" onClick={() => { setShowCreate(false); setEditingStore(null); }} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
              Cancelar
            </button>
          </div>

          <div className="space-y-4">
            {/* Logo + Banner */}
            <div className="flex gap-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Logo</label>
                <div onClick={() => logoRef.current?.click()} className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-orange-400 transition overflow-hidden">
                  {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-[var(--text-muted)] text-2xl">+</span>}
                </div>
                <input ref={logoRef} type="file" accept="image/*" onChange={(e) => handleImage(e, "logo")} className="hidden" />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-500 mb-1 block">Banner</label>
                <div onClick={() => bannerRef.current?.click()} className="w-full h-20 rounded-2xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-orange-400 transition overflow-hidden">
                  {bannerPreview ? <img src={bannerPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-[var(--text-muted)]">+ Banner</span>}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" onChange={(e) => handleImage(e, "banner")} className="hidden" />
              </div>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Nome da loja" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] col-span-2 focus:outline-none focus:border-orange-400" required />
              <input type="text" placeholder="Descricao" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] col-span-2 focus:outline-none focus:border-orange-400" />
              <input type="text" placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
            </div>

            {/* Address */}
            <h4 className="font-semibold text-[var(--text-secondary)] text-sm pt-2">Endereco</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Rua" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
              <input type="text" placeholder="Numero" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
              <input type="text" placeholder="Complemento" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
              <input type="text" placeholder="Bairro" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
              <input type="text" placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
              <input type="text" placeholder="Estado" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
              <input type="text" placeholder="CEP" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
            </div>

            {/* Delivery */}
            <h4 className="font-semibold text-[var(--text-secondary)] text-sm pt-2">Entrega</h4>
            <Toggle value={form.hasOwnDelivery} onChange={() => setForm({ ...form, hasOwnDelivery: !form.hasOwnDelivery })} label={form.hasOwnDelivery ? "Entrega propria" : "Entregadores do app"} />
            {!form.hasOwnDelivery && !mpConnected && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-700 font-medium">
                Para usar entregadores do app, conecte sua conta Mercado Pago.
              </div>
            )}

            <Toggle value={form.freeDelivery} onChange={() => setForm({ ...form, freeDelivery: !form.freeDelivery })} label="Entrega gratis" />

            {!form.freeDelivery && (
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Entrega gratis acima de (R$)</label>
                <input type="number" step="0.01" placeholder="Opcional" value={form.freeDeliveryAbove} onChange={(e) => setForm({ ...form, freeDeliveryAbove: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Horario inicio entregas</label>
                <input type="time" value={form.deliveryStartTime} onChange={(e) => setForm({ ...form, deliveryStartTime: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Horario fim entregas</label>
                <input type="time" value={form.deliveryEndTime} onChange={(e) => setForm({ ...form, deliveryEndTime: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
              </div>
            </div>

            {form.hasOwnDelivery && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--text-secondary)]">Tempo estimado (min)</label>
                  <input type="number" value={form.estimatedDeliveryMinutes} onChange={(e) => setForm({ ...form, estimatedDeliveryMinutes: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)]">Pedido minimo (R$)</label>
                  <input type="number" step="0.01" value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
                </div>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="mt-2 w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition">
              {isSubmitting ? "Salvando..." : editingStore ? "Salvar alteracoes" : "Criar loja"}
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}

// ===== APPEARANCE SECTION =====
function AppearanceSection() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Section title="Aparencia">
      <Toggle value={isDark} onChange={toggleTheme} label={isDark ? "Modo escuro ativado" : "Modo claro"} />
    </Section>
  );
}

// ===== CONTRACTS SECTION =====
function ContractsSection() {
  const { data } = useQuery(GET_MY_PLAN);
  const [viewingTerms, setViewingTerms] = useState<"terms" | "subscription" | null>(null);

  const acceptedTermsAt = data?.me?.acceptedTermsAt;
  const acceptedSubAt = data?.me?.acceptedSubscriptionTermsAt;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <Section title="Contratos e Termos">
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 border border-[var(--border-light)] rounded-xl">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Termos de Uso da Plataforma</p>
            {acceptedTermsAt ? (
              <p className="text-xs text-green-600 mt-1">Aceito em {formatDate(acceptedTermsAt)}</p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] mt-1">Ainda n&atilde;o aceito</p>
            )}
          </div>
          <button
            onClick={() => setViewingTerms("terms")}
            className="px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 rounded-xl transition cursor-pointer"
          >
            Visualizar
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border border-[var(--border-light)] rounded-xl">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Contrato de Assinatura de Plano</p>
            {acceptedSubAt ? (
              <p className="text-xs text-green-600 mt-1">Aceito em {formatDate(acceptedSubAt)}</p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] mt-1">Ainda n&atilde;o aceito</p>
            )}
          </div>
          <button
            onClick={() => setViewingTerms("subscription")}
            className="px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 rounded-xl transition cursor-pointer"
          >
            Visualizar
          </button>
        </div>
      </div>

      {viewingTerms && (
        <TermsModal
          type={viewingTerms}
          readOnly
          onClose={() => setViewingTerms(null)}
          userName={data?.me?.name}
          userCpf={data?.me?.cpf}
        />
      )}
    </Section>
  );
}

// ===== MAIN PAGE =====
export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Configuracoes</h1>
      <ProfileSection />
      <StoresSection />
      <ContractsSection />
      <AppearanceSection />
    </div>
  );
}
