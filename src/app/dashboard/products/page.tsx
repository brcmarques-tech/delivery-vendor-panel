"use client";

import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_STORES,
  CREATE_PRODUCT,
  CREATE_CATEGORY,
  DELETE_PRODUCT,
  DELETE_CATEGORY,
  TOGGLE_PRODUCT_AVAILABILITY,
  UPDATE_PRODUCT,
  UPLOAD_IMAGE,
} from "@/lib/graphql";
import { useState, useRef } from "react";

export default function ProductsPage() {
  const { data: storesData, refetch, error: storesError } = useQuery(GET_MY_STORES);
  const stores = storesData?.myStores || [];
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [error, setError] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    unit: "",
    categoryId: "",
  });
  const [categoryName, setCategoryName] = useState("");

  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);
  const [toggleAvailability] = useMutation(TOGGLE_PRODUCT_AVAILABILITY);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [categoryMenuId, setCategoryMenuId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", price: "", unit: "", categoryId: "" });

  const activeStoreId = selectedStoreId || (stores.length > 0 ? stores[0].id : "");
  const store = stores.find((s: any) => s.id === activeStoreId);
  const products = store?.products || [];
  const categories = store?.categories || [];

  const filteredProducts =
    categoryFilter === "ALL"
      ? products
      : categoryFilter === "NONE"
      ? products.filter((p: any) => !p.category)
      : products.filter((p: any) => p.category?.id === categoryFilter);

  const groupedProducts =
    categoryFilter === "ALL"
      ? (() => {
          const groups: Record<string, { id: string; name: string; products: any[] }> = {};
          for (const p of products) {
            const key = p.category?.id || "sem-categoria";
            if (!groups[key])
              groups[key] = { id: key, name: p.category?.name || "Sem categoria", products: [] };
            groups[key].products.push(p);
          }
          const entries = Object.entries(groups);
          entries.sort((a, b) => {
            if (a[0] === "sem-categoria") return 1;
            if (b[0] === "sem-categoria") return -1;
            return a[1].name.localeCompare(b[1].name);
          });
          return entries;
        })()
      : null;

  function handleImageSelect(file: File, mode: "create" | "edit") {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (mode === "create") {
        setImagePreview(result);
        setImageBase64(result);
      } else {
        setEditImagePreview(result);
        setEditImageBase64(result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!activeStoreId) {
      setError("Nenhuma loja encontrada. Crie uma loja primeiro.");
      return;
    }
    try {
      setUploading(true);
      let imageUrl: string | undefined;
      if (imageBase64) {
        const { data: uploadData } = await uploadImage({ variables: { base64: imageBase64, folder: "products" } });
        imageUrl = uploadData.uploadImage;
      }
      await createProduct({
        variables: {
          input: {
            name: productForm.name,
            description: productForm.description || undefined,
            price: parseFloat(productForm.price),
            unit: productForm.unit || undefined,
            storeId: activeStoreId,
            categoryId: productForm.categoryId || undefined,
            imageUrl,
          },
        },
      });
      setProductForm({ name: "", description: "", price: "", unit: "", categoryId: "" });
      setImagePreview(null);
      setImageBase64(null);
      setShowProductForm(false);
      setUploading(false);
      refetch();
    } catch (err: any) {
      setUploading(false);
      setError(err.message || "Erro ao criar produto");
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!activeStoreId) {
      setError("Nenhuma loja encontrada. Crie uma loja primeiro.");
      return;
    }
    try {
      await createCategory({ variables: { name: categoryName, storeId: activeStoreId } });
      setCategoryName("");
      setShowCategoryForm(false);
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao criar categoria");
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await deleteProduct({ variables: { id } });
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir produto");
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Os produtos dela ficarao sem categoria.")) return;
    try {
      await deleteCategory({ variables: { id } });
      setCategoryMenuId(null);
      if (categoryFilter === id) setCategoryFilter("ALL");
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir categoria");
    }
  }

  async function handleToggleAvailability(id: string) {
    try {
      await toggleAvailability({ variables: { id } });
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao alterar disponibilidade");
    }
  }

  function startEditing(product: any) {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      unit: product.unit || "",
      categoryId: product.category?.id || "",
    });
    setEditImagePreview(product.imageUrl || null);
    setEditImageBase64(null);
  }

  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setUploading(true);
      let imageUrl: string | undefined;
      if (editImageBase64) {
        const { data: uploadData } = await uploadImage({ variables: { base64: editImageBase64, folder: "products" } });
        imageUrl = uploadData.uploadImage;
      }
      await updateProduct({
        variables: {
          input: {
            id: editingProduct.id,
            name: editForm.name,
            description: editForm.description || undefined,
            price: parseFloat(editForm.price),
            unit: editForm.unit || undefined,
            categoryId: editForm.categoryId || undefined,
            ...(imageUrl && { imageUrl }),
          },
        },
      });
      setEditingProduct(null);
      setEditImagePreview(null);
      setEditImageBase64(null);
      setUploading(false);
      refetch();
    } catch (err: any) {
      setUploading(false);
      setError(err.message || "Erro ao atualizar produto");
    }
  }

  function renderProductRow(product: any) {
    return (
      <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50/50">
        <td className="px-6 py-4">
          <button
            onClick={() => startEditing(product)}
            className="text-left cursor-pointer hover:text-orange-600 transition flex items-center gap-3"
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                onClick={(e) => { e.stopPropagation(); setZoomedImage(product.imageUrl); }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-800">{product.name}</p>
              {product.description && (
                <p className="text-xs text-gray-400 mt-0.5">{product.description}</p>
              )}
            </div>
          </button>
        </td>
        <td className="px-6 py-4 text-gray-600">R$ {Number(product.price).toFixed(2)}</td>
        <td className="px-6 py-4 text-gray-600">{product.stock}</td>
        <td className="px-6 py-4">
          <button
            onClick={() => handleToggleAvailability(product.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition active:scale-95 ${
              product.isAvailable
                ? "bg-green-100 text-green-600 hover:bg-green-200"
                : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
          >
            {product.isAvailable ? "Disponivel" : "Indisponivel"}
          </button>
        </td>
        <td className="px-6 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => startEditing(product)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 cursor-pointer transition"
              title="Editar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleDeleteProduct(product.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition"
              title="Excluir"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  function renderTableHeader() {
    return (
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Produto</th>
          <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Preco</th>
          <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Estoque</th>
          <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
          <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 w-24">Acoes</th>
        </tr>
      </thead>
    );
  }

  return (
    <div>
      {(error || storesError) && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {error || storesError?.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="px-4 py-2 border border-orange-500 text-orange-500 rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-50 active:scale-95 transition"
          >
            + Categoria
          </button>
          <button
            onClick={() => setShowProductForm(!showProductForm)}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition"
          >
            + Produto
          </button>
        </div>
      </div>

      {showCategoryForm && (
        <form onSubmit={handleCreateCategory} className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-bold text-gray-800 mb-4">Nova categoria</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nome da categoria"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-800"
              required
            />
            <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
              Criar
            </button>
          </div>
        </form>
      )}

      {showProductForm && (
        <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-bold text-gray-800 mb-4">Novo produto</h3>
          {/* Upload de imagem */}
          <div className="mb-4">
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0], "create"); }} />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition overflow-hidden"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-400">Clique para adicionar imagem</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Nome do produto" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="number" step="0.01" placeholder="Preco (R$)" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
            <input type="text" placeholder="Descricao (opcional)" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
            <input type="text" placeholder="Unidade: kg, un, lt (opcional)" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
            <select value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800">
              <option value="">Sem categoria</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" disabled={uploading} className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition disabled:opacity-50">
              {uploading ? "Enviando..." : "Adicionar produto"}
            </button>
          </div>
        </form>
      )}

      {/* Modal de edicao */}
      {editingProduct && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEditingProduct(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleUpdateProduct} className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Editar produto</h3>
              {/* Imagem */}
              <div className="mb-4">
                <input type="file" ref={editFileInputRef} accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0], "edit"); }} />
                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition overflow-hidden"
                >
                  {editImagePreview ? (
                    <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-400">Clique para adicionar imagem</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Nome" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
                <input type="number" step="0.01" placeholder="Preco (R$)" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" required />
                <input type="text" placeholder="Descricao (opcional)" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
                <input type="text" placeholder="Unidade: kg, un, lt (opcional)" value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800" />
                <select value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800">
                  <option value="">Sem categoria</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold cursor-pointer hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={uploading} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition disabled:opacity-50">
                  {uploading ? "Enviando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Filtro por categoria */}
      <div className="relative inline-block mb-4">
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 active:scale-95 transition shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {categoryFilter === "ALL"
            ? "Todas as categorias"
            : categoryFilter === "NONE"
            ? "Sem categoria"
            : categories.find((c: any) => c.id === categoryFilter)?.name || "Filtrar"}
          {categoryFilter !== "ALL" && (
            <span className="ml-1 w-2 h-2 rounded-full bg-orange-500" />
          )}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition ${showFilterDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showFilterDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[220px]">
              <button
                onClick={() => { setCategoryFilter("ALL"); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition ${
                  categoryFilter === "ALL" ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Todas as categorias
              </button>
              {categories.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => { setCategoryFilter(c.id); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition ${
                    categoryFilter === c.id ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { setCategoryFilter("NONE"); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition ${
                  categoryFilter === "NONE" ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Sem categoria
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tabela de produtos */}
      {categoryFilter === "ALL" && groupedProducts ? (
        groupedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <p className="text-center py-12 text-gray-500">Nenhum produto cadastrado</p>
          </div>
        ) : (
          groupedProducts.map(([key, group]) => (
            <div key={key} className="mb-6">
              <div className="flex items-center gap-2 mb-2 px-1">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  {group.name} ({group.products.length})
                </h3>
                {/* 3 pontinhos para categoria */}
                {key !== "sem-categoria" && (
                  <div className="relative">
                    <button
                      onClick={() => setCategoryMenuId(categoryMenuId === key ? null : key)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                    {categoryMenuId === key && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setCategoryMenuId(null)} />
                        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                          <button
                            onClick={() => handleDeleteCategory(key)}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir categoria
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                  {renderTableHeader()}
                  <tbody>
                    {group.products.map((product: any) => renderProductRow(product))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            {renderTableHeader()}
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    Nenhum produto nesta categoria
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: any) => renderProductRow(product))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de imagem ampliada */}
      {zoomedImage && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setZoomedImage(null)}>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-6 right-6 text-white/80 hover:text-white cursor-pointer transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={zoomedImage}
              alt="Produto ampliado"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </>
      )}
    </div>
  );
}
