"use client";

import { useState, useRef } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_STORE, UPLOAD_IMAGE, GET_MY_STORES } from "@/lib/graphql";

interface CreateStoreModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

function emptyForm() {
  return {
    name: "", description: "", phone: "",
    street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "",
    hasOwnDelivery: false, freeDelivery: false,
    estimatedDeliveryMinutes: "30", minimumOrder: "0",
    deliveryStartTime: "", deliveryEndTime: "", freeDeliveryAbove: "",
  };
}

export default function CreateStoreModal({ open, onClose, onCreated }: CreateStoreModalProps) {
  const [createStore, { loading }] = useMutation(CREATE_STORE, {
    refetchQueries: [{ query: GET_MY_STORES }],
  });
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const [form, setForm] = useState(emptyForm());
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

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

  async function uploadImg(base64: string | null): Promise<string | undefined> {
    if (!base64) return undefined;
    try {
      const { data } = await uploadImage({ variables: { base64, folder: "stores" } });
      return data?.uploadImage;
    } catch { return undefined; }
  }

  function validateStep1() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Preencha o nome e telefone da loja.");
      return false;
    }
    setError("");
    return true;
  }

  function validateStep2() {
    if (!form.street.trim() || !form.number.trim() || !form.neighborhood.trim() || !form.city.trim() || !form.state.trim() || !form.zipCode.trim()) {
      setError("Preencha todos os campos obrigatórios do endereço.");
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit() {
    setError("");
    const logoUrl = await uploadImg(logoBase64);
    const bannerUrl = await uploadImg(bannerBase64);

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
      await createStore({ variables: { input } });
      setForm(emptyForm());
      setStep(1);
      setLogoPreview(null);
      setBannerPreview(null);
      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err?.graphQLErrors?.[0]?.message || err?.message || "Erro ao criar loja.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Criar loja</h2>
            <p className="text-sm text-[var(--text-secondary)]">Etapa {step} de 3</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer text-2xl leading-none">&times;</button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--bg-muted)]">
          <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>
          )}

          {/* Step 1: Info básica */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Informações da loja</h3>

              {/* Logo + Banner */}
              <div className="flex gap-4">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">Logo</label>
                  <div onClick={() => logoRef.current?.click()} className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-orange-400 transition overflow-hidden">
                    {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-[var(--text-muted)] text-2xl">+</span>}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" onChange={(e) => handleImage(e, "logo")} className="hidden" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">Banner</label>
                  <div onClick={() => bannerRef.current?.click()} className="w-full h-20 rounded-2xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-orange-400 transition overflow-hidden">
                    {bannerPreview ? <img src={bannerPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-[var(--text-muted)]">+ Banner</span>}
                  </div>
                  <input ref={bannerRef} type="file" accept="image/*" onChange={(e) => handleImage(e, "banner")} className="hidden" />
                </div>
              </div>

              <input type="text" placeholder="Nome da loja *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
              <input type="text" placeholder="Descrição (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
              <input type="tel" placeholder="Telefone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />

              <button onClick={() => validateStep1() && setStep(2)}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
                Próximo
              </button>
            </div>
          )}

          {/* Step 2: Endereço */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Endereço</h3>

              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Rua *" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })}
                  className="col-span-2 px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
                <input type="text" placeholder="Número *" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
                  className="px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
                <input type="text" placeholder="Complemento" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })}
                  className="px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
                <input type="text" placeholder="Bairro *" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  className="col-span-2 px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
                <input type="text" placeholder="Cidade *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
                <input type="text" placeholder="Estado *" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
                <input type="text" placeholder="CEP *" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                  className="col-span-2 px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition">
                  Voltar
                </button>
                <button onClick={() => validateStep2() && setStep(3)}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Entrega */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Configurações de entrega</h3>

              <div className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded-xl">
                <span className="text-sm text-[var(--text-primary)]">{form.hasOwnDelivery ? "Entrega própria" : "Entregadores do app"}</span>
                <button type="button" onClick={() => setForm({ ...form, hasOwnDelivery: !form.hasOwnDelivery })}
                  className={`w-12 h-6 rounded-full transition cursor-pointer ${form.hasOwnDelivery ? "bg-orange-500" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.hasOwnDelivery ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded-xl">
                <span className="text-sm text-[var(--text-primary)]">Entrega grátis</span>
                <button type="button" onClick={() => setForm({ ...form, freeDelivery: !form.freeDelivery })}
                  className={`w-12 h-6 rounded-full transition cursor-pointer ${form.freeDelivery ? "bg-orange-500" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.freeDelivery ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              {!form.freeDelivery && (
                <input type="number" step="0.01" placeholder="Entrega grátis acima de R$ (opcional)" value={form.freeDeliveryAbove} onChange={(e) => setForm({ ...form, freeDeliveryAbove: e.target.value })}
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">Horário início</label>
                  <input type="time" value={form.deliveryStartTime} onChange={(e) => setForm({ ...form, deliveryStartTime: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">Horário fim</label>
                  <input type="time" value={form.deliveryEndTime} onChange={(e) => setForm({ ...form, deliveryEndTime: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
                </div>
              </div>

              {form.hasOwnDelivery && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1 block">Tempo estimado (min)</label>
                    <input type="number" value={form.estimatedDeliveryMinutes} onChange={(e) => setForm({ ...form, estimatedDeliveryMinutes: e.target.value })}
                      className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1 block">Pedido mínimo (R$)</label>
                    <input type="number" step="0.01" value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })}
                      className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition">
                  Voltar
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition">
                  {loading ? "Criando..." : "Criar loja"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
