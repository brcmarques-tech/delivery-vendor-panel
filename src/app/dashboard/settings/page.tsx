"use client";

import { useMutation, useQuery, useLazyQuery } from "@apollo/client";
import {
  CREATE_STORE, UPDATE_STORE, UPLOAD_IMAGE, GET_MY_STORES,
  GET_MY_PROFILE, UPDATE_PROFILE, GET_MY_PLAN, GET_BADGE_CONFIG,
  CLAIM_BADGE_REWARD, GET_MP_CONNECT_URL, DISCONNECT_MP,
  SEND_EMAIL_VERIFICATION, CONFIRM_EMAIL_VERIFICATION,
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
  const [sendEmailVerification] = useMutation(SEND_EMAIL_VERIFICATION);
  const [confirmEmailVerification] = useMutation(CONFIRM_EMAIL_VERIFICATION);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [passForm, setPassForm] = useState({ current: "", new: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailVerifyMsg, setEmailVerifyMsg] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (data?.meVendor) {
      setForm({ name: data.meVendor.name || "", phone: data.meVendor.phone || "", email: data.meVendor.email || "" });
    }
  }, [data]);

  async function handleSaveProfile() {
    try {
      const vars: any = { name: form.name, phone: form.phone };
      if (form.email !== data?.meVendor?.email) vars.email = form.email;
      await updateProfile({ variables: vars });
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

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleSendEmailCode() {
    setSendingCode(true);
    setEmailVerifyMsg("");
    try {
      await sendEmailVerification({ variables: { userType: "vendor" } });
      setShowEmailVerify(true);
      setEmailCode("");
      setResendTimer(60);
      setEmailVerifyMsg("Codigo enviado para seu email!");
    } catch (err: any) {
      setEmailVerifyMsg(err.message);
    } finally {
      setSendingCode(false);
    }
  }

  async function handleConfirmEmailCode() {
    if (emailCode.length !== 6) {
      setEmailVerifyMsg("Digite o codigo de 6 digitos");
      return;
    }
    setVerifyingCode(true);
    setEmailVerifyMsg("");
    try {
      await confirmEmailVerification({ variables: { code: emailCode, userType: "vendor" } });
      setShowEmailVerify(false);
      setEmailCode("");
      setEmailVerifyMsg("");
      refetch();
    } catch (err: any) {
      setEmailVerifyMsg(err.message);
    } finally {
      setVerifyingCode(false);
    }
  }

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Carregando...</p>;

  const emailVerified = data?.meVendor?.emailVerified;
  const isGoogleAccount = !!data?.meVendor?.googleId;

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
          <div className="flex items-center gap-2 mt-1">
            {isGoogleAccount ? (
              <div className="flex-1 flex items-center gap-2 px-4 py-2 border border-[var(--border-light)] rounded-xl bg-[var(--bg-muted)]">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="text-[var(--text-muted)]">{data?.meVendor?.email}</span>
              </div>
            ) : (
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
            )}
            {emailVerified ? (
              <span className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium whitespace-nowrap">
                ✓ Verificado
              </span>
            ) : (
              <button
                onClick={handleSendEmailCode}
                disabled={sendingCode}
                className="px-3 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {sendingCode ? "Enviando..." : "Verificar email"}
              </button>
            )}
          </div>
          {showEmailVerify && !emailVerified && (
            <div className="mt-3 p-4 border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 rounded-xl">
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Digite o codigo de 6 digitos enviado para <strong>{data?.meVendor?.email}</strong>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-32 px-4 py-2 border border-[var(--border-color)] rounded-xl text-center text-lg font-mono tracking-widest bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-orange-400"
                />
                <button
                  onClick={handleConfirmEmailCode}
                  disabled={verifyingCode}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition cursor-pointer disabled:opacity-50"
                >
                  {verifyingCode ? "Verificando..." : "Confirmar"}
                </button>
                <button
                  onClick={handleSendEmailCode}
                  disabled={sendingCode || resendTimer > 0}
                  className="px-4 py-2 text-orange-500 text-sm font-medium hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                >
                  {resendTimer > 0 ? `Reenviar (${resendTimer}s)` : "Reenviar"}
                </button>
              </div>
              {emailVerifyMsg && (
                <p className={`mt-2 text-sm ${emailVerifyMsg.includes("enviado") ? "text-green-600" : "text-red-500"}`}>
                  {emailVerifyMsg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-50">
        {saving ? "Salvando..." : "Salvar perfil"}
      </button>

      {!isGoogleAccount && (
        <>
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
        </>
      )}
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
  const mpConnected = planData?.meVendor?.mpConnected ?? false;

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

// ===== VERIFICATION BADGE SECTION =====
const BADGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; emoji: string; progressColor: string }> = {
  NONE:    { label: "Sem medalha", color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/30", emoji: "",   progressColor: "#d97706" },
  BRONZE:  { label: "Bronze",     color: "text-amber-600",   bg: "bg-amber-500/10",  border: "border-amber-500/30", emoji: "🥉", progressColor: "#d97706" },
  SILVER:  { label: "Prata",      color: "text-gray-300",    bg: "bg-gray-400/10",   border: "border-gray-400/30", emoji: "🥈", progressColor: "#9ca3af" },
  GOLD:    { label: "Ouro",       color: "text-yellow-400",  bg: "bg-yellow-500/10", border: "border-yellow-500/30", emoji: "🥇", progressColor: "#eab308" },
  DIAMOND: { label: "Diamante",   color: "text-cyan-400",    bg: "bg-cyan-500/10",   border: "border-cyan-500/30", emoji: "💎", progressColor: "#06b6d4" },
};

const LEVELS_ORDER = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];

const REWARD_LABELS: Record<string, { label: string; suffix: string; type: string }> = {
  freePromoDays:        { label: "Dias de promocao gratis", suffix: "dias",   type: "sempre" },
  commissionReduction:  { label: "Reducao de comissao",     suffix: "% (1 semana)", type: "sempre" },
  freeTrialDays:        { label: "Trial gratis",            suffix: "dias",   type: "1a vez" },
  subscriptionDiscount: { label: "Desconto na assinatura",  suffix: "%",      type: "da 2a em diante" },
  couponValue:          { label: "Cupom de desconto",       suffix: "%",      type: "da 2a em diante" },
};

function VerificationSection() {
  const { data, refetch } = useQuery(GET_MY_STORES);
  const { data: badgeData } = useQuery(GET_BADGE_CONFIG);
  const [claimBadge, { loading: claiming }] = useMutation(CLAIM_BADGE_REWARD);
  const [prizesModal, setPrizesModal] = useState<any>(null);
  const [claimModal, setClaimModal] = useState<any>(null);
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState("");
  const stores = data?.myStores || [];

  // Parse dynamic config from API
  let thresholds: Record<string, number> = { BRONZE: 20, SILVER: 100, GOLD: 300, DIAMOND: 1000 };
  let pointsCfg: Record<string, number> = { PER_PRODUCT: 2, PER_SALE: 5, PER_MONTH_ACTIVE: 3 };
  let rewardsCfg: Record<string, Record<string, number>> = {};

  if (badgeData?.badgeConfig) {
    try {
      const parsed = JSON.parse(badgeData.badgeConfig);
      thresholds = parsed.thresholds || thresholds;
      pointsCfg = parsed.points || pointsCfg;
      rewardsCfg = parsed.rewards || {};
    } catch {}
  }

  function getNextLevel(current: string): { level: string; threshold: number } | null {
    const idx = LEVELS_ORDER.indexOf(current);
    const nextKey = idx === -1 ? LEVELS_ORDER[0] : LEVELS_ORDER[idx + 1];
    if (!nextKey) return null;
    return { level: nextKey, threshold: thresholds[nextKey] || 0 };
  }

  function getActiveRewards(level: string): Record<string, number> {
    return rewardsCfg[level] || {};
  }

  function hasAnyReward(rewards: Record<string, number>): boolean {
    return Object.values(rewards).some((v) => v > 0);
  }

  function getClaimablePoints(store: any): number {
    return (store.verificationScore || 0) - (store.lastClaimedScore || 0);
  }

  function getClaimableLevels(store: any): { level: string; threshold: number; canClaim: boolean }[] {
    const claimable = getClaimablePoints(store);
    return LEVELS_ORDER.map((lvl) => ({
      level: lvl,
      threshold: thresholds[lvl] || 0,
      canClaim: claimable >= (thresholds[lvl] || 0),
    }));
  }

  async function handleClaim(storeId: string, level: string) {
    try {
      await claimBadge({ variables: { storeId, level } });
      setClaimMsg("Premio resgatado com sucesso!");
      refetch();
      setTimeout(() => { setClaimMsg(""); setClaimModal(null); }, 2000);
    } catch (err: any) {
      setClaimMsg(err.message);
      setTimeout(() => setClaimMsg(""), 4000);
    }
  }

  if (stores.length === 0) return null;

  return (
    <Section title="Selo de Verificacao">
      <div className="space-y-4">
        {stores.map((store: any) => {
          const level = store.verificationLevel || "NONE";
          const score = store.verificationScore || 0;
          const badge = BADGE_CONFIG[level] || BADGE_CONFIG.NONE;
          const next = getNextLevel(level);
          const progressPercent = next ? Math.min((score / next.threshold) * 100, 100) : 100;
          const currentRewards = getActiveRewards(level);
          const hasRewards = level !== "NONE" && hasAnyReward(currentRewards);
          const claimablePoints = getClaimablePoints(store);
          const hasClaimable = getClaimableLevels(store).some((l) => l.canClaim);
          const claimCount = store.badgeClaimCount || 0;

          // Active benefits
          const hasActiveCommission =
            Number(store.commissionReductionPercent) > 0 &&
            store.commissionReductionExpiresAt &&
            new Date(store.commissionReductionExpiresAt) > new Date();
          const freePromoDays = store.freePromoDaysCredit || 0;

          return (
            <div key={store.id} className={`p-4 rounded-xl border ${badge.border} ${badge.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{badge.emoji || "⭕"}</span>
                  <div>
                    <p className={`font-bold text-base ${badge.color}`}>{badge.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{store.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--text-primary)]">{score} pts</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {store.totalSales || 0} vendas &middot; {store.totalProducts || 0} produtos
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {next ? (
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>Proximo: {BADGE_CONFIG[next.level]?.emoji} {BADGE_CONFIG[next.level]?.label}</span>
                    <span>{score}/{next.threshold} pts</span>
                  </div>
                  <div className="w-full h-2.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%`, background: badge.progressColor }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">Nivel maximo atingido!</p>
              )}

              {/* Active benefits banner */}
              {(freePromoDays > 0 || hasActiveCommission) && (
                <div className="mt-3 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs font-semibold text-green-600 mb-1">Beneficios ativos</p>
                  <div className="flex flex-wrap gap-2">
                    {freePromoDays > 0 && (
                      <span className="text-xs bg-green-500/20 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {freePromoDays} dias promo gratis
                      </span>
                    )}
                    {hasActiveCommission && (
                      <span className="text-xs bg-green-500/20 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        -{Number(store.commissionReductionPercent)}% comissao (ate {new Date(store.commissionReductionExpiresAt).toLocaleDateString("pt-BR")})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* How to earn */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-[var(--bg-muted)]">
                  <p className="text-xs text-[var(--text-muted)]">Por produto</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">+{pointsCfg.PER_PRODUCT} pts</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-muted)]">
                  <p className="text-xs text-[var(--text-muted)]">Por venda</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">+{pointsCfg.PER_SALE} pts</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-muted)]">
                  <p className="text-xs text-[var(--text-muted)]">Por mes ativo</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">+{pointsCfg.PER_MONTH_ACTIVE} pts</p>
                </div>
              </div>

              {/* Levels overview */}
              <div className="mt-3 flex gap-2 flex-wrap justify-center">
                {LEVELS_ORDER.map((key) => {
                  const b = BADGE_CONFIG[key];
                  const lvlRewards = getActiveRewards(key);
                  const hasR = hasAnyReward(lvlRewards);
                  return (
                    <div
                      key={key}
                      className="relative"
                      onMouseEnter={() => setHoveredLevel(key)}
                      onMouseLeave={() => setHoveredLevel(null)}
                      onClick={() => hasR && setHoveredLevel(hoveredLevel === key ? null : key)}
                    >
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold cursor-default ${
                          level === key ? `${b.bg} ${b.color} ring-1 ring-current` : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                        }`}
                      >
                        {b.emoji} {thresholds[key]} pts
                      </span>

                      {hoveredLevel === key && hasR && (
                        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-xl">
                          <p className={`text-xs font-bold mb-2 ${b.color}`}>{b.emoji} {b.label} — Premios</p>
                          <div className="space-y-1">
                            {Object.entries(REWARD_LABELS).map(([rKey, meta]) => {
                              const val = lvlRewards[rKey] ?? 0;
                              if (val <= 0) return null;
                              return (
                                <div key={rKey} className="flex justify-between text-xs gap-1">
                                  <span className="text-[var(--text-muted)]">{meta.label}</span>
                                  <span className="text-[var(--text-primary)] font-semibold shrink-0">
                                    {val} {meta.suffix}
                                    <span className="text-[10px] text-[var(--text-muted)] ml-1">({meta.type})</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-[var(--bg-card)] border-r border-b border-[var(--border-color)] rotate-45" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Claimable points + Claim button */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--text-muted)]">
                  Pontos resgatáveis: <span className="font-bold text-[var(--text-primary)]">{claimablePoints}</span>
                  {claimCount > 0 && <span className="ml-1">({claimCount}x resgatado)</span>}
                </p>
                {hasClaimable && (
                  <button
                    onClick={() => setClaimModal(store)}
                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition cursor-pointer"
                  >
                    Resgatar premio
                  </button>
                )}
              </div>

              {/* Prizes button */}
              {hasRewards && (
                <button
                  onClick={() => setPrizesModal({ store, level, rewards: currentRewards })}
                  className="mt-2 w-full py-2 bg-orange-500/10 text-orange-500 rounded-lg text-sm font-semibold hover:bg-orange-500/20 transition cursor-pointer"
                >
                  Ver premios do nivel
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Claim Modal */}
      {claimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setClaimModal(null); setClaimMsg(""); }}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Resgatar Premio</h3>
              <button onClick={() => { setClaimModal(null); setClaimMsg(""); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">&#10005;</button>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-1">
              Pontos disponiveis: <span className="font-bold text-[var(--text-primary)]">{getClaimablePoints(claimModal)}</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {claimModal.badgeClaimCount === 0 ? "1a conquista: trial + dias promo + reducao comissao" : "Premios: dias promo + reducao comissao + desc. assinatura + cupom"}
            </p>

            {claimMsg && (
              <div className={`mb-3 p-2.5 rounded-lg text-sm font-medium ${claimMsg.includes("sucesso") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {claimMsg}
              </div>
            )}

            <div className="space-y-2">
              {getClaimableLevels(claimModal).map(({ level: lvl, threshold, canClaim }) => {
                const b = BADGE_CONFIG[lvl];
                const rewards = getActiveRewards(lvl);
                const isFirst = claimModal.badgeClaimCount === 0;
                return (
                  <button
                    key={lvl}
                    disabled={!canClaim || claiming}
                    onClick={() => handleClaim(claimModal.id, lvl)}
                    className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                      canClaim
                        ? `${b.bg} ${b.border} hover:ring-2 hover:ring-orange-400`
                        : "bg-[var(--bg-muted)] border-[var(--border-light)] opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-sm ${canClaim ? b.color : "text-[var(--text-muted)]"}`}>
                        {b.emoji} {b.label} ({threshold} pts)
                      </span>
                      {canClaim && <span className="text-xs text-orange-500 font-semibold">Resgatar</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {Object.entries(REWARD_LABELS).map(([rKey, meta]) => {
                        const val = rewards[rKey] ?? 0;
                        if (val <= 0) return null;
                        // Skip rewards that don't apply based on claim count
                        if (isFirst && meta.type === "da 2a em diante") return null;
                        if (!isFirst && meta.type === "1a vez") return null;
                        return (
                          <span key={rKey} className="text-[10px] text-[var(--text-muted)]">
                            {meta.label}: <span className="font-semibold text-[var(--text-primary)]">{val}{meta.suffix.includes("%") ? "%" : ` ${meta.suffix}`}</span>
                          </span>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Prizes Modal */}
      {prizesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPrizesModal(null)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{BADGE_CONFIG[prizesModal.level]?.emoji}</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Premios do Nivel</h3>
                  <p className="text-sm text-[var(--text-muted)]">{prizesModal.store.name} — {BADGE_CONFIG[prizesModal.level]?.label}</p>
                </div>
              </div>
              <button onClick={() => setPrizesModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer text-lg">&#10005;</button>
            </div>

            <div className="space-y-2.5">
              {Object.entries(REWARD_LABELS).map(([key, meta]) => {
                const val = prizesModal.rewards[key] ?? 0;
                const active = val > 0;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      active
                        ? "border-orange-500/30 bg-orange-500/5"
                        : "border-[var(--border-light)] bg-[var(--bg-muted)] opacity-40"
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                        {meta.label}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">{meta.type}</p>
                    </div>
                    {active ? (
                      <p className="text-sm font-bold text-orange-500">{val} {meta.suffix}</p>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)]">—</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next level preview */}
            {(() => {
              const nextLvl = LEVELS_ORDER[LEVELS_ORDER.indexOf(prizesModal.level) + 1];
              if (!nextLvl) return null;
              const nextRewards = rewardsCfg[nextLvl] || {};
              const nextBadge = BADGE_CONFIG[nextLvl];
              if (!hasAnyReward(nextRewards)) return null;
              return (
                <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    Proximo nivel: {nextBadge.emoji} <span className={nextBadge.color}>{nextBadge.label}</span> ({thresholds[nextLvl]} pts)
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(REWARD_LABELS).map(([key, meta]) => {
                      const current = prizesModal.rewards[key] ?? 0;
                      const nextVal = nextRewards[key] ?? 0;
                      if (nextVal <= 0) return null;
                      const improvement = nextVal - current;
                      return (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">{meta.label}</span>
                          <span>
                            <span className="text-[var(--text-primary)] font-semibold">{nextVal} {meta.suffix}</span>
                            {improvement > 0 && <span className="text-green-500 ml-1">(+{improvement})</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setPrizesModal(null)}
              className="mt-5 w-full py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

// ===== CONTRACTS SECTION =====
function ContractsSection() {
  const { data } = useQuery(GET_MY_PLAN);
  const [viewingTerms, setViewingTerms] = useState<"terms" | "subscription" | null>(null);

  const acceptedTermsAt = data?.meVendor?.acceptedTermsAt;
  const acceptedSubAt = data?.meVendor?.acceptedSubscriptionTermsAt;

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
          userName={data?.meVendor?.name}
          userCpf={data?.meVendor?.cpf}
        />
      )}
    </Section>
  );
}

// ===== MAIN PAGE =====
// ===== MERCADO PAGO SECTION =====
function MercadoPagoSection() {
  const { data: planData, refetch: refetchPlan } = useQuery(GET_MY_PLAN);
  const { data: storesData } = useQuery(GET_MY_STORES);
  const [getMpConnectUrl, { loading: mpUrlLoading }] = useLazyQuery(GET_MP_CONNECT_URL, { fetchPolicy: "network-only" });
  const [disconnectMp, { loading: disconnecting }] = useMutation(DISCONNECT_MP);

  const mpConnected = planData?.meVendor?.mpConnected ?? false;
  const stores = storesData?.myStores || [];

  if (stores.length === 0) return null;

  async function handleConnectMp() {
    const { data: urlData } = await getMpConnectUrl();
    const url = urlData?.mpConnectUrl;
    if (url) window.location.href = url;
  }

  async function handleDisconnectMp() {
    await disconnectMp();
    refetchPlan();
  }

  return (
    <Section title="Mercado Pago">
      {!mpConnected ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Conecte sua conta do Mercado Pago para aceitar pagamentos via PIX, cartão de crédito e débito.
            Sem conexão, sua loja só aceita pagamento na entrega.
          </p>
          <ul className="space-y-1 text-sm text-[var(--text-muted)]">
            <li>• Receba pagamentos diretamente na sua conta</li>
            <li>• Aceite PIX, cartão de crédito e débito</li>
            <li>• Habilite entregadores autônomos do app</li>
          </ul>
          <button
            onClick={handleConnectMp}
            disabled={mpUrlLoading}
            className="px-6 py-3 bg-[#009ee3] text-white rounded-xl font-bold cursor-pointer hover:bg-[#0087c9] active:scale-95 disabled:opacity-50 transition"
          >
            {mpUrlLoading ? "Carregando..." : "Conectar Mercado Pago"}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <div>
              <p className="font-semibold text-green-700 text-sm">Conta conectada</p>
              <p className="text-green-600 text-xs">Você recebe pagamentos diretamente na sua conta.</p>
            </div>
          </div>
          <button
            onClick={handleDisconnectMp}
            disabled={disconnecting}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-semibold cursor-pointer hover:bg-red-50 disabled:opacity-50 transition"
          >
            {disconnecting ? "..." : "Desconectar"}
          </button>
        </div>
      )}
    </Section>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Configuracoes</h1>
      <ProfileSection />
      <StoresSection />
      <MercadoPagoSection />
      <VerificationSection />
      <ContractsSection />
      <AppearanceSection />
    </div>
  );
}
