"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import { useMutation, useQuery } from "@apollo/client";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";
import {
  UPDATE_STORE,
  UPLOAD_IMAGE,
  GET_MY_STORES,
  GET_MY_PLAN,
  GET_BADGE_CONFIG,
  CLAIM_BADGE_REWARD,
} from "@/lib/graphql";
import { useState, useRef } from "react";
import { compressImage } from "@/lib/compressImage";
import CreateStoreModal from "@/components/CreateStoreModal";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Award, Medal, Gem, RotateCcw, Copy, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";

function Section({
  title,
  children,
  "data-tour": dataTour,
}: {
  title: string;
  children: React.ReactNode;
  "data-tour"?: string;
}) {
  return (
    <div
      data-tour={dataTour}
      className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 mb-6"
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition cursor-pointer ${value ? "bg-[var(--brand-primary)]" : "bg-[var(--bg-muted)]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value ? "translate-x-6" : ""}`}
        />
      </button>
      <span className="text-sm text-[var(--text-primary)] font-medium">
        {label}
      </span>
    </div>
  );
}

// ===== STORE LINK SECTION =====
function StoreLinkSection({
  storeId,
  slug,
  isCopied,
  showQr,
  onCopy,
  onToggleQr,
}: {
  storeId: string;
  slug?: string;
  isCopied: boolean;
  showQr: boolean;
  onCopy: () => void;
  onToggleQr: () => void;
}) {
  const publicUrl = `https://loja.bcmtech.com.br/loja/${slug || storeId}`;
  return (
    <div className="px-4 pb-4 border-t border-[var(--border-light)] pt-3">
      <p className="text-xs text-[var(--text-muted)] mb-1.5">
        Link público da loja
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={publicUrl}
          className="flex-1 text-xs bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-secondary)] truncate"
        />
        <button
          onClick={onCopy}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] transition"
          title="Copiar link"
        >
          {isCopied ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Copy size={14} className="text-[var(--text-muted)]" />
          )}
        </button>
        <button
          onClick={onToggleQr}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] transition"
          title="Ver QR Code"
        >
          <QrCode size={14} className="text-[var(--text-muted)]" />
        </button>
      </div>
      {showQr && (
        <div className="mt-3 flex justify-center p-4 bg-white rounded-xl border border-[var(--border-color)]">
          <QRCodeSVG value={publicUrl} size={160} />
        </div>
      )}
    </div>
  );
}

