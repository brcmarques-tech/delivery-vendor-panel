"use client";

import { useMutation, useQuery } from "@apollo/client";
import { CREATE_STORE, UPLOAD_IMAGE, GET_MY_PLAN } from "@/lib/graphql";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [createStore, { loading }] = useMutation(CREATE_STORE);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const { data: planData } = useQuery(GET_MY_PLAN);
  const mpConnected = planData?.me?.mpConnected ?? false;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
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
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let logoUrl: string | undefined;

    if (logoBase64) {
      setUploadingLogo(true);
      try {
        const { data } = await uploadImage({ variables: { base64: logoBase64, folder: "stores" } });
        logoUrl = data?.uploadImage;
      } catch {
        // continue without logo
      }
      setUploadingLogo(false);
    }

    await createStore({
      variables: {
        input: {
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
          logoUrl,
        },
      },
    });
    router.push("/dashboard");
  }

  const isSubmitting = loading || uploadingLogo;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Criar nova loja</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
        <div className="space-y-4">
          <h3 className="font-bold text-gray-700">Logo da loja</h3>
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-400 transition overflow-hidden"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-3xl">+</span>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
            <span className="text-sm text-gray-500">Clique para adicionar o logo</span>
          </div>

          <h3 className="font-bold text-gray-700 pt-2">Informações básicas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Nome da loja" value={form.name} onChange={(e) => update("name", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800 col-span-2" required />
            <input type="text" placeholder="Descrição" value={form.description} onChange={(e) => update("description", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800 col-span-2" />
            <input type="text" placeholder="Telefone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
          </div>

          <h3 className="font-bold text-gray-700 pt-4">Endereço</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Rua" value={form.street} onChange={(e) => update("street", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="Número" value={form.number} onChange={(e) => update("number", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="Complemento" value={form.complement} onChange={(e) => update("complement", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
            <input type="text" placeholder="Bairro" value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="Cidade" value={form.city} onChange={(e) => update("city", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="Estado" value={form.state} onChange={(e) => update("state", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="CEP" value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
          </div>

          <h3 className="font-bold text-gray-700 pt-4">Entrega</h3>

          <div className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, hasOwnDelivery: !prev.hasOwnDelivery }))}
              className={`relative w-12 h-6 rounded-full transition cursor-pointer ${form.hasOwnDelivery ? "bg-orange-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.hasOwnDelivery ? "translate-x-6" : ""}`} />
            </button>
            <span className="text-sm text-gray-700 font-medium">
              {form.hasOwnDelivery ? "Entrega própria" : "Não possui entrega própria"}
            </span>
          </div>
          {form.hasOwnDelivery ? (
            <p className="text-xs text-gray-400">Seus próprios entregadores farão as entregas dos pedidos.</p>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-600">O app disponibilizará entregadores autônomos para realizar as entregas dos seus pedidos.</p>
              </div>
              {!mpConnected && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-700 font-medium">
                    Para usar entregadores do app, você precisa conectar sua conta Mercado Pago nas configurações.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-3 py-2 mt-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, freeDelivery: !prev.freeDelivery }))}
              className={`relative w-12 h-6 rounded-full transition cursor-pointer ${form.freeDelivery ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.freeDelivery ? "translate-x-6" : ""}`} />
            </button>
            <span className="text-sm text-gray-700 font-medium">Entrega grátis</span>
          </div>
          {form.freeDelivery && (
            <p className="text-xs text-gray-400">A loja não cobrará taxa de entrega dos clientes.</p>
          )}

          {!form.freeDelivery && (
            <div className="mt-2">
              <label className="text-sm text-gray-500">Entrega grátis acima de (R$)</label>
              <input type="number" step="0.01" placeholder="Ex: 50.00 (opcional)" value={form.freeDeliveryAbove} onChange={(e) => update("freeDeliveryAbove", e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
              <p className="text-xs text-gray-400 mt-1">Deixe vazio se não quiser oferecer. A taxa de entrega é calculada automaticamente pela distância.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="text-sm text-gray-500">Horário início entregas</label>
              <input type="time" value={form.deliveryStartTime} onChange={(e) => update("deliveryStartTime", e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
            </div>
            <div>
              <label className="text-sm text-gray-500">Horário fim entregas</label>
              <input type="time" value={form.deliveryEndTime} onChange={(e) => update("deliveryEndTime", e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Deixe vazio para aceitar entregas durante todo o horário de funcionamento.</p>

          {form.hasOwnDelivery && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-sm text-gray-500">Tempo estimado (min)</label>
                <input type="number" value={form.estimatedDeliveryMinutes} onChange={(e) => update("estimatedDeliveryMinutes", e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Pedido mínimo (R$)</label>
                <input type="number" step="0.01" value={form.minimumOrder} onChange={(e) => update("minimumOrder", e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
              </div>
            </div>
          )}
          {!form.hasOwnDelivery && (
            <p className="text-xs text-gray-400 mt-2">O tempo estimado sera calculado automaticamente com base na distancia do entregador ate a loja e da loja ate o cliente.</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Criando..." : "Criar loja"}
          </button>
        </div>
      </form>
    </div>
  );
}
