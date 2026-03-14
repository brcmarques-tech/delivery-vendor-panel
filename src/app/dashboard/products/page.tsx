"use client";

import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import CreateStoreModal from "@/components/CreateStoreModal";
import {
  GET_MY_STORES,
  CREATE_PRODUCT,
  CREATE_CATEGORY,
  DELETE_PRODUCT,
  DELETE_CATEGORY,
  TOGGLE_PRODUCT_AVAILABILITY,
  TOGGLE_PRODUCT_ACTIVE,
  UPDATE_PRODUCT,
  UPLOAD_IMAGE,
  SEARCH_PRODUCT_IMAGES,
  UPLOAD_FROM_URL,
  LOOKUP_BARCODE,
  BULK_CREATE_PRODUCTS,
  SEARCH_CATALOG,
  GET_DELETED_PRODUCTS,
  RESTORE_PRODUCT,
} from "@/lib/graphql";
import { useState, useRef, useCallback, useEffect } from "react";
import Papa from "papaparse";

// Map PT product names to EN search terms for Open Food Facts
const PT_TO_EN: Record<string, string> = {
  'Arroz': 'rice', 'Feijao': 'beans', 'Lentilha': 'lentils', 'Grao de Bico': 'chickpeas',
  'Aveia': 'oats', 'Macarrao': 'pasta', 'Farinha de Trigo': 'wheat flour',
  'Farinha de Mandioca': 'cassava flour', 'Fuba': 'cornmeal', 'Farinha de Rosca': 'breadcrumbs',
  'Oleo de Soja': 'soybean oil', 'Azeite': 'olive oil', 'Vinagre': 'vinegar',
  'Sal ': 'salt', 'Acucar': 'sugar', 'Molho de Tomate': 'tomato sauce',
  'Extrato de Tomate': 'tomato paste', 'Milho Verde': 'canned corn',
  'Ervilha': 'canned peas', 'Sardinha': 'canned sardines', 'Atum': 'canned tuna',
  'Catchup': 'ketchup', 'Maionese': 'mayonnaise', 'Mostarda': 'mustard',
  'Leite Condensado': 'condensed milk', 'Leite': 'milk',
  'Queijo Mussarela': 'mozzarella', 'Queijo Prato': 'cheese',
  'Manteiga': 'butter', 'Margarina': 'margarine', 'Iogurte': 'yogurt',
  'Requeijao': 'cream cheese', 'Creme de Leite': 'heavy cream', 'Cream Cheese': 'cream cheese',
  'Peito de Frango': 'chicken breast', 'Coxa': 'chicken thigh', 'Frango': 'chicken',
  'Carne Moida': 'ground beef', 'Alcatra': 'beef steak', 'Picanha': 'picanha beef',
  'Costela': 'beef ribs', 'Linguica': 'sausage', 'Salsicha': 'hot dog',
  'Presunto': 'ham', 'Mortadela': 'mortadella', 'Bacon': 'bacon',
  'Banana': 'banana', 'Maca': 'apple', 'Laranja': 'orange', 'Limao': 'lime',
  'Manga': 'mango', 'Mamao': 'papaya', 'Melancia': 'watermelon',
  'Uva': 'grapes', 'Abacaxi': 'pineapple', 'Morango': 'strawberry',
  'Tomate': 'tomato', 'Cebola': 'onion', 'Batata Doce': 'sweet potato',
  'Batata': 'potato', 'Cenoura': 'carrot', 'Alho': 'garlic', 'Alface': 'lettuce',
  'Repolho': 'cabbage', 'Pimentao': 'bell pepper', 'Pepino': 'cucumber',
  'Beterraba': 'beetroot', 'Couve': 'kale', 'Mandioca': 'cassava',
  'Abobora': 'pumpkin', 'Chuchu': 'chayote',
  'Pao Frances': 'french bread', 'Pao de Forma': 'sliced bread',
  'Bisnaguinha': 'bread rolls', 'Bolo': 'cake', 'Torrada': 'toast',
  'Agua Mineral': 'mineral water', 'Refrigerante': 'soda',
  'Suco de Laranja': 'orange juice', 'Suco de Uva': 'grape juice',
  'Cerveja': 'beer', 'Cha Mate': 'mate tea',
  'Cafe': 'coffee', 'Cha de Camomila': 'chamomile tea', 'Cha Preto': 'black tea',
  'Achocolatado': 'chocolate powder',
  'Biscoito Cream Cracker': 'crackers', 'Biscoito Maisena': 'cookies',
  'Biscoito Recheado': 'sandwich cookies', 'Batata Chips': 'potato chips',
  'Pipoca': 'popcorn', 'Pizza': 'frozen pizza', 'Lasanha': 'frozen lasagna',
  'Hamburguer': 'hamburger', 'Batata Frita': 'french fries',
  'Nuggets': 'chicken nuggets', 'Sorvete': 'ice cream', 'Ovos': 'eggs',
  'Sabao em Po': 'laundry detergent', 'Detergente': 'dish soap',
  'Agua Sanitaria': 'bleach', 'Desinfetante': 'disinfectant',
  'Esponja': 'steel wool', 'Amaciante': 'fabric softener',
  'Limpador': 'cleaner', 'Sabao em Barra': 'bar soap',
  'Papel Higienico': 'toilet paper', 'Creme Dental': 'toothpaste',
  'Sabonete': 'bath soap', 'Shampoo': 'shampoo', 'Condicionador': 'conditioner',
  'Desodorante': 'deodorant', 'Absorvente': 'sanitary pads', 'Fralda': 'diapers',
};

const imageCache: Record<string, string | null> = {};

