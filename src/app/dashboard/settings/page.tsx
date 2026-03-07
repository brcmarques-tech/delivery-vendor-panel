"use client";

import { useMutation } from "@apollo/client";
import { CREATE_STORE, UPLOAD_IMAGE } from "@/lib/graphql";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [createStore, { loading }] = useMutation(CREATE_STORE);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
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
    latitude: "-23.5505",
    longitude: "-46.6333",
    deliveryFee: "5.99",
    estimatedDeliveryMinutes: "30",
    minimumOrder: "0",
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
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          deliveryFee: parseFloat(form.deliveryFee),
          estimatedDeliveryMinutes: parseInt(form.estimatedDeliveryMinutes),
          minimumOrder: parseFloat(form.minimumOrder),
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
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Nome da loja" value={form.name} onChange={(e) => update("name", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800 col-span-2" required />
            <input type="text" placeholder="Descrição" value={form.description} onChange={(e) => update("description", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800 col-span-2" />
            <input type="text" placeholder="Telefone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
          </div>

          <h3 className="font-bold text-gray-700 pt-4">Endereço</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Rua" value={form.street} onChange={(e) => update("street", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="Número" value={form.number} onChange={(e) => update("number", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="Complemento" value={form.complement} onChange={(e) => update("complement", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
            <input type="text" placeholder="Bairro" value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="Cidade" value={form.city} onChange={(e) => update("city", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="Estado" value={form.state} onChange={(e) => update("state", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="CEP" value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
          </div>

          <h3 className="font-bold text-gray-700 pt-4">Entrega</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">Taxa de entrega (R$)</label>
              <input type="number" step="0.01" value={form.deliveryFee} onChange={(e) => update("deliveryFee", e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
            </div>
            <div>
              <label className="text-sm text-gray-500">Tempo estimado (min)</label>
              <input type="number" value={form.estimatedDeliveryMinutes} onChange={(e) => update("estimatedDeliveryMinutes", e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
            </div>
            <div>
              <label className="text-sm text-gray-500">Pedido mínimo (R$)</label>
              <input type="number" step="0.01" value={form.minimumOrder} onChange={(e) => update("minimumOrder", e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
            </div>
          </div>

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