// ===== STORES SECTION =====
function StoresSection() {
  const { data, loading, refetch } = useQuery(GET_MY_STORES);
  const { data: planData } = useQuery(GET_MY_PLAN);
  const [updateStore, { loading: updating }] = useMutation(UPDATE_STORE);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const paymentConnected = planData?.meVendor?.paymentConnected ?? false;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [form, setForm] = useState(emptyStoreForm());
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);
  const [qrStoreId, setQrStoreId] = useState<string | null>(null);

  const stores = data?.myStores || [];

  function emptyStoreForm() {
    return {
      name: "",
      description: "",
      phone: "",
      whatsappNumber: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      hasOwnDelivery: false,
      freeDelivery: false,
      estimatedDeliveryMinutes: "30",
      minimumOrder: "0",
      deliveryStartTime: "",
      deliveryEndTime: "",
      freeDeliveryAbove: "",
    };
  }

  function startEdit(store: any) {
    setEditingStore(store.id);
    setShowCreateModal(false);
    setForm({
      name: store.name || "",
      description: store.description || "",
      phone: store.phone || "",
      whatsappNumber: store.whatsappNumber || "",
      street: store.street || "",
      number: store.number || "",
      complement: store.complement || "",
      neighborhood: store.neighborhood || "",
      city: store.city || "",
      state: store.state || "",
      zipCode: store.zipCode || "",
      hasOwnDelivery: store.hasOwnDelivery || false,
      freeDelivery: store.freeDelivery || false,
      estimatedDeliveryMinutes: String(store.estimatedDeliveryMinutes || 30),
      minimumOrder: String(store.minimumOrder || 0),
      deliveryStartTime: store.deliveryStartTime || "",
      deliveryEndTime: store.deliveryEndTime || "",
      freeDeliveryAbove: store.freeDeliveryAbove
        ? String(store.freeDeliveryAbove)
        : "",
    });
    setLogoPreview(store.logoUrl || null);
    setBannerPreview(store.bannerUrl || null);
    setLogoBase64(null);
    setBannerBase64(null);
  }

  function startCreate() {
    setEditingStore(null);
    setShowCreateModal(true);
  }

  function handleImage(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      const maxW = type === "logo" ? 400 : 1200;
      const compressed = await compressImage(raw, maxW, 0.8);
      if (type === "logo") {
        setLogoPreview(compressed);
        setLogoBase64(compressed);
      } else {
        setBannerPreview(compressed);
        setBannerBase64(compressed);
      }
    };
    reader.readAsDataURL(file);
  }

  async function uploadImg(
    base64: string | null,
    folder: string,
  ): Promise<string | undefined> {
    if (!base64) return undefined;
    try {
      const { data } = await uploadImage({
        variables: { base64, folder: "stores" },
      });
      return data?.uploadImage;
    } catch {
      return undefined;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const logoUrl = await uploadImg(logoBase64, "stores");
    const bannerUrl = await uploadImg(bannerBase64, "stores");

    const input: any = {
      name: form.name,
      description: form.description || undefined,
      phone: form.phone,
      whatsappNumber: form.whatsappNumber || undefined,
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
      freeDeliveryAbove: form.freeDeliveryAbove
        ? parseFloat(form.freeDeliveryAbove)
        : undefined,
    };
    if (logoUrl) input.logoUrl = logoUrl;
    if (bannerUrl) input.bannerUrl = bannerUrl;

    try {
      input.id = editingStore;
      await updateStore({ variables: { input } });
      setMsg("Loja atualizada!");
      refetch();
      setEditingStore(null);
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  const isSubmitting = updating;
  const isEditing = !!editingStore;

  return (
    <Section title="Minhas Lojas" data-tour="stores-section">
      {msg && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm font-medium ${msg.includes("!") ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]" : "bg-[var(--status-error-bg)] text-[var(--status-error-text)]"}`}
        >
          {msg}
        </div>
      )}

      {/* Store list */}
      {!isEditing && (
        <>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : stores.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Nenhuma loja cadastrada.
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {stores.map((store: any) => (
                <div key={store.id} className="border border-[var(--border-light)] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] transition">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] flex items-center justify-center shrink-0">
                        <span className="text-[var(--brand-primary)] text-xl font-bold">{store.name?.[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] truncate">{store.name}</p>
                      <p className="text-sm text-[var(--text-muted)] truncate">{store.city} - {store.state}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${store.isOpen ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"}`}>
                      {store.isOpen ? "Aberta" : "Fechada"}
                    </span>
                    <button onClick={() => startEdit(store)} className="px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition cursor-pointer">
                      Editar
                    </button>
                  </div>
                  <StoreLinkSection
                    storeId={store.id}
                    slug={store.slug}
                    isCopied={copiedStoreId === store.id}
                    showQr={qrStoreId === store.id}
                    onCopy={async () => {
                      const url = `https://loja.bcmtech.com.br/loja/${store.slug || store.id}`;
                      await navigator.clipboard.writeText(url);
                      setCopiedStoreId(store.id);
                      setTimeout(() => setCopiedStoreId(null), 2000);
                    }}
                    onToggleQr={() => setQrStoreId(qrStoreId === store.id ? null : store.id)}
                  />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={startCreate}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium transition cursor-pointer"
          >
            + Nova loja
          </button>
        </>
      )}

      {/* Create / Edit form */}
      {isEditing && (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--text-primary)]">
              Editar loja
            </h3>
            <button
              type="button"
              onClick={() => setEditingStore(null)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-4">
            {/* Logo + Banner */}
            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                  Logo
                </label>
                <div
                  onClick={() => logoRef.current?.click()}
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-[var(--brand-primary)] transition overflow-hidden"
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[var(--text-muted)] text-2xl">+</span>
                  )}
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImage(e, "logo")}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                  Banner
                </label>
                <div
                  onClick={() => bannerRef.current?.click()}
                  className="w-full h-20 rounded-2xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-[var(--brand-primary)] transition overflow-hidden"
                >
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[var(--text-muted)]">+ Banner</span>
                  )}
                </div>
                <input
                  ref={bannerRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImage(e, "banner")}
                  className="hidden"
                />
              </div>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nome da loja"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] col-span-2 focus:outline-none focus:border-[var(--brand-primary)]"
                required
              />
              <input
                type="text"
                placeholder="Descricao"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] col-span-2 focus:outline-none focus:border-[var(--brand-primary)]"
              />
              <input
                type="text"
                placeholder="Telefone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                required
              />
              <div className="col-span-2">
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                  WhatsApp do agente IA{" "}
                  <span className="text-[var(--text-muted)] font-normal">
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5511999999999"
                  value={form.whatsappNumber}
                  onChange={(e) =>
                    setForm({ ...form, whatsappNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Número com DDI (ex: 5511999999999). Clientes que mandarem
                  mensagem neste número serão atendidos pelo agente IA.
                </p>
              </div>
            </div>

            {/* Address */}
            <h4 className="font-semibold text-[var(--text-secondary)] text-sm pt-2">
              Endereco
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Rua"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                required
              />
              <input
                type="text"
                placeholder="Numero"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                required
              />
              <input
                type="text"
                placeholder="Complemento"
                value={form.complement}
                onChange={(e) =>
                  setForm({ ...form, complement: e.target.value })
                }
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
              <input
                type="text"
                placeholder="Bairro"
                value={form.neighborhood}
                onChange={(e) =>
                  setForm({ ...form, neighborhood: e.target.value })
                }
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                required
              />
              <input
                type="text"
                placeholder="Cidade"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                required
              />
              <input
                type="text"
                placeholder="Estado"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                required
              />
              <input
                type="text"
                placeholder="CEP"
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                required
              />
            </div>

            {/* Delivery */}
            <h4 className="font-semibold text-[var(--text-secondary)] text-sm pt-2">
              Entrega
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, hasOwnDelivery: false })}
                className={`p-3 rounded-xl border-2 text-center cursor-pointer transition ${!form.hasOwnDelivery ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]" : "border-[var(--border-color)] hover:border-[var(--border-light)]"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 mx-auto mb-1.5 flex items-center justify-center ${!form.hasOwnDelivery ? "border-[var(--brand-primary)]" : "border-[var(--text-muted)]"}`}
                >
                  {!form.hasOwnDelivery && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${!form.hasOwnDelivery ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"}`}
                >
                  Entregadores do app
                </span>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  A plataforma gerencia
                </p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, hasOwnDelivery: true })}
                className={`p-3 rounded-xl border-2 text-center cursor-pointer transition ${form.hasOwnDelivery ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]" : "border-[var(--border-color)] hover:border-[var(--border-light)]"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 mx-auto mb-1.5 flex items-center justify-center ${form.hasOwnDelivery ? "border-[var(--brand-primary)]" : "border-[var(--text-muted)]"}`}
                >
                  {form.hasOwnDelivery && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${form.hasOwnDelivery ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"}`}
                >
                  Entregadores da empresa
                </span>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Você gerencia a entrega
                </p>
              </button>
            </div>
            {!form.hasOwnDelivery && !paymentConnected && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-700 font-medium">
                Para usar entregadores do app, configure seu pagamento na seção
                abaixo.
              </div>
            )}

            {form.hasOwnDelivery && (
              <>
                <Toggle
                  value={form.freeDelivery}
                  onChange={() =>
                    setForm({ ...form, freeDelivery: !form.freeDelivery })
                  }
                  label="Entrega grátis"
                />

                {!form.freeDelivery && (
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                      Entrega grátis acima de (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Opcional"
                      value={form.freeDeliveryAbove}
                      onChange={(e) =>
                        setForm({ ...form, freeDeliveryAbove: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                      Horário início entregas
                    </label>
                    <input
                      type="time"
                      value={form.deliveryStartTime}
                      onChange={(e) =>
                        setForm({ ...form, deliveryStartTime: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                      Horário fim entregas
                    </label>
                    <input
                      type="time"
                      value={form.deliveryEndTime}
                      onChange={(e) =>
                        setForm({ ...form, deliveryEndTime: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                      Tempo estimado (min)
                    </label>
                    <input
                      type="number"
                      value={form.estimatedDeliveryMinutes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          estimatedDeliveryMinutes: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                      Pedido mínimo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.minimumOrder}
                      onChange={(e) =>
                        setForm({ ...form, minimumOrder: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </div>
        </form>
      )}

      <CreateStoreModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          refetch();
          setShowCreateModal(false);
        }}
      />
    </Section>
  );
}

// ===== VERIFICATION BADGE SECTION =====
const BADGE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ComponentType<{ className?: string }> | null;
    progressColor: string;
  }
> = {
  NONE: {
    label: "Sem medalha",
    color: "text-[var(--text-muted)]",
    bg: "bg-[var(--bg-muted)]",
    border: "border-[var(--border-color)]",
    icon: null,
    progressColor: "#9ca3af",
  },
  BRONZE: {
    label: "Bronze",
    color: "text-[#cd7f32] dark:text-[#dda15e]",
    bg: "bg-[#cd7f32]/10",
    border: "border-[#cd7f32]/30",
    icon: Medal,
    progressColor: "#cd7f32",
  },
  SILVER: {
    label: "Prata",
    color: "text-[#8a8a8a] dark:text-[#c0c0c0]",
    bg: "bg-[#c0c0c0]/10",
    border: "border-[#c0c0c0]/30",
    icon: Medal,
    progressColor: "#c0c0c0",
  },
  GOLD: {
    label: "Ouro",
    color: "text-[#b8860b] dark:text-[#ffd700]",
    bg: "bg-[#ffd700]/10",
    border: "border-[#ffd700]/30",
    icon: Medal,
    progressColor: "#ffd700",
  },
  DIAMOND: {
    label: "Diamante",
    color: "text-[#0891b2] dark:text-[#22d3ee]",
    bg: "bg-[#22d3ee]/10",
    border: "border-[#22d3ee]/30",
    icon: Gem,
    progressColor: "#22d3ee",
  },
};

const LEVELS_ORDER = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];

const REWARD_LABELS: Record<
  string,
  { label: string; suffix: string; type: string }
> = {
  freePromoDays: {
    label: "Dias de promocao gratis",
    suffix: "dias",
    type: "sempre",
  },
  commissionReduction: {
    label: "Reducao de comissao",
    suffix: "% (1 semana)",
    type: "sempre",
  },
  freeTrialDays: { label: "Trial gratis", suffix: "dias", type: "1a vez" },
  subscriptionDiscount: {
    label: "Desconto na assinatura",
    suffix: "%",
    type: "da 2a em diante",
  },
  couponValue: {
    label: "Cupom de desconto",
    suffix: "%",
    type: "da 2a em diante",
  },
};

function VerificationSection() {
  const { data, refetch } = useQuery(GET_MY_STORES);
  const { data: badgeData } = useQuery(GET_BADGE_CONFIG);
  const [claimBadge, { loading: claiming }] = useMutation(CLAIM_BADGE_REWARD);
  const [prizesModal, setPrizesModal] = useState<any>(null);
  const [claimModal, setClaimModal] = useState<any>(null);
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const stores = data?.myStores || [];
  const selectedStore =
    stores.find((s: any) => s.id === selectedStoreId) || stores[0] || null;

  // Parse dynamic config from API
  let thresholds: Record<string, number> = {
    BRONZE: 20,
    SILVER: 100,
    GOLD: 300,
    DIAMOND: 1000,
  };
  let pointsCfg: Record<string, number> = {
    PER_PRODUCT: 2,
    PER_SALE: 5,
    PER_MONTH_ACTIVE: 3,
  };
  let rewardsCfg: Record<string, Record<string, number>> = {};

  if (badgeData?.badgeConfig) {
    try {
      const parsed = JSON.parse(badgeData.badgeConfig);
      thresholds = parsed.thresholds || thresholds;
      pointsCfg = parsed.points || pointsCfg;
      rewardsCfg = parsed.rewards || {};
    } catch {}
  }

  function getNextLevel(
    current: string,
  ): { level: string; threshold: number } | null {
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

  function getClaimableLevels(
    store: any,
  ): { level: string; threshold: number; canClaim: boolean }[] {
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
      setTimeout(() => {
        setClaimMsg("");
        setClaimModal(null);
      }, 2000);
    } catch (err: any) {
      setClaimMsg(err.message);
      setTimeout(() => setClaimMsg(""), 4000);
    }
  }

  if (stores.length === 0) return null;

  return (
    <Section title="Selo de Verificacao" data-tour="verification-section">
      {/* Como ganhar pontos — aparece 1x só */}
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div className="p-2.5 rounded-lg bg-[var(--bg-muted)]">
          <p className="text-xs text-[var(--text-muted)]">Por produto</p>
          <p className="font-bold text-sm text-[var(--text-primary)]">
            +{pointsCfg.PER_PRODUCT} pts
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-[var(--bg-muted)]">
          <p className="text-xs text-[var(--text-muted)]">Por venda</p>
          <p className="font-bold text-sm text-[var(--text-primary)]">
            +{pointsCfg.PER_SALE} pts
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-[var(--bg-muted)]">
          <p className="text-xs text-[var(--text-muted)]">Por mes ativo</p>
          <p className="font-bold text-sm text-[var(--text-primary)]">
            +{pointsCfg.PER_MONTH_ACTIVE} pts
          </p>
        </div>
      </div>

      {/* Níveis — aparece 1x só */}
      <div className="flex gap-2 flex-wrap justify-center mb-5">
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
              onClick={() =>
                hasR && setHoveredLevel(hoveredLevel === key ? null : key)
              }
            >
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-default ${b.bg} ${b.color} border ${b.border}`}
              >
                {b.icon && <b.icon className="w-3.5 h-3.5" />} {thresholds[key]}{" "}
                pts
              </span>

              {hoveredLevel === key && hasR && (
                <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-xl">
                  <p
                    className={`text-xs font-bold mb-2 ${b.color} inline-flex items-center gap-1`}
                  >
                    {b.icon && <b.icon className="w-3.5 h-3.5" />} {b.label} —
                    Premios
                  </p>
                  <div className="space-y-1">
                    {Object.entries(REWARD_LABELS).map(([rKey, meta]) => {
                      const val = lvlRewards[rKey] ?? 0;
                      if (val <= 0) return null;
                      return (
                        <div
                          key={rKey}
                          className="flex justify-between text-xs gap-1"
                        >
                          <span className="text-[var(--text-muted)]">
                            {meta.label}
                          </span>
                          <span className="text-[var(--text-primary)] font-semibold shrink-0">
                            {val} {meta.suffix}
                            <span className="text-[10px] text-[var(--text-muted)] ml-1">
                              ({meta.type})
                            </span>
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

      {/* Seletor de loja */}
      {stores.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedStore?.id || ""}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-sm font-medium focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
          >
            {stores.map((s: any) => {
              const lvl =
                BADGE_CONFIG[s.verificationLevel || "NONE"] ||
                BADGE_CONFIG.NONE;
              return (
                <option key={s.id} value={s.id}>
                  {s.name} — {lvl.label} ({s.verificationScore || 0} pts)
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Card da loja selecionada */}
      {selectedStore &&
        (() => {
          const store = selectedStore;
          const level = store.verificationLevel || "NONE";
          const score = store.verificationScore || 0;
          const badge = BADGE_CONFIG[level] || BADGE_CONFIG.NONE;
          const next = getNextLevel(level);
          const progressPercent = next
            ? Math.min((score / next.threshold) * 100, 100)
            : 100;
          const currentRewards = getActiveRewards(level);
          const hasRewards = level !== "NONE" && hasAnyReward(currentRewards);
          const claimablePoints = getClaimablePoints(store);
          const hasClaimable = getClaimableLevels(store).some(
            (l: any) => l.canClaim,
          );
          const claimCount = store.badgeClaimCount || 0;

          const hasActiveCommission =
            Number(store.commissionReductionPercent) > 0 &&
            store.commissionReductionExpiresAt &&
            new Date(store.commissionReductionExpiresAt) > new Date();
          const freePromoDays = store.freePromoDaysCredit || 0;

          return (
            <div
              className={`p-4 rounded-xl border ${badge.border} ${badge.bg}`}
            >
              {/* Header: medalha + nome + score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>
                    {badge.icon ? (
                      <badge.icon className={`w-6 h-6 ${badge.color}`} />
                    ) : (
                      <Award className="w-6 h-6 text-[var(--text-muted)]" />
                    )}
                  </span>
                  <div>
                    <p className={`font-bold text-sm ${badge.color}`}>
                      {badge.label}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {store.name}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-base font-bold text-[var(--text-primary)]">
                      {score} pts
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {store.totalSales || 0} vendas ·{" "}
                      {store.totalProducts || 0} produtos
                    </p>
                  </div>
                  {hasClaimable && (
                    <button
                      onClick={() => setClaimModal(store)}
                      className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer"
                    >
                      Resgatar
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {next && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                    <span className="inline-flex items-center gap-1">
                      Proximo:{" "}
                      {BADGE_CONFIG[next.level]?.icon &&
                        (() => {
                          const Icon = BADGE_CONFIG[next.level].icon!;
                          return <Icon className="w-3 h-3" />;
                        })()}
                      {BADGE_CONFIG[next.level]?.label}
                    </span>
                    <span>
                      {score}/{next.threshold}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                        background: badge.progressColor,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Active benefits — inline */}
              {(freePromoDays > 0 || hasActiveCommission) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {freePromoDays > 0 && (
                    <span className="text-[10px] bg-[var(--status-success-bg)] text-[var(--status-success-text)] px-2 py-0.5 rounded-full font-medium">
                      {freePromoDays} dias promo gratis
                    </span>
                  )}
                  {hasActiveCommission && (
                    <span className="text-[10px] bg-[var(--status-success-bg)] text-[var(--status-success-text)] px-2 py-0.5 rounded-full font-medium">
                      -{Number(store.commissionReductionPercent)}% comissao
                    </span>
                  )}
                </div>
              )}

              {/* Bottom row: claimable + prizes */}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[10px] text-[var(--text-muted)]">
                  Resgatáveis:{" "}
                  <span className="font-bold text-[var(--text-primary)]">
                    {claimablePoints}
                  </span>
                  {claimCount > 0 && (
                    <span className="ml-0.5">({claimCount}x)</span>
                  )}
                </p>
                {hasRewards && (
                  <button
                    onClick={() =>
                      setPrizesModal({ store, level, rewards: currentRewards })
                    }
                    className="text-[10px] text-[var(--brand-primary)] font-semibold hover:underline cursor-pointer"
                  >
                    Ver premios
                  </button>
                )}
              </div>
            </div>
          );
        })()}

      {/* Claim Modal */}
      {claimModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setClaimModal(null);
            setClaimMsg("");
          }}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Resgatar Premio
              </h3>
              <button
                onClick={() => {
                  setClaimModal(null);
                  setClaimMsg("");
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                &#10005;
              </button>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-1">
              Pontos disponiveis:{" "}
              <span className="font-bold text-[var(--text-primary)]">
                {getClaimablePoints(claimModal)}
              </span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {claimModal.badgeClaimCount === 0
                ? "1a conquista: trial + dias promo + reducao comissao"
                : "Premios: dias promo + reducao comissao + desc. assinatura + cupom"}
            </p>

            {claimMsg && (
              <div
                className={`mb-3 p-2.5 rounded-lg text-sm font-medium ${claimMsg.includes("sucesso") ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]" : "bg-[var(--status-error-bg)] text-[var(--status-error-text)]"}`}
              >
                {claimMsg}
              </div>
            )}

            <div className="space-y-2">
              {getClaimableLevels(claimModal).map(
                ({ level: lvl, threshold, canClaim }) => {
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
                          ? `${b.bg} ${b.border} hover:ring-2 hover:ring-[var(--brand-primary)]`
                          : "bg-[var(--bg-muted)] border-[var(--border-light)] opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-bold text-sm ${canClaim ? b.color : "text-[var(--text-muted)]"}`}
                        >
                          {b.icon && <b.icon className="w-4 h-4 inline" />}{" "}
                          {b.label} ({threshold} pts)
                        </span>
                        {canClaim && (
                          <span className="text-xs text-[var(--brand-primary)] font-semibold">
                            Resgatar
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {Object.entries(REWARD_LABELS).map(([rKey, meta]) => {
                          const val = rewards[rKey] ?? 0;
                          if (val <= 0) return null;
                          // Skip rewards that don't apply based on claim count
                          if (isFirst && meta.type === "da 2a em diante")
                            return null;
                          if (!isFirst && meta.type === "1a vez") return null;
                          return (
                            <span
                              key={rKey}
                              className="text-[10px] text-[var(--text-muted)]"
                            >
                              {meta.label}:{" "}
                              <span className="font-semibold text-[var(--text-primary)]">
                                {val}
                                {meta.suffix.includes("%")
                                  ? "%"
                                  : ` ${meta.suffix}`}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prizes Modal */}
      {prizesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setPrizesModal(null)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {(() => {
                    const Icon = BADGE_CONFIG[prizesModal.level]?.icon;
                    return Icon ? (
                      <Icon className="w-8 h-8" />
                    ) : (
                      <Award className="w-8 h-8 text-[var(--text-muted)]" />
                    );
                  })()}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Premios do Nivel
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    {prizesModal.store.name} —{" "}
                    {BADGE_CONFIG[prizesModal.level]?.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPrizesModal(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer text-lg"
              >
                &#10005;
              </button>
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
                        ? "border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,transparent)]"
                        : "border-[var(--border-light)] bg-[var(--bg-muted)] opacity-40"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-medium ${active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
                      >
                        {meta.label}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {meta.type}
                      </p>
                    </div>
                    {active ? (
                      <p className="text-sm font-bold text-[var(--brand-primary)]">
                        {val} {meta.suffix}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)]">—</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next level preview */}
            {(() => {
              const nextLvl =
                LEVELS_ORDER[LEVELS_ORDER.indexOf(prizesModal.level) + 1];
              if (!nextLvl) return null;
              const nextRewards = rewardsCfg[nextLvl] || {};
              const nextBadge = BADGE_CONFIG[nextLvl];
              if (!hasAnyReward(nextRewards)) return null;
              return (
                <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    Proximo nivel:{" "}
                    {nextBadge.icon && (
                      <nextBadge.icon className="w-3.5 h-3.5 inline" />
                    )}{" "}
                    <span className={nextBadge.color}>{nextBadge.label}</span> (
                    {thresholds[nextLvl]} pts)
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(REWARD_LABELS).map(([key, meta]) => {
                      const current = prizesModal.rewards[key] ?? 0;
                      const nextVal = nextRewards[key] ?? 0;
                      if (nextVal <= 0) return null;
                      const improvement = nextVal - current;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-[var(--text-muted)]">
                            {meta.label}
                          </span>
                          <span>
                            <span className="text-[var(--text-primary)] font-semibold">
                              {nextVal} {meta.suffix}
                            </span>
                            {improvement > 0 && (
                              <span className="text-[var(--status-success-text)] ml-1">
                                (+{improvement})
                              </span>
                            )}
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
              className="mt-5 w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium transition cursor-pointer"
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
// ===== MAIN PAGE =====
// ===== PAGAMENTO SECTION =====
function PaymentSection() {
  const { data: planData, refetch: refetchPlan } = useQuery(GET_MY_PLAN);
  const { data: storesData } = useQuery(GET_MY_STORES);
  const paymentConnected = planData?.meVendor?.paymentConnected ?? false;
  const stores = storesData?.myStores || [];

  if (stores.length === 0) return null;

  return (
    <Section title="Pagamento" data-tour="payment-section">
      {!paymentConnected ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Configure seus dados bancarios para aceitar pagamentos via PIX,
            cartao de credito e debito. Sem conexao, sua loja so aceita
            pagamento na entrega.
          </p>
          <ul className="space-y-1 text-sm text-[var(--text-muted)]">
            <li>• Receba pagamentos diretamente na sua conta</li>
            <li>• Aceite PIX, cartao de credito e debito</li>
            <li>• Habilite entregadores autonomos do app</li>
          </ul>
          <a
            href="/dashboard/earnings"
            className="inline-block bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 transition"
          >
            Cadastrar Dados Bancarios
          </a>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[var(--status-success-text)] text-lg">✓</span>
            <div>
              <p className="font-semibold text-[var(--status-success-text)] text-sm">
                Conta conectada
              </p>
              <p className="text-[var(--status-success-text)] text-xs">
                Voce recebe pagamentos diretamente na sua conta.
              </p>
            </div>
          </div>
          <a
            href="/dashboard/earnings"
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer transition"
          >
            Ver Recebimentos
          </a>
        </div>
      )}
    </Section>
  );
}

// ===== TUTORIAL SECTION =====
function TutorialSection() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  function resetAllTours() {
    setResetting(true);
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("tour_seen_"),
      );
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 300);
  }

  return (
    <Section title="Tutorial">
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Refaça o tutorial completo do sistema como se fosse seu primeiro acesso.
      </p>
      <button
        onClick={resetAllTours}
        disabled={resetting}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold hover:bg-[var(--brand-primary-hover)] active:scale-95 disabled:opacity-50 transition cursor-pointer"
      >
        <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
        {resetting ? "Reiniciando..." : "Refazer tutorial completo"}
      </button>
    </Section>
  );
}

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo às Configurações!",
      description:
        "Aqui você configura suas lojas, conta de pagamento e acompanha o processo de verificação.",
    },
  },
  {
    element: '[data-tour="stores-section"]',
    popover: {
      title: "Configurações da loja",
      description:
        "Edite o nome, endereço, horários, logo e outras informações das suas lojas.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="payment-section"]',
    popover: {
      title: "Conta de pagamento",
      description:
        "Configure sua conta bancária para receber os repasses das vendas. É necessário para sacar seus ganhos.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="verification-section"]',
    popover: {
      title: "✅ Verificação e selo",
      description:
        "Acompanhe sua pontuação de verificação. Lojas verificadas ganham mais destaque e confiança dos clientes.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Configurações'.",
      side: "top",
      align: "start",
    },
  },
];

export default function SettingsPage() {
  const { startTour, hasSeenTour } = useTour("settings", TOUR_STEPS);

  return (
    <motion.div className="max-w-4xl mx-auto pb-20" {...fadeIn}>
      <PageHeader
        title="Configuracoes"
        description="Gerencie suas lojas, pagamentos e contratos"
        onTourStart={startTour}
        tourNotSeen={!hasSeenTour}
      />
      <StoresSection />
      <PaymentSection />
      <VerificationSection />
      <TutorialSection />
    </motion.div>
  );
}