function ProductImage({ name, imageUrl, size = 12 }: { name: string; imageUrl?: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(imageUrl || null);
  const [loading, setLoading] = useState(!imageUrl);

  useEffect(() => {
    if (imageUrl) { setSrc(imageUrl); setLoading(false); return; }
    if (imageCache[name] !== undefined) { setSrc(imageCache[name]); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    // Find english search term
    let searchTerm = name;
    for (const [pt, en] of Object.entries(PT_TO_EN)) {
      if (name.includes(pt)) { searchTerm = en; break; }
    }

    const q = encodeURIComponent(searchTerm);
    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=1`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const img = data?.products?.[0]?.image_front_small_url || data?.products?.[0]?.image_front_url || null;
        imageCache[name] = img;
        setSrc(img);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { imageCache[name] = null; setSrc(null); setLoading(false); } });

    return () => { cancelled = true; };
  }, [name, imageUrl]);

  const sizeClass = size === 8 ? "w-8 h-8" : "w-12 h-12";
  const iconSize = size === 8 ? "h-4 w-4" : "h-5 w-5";

  if (loading) {
    return <div className={`${sizeClass} rounded-lg bg-[var(--bg-muted)] flex items-center justify-center flex-shrink-0 animate-pulse`} />;
  }

  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} rounded-lg object-cover flex-shrink-0`} />;
  }

  return (
    <div className={`${sizeClass} rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={`${iconSize} text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

export default function ProductsPage() {
  const { data: storesData, refetch, error: storesError } = useQuery(GET_MY_STORES);
  const stores = storesData?.myStores || [];
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [activePanel, setActivePanel] = useState<"catalog" | "product" | "category" | "csv" | "trash" | null>("catalog");
  const showProductForm = activePanel === "product";
  const showCategoryForm = activePanel === "category";
  const showBulkImport = activePanel === "csv";
  const showTrashPanel = activePanel === "trash";
  const showCatalog = activePanel === "catalog";
  const [error, setError] = useState("");

  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", unit: "", categoryId: "", stock: "", barcode: "", isVariableWeight: false });
  const [categoryName, setCategoryName] = useState("");
  const [inlineNewCategory, setInlineNewCategory] = useState<"product" | "edit" | "csv" | null>(null);
  const [inlineCategoryName, setInlineCategoryName] = useState("");

  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);
  const [toggleAvailability] = useMutation(TOGGLE_PRODUCT_AVAILABILITY);
  const [toggleActive] = useMutation(TOGGLE_PRODUCT_ACTIVE);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const [uploadFromUrl] = useMutation(UPLOAD_FROM_URL);
  const [searchImages, { loading: searchingImages }] = useLazyQuery(SEARCH_PRODUCT_IMAGES);
  const [lookupBarcode, { loading: lookingUpBarcode }] = useLazyQuery(LOOKUP_BARCODE);
  const [bulkCreateProducts] = useMutation(BULK_CREATE_PRODUCTS);
  const [searchCatalog, { loading: searchingCatalog }] = useLazyQuery(SEARCH_CATALOG);

  // Barcode in product form
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeResult, setBarcodeResult] = useState<any>(null);
  const barcodeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const barcodeLastInputTime = useRef<number>(0);

  // Catalog search (always visible)
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const catalogDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // CSV import
  const [csvProducts, setCsvProducts] = useState<any[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; errors: string[] } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const csvFileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [csvWebSearchIndex, setCsvWebSearchIndex] = useState<number | null>(null);

  // Images
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [webImageResults, setWebImageResults] = useState<string[]>([]);
  const [showWebSearch, setShowWebSearch] = useState<"create" | "edit" | "csv" | null>(null);
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [savingWebImage, setSavingWebImage] = useState(false);

  // Filters & editing
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [categoryMenuId, setCategoryMenuId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", price: "", unit: "", categoryId: "", stock: "", isVariableWeight: false });

  // Inline edit (price/stock)
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: "price" | "stock"; value: string; original: string } | null>(null);
  const [confirmInline, setConfirmInline] = useState<{ id: string; field: "price" | "stock"; value: string; original: string } | null>(null);

  // Name autocomplete in product form
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const nameDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Drag & drop
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  // Status dropdown
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  // Deleted products (trash)
  const [fetchDeleted, { data: deletedData, loading: loadingDeleted }] = useLazyQuery(GET_DELETED_PRODUCTS, { fetchPolicy: "network-only" });
  const [restoreProduct] = useMutation(RESTORE_PRODUCT);
  const [trashSearch, setTrashSearch] = useState("");
  const [restoreModal, setRestoreModal] = useState<any>(null); // product being restored

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
            if (!groups[key]) groups[key] = { id: key, name: p.category?.name || "Sem categoria", products: [] };
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

  // ─── Barcode lookup (inside + Produto) ───
  async function doBarcodeLookup(barcode: string) {
    if (!barcode.trim()) { setBarcodeResult(null); return; }
    setError("");
    setBarcodeResult(null);
    try {
      const { data } = await lookupBarcode({ variables: { barcode: barcode.trim() } });
      const result = data?.lookupBarcode;
      if (result?.name) {
        setBarcodeResult(result);
        setProductForm((prev) => ({
          ...prev,
          name: result.name || prev.name,
          description: result.description || (result.brand ? `${result.brand}${result.quantity ? " - " + result.quantity : ""}` : prev.description),
          barcode: barcode.trim(),
          unit: result.quantity ? "un" : prev.unit,
        }));
        if (result.imageUrl) setImagePreview(result.imageUrl);
      } else {
        setBarcodeResult({ barcode: barcode.trim() });
        setProductForm((prev) => ({ ...prev, barcode: barcode.trim() }));
      }
    } catch {
      setError("Erro ao buscar codigo de barras");
    }
  }

  function handleBarcodeInputChange(value: string) {
    setBarcodeInput(value);
    setBarcodeResult(null);
    if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current);
    const now = Date.now();
    const timeSinceLastInput = now - barcodeLastInputTime.current;
    barcodeLastInputTime.current = now;
    const isScanner = timeSinceLastInput < 50 && value.length >= 8;
    if (!value.trim()) return;
    if (isScanner) {
      barcodeDebounceRef.current = setTimeout(() => doBarcodeLookup(value), 100);
    } else if (value.length >= 8) {
      barcodeDebounceRef.current = setTimeout(() => doBarcodeLookup(value), 800);
    }
  }

  // ─── Catalog search (always visible) ───
  const doCatalogSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setCatalogResults([]); return; }
    try {
      const { data } = await searchCatalog({ variables: { query: query.trim(), limit: 20 } });
      setCatalogResults(data?.searchCatalog || []);
    } catch (err: any) {
      console.error("Catalog search error:", err);
    }
  }, [searchCatalog]);

  function handleNameChange(value: string) {
    setProductForm((f) => ({ ...f, name: value }));
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    if (!value.trim() || value.trim().length < 2) { setNameSuggestions([]); setShowNameSuggestions(false); return; }
    nameDebounceRef.current = setTimeout(async () => {
      try {
        const { data } = await searchCatalog({ variables: { query: value.trim(), limit: 8 } });
        setNameSuggestions(data?.searchCatalog || []);
        setShowNameSuggestions(true);
      } catch {}
    }, 400);
  }

  function selectNameSuggestion(product: any) {
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price || ""),
      unit: product.unit || "",
      categoryId: "",
      stock: "",
      barcode: product.barcode || "",
      isVariableWeight: false,
    });
    if (product.imageUrl) {
      setImagePreview(product.imageUrl);
      setImageBase64(null);
    }
    setNameSuggestions([]);
    setShowNameSuggestions(false);
  }

  function handleCatalogQueryChange(value: string) {
    setCatalogQuery(value);
    if (catalogDebounceRef.current) clearTimeout(catalogDebounceRef.current);
    if (!value.trim()) { setCatalogResults([]); return; }
    catalogDebounceRef.current = setTimeout(() => doCatalogSearch(value), 400);
  }

  async function handleAddFromCatalog(product: any) {
    if (!activeStoreId) {
      setError("Nenhuma loja encontrada. Crie uma loja primeiro.");
      return;
    }
    setError("");
    try {
      const input: any = {
        name: product.name,
        price: Number(product.price),
        storeId: activeStoreId,
        stock: 0,
      };
      if (product.description) input.description = product.description;
      if (product.imageUrl) input.imageUrl = product.imageUrl;
      if (product.unit) input.unit = product.unit;
      if (product.barcode) input.barcode = product.barcode;

      console.log("Adding from catalog:", input);
      const result = await createProduct({ variables: { input } });
      console.log("Create result:", result);
      setCatalogResults((prev) => prev.filter((p) => p.id !== product.id));
      await refetch();
    } catch (err: any) {
      console.error("Add from catalog error:", err);
      setError(err.message || "Erro ao adicionar produto");
    }
  }

  // ─── CSV import ───
  function handleCsvUpload(file: File) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const prods = results.data.map((row: any) => ({
          name: row.nome || row.name || row.produto || row.descricao_produto || row["Descricao"] || row["Produto"] || row["Nome"] || "",
          description: row.descricao || row.description || row.obs || row["Observacao"] || "",
          price: parseFloat(String(row.preco || row.price || row.valor || row.preco_venda || row["Preco"] || row["Valor"] || "0").replace(",", ".")) || 0,
          unit: row.unidade || row.unit || row.un || row["Unidade"] || row["UN"] || "",
          stock: parseInt(row.estoque || row.stock || row.qtd || row.quantidade || row["Estoque"] || row["Qtd"] || "0") || 0,
          barcode: row.codigo_barras || row.barcode || row.ean || row.cod_barras || row.gtin || row["EAN"] || row["Codigo"] || "",
          categoryId: "",
          imageUrl: row.imagem || row.image || row.imageUrl || row.foto || "",
        })).filter((p: any) => p.name && p.price > 0);
        setCsvProducts(prods);
        setBulkResult(null);
        setShowCsvModal(true);
      },
    });
  }

  function updateCsvProduct(index: number, field: string, value: any) {
    setCsvProducts((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  function removeCsvProduct(index: number) {
    setCsvProducts((prev) => prev.filter((_, i) => i !== index));
    if (csvProducts.length <= 1) setShowCsvModal(false);
  }

  async function handleBulkImport() {
    if (!activeStoreId || csvProducts.length === 0) return;
    setBulkImporting(true); setError(""); setBulkResult(null);
    try {
      const { data } = await bulkCreateProducts({
        variables: {
          input: {
            storeId: activeStoreId,
            products: csvProducts.map((p) => ({
              name: p.name, description: p.description || undefined, price: p.price,
              unit: p.unit || undefined, stock: p.stock || 0, barcode: p.barcode || undefined,
              imageUrl: p.imageUrl || undefined, categoryId: p.categoryId || undefined,
            })),
          },
        },
      });
      setBulkResult(data.bulkCreateProducts);
      if (data.bulkCreateProducts.errors.length === 0) {
        setCsvProducts([]);
        setShowCsvModal(false);
      }
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao importar produtos");
    }
    setBulkImporting(false);
  }

  function handleCsvImageSelect(file: File, index: number) {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const { data: uploadData } = await uploadImage({ variables: { base64, folder: "products" } });
        updateCsvProduct(index, "imageUrl", uploadData.uploadImage);
      } catch {
        setError("Erro ao enviar imagem");
      }
    };
    reader.readAsDataURL(file);
  }

  // ─── Image handling ───
  async function handleWebSearch(mode: "create" | "edit" | "csv", csvIndex?: number) {
    let query = "";
    if (mode === "create") query = productForm.name;
    else if (mode === "edit") query = editForm.name;
    else if (mode === "csv" && csvIndex !== undefined) {
      query = csvProducts[csvIndex]?.name || "";
      setCsvWebSearchIndex(csvIndex);
    }
    if (!query.trim()) return;
    setShowWebSearch(mode); setWebSearchQuery(query); setWebImageResults([]);
    try {
      const { data } = await searchImages({ variables: { query: query + " produto" } });
      setWebImageResults(data?.searchProductImages || []);
    } catch { setError("Erro ao buscar imagens"); }
  }

  async function handleSelectWebImage(url: string) {
    setSavingWebImage(true);
    try {
      const { data } = await uploadFromUrl({ variables: { url, folder: "products" } });
      const savedUrl = data.uploadFromUrl;
      if (showWebSearch === "create") { setImagePreview(savedUrl); setImageBase64(null); }
      else if (showWebSearch === "csv" && csvWebSearchIndex !== null) {
        updateCsvProduct(csvWebSearchIndex, "imageUrl", savedUrl);
        setCsvWebSearchIndex(null);
      } else { setEditImagePreview(savedUrl); setEditImageBase64(null); }
      if (showWebSearch === "edit" && editingProduct) {
        await updateProduct({ variables: { input: { id: editingProduct.id, imageUrl: savedUrl } } });
        refetch();
      }
      setShowWebSearch(null); setWebImageResults([]); setSavingWebImage(false);
    } catch { setSavingWebImage(false); setError("Erro ao salvar imagem"); }
  }

  function handleImageSelect(file: File, mode: "create" | "edit") {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (mode === "create") { setImagePreview(result); setImageBase64(result); }
      else { setEditImagePreview(result); setEditImageBase64(result); }
    };
    reader.readAsDataURL(file);
  }

  // ─── CRUD ───
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!activeStoreId) { setError("Nenhuma loja encontrada."); return; }
    try {
      setUploading(true);
      let imageUrl: string | undefined;
      if (imageBase64) {
        const { data: uploadData } = await uploadImage({ variables: { base64: imageBase64, folder: "products" } });
        imageUrl = uploadData.uploadImage;
      } else if (imagePreview && imagePreview.startsWith("http")) {
        imageUrl = imagePreview;
      }
      await createProduct({
        variables: {
          input: {
            name: productForm.name, description: productForm.description || undefined,
            price: parseFloat(productForm.price), unit: productForm.unit || undefined,
            storeId: activeStoreId, categoryId: productForm.categoryId || undefined,
            imageUrl, barcode: productForm.barcode || undefined,
            isVariableWeight: productForm.isVariableWeight || undefined,
            ...(productForm.stock ? { stock: parseInt(productForm.stock) } : {}),
          },
        },
      });
      setProductForm({ name: "", description: "", price: "", unit: "", categoryId: "", stock: "", barcode: "", isVariableWeight: false });
      setImagePreview(null); setImageBase64(null); setBarcodeInput(""); setBarcodeResult(null);
      setActivePanel("catalog"); setUploading(false);
      refetch();
    } catch (err: any) { setUploading(false); setError(err.message || "Erro ao criar produto"); }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!activeStoreId) { setError("Nenhuma loja encontrada."); return; }
    try {
      await createCategory({ variables: { name: categoryName, storeId: activeStoreId } });
      setCategoryName(""); setActivePanel("catalog"); refetch();
    } catch (err: any) { setError(err.message || "Erro ao criar categoria"); }
  }

  async function handleInlineCreateCategory(target: "product" | "edit" | "csv") {
    if (!inlineCategoryName.trim() || !activeStoreId) return;
    try {
      const res = await createCategory({ variables: { name: inlineCategoryName.trim(), storeId: activeStoreId } });
      const newId = res.data?.createCategory?.id;
      if (target === "product") setProductForm({ ...productForm, categoryId: newId || "" });
      if (target === "edit") setEditForm({ ...editForm, categoryId: newId || "" });
      setInlineCategoryName("");
      setInlineNewCategory(null);
      refetch();
    } catch (err: any) { setError(err.message || "Erro ao criar categoria"); }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try { await deleteProduct({ variables: { id } }); refetch(); }
    catch (err: any) { setError(err.message || "Erro ao excluir produto"); }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Excluir esta categoria? Os produtos ficarao sem categoria.")) return;
    try {
      await deleteCategory({ variables: { id } }); setCategoryMenuId(null);
      if (categoryFilter === id) setCategoryFilter("ALL"); refetch();
    } catch (err: any) { setError(err.message || "Erro ao excluir categoria"); }
  }

  async function handleToggleAvailability(id: string) {
    try { await toggleAvailability({ variables: { id } }); setStatusMenuId(null); refetch(); }
    catch (err: any) { setError(err.message); }
  }

  async function handleToggleActive(id: string) {
    try { await toggleActive({ variables: { id } }); setStatusMenuId(null); refetch(); }
    catch (err: any) { setError(err.message); }
  }

  function startEditing(product: any) {
    setEditingProduct(product);
    setEditForm({ name: product.name, description: product.description || "", price: String(product.price), unit: product.unit || "", categoryId: product.category?.id || "", stock: String(product.stock || 0), isVariableWeight: product.isVariableWeight || false });
    setEditImagePreview(product.imageUrl || null); setEditImageBase64(null);
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
            id: editingProduct.id, name: editForm.name, description: editForm.description || undefined,
            price: parseFloat(editForm.price), unit: editForm.unit || undefined,
            categoryId: editForm.categoryId || undefined, stock: parseInt(editForm.stock) || 0,
            isVariableWeight: editForm.isVariableWeight,
            ...(imageUrl && { imageUrl }),
          },
        },
      });
      setEditingProduct(null); setEditImagePreview(null); setEditImageBase64(null); setUploading(false); refetch();
    } catch (err: any) { setUploading(false); setError(err.message || "Erro ao atualizar produto"); }
  }

  // ─── Drag & Drop ───
  function handleDragStart(productId: string) {
    setDraggedProductId(productId);
  }

  function handleDragOver(e: React.DragEvent, categoryId: string) {
    e.preventDefault();
    setDragOverCategory(categoryId);
  }

  function handleDragLeave() {
    setDragOverCategory(null);
  }

  async function handleDrop(categoryId: string) {
    if (!draggedProductId) return;
    setDragOverCategory(null);
    setDraggedProductId(null);
    const realCategoryId = categoryId === "sem-categoria" ? "" : categoryId;
    try {
      await updateProduct({
        variables: { input: { id: draggedProductId, categoryId: realCategoryId || undefined } },
      });
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao mover produto");
    }
  }

  // ─── Inline edit ───
  function startInlineEdit(productId: string, field: "price" | "stock", currentValue: number) {
    const strVal = field === "price" ? currentValue.toFixed(2) : String(currentValue);
    setInlineEdit({ id: productId, field, value: strVal, original: strVal });
  }

  function handleInlineBlurOrEnter() {
    if (!inlineEdit) return;
    const newVal = inlineEdit.field === "price"
      ? parseFloat(inlineEdit.value)
      : parseInt(inlineEdit.value) || 0;
    const origVal = inlineEdit.field === "price"
      ? parseFloat(inlineEdit.original)
      : parseInt(inlineEdit.original) || 0;

    if (newVal === origVal || isNaN(newVal)) {
      setInlineEdit(null);
      return;
    }
    setConfirmInline(inlineEdit);
    setInlineEdit(null);
  }

  async function confirmInlineEdit() {
    if (!confirmInline) return;
    const { id, field, value } = confirmInline;
    try {
      const input: any = { id };
      if (field === "price") input.price = parseFloat(value);
      else input.stock = parseInt(value) || 0;
      await updateProduct({ variables: { input } });
      refetch();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar");
    }
    setConfirmInline(null);
  }

  // ─── Status helpers ───
  function getStatusInfo(product: any) {
    if (!product.isActive) return { label: "Oculto", color: "bg-[var(--bg-muted)] text-[var(--text-muted)]", dot: "bg-gray-400" };
    if (!product.isAvailable) return { label: "Indisponivel", color: "bg-red-100 text-red-600", dot: "bg-red-500" };
    return { label: "Disponivel", color: "bg-green-100 text-green-600", dot: "bg-green-500" };
  }

  // ─── Render helpers ───
  function renderProductRow(product: any) {
    const status = getStatusInfo(product);
    return (
      <tr
        key={product.id}
        className={`border-t border-gray-100 hover:bg-[var(--bg-hover)]/50 ${!product.isActive ? "opacity-50" : ""}`}
      >
        <td className="pl-2 pr-0 py-4 w-8">
          <div
            draggable
            onDragStart={() => handleDragStart(product.id)}
            className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-300 hover:text-[var(--text-muted)] transition"
            title="Arrastar para outra categoria"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
              <circle cx="9" cy="10" r="1.5" /><circle cx="15" cy="10" r="1.5" />
              <circle cx="9" cy="15" r="1.5" /><circle cx="15" cy="15" r="1.5" />
              <circle cx="9" cy="20" r="1.5" /><circle cx="15" cy="20" r="1.5" />
            </svg>
          </div>
        </td>
        <td className="px-4 py-4">
          <button onClick={() => startEditing(product)} className="text-left cursor-pointer hover:text-orange-600 transition flex items-center gap-3">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 hover:opacity-80 transition"
                onClick={(e) => { e.stopPropagation(); setZoomedImage(product.imageUrl); }} />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div>
              <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
              {product.description && <p className="text-xs text-gray-400 mt-0.5">{product.description}</p>}
            </div>
          </button>
        </td>
        <td className="px-6 py-4 text-[var(--text-secondary)]">
          {inlineEdit && inlineEdit.id === product.id && inlineEdit.field === "price" ? (
            <input type="number" step="0.01" autoFocus value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={handleInlineBlurOrEnter}
              onKeyDown={(e) => { if (e.key === "Enter") handleInlineBlurOrEnter(); if (e.key === "Escape") setInlineEdit(null); }}
              className="w-24 px-2 py-1 border border-orange-300 rounded-lg text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => startInlineEdit(product.id, "price", Number(product.price))}
                className="cursor-pointer hover:bg-orange-50 hover:text-orange-600 px-2 py-1 rounded-lg transition text-left">
                R$ {Number(product.price).toFixed(2)}
              </button>
              {product.isVariableWeight && (
                <span className="px-1.5 py-0.5 bg-[var(--bg-muted)] text-[var(--text-muted)] text-xs rounded-full font-medium">por peso</span>
              )}
            </div>
          )}
        </td>
        <td className="px-6 py-4 text-[var(--text-secondary)]">
          {inlineEdit && inlineEdit.id === product.id && inlineEdit.field === "stock" ? (
            <input type="number" min="0" autoFocus value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={handleInlineBlurOrEnter}
              onKeyDown={(e) => { if (e.key === "Enter") handleInlineBlurOrEnter(); if (e.key === "Escape") setInlineEdit(null); }}
              className="w-20 px-2 py-1 border border-orange-300 rounded-lg text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
          ) : (
            <button onClick={() => startInlineEdit(product.id, "stock", product.stock || 0)}
              className="cursor-pointer hover:bg-orange-50 hover:text-orange-600 px-2 py-1 rounded-lg transition text-left">
              {product.stock > 0 ? product.stock : <span className="text-gray-400 text-xs">Ilimitado</span>}
            </button>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="relative inline-block">
            <button
              onClick={(e) => { e.stopPropagation(); setStatusMenuId(statusMenuId === product.id ? null : product.id); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition active:scale-95 flex items-center gap-1.5 ${status.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {status.label}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {statusMenuId === product.id && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setStatusMenuId(null)} />
                <div className="absolute left-0 bottom-full mb-2 z-40 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[200px]">
                  {product.isActive && (
                    <button onClick={() => handleToggleAvailability(product.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] font-medium cursor-pointer transition hover:bg-[var(--bg-hover)] flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${product.isAvailable ? "bg-red-500" : "bg-green-500"}`} />
                      {product.isAvailable ? "Marcar indisponivel" : "Marcar disponivel"}
                    </button>
                  )}
                  {product.isActive && <div className="border-t border-gray-100 my-1" />}
                  <button onClick={() => handleToggleActive(product.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] font-medium cursor-pointer transition hover:bg-[var(--bg-hover)] flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${product.isActive ? "bg-gray-400" : "bg-green-500"}`} />
                    {product.isActive ? "Ocultar produto" : "Mostrar produto"}
                  </button>
                </div>
              </>
            )}
          </div>
        </td>
        <td className="px-6 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => startEditing(product)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 cursor-pointer transition" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition" title="Excluir">
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
      <thead className="bg-[var(--bg-hover)]">
        <tr>
          <th className="w-8" />
          <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]">Produto</th>
          <th className="text-left px-6 py-3 text-sm font-semibold text-[var(--text-secondary)]">Preco</th>
          <th className="text-left px-6 py-3 text-sm font-semibold text-[var(--text-secondary)]">Estoque</th>
          <th className="text-left px-6 py-3 text-sm font-semibold text-[var(--text-secondary)]">Status</th>
          <th className="text-left px-6 py-3 text-sm font-semibold text-[var(--text-secondary)] w-24">Acoes</th>
        </tr>
      </thead>
    );
  }

  function renderProductCard(product: any) {
    const status = getStatusInfo(product);
    return (
      <div
        key={product.id}
        className={`bg-[var(--bg-card)] rounded-2xl shadow-sm p-4 flex flex-col gap-3 ${!product.isActive ? "opacity-50" : ""}`}
      >
        {/* Top row: image + info */}
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <button
            onClick={() => product.imageUrl && setZoomedImage(product.imageUrl)}
            className={`flex-shrink-0 ${product.imageUrl ? "cursor-pointer" : "cursor-default"}`}
          >
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </button>

          {/* Name + category + status */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-primary)] leading-tight">{product.name}</p>
            {product.description && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{product.description}</p>
            )}
            {product.category?.name && (
              <p className="text-xs text-gray-400 mt-0.5">{product.category.name}</p>
            )}
          </div>

          {/* Status badge */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setStatusMenuId(statusMenuId === product.id ? null : product.id); }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition active:scale-95 flex items-center gap-1.5 ${status.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </button>
            {statusMenuId === product.id && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setStatusMenuId(null)} />
                <div className="absolute right-0 top-full mt-1 z-40 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[200px]">
                  {product.isActive && (
                    <button onClick={() => handleToggleAvailability(product.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] font-medium cursor-pointer transition hover:bg-[var(--bg-hover)] flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${product.isAvailable ? "bg-red-500" : "bg-green-500"}`} />
                      {product.isAvailable ? "Marcar indisponivel" : "Marcar disponivel"}
                    </button>
                  )}
                  {product.isActive && <div className="border-t border-gray-100 my-1" />}
                  <button onClick={() => handleToggleActive(product.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] font-medium cursor-pointer transition hover:bg-[var(--bg-hover)] flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${product.isActive ? "bg-gray-400" : "bg-green-500"}`} />
                    {product.isActive ? "Ocultar produto" : "Mostrar produto"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Price + stock row */}
        <div className="flex items-center gap-4 px-1">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Preco</p>
            {inlineEdit && inlineEdit.id === product.id && inlineEdit.field === "price" ? (
              <input type="number" step="0.01" autoFocus value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onBlur={handleInlineBlurOrEnter}
                onKeyDown={(e) => { if (e.key === "Enter") handleInlineBlurOrEnter(); if (e.key === "Escape") setInlineEdit(null); }}
                className="w-28 px-2 py-1 border border-orange-300 rounded-lg text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => startInlineEdit(product.id, "price", Number(product.price))}
                  className="text-sm font-semibold text-[var(--text-primary)] cursor-pointer hover:text-orange-600 transition">
                  R$ {Number(product.price).toFixed(2)}
                </button>
                {product.isVariableWeight && (
                  <span className="px-1.5 py-0.5 bg-[var(--bg-muted)] text-[var(--text-muted)] text-xs rounded-full font-medium">por peso</span>
                )}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Estoque</p>
            {inlineEdit && inlineEdit.id === product.id && inlineEdit.field === "stock" ? (
              <input type="number" min="0" autoFocus value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onBlur={handleInlineBlurOrEnter}
                onKeyDown={(e) => { if (e.key === "Enter") handleInlineBlurOrEnter(); if (e.key === "Escape") setInlineEdit(null); }}
                className="w-20 px-2 py-1 border border-orange-300 rounded-lg text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
            ) : (
              <button onClick={() => startInlineEdit(product.id, "stock", product.stock || 0)}
                className="text-sm font-semibold text-[var(--text-primary)] cursor-pointer hover:text-orange-600 transition">
                {product.stock > 0 ? product.stock : <span className="text-gray-400 text-xs font-normal">Ilimitado</span>}
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          <button onClick={() => startEditing(product)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-hover)] hover:bg-orange-50 hover:text-orange-600 cursor-pointer transition active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button onClick={() => handleDeleteProduct(product.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-hover)] hover:bg-red-50 hover:text-red-600 cursor-pointer transition active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir
          </button>
        </div>
      </div>
    );
  }

  if (!storesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => refetch()} />
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja cadastrada</h2>
          <p className="text-[var(--text-secondary)] mb-6">Crie sua primeira loja para começar a cadastrar produtos</p>
          <button onClick={() => setShowCreateStore(true)} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
            Criar loja
          </button>
        </div>
      </>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Produtos</h1>
        <button onClick={() => { setActivePanel(activePanel === "product" ? "catalog" : "product"); setBarcodeInput(""); setBarcodeResult(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition flex items-center gap-2 ${activePanel === "product" ? "bg-orange-600 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Produto
        </button>
      </div>

      {/* Category form */}
      {showCategoryForm && (
        <form onSubmit={handleCreateCategory} className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--text-primary)]">Nova categoria</h3>
            <button onClick={() => setActivePanel("catalog")} className="text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-3">
            <input type="text" placeholder="Nome da categoria" value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
              className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" required />
            <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">Criar</button>
          </div>
        </form>
      )}

      {/* CSV Import */}
      {showBulkImport && (
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--text-primary)] text-lg">Importar via CSV</h3>
            <button onClick={() => setActivePanel("catalog")} className="text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Colunas: <strong>nome</strong> (ou name), <strong>preco</strong> (ou price), e opcionalmente: descricao, unidade, estoque, codigo_barras (ou barcode/ean)
          </p>
          <input type="file" ref={csvInputRef} accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleCsvUpload(e.target.files[0]); }} />
          <button onClick={() => csvInputRef.current?.click()}
            className="px-6 py-3 border-2 border-dashed border-[var(--border-color)] rounded-xl text-[var(--text-muted)] font-semibold cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95 transition w-full flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Selecionar arquivo CSV
          </button>
          {csvProducts.length > 0 && !showCsvModal && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">{csvProducts.length} produtos carregados</p>
              <button onClick={() => setShowCsvModal(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-600 active:scale-95 transition">
                Revisar produtos
              </button>
            </div>
          )}
          {bulkResult && (
            <div className={`mt-4 p-4 rounded-xl ${bulkResult.errors.length > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
              <p className="font-semibold text-[var(--text-primary)]">{bulkResult.created} produtos importados com sucesso!</p>
              {bulkResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-red-600 mb-1">Erros:</p>
                  {bulkResult.errors.map((err: string, i: number) => <p key={i} className="text-sm text-red-500">{err}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* + Produto form (with barcode) */}
      {showProductForm && (
        <form onSubmit={handleCreateProduct} className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--text-primary)]">Novo produto</h3>
            <button onClick={() => setActivePanel("catalog")} className="text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Barcode scanner */}
          <div className="mb-4 p-4 bg-blue-50 rounded-xl">
            <label className="text-sm font-semibold text-blue-700 mb-2 block">Buscar por codigo de barras (EAN)</label>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <input type="text" placeholder="Escaneie com a pistola ou digite o EAN..."
                value={barcodeInput} onChange={(e) => handleBarcodeInputChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current); doBarcodeLookup(barcodeInput); } }}
                className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-xl text-[var(--text-primary)] font-mono tracking-wider bg-[var(--bg-card)] focus:border-blue-400 outline-none transition" />
              {lookingUpBarcode && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
            </div>
            {barcodeResult?.name && (
              <div className="mt-3 p-3 bg-[var(--bg-card)] border border-green-200 rounded-xl flex items-center gap-3">
                {barcodeResult.imageUrl && <img src={barcodeResult.imageUrl} alt={barcodeResult.name} className="w-12 h-12 rounded-lg object-cover" />}
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{barcodeResult.name}</p>
                  {barcodeResult.brand && <p className="text-xs text-[var(--text-muted)]">{barcodeResult.brand} {barcodeResult.quantity && `- ${barcodeResult.quantity}`}</p>}
                </div>
                <span className="text-xs text-green-600 font-semibold">Preenchido!</span>
              </div>
            )}
          </div>
          {/* Image upload */}
          <div className="mb-4">
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0], "create"); }} />
            {imagePreview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-36 h-36 rounded-2xl object-cover shadow-sm cursor-pointer hover:opacity-90 transition" onClick={() => fileInputRef.current?.click()} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageBase64(null); }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-red-600 transition shadow-md">&#10005;</button>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-orange-500 font-medium cursor-pointer hover:text-orange-600 transition">Trocar imagem</button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-400">Clique para adicionar imagem</p>
                </div>
              </div>
            )}
            {productForm.name.trim() && !imagePreview && (
              <button type="button" onClick={() => handleWebSearch("create")} disabled={searchingImages}
                className="mt-2 w-full py-2 text-sm text-blue-600 bg-blue-50 rounded-xl font-semibold cursor-pointer hover:bg-blue-100 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchingImages ? "Buscando..." : "Buscar imagem na internet"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input type="text" placeholder="Nome do produto" value={productForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => { if (nameSuggestions.length > 0) setShowNameSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" required autoComplete="off" />
              {showNameSuggestions && nameSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {nameSuggestions.map((s: any) => (
                    <button key={s.id} type="button" onMouseDown={() => selectNameSuggestion(s)}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center gap-3 transition cursor-pointer">
                      <ProductImage name={s.name} imageUrl={s.imageUrl} size={8} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.name}</p>
                        <p className="text-xs text-gray-400">R$ {Number(s.price).toFixed(2)} {s.unit ? `/ ${s.unit}` : ""} {s.barcode ? `· EAN: ${s.barcode}` : ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">R$</span>
              <input type="number" step="0.01" placeholder="0.00" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" required />
            </div>
            <input type="text" placeholder="Descricao (opcional)" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" />
            <input type="text" placeholder="Unidade: kg, un, lt (opcional)" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" disabled={productForm.isVariableWeight} />
            <input type="number" min="0" placeholder="Estoque (0 = ilimitado)" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" />
            {inlineNewCategory === "product" ? (
              <div className="flex gap-2">
                <input type="text" autoFocus placeholder="Nome da categoria" value={inlineCategoryName}
                  onChange={(e) => setInlineCategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleInlineCreateCategory("product"); } if (e.key === "Escape") { setInlineNewCategory(null); setInlineCategoryName(""); } }}
                  className="flex-1 px-4 py-2 border border-orange-300 rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-orange-200 outline-none" />
                <button type="button" onClick={() => handleInlineCreateCategory("product")} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition text-sm">Criar</button>
                <button type="button" onClick={() => { setInlineNewCategory(null); setInlineCategoryName(""); }} className="px-3 py-2 text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer">&#10005;</button>
              </div>
            ) : (
              <select value={productForm.categoryId} onChange={(e) => { if (e.target.value === "__new__") { setInlineNewCategory("product"); setInlineCategoryName(""); return; } setProductForm({ ...productForm, categoryId: e.target.value }); }} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]">
                <option value="">Sem categoria</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new__">+ Criar categoria</option>
              </select>
            )}
            <label className="flex items-center gap-3 col-span-1 md:col-span-2 cursor-pointer">
              <div className={`relative w-11 h-6 rounded-full transition ${productForm.isVariableWeight ? 'bg-orange-500' : 'bg-gray-200'}`} onClick={() => setProductForm({...productForm, isVariableWeight: !productForm.isVariableWeight, unit: !productForm.isVariableWeight ? 'kg' : productForm.unit})}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--bg-card)] rounded-full shadow transition-transform ${productForm.isVariableWeight ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Produto vendido por peso (preco por kg)</span>
            </label>
            <button type="submit" disabled={uploading} className="md:col-span-2 px-6 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition disabled:opacity-50">
              {uploading ? "Enviando..." : "Adicionar produto"}
            </button>
          </div>
        </form>
      )}

      {/* Catalog search */}
      {showCatalog && <div className="bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="font-bold text-[var(--text-primary)]">Cadastro rapido</h3>
          <span className="text-xs text-gray-400">Busque no catalogo da plataforma e adicione com um clique</span>
        </div>
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Digite o nome do produto ou codigo de barras..."
            value={catalogQuery} onChange={(e) => handleCatalogQueryChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition" />
          {searchingCatalog && <div className="absolute right-4 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}
        </div>
        {catalogResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
            {catalogResults.map((product: any) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-[var(--bg-hover)] rounded-xl hover:bg-purple-50 transition">
                <ProductImage name={product.name} imageUrl={product.imageUrl} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] truncate">{product.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>R$ {Number(product.price).toFixed(2)}</span>
                    {product.unit && <span>/ {product.unit}</span>}
                    {product.barcode && <span>EAN: {product.barcode}</span>}
                  </div>
                  {product.store?.name && <p className="text-xs text-gray-300 mt-0.5">de: {product.store.name}</p>}
                </div>
                <button onClick={() => handleAddFromCatalog(product)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-purple-600 active:scale-95 transition flex-shrink-0">
                  + Adicionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* Trash / deleted products */}
      {showTrashPanel && (() => {
        const trashItems = deletedData?.deletedProductsByStore || [];
        const filtered = trashSearch.trim()
          ? trashItems.filter((p: any) => p.name.toLowerCase().includes(trashSearch.toLowerCase()))
          : trashItems;
        return (
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm mb-6 border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <h3 className="font-bold text-[var(--text-primary)]">Produtos excluidos</h3>
            <span className="text-xs text-gray-400 flex-1">Restaure ou busque produtos removidos</span>
            <button onClick={() => setActivePanel("catalog")} className="text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {trashItems.length > 0 && (
            <div className="relative mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Buscar nos excluidos..." value={trashSearch} onChange={(e) => setTrashSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-red-300 focus:ring-1 focus:ring-red-100 outline-none transition" />
            </div>
          )}
          {loadingDeleted ? (
            <p className="text-gray-400 text-sm">Carregando...</p>
          ) : trashItems.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum produto na lixeira.</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum resultado para &quot;{trashSearch}&quot;</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filtered.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-red-50/50 rounded-xl">
                  <ProductImage name={p.name} imageUrl={p.imageUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-secondary)] truncate">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>R$ {Number(p.price).toFixed(2)}</span>
                      {p.unit && <span>/ {p.unit}</span>}
                      {p.category?.name && <span>· {p.category.name}</span>}
                      {p.deletedAt && <span>· excluido em {new Date(Number(p.deletedAt)).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <button onClick={() => setRestoreModal({ ...p, editPrice: String(p.price), editStock: String(p.stock || 0), editName: p.name })}
                    className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-green-600 active:scale-95 transition flex-shrink-0">
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        );
      })()}

      {/* Restore modal */}
      {restoreModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setRestoreModal(null)}>
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--text-primary)] text-lg">Restaurar produto</h3>
              <button onClick={() => setRestoreModal(null)} className="text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3 mb-5 p-3 bg-[var(--bg-hover)] rounded-xl">
              <ProductImage name={restoreModal.name} imageUrl={restoreModal.imageUrl} />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{restoreModal.name}</p>
                {restoreModal.category?.name && <p className="text-xs text-gray-400">{restoreModal.category.name}</p>}
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Nome</label>
                <input type="text" value={restoreModal.editName} onChange={(e) => setRestoreModal({ ...restoreModal, editName: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-green-400 outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Preco (R$)</label>
                  <input type="number" step="0.01" value={restoreModal.editPrice} onChange={(e) => setRestoreModal({ ...restoreModal, editPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-green-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Estoque</label>
                  <input type="number" min="0" value={restoreModal.editStock} onChange={(e) => setRestoreModal({ ...restoreModal, editStock: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-green-400 outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRestoreModal(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl text-sm font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition">
                Cancelar
              </button>
              <button onClick={async () => {
                try {
                  await restoreProduct({ variables: { id: restoreModal.id } });
                  // Update price/stock/name if changed
                  const updates: any = { id: restoreModal.id };
                  if (restoreModal.editName !== restoreModal.name) updates.name = restoreModal.editName;
                  if (Number(restoreModal.editPrice) !== Number(restoreModal.price)) updates.price = Number(restoreModal.editPrice);
                  if (Number(restoreModal.editStock) !== Number(restoreModal.stock || 0)) updates.stock = Number(restoreModal.editStock);
                  if (Object.keys(updates).length > 1) {
                    await updateProduct({ variables: { input: updates } });
                  }
                  setRestoreModal(null);
                  await refetch();
                  fetchDeleted({ variables: { storeId: activeStoreId } });
                } catch (err: any) { setError(err.message); }
              }}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-green-600 active:scale-95 transition">
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingProduct && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEditingProduct(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleUpdateProduct} className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-xl w-full max-w-md">
              <h3 className="font-bold text-[var(--text-primary)] mb-4 text-lg">Editar produto</h3>
              <div className="mb-4">
                <input type="file" ref={editFileInputRef} accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0], "edit"); }} />
                {editImagePreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <img src={editImagePreview} alt="Preview" className="w-36 h-36 rounded-2xl object-cover shadow-sm cursor-pointer hover:opacity-90 transition" onClick={() => editFileInputRef.current?.click()} />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditImagePreview(null); setEditImageBase64(null); }}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-red-600 transition shadow-md">&#10005;</button>
                    </div>
                    <button type="button" onClick={() => editFileInputRef.current?.click()} className="text-sm text-orange-500 font-medium cursor-pointer hover:text-orange-600 transition">Trocar imagem</button>
                  </div>
                ) : (
                  <div onClick={() => editFileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-400">Clique para adicionar imagem</p>
                    </div>
                  </div>
                )}
                {editForm.name.trim() && !editImagePreview && (
                  <button type="button" onClick={() => handleWebSearch("edit")} disabled={searchingImages}
                    className="mt-2 w-full py-2 text-sm text-blue-600 bg-blue-50 rounded-xl font-semibold cursor-pointer hover:bg-blue-100 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchingImages ? "Buscando..." : "Buscar imagem na internet"}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Nome" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" required />
                <input type="number" step="0.01" placeholder="Preco (R$)" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" required />
                <input type="text" placeholder="Descricao (opcional)" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" />
                <input type="text" placeholder="Unidade: kg, un, lt (opcional)" value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" disabled={editForm.isVariableWeight} />
                <input type="number" min="0" placeholder="Estoque (0 = ilimitado)" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" />
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative w-11 h-6 rounded-full transition ${editForm.isVariableWeight ? 'bg-orange-500' : 'bg-gray-200'}`} onClick={() => setEditForm({...editForm, isVariableWeight: !editForm.isVariableWeight, unit: !editForm.isVariableWeight ? 'kg' : editForm.unit})}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--bg-card)] rounded-full shadow transition-transform ${editForm.isVariableWeight ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">Produto vendido por peso (preco por kg)</span>
                </label>
                {inlineNewCategory === "edit" ? (
                  <div className="flex gap-2">
                    <input type="text" autoFocus placeholder="Nome da categoria" value={inlineCategoryName}
                      onChange={(e) => setInlineCategoryName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleInlineCreateCategory("edit"); } if (e.key === "Escape") { setInlineNewCategory(null); setInlineCategoryName(""); } }}
                      className="flex-1 px-4 py-2 border border-orange-300 rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-orange-200 outline-none" />
                    <button type="button" onClick={() => handleInlineCreateCategory("edit")} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition text-sm">Criar</button>
                    <button type="button" onClick={() => { setInlineNewCategory(null); setInlineCategoryName(""); }} className="px-3 py-2 text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer">&#10005;</button>
                  </div>
                ) : (
                  <select value={editForm.categoryId} onChange={(e) => { if (e.target.value === "__new__") { setInlineNewCategory("edit"); setInlineCategoryName(""); return; } setEditForm({ ...editForm, categoryId: e.target.value }); }} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]">
                    <option value="">Sem categoria</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="__new__">+ Criar categoria</option>
                  </select>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition">Cancelar</button>
                <button type="submit" disabled={uploading} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition disabled:opacity-50">
                  {uploading ? "Enviando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Toolbar: filter left, actions right */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
      <div className="relative inline-block">
        <button onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {categoryFilter === "ALL" ? "Todas as categorias" : categoryFilter === "NONE" ? "Sem categoria" : categories.find((c: any) => c.id === categoryFilter)?.name || "Filtrar"}
          {categoryFilter !== "ALL" && <span className="ml-1 w-2 h-2 rounded-full bg-orange-500" />}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition ${showFilterDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showFilterDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
            <div className="absolute left-0 top-full mt-1 z-20 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[220px]">
              <button onClick={() => { setCategoryFilter("ALL"); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition ${categoryFilter === "ALL" ? "bg-orange-50 text-orange-600 font-semibold" : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}>
                Todas as categorias
              </button>
              {categories.map((c: any) => (
                <button key={c.id} onClick={() => { setCategoryFilter(c.id); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition ${categoryFilter === c.id ? "bg-orange-50 text-orange-600 font-semibold" : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}>
                  {c.name}
                </button>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => { setCategoryFilter("NONE"); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition ${categoryFilter === "NONE" ? "bg-orange-50 text-orange-600 font-semibold" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}>
                Sem categoria
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 bg-[var(--bg-hover)] rounded-lg p-1">
        <button onClick={() => setActivePanel(activePanel === "category" ? "catalog" : "category")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition flex items-center gap-1.5 ${activePanel === "category" ? "bg-[var(--bg-card)] text-orange-600 shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/60"}`}
          title="Nova categoria">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Categoria
        </button>
        <button onClick={() => { setActivePanel(activePanel === "csv" ? "catalog" : "csv"); setCsvProducts([]); setBulkResult(null); }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition flex items-center gap-1.5 ${activePanel === "csv" ? "bg-[var(--bg-card)] text-blue-600 shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/60"}`}
          title="Importar CSV">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Importar
        </button>
        <button onClick={() => { setActivePanel(activePanel === "trash" ? "catalog" : "trash"); if (activePanel !== "trash" && activeStoreId) fetchDeleted({ variables: { storeId: activeStoreId } }); }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition flex items-center gap-1.5 ${activePanel === "trash" ? "bg-[var(--bg-card)] text-red-500 shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/60"}`}
          title="Lixeira">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Lixeira
        </button>
      </div>

      </div>

      {/* Products table */}
      {categoryFilter === "ALL" && groupedProducts ? (
        groupedProducts.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm">
            <p className="text-center py-12 text-[var(--text-muted)]">Nenhum produto cadastrado</p>
          </div>
        ) : (
          groupedProducts.map(([key, group]) => (
            <div key={key} className="mb-6"
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(key)}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide">{group.name} ({group.products.length})</h3>
                {key !== "sem-categoria" && (
                  <div className="relative">
                    <button onClick={() => setCategoryMenuId(categoryMenuId === key ? null : key)}
                      className="p-1 rounded-lg text-gray-400 hover:text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                    {categoryMenuId === key && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setCategoryMenuId(null)} />
                        <div className="absolute left-0 top-full mt-1 z-20 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[160px]">
                          <button onClick={() => handleDeleteCategory(key)}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition flex items-center gap-2">
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
              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {group.products.map((product: any) => renderProductCard(product))}
              </div>

              {/* Desktop table */}
              <div className={`hidden md:block bg-[var(--bg-card)] rounded-2xl shadow-sm transition-all overflow-x-auto ${dragOverCategory === key ? "ring-2 ring-purple-400 ring-offset-2" : ""}`}>
                <table className="w-full">
                  {renderTableHeader()}
                  <tbody>{group.products.map((product: any) => renderProductRow(product))}</tbody>
                </table>
              </div>
            </div>
          ))
        )
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden">
            {filteredProducts.length === 0 ? (
              <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-12 text-center text-[var(--text-muted)]">Nenhum produto nesta categoria</div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product: any) => renderProductCard(product))}
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-[var(--bg-card)] rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full">
              {renderTableHeader()}
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">Nenhum produto nesta categoria</td></tr>
                ) : (
                  filteredProducts.map((product: any) => renderProductRow(product))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Inline edit confirmation modal */}
      {confirmInline && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setConfirmInline(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-xl w-full max-w-sm">
              <h3 className="font-bold text-[var(--text-primary)] mb-3 text-lg">Confirmar alteracao</h3>
              <p className="text-[var(--text-secondary)] mb-1">
                {confirmInline.field === "price" ? "Preco" : "Estoque"}:
              </p>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-gray-400 line-through">
                  {confirmInline.field === "price" ? `R$ ${parseFloat(confirmInline.original).toFixed(2)}` : confirmInline.original}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="text-orange-600 font-bold text-lg">
                  {confirmInline.field === "price" ? `R$ ${parseFloat(confirmInline.value).toFixed(2)}` : confirmInline.value}
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmInline(null)}
                  className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition">
                  Cancelar
                </button>
                <button onClick={confirmInlineEdit}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Web image search modal */}
      {showWebSearch && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => { setShowWebSearch(null); setWebImageResults([]); }} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-[var(--text-primary)] text-lg">Buscar imagem</h3>
                  <button onClick={() => { setShowWebSearch(null); setWebImageResults([]); }} className="text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Resultados para &quot;{webSearchQuery}&quot;</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {searchingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Buscando imagens...</p>
                    </div>
                  </div>
                ) : webImageResults.length === 0 ? (
                  <p className="text-center text-gray-400 py-12">Nenhuma imagem encontrada</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {webImageResults.map((url, i) => (
                      <button key={i} onClick={() => handleSelectWebImage(url)} disabled={savingWebImage}
                        className="relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-orange-500 cursor-pointer transition disabled:opacity-50">
                        <img src={url} alt={`Resultado ${i + 1}`} className="w-full h-36 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                          <span className="text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition">{savingWebImage ? "Salvando..." : "Usar esta"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* CSV review modal */}
      {showCsvModal && csvProducts.length > 0 && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCsvModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] text-lg">Revisar importacao</h3>
                  <p className="text-sm text-gray-400">{csvProducts.length} produtos - edite antes de importar</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleBulkImport} disabled={bulkImporting}
                    className="px-5 py-2 bg-green-500 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-green-600 active:scale-95 transition disabled:opacity-50">
                    {bulkImporting ? "Importando..." : `Importar ${csvProducts.length}`}
                  </button>
                  <button onClick={() => setShowCsvModal(false)} className="text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {bulkResult && (
                <div className={`mx-5 mt-4 p-3 rounded-xl text-sm ${bulkResult.errors.length > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
                  <p className="font-semibold text-[var(--text-primary)]">{bulkResult.created} produtos importados!</p>
                  {bulkResult.errors.length > 0 && bulkResult.errors.map((err, i) => <p key={i} className="text-red-500 text-xs mt-1">{err}</p>)}
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {csvProducts.map((p, i) => (
                  <div key={i} className="border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--border-color)] transition">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="flex-shrink-0 flex flex-col gap-1.5">
                        <input type="file" accept="image/*" className="hidden"
                          ref={(el) => { csvFileInputRefs.current[i] = el; }}
                          onChange={(e) => { if (e.target.files?.[0]) handleCsvImageSelect(e.target.files[0], i); }} />
                        <div onClick={() => csvFileInputRefs.current[i]?.click()}
                          className="w-20 h-20 border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        {p.name.trim() && !p.imageUrl && (
                          <button type="button" onClick={() => handleWebSearch("csv", i)}
                            className="w-20 py-1 text-[10px] text-blue-600 bg-blue-50 rounded-lg font-semibold cursor-pointer hover:bg-blue-100 active:scale-95 transition flex items-center justify-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Buscar
                          </button>
                        )}
                      </div>
                      {/* Fields */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="md:col-span-2">
                          <input type="text" placeholder="Nome" value={p.name}
                            onChange={(e) => updateCsvProduct(i, "name", e.target.value)}
                            className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-blue-400 outline-none" />
                        </div>
                        <div>
                          <input type="number" step="0.01" placeholder="Preco (R$)" value={p.price || ""}
                            onChange={(e) => updateCsvProduct(i, "price", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-blue-400 outline-none" />
                        </div>
                        <div>
                          <input type="number" min="0" placeholder="Estoque" value={p.stock || ""}
                            onChange={(e) => updateCsvProduct(i, "stock", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-blue-400 outline-none" />
                        </div>
                        <div>
                          <input type="text" placeholder="Unidade (kg, un...)" value={p.unit || ""}
                            onChange={(e) => updateCsvProduct(i, "unit", e.target.value)}
                            className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-blue-400 outline-none" />
                        </div>
                        <div>
                          {inlineNewCategory === "csv" ? (
                            <div className="flex gap-1">
                              <input type="text" autoFocus placeholder="Nome" value={inlineCategoryName}
                                onChange={(e) => setInlineCategoryName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleInlineCreateCategory("csv"); } if (e.key === "Escape") { setInlineNewCategory(null); setInlineCategoryName(""); } }}
                                className="flex-1 px-2 py-1.5 border border-orange-300 rounded-lg text-sm text-[var(--text-primary)] outline-none" />
                              <button type="button" onClick={() => handleInlineCreateCategory("csv")} className="px-2 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer">OK</button>
                              <button type="button" onClick={() => { setInlineNewCategory(null); setInlineCategoryName(""); }} className="px-1 text-gray-400 cursor-pointer">&#10005;</button>
                            </div>
                          ) : (
                            <select value={p.categoryId || ""}
                              onChange={(e) => { if (e.target.value === "__new__") { setInlineNewCategory("csv"); setInlineCategoryName(""); return; } updateCsvProduct(i, "categoryId", e.target.value); }}
                              className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-blue-400 outline-none">
                              <option value="">Sem categoria</option>
                              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              <option value="__new__">+ Criar categoria</option>
                            </select>
                          )}
                        </div>
                        <div className="col-span-2">
                          <input type="text" placeholder="Descricao (opcional)" value={p.description || ""}
                            onChange={(e) => updateCsvProduct(i, "description", e.target.value)}
                            className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-blue-400 outline-none" />
                        </div>
                      </div>
                      {/* Remove button */}
                      <button onClick={() => removeCsvProduct(i)}
                        className="flex-shrink-0 self-start p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                <button onClick={() => { setCsvProducts([]); setShowCsvModal(false); }}
                  className="px-4 py-2 text-sm text-red-500 font-semibold cursor-pointer hover:bg-red-50 rounded-xl transition">
                  Descartar tudo
                </button>
                <button onClick={handleBulkImport} disabled={bulkImporting}
                  className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-bold cursor-pointer hover:bg-green-600 active:scale-95 transition disabled:opacity-50">
                  {bulkImporting ? "Importando..." : `Importar ${csvProducts.length} produtos`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Zoomed image modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setZoomedImage(null)}>
          <button onClick={() => setZoomedImage(null)} className="absolute top-6 right-6 text-white/80 hover:text-white cursor-pointer transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={zoomedImage} alt="Produto ampliado" className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
