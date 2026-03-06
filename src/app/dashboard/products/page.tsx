"use client";

import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_STORES, CREATE_PRODUCT, CREATE_CATEGORY } from "@/lib/graphql";
import { useState, useEffect } from "react";

export default function ProductsPage() {
  const { data: storesData, refetch } = useQuery(GET_MY_STORES);
  const stores = storesData?.myStores || [];
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

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

  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);

  const store = stores.find((s: any) => s.id === selectedStore);
  const products = store?.products || [];
  const categories = store?.categories || [];

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    await createProduct({
      variables: {
        input: {
          name: productForm.name,
          description: productForm.description || undefined,
          price: parseFloat(productForm.price),
          unit: productForm.unit || undefined,
          storeId: selectedStore,
          categoryId: productForm.categoryId || undefined,
        },
      },
    });
    setProductForm({ name: "", description: "", price: "", unit: "", categoryId: "" });
    setShowProductForm(false);
    refetch();
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    await createCategory({ variables: { name: categoryName, storeId: selectedStore } });
    setCategoryName("");
    setShowCategoryForm(false);
    refetch();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="px-4 py-2 border border-orange-500 text-orange-500 rounded-xl text-sm font-bold hover:bg-orange-50 transition"
          >
            + Categoria
          </button>
          <button
            onClick={() => setShowProductForm(!showProductForm)}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition"
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
            <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold">
              Criar
            </button>
          </div>
        </form>
      )}

      {showProductForm && (
        <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-bold text-gray-800 mb-4">Novo produto</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome do produto"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Preco (R$)"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800"
              required
            />
            <input
              type="text"
              placeholder="Descricao (opcional)"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800"
            />
            <input
              type="text"
              placeholder="Unidade: kg, un, lt (opcional)"
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800"
            />
            <select
              value={productForm.categoryId}
              onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-800"
            >
              <option value="">Sem categoria</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold">
              Adicionar produto
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Produto</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Preco</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Estoque</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-500">
                  Nenhum produto cadastrado
                </td>
              </tr>
            ) : (
              products.map((product: any) => (
                <tr key={product.id} className="border-t border-gray-100">
                  <td className="px-6 py-4 font-medium text-gray-800">{product.name}</td>
                  <td className="px-6 py-4 text-gray-600">R$ {Number(product.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.isAvailable
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {product.isAvailable ? "Disponivel" : "Indisponivel"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
