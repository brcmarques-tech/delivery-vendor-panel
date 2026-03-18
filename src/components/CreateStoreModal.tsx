"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMutation } from "@apollo/client";
import { CREATE_STORE, UPDATE_STORE, UPLOAD_IMAGE, GET_MY_STORES } from "@/lib/graphql";
import "leaflet/dist/leaflet.css";

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

// Mapa carregado client-side com marker arrastável
const StoreLocationMap = dynamic(() => import("./StoreLocationMap"), { ssr: false });

interface StoreData {
  id: string;
  name?: string;
  description?: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  hasOwnDelivery?: boolean;
  freeDelivery?: boolean;
  estimatedDeliveryMinutes?: number;
  minimumOrder?: number;
  deliveryStartTime?: string;
  deliveryEndTime?: string;
  freeDeliveryAbove?: number;
  logoUrl?: string;
  bannerUrl?: string;
  latitude?: number;
  longitude?: number;
}

interface CreateStoreModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  store?: StoreData | null;
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

function storeToForm(store: StoreData) {
  return {
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
  };
}

export default function CreateStoreModal({ open, onClose, onCreated, store }: CreateStoreModalProps) {
  const isEdit = !!store;

  const [createStore, { loading: creating }] = useMutation(CREATE_STORE, {
    refetchQueries: [{ query: GET_MY_STORES }],
  });
  const [updateStore, { loading: updating }] = useMutation(UPDATE_STORE, {
    refetchQueries: [{ query: GET_MY_STORES }],
  });
  const [uploadImage] = useMutation(UPLOAD_IMAGE);

  const [form, setForm] = useState(emptyForm());
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  // Guarda o endereço original para detectar se mudou (evita geocoding desnecessário)
  const originalAddressRef = useRef<string>("");
  const savedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Initialize form when store changes (edit mode) or when opening
  useEffect(() => {
    if (open && store) {
      setForm(storeToForm(store));
      setLogoPreview(store.logoUrl || null);
      setBannerPreview(store.bannerUrl || null);
      setLogoBase64(null);
      setBannerBase64(null);
      const coords = (store.latitude && store.longitude)
        ? { lat: Number(store.latitude), lng: Number(store.longitude) }
        : null;
      setMapCoords(coords);
      savedCoordsRef.current = coords;
      originalAddressRef.current = `${store.street}|${store.number}|${store.neighborhood}|${store.city}|${store.state}|${store.zipCode}`;
      setStep(1);
      setError("");
    } else if (open && !store) {
      setForm(emptyForm());
      setLogoPreview(null);
      setBannerPreview(null);
      setLogoBase64(null);
      setBannerBase64(null);
      setMapCoords(null);
      savedCoordsRef.current = null;
      originalAddressRef.current = "";
      setStep(1);
      setError("");
    }
  }, [open, store]);

  async function handleCepChange(value: string) {
    const cleaned = value.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, zipCode: cleaned }));
    if (cleaned.length === 8) {
      setFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            complement: data.complemento || prev.complement,
          }));
        }
      } catch {
        // silently fail - user can fill manually
      } finally {
        setFetchingCep(false);
      }
    }
  }

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

  async function nominatimStructured(street: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
    const params = new URLSearchParams({
      format: "json",
      street,
      city,
      state,
      country: "Brazil",
      limit: "1",
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "Accept-Language": "pt-BR", "User-Agent": "bcmtech-delivery/1.0" },
    });
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  }

  async function nominatimFree(query: string): Promise<{ lat: number; lng: number } | null> {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`,
      { headers: { "Accept-Language": "pt-BR", "User-Agent": "bcmtech-delivery/1.0" } },
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  }

  async function geocodeAndShowMap() {
    if (!validateStep2()) return;

    // Se editando e o endereço não mudou, usa as coordenadas salvas direto
    const currentAddress = `${form.street}|${form.number}|${form.neighborhood}|${form.city}|${form.state}|${form.zipCode}`;
    if (savedCoordsRef.current && currentAddress === originalAddressRef.current) {
      setMapCoords(savedCoordsRef.current);
      setStep(3);
      return;
    }

    setGeocoding(true);
    setError("");
    try {
      let coords = await nominatimStructured(`${form.number} ${form.street}`, form.city, form.state);
      if (!coords) coords = await nominatimStructured(form.street, form.city, form.state);
      if (!coords && form.zipCode) coords = await nominatimFree(`${form.zipCode}, ${form.city}, Brasil`);
      if (!coords) coords = await nominatimFree(`${form.street} ${form.number}, ${form.neighborhood}, ${form.city}, ${form.state}`);
      if (!coords) coords = await nominatimFree(`${form.city}, ${form.state}, Brasil`);

      if (coords) {
        setMapCoords(coords);
        setStep(3);
      } else {
        setError("Não foi possível localizar o endereço no mapa. Verifique os dados.");
      }
    } catch {
      setError("Erro ao buscar localização. Tente novamente.");
    } finally {
      setGeocoding(false);
    }
  }

  const loading = creating || updating;

  async function handleSubmit() {
    if (submitting || loading) return;
    setSubmitting(true);
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
      ...(mapCoords ? { latitude: mapCoords.lat, longitude: mapCoords.lng } : {}),
    };
    if (logoUrl) input.logoUrl = logoUrl;
    if (bannerUrl) input.bannerUrl = bannerUrl;

    try {
      if (isEdit && store) {
        input.id = store.id;
        await updateStore({ variables: { input } });
      } else {
        await createStore({ variables: { input } });
      }
      setSubmitting(false);
      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err?.graphQLErrors?.[0]?.message || err?.message || (isEdit ? "Erro ao salvar." : "Erro ao criar loja."));
      setSubmitting(false);
    }
  }

  const title = isEdit ? "Editar loja" : "Criar loja";
  const submitLabel = isEdit
    ? (submitting || loading ? "Salvando..." : "Salvar")
    : (submitting || loading ? "Criando..." : "Criar loja");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
            <p className="text-sm text-[var(--text-secondary)]">Etapa {step} de 4</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer text-2xl leading-none">&times;</button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--bg-muted)]">
          <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
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
                <div className="col-span-2 relative">
                  <input type="text" placeholder="CEP *" value={form.zipCode} onChange={(e) => handleCepChange(e.target.value)} maxLength={8}
                    className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400" required />
                  {fetchingCep && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
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
                <div className="relative">
                  <button type="button" onClick={() => setShowStatePicker(!showStatePicker)}
                    className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-input)] focus:outline-none focus:border-orange-400 text-left flex items-center justify-between cursor-pointer">
                    <span className={form.state ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                      {form.state || "Estado *"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStatePicker && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {ESTADOS_BR.map((uf) => (
                        <button key={uf} type="button"
                          onClick={() => { setForm({ ...form, state: uf }); setShowStatePicker(false); }}
                          className={`w-full px-4 py-2 text-left text-sm cursor-pointer hover:bg-orange-500/10 transition ${form.state === uf ? "bg-orange-500/20 text-orange-500 font-bold" : "text-[var(--text-primary)]"}`}>
                          {uf}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition">
                  Voltar
                </button>
                <button onClick={geocodeAndShowMap} disabled={geocoding}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition">
                  {geocoding ? "Localizando..." : "Próximo"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Mapa de confirmação */}
          {step === 3 && mapCoords && (
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Confirme a localização</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {form.street}, {form.number}{form.complement ? ` - ${form.complement}` : ""} — {form.neighborhood}, {form.city}/{form.state}
              </p>
              <p className="text-sm font-semibold text-orange-400">
                Arraste o pin para ajustar a posição exata da sua loja.
              </p>

              <div className="rounded-xl overflow-hidden border border-[var(--border-color)]" style={{ height: 300 }}>
                <StoreLocationMap
                  lat={mapCoords.lat}
                  lng={mapCoords.lng}
                  onPositionChange={(lat, lng) => setMapCoords({ lat, lng })}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition">
                  Corrigir endereço
                </button>
                <button onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Entrega */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Configurações de entrega</h3>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm({ ...form, hasOwnDelivery: false })}
                  className={`p-4 rounded-xl border-2 text-center cursor-pointer transition ${!form.hasOwnDelivery ? "border-orange-500 bg-orange-500/10" : "border-[var(--border-color)] hover:border-[var(--border-light)]"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 mx-auto mb-2 flex items-center justify-center ${!form.hasOwnDelivery ? "border-orange-500" : "border-[var(--text-muted)]"}`}>
                    {!form.hasOwnDelivery && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                  </div>
                  <span className={`text-sm font-semibold ${!form.hasOwnDelivery ? "text-orange-500" : "text-[var(--text-secondary)]"}`}>Entregadores do app</span>
                  <p className="text-xs text-[var(--text-muted)] mt-1">A plataforma gerencia</p>
                </button>
                <button type="button" onClick={() => setForm({ ...form, hasOwnDelivery: true })}
                  className={`p-4 rounded-xl border-2 text-center cursor-pointer transition ${form.hasOwnDelivery ? "border-orange-500 bg-orange-500/10" : "border-[var(--border-color)] hover:border-[var(--border-light)]"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 mx-auto mb-2 flex items-center justify-center ${form.hasOwnDelivery ? "border-orange-500" : "border-[var(--text-muted)]"}`}>
                    {form.hasOwnDelivery && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                  </div>
                  <span className={`text-sm font-semibold ${form.hasOwnDelivery ? "text-orange-500" : "text-[var(--text-secondary)]"}`}>Entregadores da empresa</span>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Você gerencia a entrega</p>
                </button>
              </div>

              {form.hasOwnDelivery && (
                <>
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
                </>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(3)}
                  className="flex-1 py-3 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition">
                  Voltar
                </button>
                <button onClick={handleSubmit} disabled={submitting || loading}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition">
                  {submitLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
