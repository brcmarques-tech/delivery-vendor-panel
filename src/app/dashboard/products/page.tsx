"use client";

import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { devLog } from "@/lib/devLog"; // KAN-256
import CreateStoreModal from "@/components/CreateStoreModal";
import {
  GET_MY_STORES,
  CREATE_PRODUCT,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
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
import { compressImage } from "@/lib/compressImage";
import Papa from "papaparse";
import {
  ImageIcon, GripVertical, ChevronDown, Pencil, Trash2, Plus, X, FileText,
  ScanBarcode, Search, Filter, Tag, Upload, MoreVertical, ArrowRight, Package, HelpCircle,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem, scaleIn } from "@/lib/motion";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo aos Produtos!",
      description: "Aqui você gerencia todo o catálogo de produtos das suas lojas. Vou te mostrar como funciona.",
    },
  },
  {
    element: '[data-tour="product-grid"]',
    popover: {
      title: "✅ Catálogo de produtos",
      description: "Todos os seus produtos aparecem aqui. Edite, ative ou desative qualquer produto a qualquer momento.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="product-toolbar"]',
    popover: {
      title: "🛠️ Ferramentas",
      description: "Categoria, importação CSV e lixeira ficam aqui.",
      side: "top",
      align: "end",
    },
  },
  {
    element: '[data-tour="add-product-btn"]',
    popover: {
      title: "✅ Adicionar produto",
      description: "Clique aqui para cadastrar um novo produto! Um tutorial vai te guiar pelo formulário.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título.",
      side: "bottom",
      align: "start",
    },
  },
];

