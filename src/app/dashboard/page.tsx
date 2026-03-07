"use client";

import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_STORES, TOGGLE_STORE_OPEN, UPDATE_STORE, UPLOAD_IMAGE } from "@/lib/graphql";
import { useState, useRef } from "react";

export default function DashboardPage() {
  const { data, loading, refetch } = useQuery(GET_MY_STORES);
  const [toggleOpen] = useMutation(TOGGLE_STORE_OPEN);
  const [updateStore] = useMutation(UPDATE_STORE);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);

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
      deliveryFee: String(store.deliveryFee || "0"),
      estimatedDeliveryMinutes: String(store.estimatedDeliveryMinutes || "30"),
      minimumOrder: String(store.minimumOrder || "0"),
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
            deliveryFee: parseFloat(form.deliveryFee),
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
    return <p className="text-gray-500">Carregando...</p>;
  }

  if (stores.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Nenhuma loja cadastrada</h2>
        <p className="text-gray-500 mb-6">Crie sua primeira loja para começar a vender</p>
        <a href="/dashboard/settings" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
          Criar loja
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Visão Geral</h1>

      <div className="grid grid-cols-1 gap-6">
        {stores.map((store: any) => (
          <div key={store.id} className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
            {editingId === store.id ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">Editar loja</h2>
                  <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
                </div>

                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Logo</label>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-400 transition overflow-hidden"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-2xl">+</span>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                    <span className="text-sm text-gray-400">Clique para alterar</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Nome</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Descrição</label>
                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Telefone</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                </div>

                <h3 className="font-bold text-gray-700 text-sm pt-2">Endereço</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-500">Rua</label>
                    <input type="text" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Número</label>
                    <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Complemento</label>
                    <input type="text" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Bairro</label>
                    <input type="text" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Cidade</label>
                    <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Estado</label>
                    <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">CEP</label>
                    <input type="text" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                </div>

                <h3 className="font-bold text-gray-700 text-sm pt-2">Entrega</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-500">Taxa (R$)</label>
                    <input type="number" step="0.01" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Tempo (min)</label>
                    <input type="number" value={form.estimatedDeliveryMinutes} onChange={(e) => setForm({ ...form, estimatedDeliveryMinutes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Mínimo (R$)</label>
                    <input type="number" step="0.01" value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800" />
                  </div>
                </div>

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
                    className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-semibold cursor-pointer hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : null}
                    <h2 className="text-lg font-bold text-gray-800">{store.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(store)}
                      className="px-3 py-1 rounded-full text-sm font-semibold cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
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
                  <p className="text-sm text-gray-500 mb-4">{store.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">{store.products?.length || 0}</p>
                    <p className="text-xs text-gray-500">Produtos</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">{store.categories?.length || 0}</p>
                    <p className="text-xs text-gray-500">Categorias</p>
                  </div>
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p>Taxa de entrega: R$ {Number(store.deliveryFee).toFixed(2)}</p>
                  <p>Tempo estimado: {store.estimatedDeliveryMinutes} min</p>
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