const PRODUCT_FORM_TOUR: DriveStep[] = [
  {
    popover: {
      title: "👋 Novo Produto!",
      description: "Vou te mostrar cada parte do formulário.",
    },
  },
  {
    element: '[data-tour="product-image"]',
    popover: {
      title: "📸 Imagem",
      description: "Clique para adicionar uma foto. Também pode buscar imagens na internet.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="product-name"]',
    popover: {
      title: "✏️ Nome do produto",
      description: "Digite o nome. Sugestões aparecem automaticamente.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="product-price"]',
    popover: {
      title: "💰 Preço",
      description: "Valor de venda em reais.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="product-submit"]',
    popover: {
      title: "✅ Adicionar",
      description: "Preencha os campos e clique aqui para salvar o produto.\n\nIsso é tudo!",
      side: "top",
      align: "start",
    },
  },
];

const CSV_IMPORT_TOUR: DriveStep[] = [
  {
    popover: {
      title: "📥 Importar produtos via CSV",
      description: "Cadastre dezenas de produtos de uma vez usando um arquivo CSV (planilha).",
    },
  },
  {
    element: '[data-tour="csv-columns"]',
    popover: {
      title: "📋 Formato do arquivo",
      description: "Seu CSV precisa ter as colunas: nome e preco (obrigatórios). Pode incluir também: descricao, unidade, estoque e codigo_barras.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="csv-upload-btn"]',
    popover: {
      title: "📂 Enviar arquivo",
      description: "Clique aqui para selecionar o arquivo CSV do seu computador. Depois você revisa os produtos antes de importar.\n\nIsso é tudo!",
      side: "top",
      align: "center",
    },
  },
];

const CSV_REVIEW_TOUR: DriveStep[] = [
  {
    popover: {
      title: "📋 Revisão dos produtos",
      description: "Seus produtos foram carregados do CSV. Revise e edite cada um antes de importar.",
    },
  },
  {
    element: '[data-tour="csv-product-card"]',
    popover: {
      title: "✏️ Editar produto",
      description: "Cada produto aparece em um card. Edite nome, preço, estoque, unidade e categoria. Clique na imagem para trocar.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="csv-import-all-btn"]',
    popover: {
      title: "✅ Importar tudo",
      description: "Quando estiver tudo certo, clique aqui para importar todos os produtos de uma vez.\n\nIsso é tudo!",
      side: "bottom",
      align: "end",
    },
  },
];

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

// KAN-256: busca de imagem no OpenFoodFacts.
//
// Antes: cada <ProductImage> sem imageUrl disparava um `fetch` externo direto
// no efeito, sem debounce, sem limite de concorrencia, sem dedup e sem timeout.
// Numa busca de catalogo isso viravam N requisicoes cross-origin em paralelo a
// cada tecla digitada, e o cache (so em memoria) se perdia a cada reload.
//
// Agora: cache persistido em localStorage, deduplicacao de chamadas iguais em
// voo, no maximo 3 requisicoes simultaneas, timeout de 8s e um debounce curto
// no componente (item que some da lista enquanto digita nem chega a buscar).
const IMAGE_CACHE_KEY = "productImageCache";
const MAX_CONCURRENT_IMAGE_FETCHES = 3;

function loadImageCache(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

const imageCache: Record<string, string | null> = loadImageCache();
const inFlightImages = new Map<string, Promise<string | null>>();
let activeImageFetches = 0;
const imageFetchQueue: (() => void)[] = [];

function persistImageCache() {
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(imageCache));
  } catch {
    // cota cheia / modo privado — cache em memoria ainda funciona
  }
}

function acquireImageSlot(): Promise<void> {
  if (activeImageFetches < MAX_CONCURRENT_IMAGE_FETCHES) {
    activeImageFetches++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    imageFetchQueue.push(() => {
      activeImageFetches++;
      resolve();
    });
  });
}

function releaseImageSlot() {
  activeImageFetches--;
  imageFetchQueue.shift()?.();
}

async function fetchProductImage(name: string): Promise<string | null> {
  if (name in imageCache) return imageCache[name];

  const pending = inFlightImages.get(name);
  if (pending) return pending; // dedup: mesma busca ja esta em voo

  const request = (async (): Promise<string | null> => {
    await acquireImageSlot();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      let searchTerm = name;
      for (const [pt, en] of Object.entries(PT_TO_EN)) {
        if (name.includes(pt)) { searchTerm = en; break; }
      }
      const q = encodeURIComponent(searchTerm);
      const base = process.env.NEXT_PUBLIC_OPENFOODFACTS_URL || "https://world.openfoodfacts.org";
      const res = await fetch(
        `${base}/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=1`,
        { signal: controller.signal },
      );
      const data = await res.json();
      const img =
        data?.products?.[0]?.image_front_small_url ||
        data?.products?.[0]?.image_front_url ||
        null;
      imageCache[name] = img;
      persistImageCache();
      return img;
    } catch {
      imageCache[name] = null; // negativo tambem e cacheado: nao re-tenta em loop
      persistImageCache();
      return null;
    } finally {
      clearTimeout(timer);
      releaseImageSlot();
      inFlightImages.delete(name);
    }
  })();

  inFlightImages.set(name, request);
  return request;
}

function ProductImage({ name, imageUrl, size = 12 }: { name: string; imageUrl?: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(imageUrl || null);
  const [loading, setLoading] = useState(!imageUrl);

  useEffect(() => {
    if (imageUrl) { setSrc(imageUrl); setLoading(false); return; }
    if (name in imageCache) { setSrc(imageCache[name]); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    // Debounce: enquanto o usuario digita, itens entram e saem da lista. Sem
    // isso, cada render intermediario disparava uma busca externa.
    const debounce = setTimeout(() => {
      fetchProductImage(name).then((img) => {
        if (cancelled) return;
        setSrc(img);
        setLoading(false);
      });
    }, 300);

    return () => { cancelled = true; clearTimeout(debounce); };
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
    <div className={`${sizeClass} rounded-lg bg-[var(--bg-muted)] flex items-center justify-center flex-shrink-0`}>
      <ImageIcon className={`${iconSize} text-[var(--text-muted)]`} />
    </div>
  );
}

export default function ProductsPage() {
  const { startTour, hasSeenTour } = useTour("products", TOUR_STEPS);
  const { startTour: startProductFormTour, hasSeenTour: hasSeenFormTour } = useTour("create-product", PRODUCT_FORM_TOUR, false);
  const { startTour: startCsvTour, hasSeenTour: hasSeenCsvTour } = useTour("import-csv", CSV_IMPORT_TOUR, false);
  const { startTour: startCsvReviewTour, hasSeenTour: hasSeenCsvReview } = useTour("csv-review", CSV_REVIEW_TOUR, false);
  const { data: storesData, refetch, error: storesError } = useQuery(GET_MY_STORES);
  const allStores = storesData?.myStores || [];
  const stores = allStores.filter((s: any) => s.storeType === "PRODUCTS" || !s.storeType);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [activePanel, setActivePanel] = useState<"catalog" | "product" | "category" | "csv" | "trash" | null>("catalog");
  const showProductForm = activePanel === "product";
  const showBulkImport = activePanel === "csv";

  // Start product form tour when form opens
  useEffect(() => {
    if (!showProductForm || hasSeenFormTour) return;
    const timer = setTimeout(() => startProductFormTour(), 800);
    return () => clearTimeout(timer);
  }, [showProductForm, hasSeenFormTour, startProductFormTour]);

  // Start CSV import tour when panel opens
  useEffect(() => {
    if (!showBulkImport || hasSeenCsvTour) return;
    const timer = setTimeout(() => startCsvTour(), 800);
    return () => clearTimeout(timer);
  }, [showBulkImport, hasSeenCsvTour, startCsvTour]);

  const showCategoryForm = activePanel === "category";
  const showTrashPanel = activePanel === "trash";
  const showCatalog = activePanel === "catalog";
  const [error, setError] = useState("");

  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", unit: "", categoryId: "", stock: "", barcode: "", isVariableWeight: false });
  const [categoryName, setCategoryName] = useState("");
  const [categoryAgeVerification, setCategoryAgeVerification] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryAgeVerification, setEditCategoryAgeVerification] = useState(false);
  const [inlineNewCategory, setInlineNewCategory] = useState<"product" | "edit" | "csv" | null>(null);
  const [inlineCategoryName, setInlineCategoryName] = useState("");

  const PRODUCT_CATEGORY_SUGGESTIONS = [
    'Lanches', 'Bebidas', 'Refeicoes', 'Carnes', 'Padaria',
    'Frutas', 'Mercearia', 'Doces', 'Petshop', 'Farmacia',
  ];

  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [updateCategoryMut] = useMutation(UPDATE_CATEGORY);
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
  // Guard de double-click no "+ Adicionar" do catálogo: sem isto, dois cliques
  // rápidos criavam o produto duas vezes (a remoção da lista só ocorre após o await).
  const addingCatalogRef = useRef<Set<string>>(new Set());

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

  // Start CSV review tour when review modal opens
  useEffect(() => {
    if (!showCsvModal || csvProducts.length === 0 || hasSeenCsvReview) return;
    const timer = setTimeout(() => startCsvReviewTour(), 800);
    return () => clearTimeout(timer);
  }, [showCsvModal, csvProducts.length, hasSeenCsvReview, startCsvReviewTour]);

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
    if (addingCatalogRef.current.has(product.id)) return;
    addingCatalogRef.current.add(product.id);
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

      devLog("Adding from catalog:", input);
      const result = await createProduct({ variables: { input } });
      devLog("Create result:", result);
      setCatalogResults((prev) => prev.filter((p) => p.id !== product.id));
      await refetch();
    } catch (err: any) {
      console.error("Add from catalog error:", err);
      setError(err.message || "Erro ao adicionar produto");
    } finally {
      addingCatalogRef.current.delete(product.id);
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
      const res = data?.bulkCreateProducts;
      if (!res) {
        setError("Falha na importacao: resposta vazia do servidor.");
        return;
      }
      setBulkResult(res);
      if ((res.errors?.length ?? 0) === 0) {
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
      const raw = reader.result as string;
      try {
        const compressed = await compressImage(raw, 800, 0.8);
        const { data: uploadData } = await uploadImage({ variables: { base64: compressed, folder: "products" } });
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
    reader.onloadend = async () => {
      const raw = reader.result as string;
      const compressed = await compressImage(raw, 800, 0.8);
      if (mode === "create") { setImagePreview(compressed); setImageBase64(compressed); }
      else { setEditImagePreview(compressed); setEditImageBase64(compressed); }
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
      await createCategory({ variables: { name: categoryName, storeId: activeStoreId, requiresAgeVerification: categoryAgeVerification || undefined } });
      setCategoryName(""); setCategoryAgeVerification(false); setActivePanel("catalog"); refetch();
    } catch (err: any) { setError(err.message || "Erro ao criar categoria"); }
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!editingCategory) return;
    try {
      await updateCategoryMut({ variables: { id: editingCategory.id, name: editCategoryName || undefined, requiresAgeVerification: editCategoryAgeVerification } });
      setEditingCategory(null); setCategoryMenuId(null); refetch();
    } catch (err: any) { setError(err.message || "Erro ao editar categoria"); }
  }

  function startEditingCategory(cat: any) {
    setEditingCategory(cat);
    setEditCategoryName(cat.name);
    setEditCategoryAgeVerification(cat.requiresAgeVerification || false);
    setCategoryMenuId(null);
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
    if (!product.isActive) return { label: "Oculto", color: "bg-[var(--bg-muted)] text-[var(--text-muted)]", dot: "bg-[var(--text-muted)]" };
    if (!product.isAvailable) return { label: "Indisponivel", color: "bg-[var(--status-error-bg)] text-[var(--status-error-text)]", dot: "bg-[var(--status-error-text)]" };
    return { label: "Disponivel", color: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]", dot: "bg-[var(--status-success-text)]" };
  }

  // ─── Render helpers ───
  function renderProductRow(product: any) {
    const status = getStatusInfo(product);
    return (
      <tr
        key={product.id}
        className={`border-t border-[var(--border-color)] hover:bg-[var(--bg-hover)]/50 ${!product.isActive ? "opacity-50" : ""}`}
      >
        <td className="pl-2 pr-0 py-4 w-8">
          <div
            draggable
            onDragStart={() => handleDragStart(product.id)}
            className="cursor-grab active:cursor-grabbing p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-muted)] transition"
            title="Arrastar para outra categoria"
          >
            <GripVertical className="h-5 w-5" />
          </div>
        </td>
        <td className="px-4 py-4">
          <button onClick={() => startEditing(product)} className="text-left cursor-pointer hover:text-[var(--brand-primary)] transition flex items-center gap-3">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 hover:opacity-80 transition"
                onClick={(e) => { e.stopPropagation(); setZoomedImage(product.imageUrl); }} />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-5 w-5 text-[var(--text-muted)]" />
              </div>
            )}
            <div>
              <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
              {product.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{product.description}</p>}
            </div>
          </button>
        </td>
        <td className="px-6 py-4 text-[var(--text-secondary)]">
          {inlineEdit && inlineEdit.id === product.id && inlineEdit.field === "price" ? (
            <input type="number" step="0.01" autoFocus value={inlineEdit.value}
              onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
              onBlur={handleInlineBlurOrEnter}
              onKeyDown={(e) => { if (e.key === "Enter") handleInlineBlurOrEnter(); if (e.key === "Escape") setInlineEdit(null); }}
              className="w-24 px-2 py-1 border border-[var(--brand-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/30 outline-none" />
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => startInlineEdit(product.id, "price", Number(product.price))}
                className="cursor-pointer hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] px-2 py-1 rounded-lg transition text-left">
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
              className="w-20 px-2 py-1 border border-[var(--brand-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/30 outline-none" />
          ) : (
            <button onClick={() => startInlineEdit(product.id, "stock", product.stock || 0)}
              className="cursor-pointer hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] px-2 py-1 rounded-lg transition text-left">
              {product.stock > 0 ? product.stock : <span className="text-[var(--text-muted)] text-xs">Ilimitado</span>}
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
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            {statusMenuId === product.id && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setStatusMenuId(null)} />
                <div className="absolute left-0 bottom-full mb-2 z-40 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[200px]">
                  {product.isActive && (
                    <button onClick={() => handleToggleAvailability(product.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] font-medium cursor-pointer transition hover:bg-[var(--bg-hover)] flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${product.isAvailable ? "bg-[var(--status-error-text)]" : "bg-[var(--status-success-text)]"}`} />
                      {product.isAvailable ? "Marcar indisponivel" : "Marcar disponivel"}
                    </button>
                  )}
                  {product.isActive && <div className="border-t border-[var(--border-color)] my-1" />}
                  <button onClick={() => handleToggleActive(product.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] font-medium cursor-pointer transition hover:bg-[var(--bg-hover)] flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${product.isActive ? "bg-[var(--text-muted)]" : "bg-[var(--status-success-text)]"}`} />
                    {product.isActive ? "Ocultar produto" : "Mostrar produto"}
                  </button>
                </div>
              </>
            )}
          </div>
        </td>
        <td className="px-6 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => startEditing(product)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 cursor-pointer transition" title="Editar">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-error-text)] hover:bg-[var(--status-error-bg)] cursor-pointer transition" title="Excluir">
              <Trash2 className="h-4 w-4" />
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
      <motion.div
        variants={staggerItem}
        key={product.id}
        className={`bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] overflow-hidden hover:shadow-[var(--card-shadow-hover)] transition-shadow ${!product.isActive ? "opacity-50" : ""}`}
      >
        {/* Image area */}
        <button
          onClick={() => product.imageUrl && setZoomedImage(product.imageUrl)}
          className={`w-full aspect-square bg-[var(--bg-muted)] flex items-center justify-center ${product.imageUrl ? "cursor-pointer" : "cursor-default"}`}
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-10 w-10 text-[var(--text-muted)]" />
          )}
        </button>

        {/* Card content */}
        <div className="p-4 space-y-2">
          {/* Name + category */}
          <div>
            <p className="font-semibold text-[var(--text-primary)] leading-tight">{product.name}</p>
            {product.description && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{product.description}</p>
            )}
            {product.category?.name && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{product.category.name}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            {inlineEdit && inlineEdit.id === product.id && inlineEdit.field === "price" ? (
              <input type="number" step="0.01" autoFocus value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onBlur={handleInlineBlurOrEnter}
                onKeyDown={(e) => { if (e.key === "Enter") handleInlineBlurOrEnter(); if (e.key === "Escape") setInlineEdit(null); }}
                className="w-28 px-2 py-1 border border-[var(--brand-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--brand-primary-muted)] outline-none" />
            ) : (
              <>
                <button onClick={() => startInlineEdit(product.id, "price", Number(product.price))}
                  className="text-lg font-bold text-[var(--brand-primary)] cursor-pointer hover:opacity-80 transition">
                  R$ {Number(product.price).toFixed(2)}
                </button>
                {product.isVariableWeight && (
                  <span className="px-1.5 py-0.5 bg-[var(--bg-muted)] text-[var(--text-muted)] text-xs rounded-full font-medium">por peso</span>
                )}
              </>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Estoque:</span>
              {inlineEdit && inlineEdit.id === product.id && inlineEdit.field === "stock" ? (
                <input type="number" min="0" autoFocus value={inlineEdit.value}
                  onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                  onBlur={handleInlineBlurOrEnter}
                  onKeyDown={(e) => { if (e.key === "Enter") handleInlineBlurOrEnter(); if (e.key === "Escape") setInlineEdit(null); }}
                  className="w-20 px-2 py-1 border border-[var(--brand-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--brand-primary-muted)] outline-none" />
              ) : (
                <button onClick={() => startInlineEdit(product.id, "stock", product.stock || 0)}
                  className="text-sm font-medium text-[var(--text-primary)] cursor-pointer hover:text-[var(--brand-primary)] transition">
                  {product.stock > 0 ? product.stock : <span className="text-[var(--text-muted)] text-xs font-normal">Ilimitado</span>}
                </button>
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
                  <div className="absolute right-0 top-full mt-1 z-40 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl shadow-lg py-1 min-w-[200px]">
                    {product.isActive && (
                      <button onClick={() => handleToggleAvailability(product.id)}
                        className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] font-medium cursor-pointer transition hover:bg-[var(--bg-hover)] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${product.isAvailable ? "bg-[var(--status-error-text)]" : "bg-[var(--status-success-text)]"}`} />
                        {product.isAvailable ? "Marcar indisponivel" : "Marcar disponivel"}
                      </button>
                    )}
                    {product.isActive && <div className="border-t border-[var(--border-light)] my-1" />}
                    <button onClick={() => handleToggleActive(product.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] font-medium cursor-pointer transition hover:bg-[var(--bg-hover)] flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${product.isActive ? "bg-[var(--text-muted)]" : "bg-[var(--status-success-text)]"}`} />
                      {product.isActive ? "Ocultar produto" : "Mostrar produto"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-light)]">
            <button onClick={() => startEditing(product)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-hover)] hover:bg-[var(--brand-primary-muted)] hover:text-[var(--brand-primary)] cursor-pointer transition active:scale-95">
              <Pencil className="h-4 w-4" />
              Editar
            </button>
            <button onClick={() => handleDeleteProduct(product.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-hover)] hover:bg-[var(--status-error-bg)] hover:text-[var(--status-error-text)] cursor-pointer transition active:scale-95">
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!storesData) {
    return (
      <div>
        <PageHeader title="Produtos" />
        <SkeletonGrid count={6} />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => refetch()} />
        <PageHeader title="Produtos" />
        <EmptyState
          icon={Package}
          title="Nenhuma loja de produtos"
          description="Para cadastrar produtos, voce precisa ter uma loja do tipo Loja de Produtos. Crie uma para comecar."
          action={{ label: "Criar loja de produtos", onClick: () => setShowCreateStore(true) }}
        />
      </>
    );
  }

  return (
    <motion.div {...fadeIn}>
      {error && (
        <div className="bg-[var(--status-error-bg)] text-[var(--status-error-text)] p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Store selector */}
      {stores.length > 1 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Loja:</span>
          <select value={activeStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}
            className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]">
            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title={`Produtos ${store ? `— ${store.name}` : ""}`}
        onTourStart={startTour}
        tourNotSeen={!hasSeenTour}
        actions={
          <button data-tour="add-product-btn" onClick={() => { setActivePanel(activePanel === "product" ? "catalog" : "product"); setBarcodeInput(""); setBarcodeResult(null); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer active:scale-95 transition flex items-center gap-2 ${activePanel === "product" ? "bg-[var(--brand-primary-hover)] text-white" : "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"}`}>
            <Plus className="h-4 w-4" />
            Novo Produto
          </button>
        }
      />

      {/* Category form */}
      {showCategoryForm && (
        <form onSubmit={handleCreateCategory} className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--text-primary)]">Nova categoria</h3>
            <button onClick={() => setActivePanel("catalog")} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-3">
            <input type="text" placeholder="Nome da categoria" value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
              className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" required />
            <button type="submit" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 transition">Criar</button>
          </div>
          {!categoryName && (
            <div className="mt-3">
              <span className="text-xs text-[var(--text-secondary)] mb-1.5 block">Sugestoes:</span>
              <div className="flex flex-wrap gap-2">
                {['Bebidas', 'Doces', 'Frutas', 'Carnes', 'Padaria', 'Limpeza', 'Frios', 'Hortifruti', 'Mercearia', 'Higiene', 'Congelados', 'Lanches'].filter(s => !categories.some((c: any) => c.name.toLowerCase() === s.toLowerCase())).map(s => (
                  <button key={s} type="button" onClick={() => setCategoryName(s)}
                    className="px-3 py-1 text-sm rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] dark:hover:bg-[var(--brand-primary)]/10 transition cursor-pointer">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
            <input type="checkbox" checked={categoryAgeVerification} onChange={(e) => setCategoryAgeVerification(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] accent-[var(--brand-primary)] cursor-pointer" />
            <span className="text-sm text-[var(--text-secondary)]">Requer verificacao de idade (+18)</span>
          </label>
        </form>
      )}

      {/* Edit category modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingCategory(null)}>
          <form onSubmit={handleUpdateCategory} onClick={(e) => e.stopPropagation()} className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--text-primary)]">Editar categoria</h3>
              <button type="button" onClick={() => setEditingCategory(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <input type="text" placeholder="Nome da categoria" value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] mb-3" required />
            <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
              <input type="checkbox" checked={editCategoryAgeVerification} onChange={(e) => setEditCategoryAgeVerification(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] accent-[var(--brand-primary)] cursor-pointer" />
              <span className="text-sm text-[var(--text-secondary)]">Requer verificacao de idade (+18)</span>
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition">Cancelar</button>
              <button type="submit" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 transition">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Import */}
      {showBulkImport && (
        <div data-tour="csv-panel" className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--text-primary)] text-lg">Importar via CSV</h3>
            <div className="flex items-center gap-2">
            <button onClick={startCsvTour} title="Ver tutorial" className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--brand-primary-muted)] hover:text-[var(--brand-primary)] transition cursor-pointer">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button onClick={() => setActivePanel("catalog")} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            </div>
          </div>
          <p data-tour="csv-columns" className="text-xs text-[var(--text-muted)] mb-3">
            Colunas: <strong>nome</strong> (ou name), <strong>preco</strong> (ou price), e opcionalmente: descricao, unidade, estoque, codigo_barras (ou barcode/ean)
          </p>
          <input type="file" ref={csvInputRef} accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleCsvUpload(e.target.files[0]); }} />
          <button data-tour="csv-upload-btn" onClick={() => csvInputRef.current?.click()}
            className="px-6 py-3 border-2 border-dashed border-[var(--border-color)] rounded-xl text-[var(--text-muted)] font-semibold cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95 transition w-full flex items-center justify-center gap-2">
            <FileText className="h-5 w-5" />
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
            <div className={`mt-4 p-4 rounded-xl ${bulkResult.errors.length > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-[var(--status-success-bg)] border border-[var(--status-success-bg)]"}`}>
              <p className="font-semibold text-[var(--text-primary)]">{bulkResult.created} produtos importados com sucesso!</p>
              {bulkResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-[var(--status-error-text)] mb-1">Erros:</p>
                  {bulkResult.errors.map((err: string, i: number) => <p key={i} className="text-sm text-[var(--status-error-text)]">{err}</p>)}
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
            <div className="flex items-center gap-2">
            <button onClick={startProductFormTour} title="Ver tutorial" className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--brand-primary-muted)] hover:text-[var(--brand-primary)] transition cursor-pointer">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button onClick={() => setActivePanel("catalog")} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            </div>
          </div>
          {/* Barcode scanner */}
          <div className="mb-4 p-4 bg-blue-50 rounded-xl">
            <label className="text-sm font-semibold text-blue-700 mb-2 block">Buscar por codigo de barras (EAN)</label>
            <div className="relative">
              <ScanBarcode className="h-5 w-5 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Escaneie com a pistola ou digite o EAN..."
                value={barcodeInput} onChange={(e) => handleBarcodeInputChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current); doBarcodeLookup(barcodeInput); } }}
                className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-xl text-[var(--text-primary)] font-mono tracking-wider bg-[var(--bg-card)] focus:border-blue-400 outline-none transition" />
              {lookingUpBarcode && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
            </div>
            {barcodeResult?.name && (
              <div className="mt-3 p-3 bg-[var(--bg-card)] border border-[var(--status-success-bg)] rounded-xl flex items-center gap-3">
                {barcodeResult.imageUrl && <img src={barcodeResult.imageUrl} alt={barcodeResult.name} className="w-12 h-12 rounded-lg object-cover" />}
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{barcodeResult.name}</p>
                  {barcodeResult.brand && <p className="text-xs text-[var(--text-muted)]">{barcodeResult.brand} {barcodeResult.quantity && `- ${barcodeResult.quantity}`}</p>}
                </div>
                <span className="text-xs text-[var(--status-success-text)] font-semibold">Preenchido!</span>
              </div>
            )}
          </div>
          {/* Image upload */}
          <div data-tour="product-image" className="mb-4">
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0], "create"); }} />
            {imagePreview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-36 h-36 rounded-2xl object-cover shadow-sm cursor-pointer hover:opacity-90 transition" onClick={() => fileInputRef.current?.click()} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageBase64(null); }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-[var(--status-error-text)] text-white rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-[var(--status-error-text)] transition shadow-md">&#10005;</button>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-[var(--brand-primary)] font-medium cursor-pointer hover:text-[var(--brand-primary)] transition">Trocar imagem</button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10/50 transition">
                <div className="text-center">
                  <ImageIcon className="h-10 w-10 mx-auto text-[var(--text-muted)] mb-2" />
                  <p className="text-sm text-[var(--text-muted)]">Clique para adicionar imagem</p>
                </div>
              </div>
            )}
            {productForm.name.trim() && !imagePreview && (
              <button type="button" onClick={() => handleWebSearch("create")} disabled={searchingImages}
                className="mt-2 w-full py-2 text-sm text-blue-600 bg-blue-50 rounded-xl font-semibold cursor-pointer hover:bg-blue-100 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Search className="h-4 w-4" />
                {searchingImages ? "Buscando..." : "Buscar imagem na internet"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-tour="product-name" className="relative">
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
                        <p className="text-xs text-[var(--text-muted)]">R$ {Number(s.price).toFixed(2)} {s.unit ? `/ ${s.unit}` : ""} {s.barcode ? `· EAN: ${s.barcode}` : ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div data-tour="product-price" className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold text-sm">R$</span>
              <input type="number" step="0.01" placeholder="0.00" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" required />
            </div>
            <input type="text" placeholder="Descricao (opcional)" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" />
            <input type="text" placeholder="Unidade: kg, un, lt (opcional)" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" disabled={productForm.isVariableWeight} />
            <input type="number" min="0" placeholder="Estoque (0 = ilimitado)" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]" />
            {inlineNewCategory === "product" ? (
              <div>
                <div className="flex gap-2">
                  <input type="text" autoFocus placeholder="Nome da categoria" value={inlineCategoryName}
                    onChange={(e) => setInlineCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleInlineCreateCategory("product"); } if (e.key === "Escape") { setInlineNewCategory(null); setInlineCategoryName(""); } }}
                    className="flex-1 px-4 py-2 border border-[var(--brand-primary)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/30 outline-none" />
                  <button type="button" onClick={() => handleInlineCreateCategory("product")} className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] active:scale-95 transition text-sm">Criar</button>
                  <button type="button" onClick={() => { setInlineNewCategory(null); setInlineCategoryName(""); }} className="px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">&#10005;</button>
                </div>
                {PRODUCT_CATEGORY_SUGGESTIONS.filter(s => !categories.some((c: any) => c.name.toLowerCase() === s.toLowerCase())).length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-[var(--text-secondary)]">ou escolha uma das categorias principais:</span>
                    <div className="grid grid-cols-5 gap-1 mt-1">
                      {PRODUCT_CATEGORY_SUGGESTIONS.filter(s => !categories.some((c: any) => c.name.toLowerCase() === s.toLowerCase())).map(s => (
                        <button key={s} type="button" onClick={() => setInlineCategoryName(s)}
                          className="px-1 py-1 text-xs rounded-full bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/30 cursor-pointer transition text-center">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <select value={productForm.categoryId} onChange={(e) => { if (e.target.value === "__new__") { setInlineNewCategory("product"); setInlineCategoryName(""); return; } setProductForm({ ...productForm, categoryId: e.target.value }); }} className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]">
                <option value="">Sem categoria</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new__">+ Criar categoria</option>
              </select>
            )}
            <label className="flex items-center gap-3 col-span-1 md:col-span-2 cursor-pointer">
              <div className={`relative w-11 h-6 rounded-full transition ${productForm.isVariableWeight ? 'bg-[var(--brand-primary)]' : 'bg-[var(--bg-muted)]'}`} onClick={() => setProductForm({...productForm, isVariableWeight: !productForm.isVariableWeight, unit: !productForm.isVariableWeight ? 'kg' : productForm.unit})}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--bg-card)] rounded-full shadow transition-transform ${productForm.isVariableWeight ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Produto vendido por peso (preco por kg)</span>
            </label>
            <button data-tour="product-submit" type="submit" disabled={uploading} className="md:col-span-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 transition disabled:opacity-50">
              {uploading ? "Enviando..." : "Adicionar produto"}
            </button>
          </div>
        </form>
      )}

      {/* Catalog search */}
      {showCatalog && <div className="bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-5 w-5 text-purple-500" />
          <h3 className="font-bold text-[var(--text-primary)]">Cadastro rapido</h3>
          <span className="text-xs text-[var(--text-muted)]">Busque no catalogo da plataforma e adicione com um clique</span>
        </div>
        <div className="relative">
          <Search className="h-5 w-5 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
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
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>R$ {Number(product.price).toFixed(2)}</span>
                    {product.unit && <span>/ {product.unit}</span>}
                    {product.barcode && <span>EAN: {product.barcode}</span>}
                  </div>
                  {product.store?.name && <p className="text-xs text-[var(--text-muted)] mt-0.5">de: {product.store.name}</p>}
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
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm mb-6 border border-[var(--status-error-bg)]">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="h-5 w-5 text-[var(--status-error-text)]" />
            <h3 className="font-bold text-[var(--text-primary)]">Produtos excluidos</h3>
            <span className="text-xs text-[var(--text-muted)] flex-1">Restaure ou busque produtos removidos</span>
            <button onClick={() => setActivePanel("catalog")} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
          {trashItems.length > 0 && (
            <div className="relative mb-3">
              <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Buscar nos excluidos..." value={trashSearch} onChange={(e) => setTrashSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--status-error-text)] focus:ring-1 focus:ring-[var(--status-error-bg)] outline-none transition" />
            </div>
          )}
          {loadingDeleted ? (
            <p className="text-[var(--text-muted)] text-sm">Carregando...</p>
          ) : trashItems.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">Nenhum produto na lixeira.</p>
          ) : filtered.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">Nenhum resultado para &quot;{trashSearch}&quot;</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filtered.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-[var(--status-error-bg)]/50 rounded-xl">
                  <ProductImage name={p.name} imageUrl={p.imageUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-secondary)] truncate">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span>R$ {Number(p.price).toFixed(2)}</span>
                      {p.unit && <span>/ {p.unit}</span>}
                      {p.category?.name && <span>· {p.category.name}</span>}
                      {p.deletedAt && <span>· excluido em {new Date(Number(p.deletedAt)).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <button onClick={() => setRestoreModal({ ...p, editPrice: String(p.price), editStock: String(p.stock || 0), editName: p.name })}
                    className="px-4 py-2 bg-[var(--status-success-text)] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[var(--status-success-text)] active:scale-95 transition flex-shrink-0">
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
              <button onClick={() => setRestoreModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-5 p-3 bg-[var(--bg-hover)] rounded-xl">
              <ProductImage name={restoreModal.name} imageUrl={restoreModal.imageUrl} />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{restoreModal.name}</p>
                {restoreModal.category?.name && <p className="text-xs text-[var(--text-muted)]">{restoreModal.category.name}</p>}
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Nome</label>
                <input type="text" value={restoreModal.editName} onChange={(e) => setRestoreModal({ ...restoreModal, editName: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--status-success-text)] outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Preco (R$)</label>
                  <input type="number" step="0.01" value={restoreModal.editPrice} onChange={(e) => setRestoreModal({ ...restoreModal, editPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--status-success-text)] outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Estoque</label>
                  <input type="number" min="0" value={restoreModal.editStock} onChange={(e) => setRestoreModal({ ...restoreModal, editStock: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--status-success-text)] outline-none" />
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
                className="flex-1 px-4 py-2.5 bg-[var(--status-success-text)] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[var(--status-success-text)] active:scale-95 transition">
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
                        className="absolute -top-2 -right-2 w-7 h-7 bg-[var(--status-error-text)] text-white rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-[var(--status-error-text)] transition shadow-md">&#10005;</button>
                    </div>
                    <button type="button" onClick={() => editFileInputRef.current?.click()} className="text-sm text-[var(--brand-primary)] font-medium cursor-pointer hover:text-[var(--brand-primary)] transition">Trocar imagem</button>
                  </div>
                ) : (
                  <div onClick={() => editFileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10/50 transition">
                    <div className="text-center">
                      <ImageIcon className="h-10 w-10 mx-auto text-[var(--text-muted)] mb-2" />
                      <p className="text-sm text-[var(--text-muted)]">Clique para adicionar imagem</p>
                    </div>
                  </div>
                )}
                {editForm.name.trim() && !editImagePreview && (
                  <button type="button" onClick={() => handleWebSearch("edit")} disabled={searchingImages}
                    className="mt-2 w-full py-2 text-sm text-blue-600 bg-blue-50 rounded-xl font-semibold cursor-pointer hover:bg-blue-100 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    <Search className="h-4 w-4" />
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
                  <div className={`relative w-11 h-6 rounded-full transition ${editForm.isVariableWeight ? 'bg-[var(--brand-primary)]' : 'bg-[var(--bg-muted)]'}`} onClick={() => setEditForm({...editForm, isVariableWeight: !editForm.isVariableWeight, unit: !editForm.isVariableWeight ? 'kg' : editForm.unit})}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--bg-card)] rounded-full shadow transition-transform ${editForm.isVariableWeight ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">Produto vendido por peso (preco por kg)</span>
                </label>
                {inlineNewCategory === "edit" ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" autoFocus placeholder="Nome da categoria" value={inlineCategoryName}
                        onChange={(e) => setInlineCategoryName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleInlineCreateCategory("edit"); } if (e.key === "Escape") { setInlineNewCategory(null); setInlineCategoryName(""); } }}
                        className="flex-1 px-4 py-2 border border-[var(--brand-primary)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/30 outline-none" />
                      <button type="button" onClick={() => handleInlineCreateCategory("edit")} className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] active:scale-95 transition text-sm">Criar</button>
                      <button type="button" onClick={() => { setInlineNewCategory(null); setInlineCategoryName(""); }} className="px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">&#10005;</button>
                    </div>
                    {PRODUCT_CATEGORY_SUGGESTIONS.filter(s => !categories.some((c: any) => c.name.toLowerCase() === s.toLowerCase())).length > 0 && (
                      <div>
                        <span className="text-xs text-[var(--text-secondary)]">ou escolha uma das categorias principais:</span>
                        <div className="grid grid-cols-5 gap-1 mt-1">
                          {PRODUCT_CATEGORY_SUGGESTIONS.filter(s => !categories.some((c: any) => c.name.toLowerCase() === s.toLowerCase())).map(s => (
                            <button key={s} type="button" onClick={() => setInlineCategoryName(s)}
                              className="px-1 py-1 text-xs rounded-full bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/30 cursor-pointer transition text-center">{s}</button>
                          ))}
                        </div>
                      </div>
                    )}
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
                <button type="submit" disabled={uploading} className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 transition disabled:opacity-50">
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
          <Filter className="h-4 w-4 text-[var(--text-muted)]" />
          {categoryFilter === "ALL" ? "Todas as categorias" : categoryFilter === "NONE" ? "Sem categoria" : categories.find((c: any) => c.id === categoryFilter)?.name || "Filtrar"}
          {categoryFilter !== "ALL" && <span className="ml-1 w-2 h-2 rounded-full bg-[var(--brand-primary)]" />}
          <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition ${showFilterDropdown ? "rotate-180" : ""}`} />
        </button>
        {showFilterDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
            <div className="absolute left-0 top-full mt-1 z-20 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[220px]">
              <button onClick={() => { setCategoryFilter("ALL"); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition ${categoryFilter === "ALL" ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold" : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}>
                Todas as categorias
              </button>
              {categories.map((c: any) => (
                <button key={c.id} onClick={() => { setCategoryFilter(c.id); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition flex items-center gap-2 ${categoryFilter === c.id ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold" : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}>
                  {c.name}
                  {c.requiresAgeVerification && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-md">+18</span>}
                </button>
              ))}
              <div className="border-t border-[var(--border-color)] my-1" />
              <button onClick={() => { setCategoryFilter("NONE"); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition ${categoryFilter === "NONE" ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}>
                Sem categoria
              </button>
            </div>
          </>
        )}
      </div>

      <div data-tour="product-toolbar" className="flex items-center gap-1 bg-[var(--bg-hover)] rounded-lg p-1">
        <button data-tour="product-category-btn" onClick={() => setActivePanel(activePanel === "category" ? "catalog" : "category")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition flex items-center gap-1.5 ${activePanel === "category" ? "bg-[var(--bg-card)] text-[var(--brand-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/60"}`}
          title="Nova categoria">
          <Tag className="h-3.5 w-3.5" />
          Categoria
        </button>
        <button data-tour="product-import-btn" onClick={() => { setActivePanel(activePanel === "csv" ? "catalog" : "csv"); setCsvProducts([]); setBulkResult(null); }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition flex items-center gap-1.5 ${activePanel === "csv" ? "bg-[var(--bg-card)] text-blue-600 shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/60"}`}
          title="Importar CSV">
          <Upload className="h-3.5 w-3.5" />
          Importar
        </button>
        <button data-tour="product-trash-btn" onClick={() => { setActivePanel(activePanel === "trash" ? "catalog" : "trash"); if (activePanel !== "trash" && activeStoreId) fetchDeleted({ variables: { storeId: activeStoreId } }); }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition flex items-center gap-1.5 ${activePanel === "trash" ? "bg-[var(--bg-card)] text-[var(--status-error-text)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/60"}`}
          title="Lixeira">
          <Trash2 className="h-3.5 w-3.5" />
          Lixeira
        </button>
      </div>

      </div>

      {/* Products table */}
      <div data-tour="product-grid">
      {categoryFilter === "ALL" && groupedProducts ? (
        groupedProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto cadastrado"
            description="Adicione seu primeiro produto para comecar a vender."
            action={{ label: "Novo Produto", onClick: () => setActivePanel("product") }}
          />
        ) : (
          groupedProducts.map(([key, group]) => (
            <div key={key} className="mb-6"
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(key)}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide">{group.name} ({group.products.length})</h3>
                {categories.find((c: any) => c.id === key)?.requiresAgeVerification && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-md">+18</span>
                )}
                {key !== "sem-categoria" && (
                  <div className="relative">
                    <button onClick={() => setCategoryMenuId(categoryMenuId === key ? null : key)}
                      className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {categoryMenuId === key && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setCategoryMenuId(null)} />
                        <div className="absolute left-0 top-full mt-1 z-20 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[160px]">
                          <button onClick={() => startEditingCategory(categories.find((c: any) => c.id === key))}
                            className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            Editar categoria
                          </button>
                          <button onClick={() => handleDeleteCategory(key)}
                            className="w-full text-left px-4 py-2.5 text-sm text-[var(--status-error-text)] hover:bg-[var(--status-error-bg)] cursor-pointer transition flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Excluir categoria
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Mobile cards */}
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="md:hidden grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {group.products.map((product: any) => renderProductCard(product))}
              </motion.div>

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
              <EmptyState
                icon={Package}
                title="Nenhum produto nesta categoria"
                description="Tente outro filtro ou adicione produtos a esta categoria."
              />
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product: any) => renderProductCard(product))}
              </motion.div>
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
      </div>

      {/* Inline edit confirmation modal */}
      {confirmInline && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setConfirmInline(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div {...scaleIn} className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-xl w-full max-w-sm">
              <h3 className="font-bold text-[var(--text-primary)] mb-3 text-lg">Confirmar alteracao</h3>
              <p className="text-[var(--text-secondary)] mb-1">
                {confirmInline.field === "price" ? "Preco" : "Estoque"}:
              </p>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[var(--text-muted)] line-through">
                  {confirmInline.field === "price" ? `R$ ${parseFloat(confirmInline.original).toFixed(2)}` : confirmInline.original}
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-[var(--brand-primary)] font-bold text-lg">
                  {confirmInline.field === "price" ? `R$ ${parseFloat(confirmInline.value).toFixed(2)}` : confirmInline.value}
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmInline(null)}
                  className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] font-semibold cursor-pointer hover:bg-[var(--bg-hover)] transition">
                  Cancelar
                </button>
                <button onClick={confirmInlineEdit}
                  className="flex-1 px-4 py-2 bg-[var(--brand-primary)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] active:scale-95 transition">
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Web image search modal */}
      {showWebSearch && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => { setShowWebSearch(null); setWebImageResults([]); }} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div {...scaleIn} className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-[var(--text-primary)] text-lg">Buscar imagem</h3>
                  <button onClick={() => { setShowWebSearch(null); setWebImageResults([]); }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Resultados para &quot;{webSearchQuery}&quot;</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {searchingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-[var(--text-muted)]">Buscando imagens...</p>
                    </div>
                  </div>
                ) : webImageResults.length === 0 ? (
                  <p className="text-center text-[var(--text-muted)] py-12">Nenhuma imagem encontrada</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {webImageResults.map((url, i) => (
                      <button key={i} onClick={() => handleSelectWebImage(url)} disabled={savingWebImage}
                        className="relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-[var(--brand-primary)] cursor-pointer transition disabled:opacity-50">
                        <img src={url} alt={`Resultado ${i + 1}`} className="w-full h-36 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                          <span className="text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition">{savingWebImage ? "Salvando..." : "Usar esta"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* CSV review modal */}
      {showCsvModal && csvProducts.length > 0 && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCsvModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div {...scaleIn} className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div data-tour="csv-review-header" className="p-5 border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] text-lg">Revisar importacao</h3>
                  <p className="text-sm text-[var(--text-muted)]">{csvProducts.length} produtos - edite antes de importar</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={startCsvReviewTour} title="Ver tutorial" className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--brand-primary-muted)] hover:text-[var(--brand-primary)] transition cursor-pointer">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  <button data-tour="csv-import-all-btn" onClick={handleBulkImport} disabled={bulkImporting}
                    className="px-5 py-2 bg-[var(--status-success-text)] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[var(--status-success-text)] active:scale-95 transition disabled:opacity-50">
                    {bulkImporting ? "Importando..." : `Importar ${csvProducts.length}`}
                  </button>
                  <button onClick={() => setShowCsvModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {bulkResult && (
                <div className={`mx-5 mt-4 p-3 rounded-xl text-sm ${bulkResult.errors.length > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-[var(--status-success-bg)] border border-[var(--status-success-bg)]"}`}>
                  <p className="font-semibold text-[var(--text-primary)]">{bulkResult.created} produtos importados!</p>
                  {bulkResult.errors.length > 0 && bulkResult.errors.map((err, i) => <p key={i} className="text-[var(--status-error-text)] text-xs mt-1">{err}</p>)}
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {csvProducts.map((p, i) => (
                  <div key={i} {...(i === 0 ? { 'data-tour': 'csv-product-card' } : {})} className="border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--border-color)] transition">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="flex-shrink-0 flex flex-col gap-1.5">
                        <input type="file" accept="image/*" className="hidden"
                          ref={(el) => { csvFileInputRefs.current[i] = el; }}
                          onChange={(e) => { if (e.target.files?.[0]) handleCsvImageSelect(e.target.files[0], i); }} />
                        <div onClick={() => csvFileInputRefs.current[i]?.click()}
                          className="w-20 h-20 border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10/50 transition overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-[var(--text-muted)]" />
                          )}
                        </div>
                        {p.name.trim() && !p.imageUrl && (
                          <button type="button" onClick={() => handleWebSearch("csv", i)}
                            className="w-20 py-1 text-[10px] text-blue-600 bg-blue-50 rounded-lg font-semibold cursor-pointer hover:bg-blue-100 active:scale-95 transition flex items-center justify-center gap-1">
                            <Search className="h-3 w-3" />
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
                                className="flex-1 px-2 py-1.5 border border-[var(--brand-primary)] rounded-lg text-sm text-[var(--text-primary)] outline-none" />
                              <button type="button" onClick={() => handleInlineCreateCategory("csv")} className="px-2 py-1.5 bg-[var(--brand-primary)] text-white rounded-lg text-xs font-bold cursor-pointer">OK</button>
                              <button type="button" onClick={() => { setInlineNewCategory(null); setInlineCategoryName(""); }} className="px-1 text-[var(--text-muted)] cursor-pointer">&#10005;</button>
                            </div>
                          ) : (
                            <select value={p.categoryId || ""}
                              onChange={(e) => { if (e.target.value === "__new__") { setInlineNewCategory("csv"); setInlineCategoryName(""); return; } updateCsvProduct(i, "categoryId", e.target.value); }}
                              className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:border-blue-400 outline-none">
                              <option value="" className="bg-[var(--bg-card)] text-[var(--text-primary)]">Sem categoria</option>
                              {categories.map((c: any) => <option key={c.id} value={c.id} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{c.name}</option>)}
                              <option value="__new__" className="bg-[var(--bg-card)] text-[var(--text-primary)]">+ Criar categoria</option>
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
                        className="flex-shrink-0 self-start p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-error-text)] hover:bg-[var(--status-error-bg)] cursor-pointer transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
                <button onClick={() => { setCsvProducts([]); setShowCsvModal(false); }}
                  className="px-4 py-2 text-sm text-[var(--status-error-text)] font-semibold cursor-pointer hover:bg-[var(--status-error-bg)] rounded-xl transition">
                  Descartar tudo
                </button>
                <button onClick={handleBulkImport} disabled={bulkImporting}
                  className="px-6 py-2.5 bg-[var(--status-success-text)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--status-success-text)] active:scale-95 transition disabled:opacity-50">
                  {bulkImporting ? "Importando..." : `Importar ${csvProducts.length} produtos`}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Zoomed image modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setZoomedImage(null)}>
          <button onClick={() => setZoomedImage(null)} className="absolute top-6 right-6 text-white/80 hover:text-white cursor-pointer transition">
            <X className="h-8 w-8" />
          </button>
          <img src={zoomedImage} alt="Produto ampliado" className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </motion.div>
  );
}
