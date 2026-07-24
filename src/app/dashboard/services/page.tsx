"use client";

import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import CreateStoreModal from "@/components/CreateStoreModal";
import {
  GET_MY_STORES,
  SERVICES_BY_STORE,
  CREATE_SERVICE,
  UPDATE_SERVICE,
  DELETE_SERVICE,
  CREATE_CATEGORY,
  UPLOAD_IMAGE,
  SEARCH_PRODUCT_IMAGES,
  UPLOAD_FROM_URL,
  STORE_SCHEDULE,
  SET_SCHEDULE,
} from "@/lib/graphql";
import { useState, useRef, useEffect, useCallback } from "react";
import { compressImage } from "@/lib/compressImage";
import { Image, X, Plus, Briefcase, ChevronDown, SquarePen, Trash2, Clock, HelpCircle } from "lucide-react";
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
      title: "👋 Bem-vindo aos Serviços!",
      description: "Aqui você cadastra e gerencia os serviços que sua loja oferece. Vou te mostrar como funciona.",
    },
  },
  {
    element: '[data-tour="service-grid"]',
    popover: {
      title: "✅ Seus serviços",
      description: "Gerencie seus serviços: edite horários, preços, fotos e ative ou desative conforme a demanda.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="add-service-btn"]',
    popover: {
      title: "Cadastrar serviço",
      description: "Clique aqui para cadastrar um novo serviço! Um tutorial vai te guiar pelo formulário.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título.",
      side: "bottom",
      align: "start",
    },
  },
];

const SERVICE_FORM_TOUR: DriveStep[] = [
  {
    popover: {
      title: "👋 Novo Serviço!",
      description: "Vou te mostrar como cadastrar um serviço. É rápido!",
    },
  },
  {
    element: '[data-tour="service-name"]',
    popover: {
      title: "Nome do serviço",
      description: "Digite o nome do serviço. Ex: Corte de cabelo, Consultoria, Massagem...",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="service-duration"]',
    popover: {
      title: "⏱️ Duração estimada",
      description: "Selecione quanto tempo o serviço leva em média. Isso ajuda no agendamento.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="service-price"]',
    popover: {
      title: "💰 Preço",
      description: "Defina o preço ou ative 'Solicitar orçamento' para preços sob consulta.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="service-submit"]',
    popover: {
      title: "✅ Pronto!",
      description: "Após preencher, clique aqui para criar o serviço.\n\nIsso é tudo! Agora é só preencher os dados.",
      side: "top",
      align: "start",
    },
  },
];

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 horas" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terca" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sabado" },
];

function emptyServiceForm() {
  return {
    name: "",
    description: "",
    price: "",
    estimatedDuration: "60",
    requiresQuote: false,
    categoryId: "",
  };
}

function defaultSchedule() {
  return DAYS_OF_WEEK.map((d) => ({
    dayOfWeek: d.value,
    startTime: d.value >= 1 && d.value <= 5 ? "08:00" : "09:00",
    endTime: d.value >= 1 && d.value <= 5 ? "18:00" : "13:00",
    isActive: d.value >= 1 && d.value <= 5,
  }));
}

export default function ServicesPage() {
  const { startTour, hasSeenTour } = useTour("services", TOUR_STEPS);
  const { startTour: startServiceFormTour, hasSeenTour: hasSeenFormTour } = useTour("create-service", SERVICE_FORM_TOUR, false);
  const { data: storesData, refetch: refetchStores } = useQuery(GET_MY_STORES);
  const allStores = storesData?.myStores || [];
  const stores = allStores.filter((s: any) => s.storeType === "SERVICES");
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"services" | "schedule">("services");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Service form
  const [showForm, setShowForm] = useState(false);

  // Start service form tour when form opens
  useEffect(() => {
    if (!showForm || hasSeenFormTour) return;
    const timer = setTimeout(() => startServiceFormTour(), 800);
    return () => clearTimeout(timer);
  }, [showForm, hasSeenFormTour, startServiceFormTour]);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit
  const [editingService, setEditingService] = useState<any>(null);
  const [editForm, setEditForm] = useState(emptyServiceForm());
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Status menu
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  // Inline category creation
  const [inlineNewCategory, setInlineNewCategory] = useState<"create" | "edit" | null>(null);
  const [inlineCategoryName, setInlineCategoryName] = useState("");

  // Web image search
  const [webImageResults, setWebImageResults] = useState<string[]>([]);
  const [showWebSearch, setShowWebSearch] = useState<"create" | "edit" | null>(null);
  const [savingWebImage, setSavingWebImage] = useState(false);
  const [searchImages] = useLazyQuery(SEARCH_PRODUCT_IMAGES);
  const [uploadFromUrl] = useMutation(UPLOAD_FROM_URL);
  const nameSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule
  const [schedule, setSchedule] = useState(defaultSchedule());
  const [savingSchedule, setSavingSchedule] = useState(false);

  const activeStoreId = selectedStoreId || (stores.length > 0 ? stores[0].id : "");
  const store = stores.find((s: any) => s.id === activeStoreId);
  const categories = store?.categories || [];

  // Queries
  const { data: servicesData, refetch: refetchServices } = useQuery(SERVICES_BY_STORE, {
    variables: { storeId: activeStoreId },
    skip: !activeStoreId,
  });
  const services = servicesData?.allServicesByStore || [];

  // KAN-256: era `useLazyQuery(..., { onCompleted })` setando estado local.
  // O Apollo 3.14 emite um aviso alto em TODO build por causa disso, e o
  // motivo e real: `onCompleted` em lazy query nao dispara de forma confiavel
  // (ex.: quando a resposta vem do cache), entao o horario da loja podia
  // simplesmente nao carregar, sem erro. A recomendacao oficial e derivar do
  // `data` retornado pelo hook — foi o que passou a ser feito no useEffect
  // abaixo.
  const [fetchSchedule, { data: scheduleData }] = useLazyQuery(STORE_SCHEDULE, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!scheduleData) return;
    const rows = scheduleData.storeSchedule;
    if (rows?.length > 0) {
      const loaded = defaultSchedule();
      for (const item of rows) {
        const idx = loaded.findIndex((d) => d.dayOfWeek === item.dayOfWeek);
        if (idx !== -1) {
          loaded[idx] = {
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime || loaded[idx].startTime,
            endTime: item.endTime || loaded[idx].endTime,
            isActive: item.isActive,
          };
        }
      }
      setSchedule(loaded);
    } else {
      setSchedule(defaultSchedule());
    }
  }, [scheduleData]);

  // Mutations
  const [createService] = useMutation(CREATE_SERVICE);
  const [updateService] = useMutation(UPDATE_SERVICE);
  const [deleteService] = useMutation(DELETE_SERVICE);
  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);
  const [setScheduleMut] = useMutation(SET_SCHEDULE);

  async function handleStatusChange(serviceId: string, status: "available" | "unavailable" | "hidden") {
    try {
      const input: any = { id: serviceId };
      if (status === "available") { input.isAvailable = true; input.isActive = true; }
      else if (status === "unavailable") { input.isAvailable = false; input.isActive = true; }
      else { input.isActive = false; }
      await updateService({ variables: { input } });
      refetchServices();
      setStatusMenuId(null);
    } catch (err: any) { setError(err.message || "Erro ao atualizar status"); }
  }

  function getServiceStatus(s: any): { label: string; color: string } {
    if (!s.isActive) return { label: "Oculto", color: "text-[var(--text-muted)]" };
    if (!s.isAvailable) return { label: "Indisponivel", color: "text-red-500" };
    return { label: "Disponivel", color: "text-green-500" };
  }

  // Load schedule when store changes
  useEffect(() => {
    if (activeStoreId) {
      fetchSchedule({ variables: { storeId: activeStoreId } });
    }
  }, [activeStoreId, fetchSchedule]);

  // Clear messages
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // ─── Image handling ───
  function handleImage(e: React.ChangeEvent<HTMLInputElement>, mode: "create" | "edit") {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      try {
        const compressed = await compressImage(result);
        if (mode === "create") {
          setImagePreview(compressed);
          setImageBase64(compressed);
        } else {
          setEditImagePreview(compressed);
          setEditImageBase64(compressed);
        }
      } catch {
        if (mode === "create") {
          setImagePreview(result);
          setImageBase64(result);
        } else {
          setEditImagePreview(result);
          setEditImageBase64(result);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async function uploadImg(base64: string | null): Promise<string | undefined> {
    if (!base64) return undefined;
    try {
      const { data } = await uploadImage({ variables: { base64, folder: "services" } });
      return data?.uploadImage;
    } catch {
      return undefined;
    }
  }

  // ─── Web image search ───
  async function searchServiceImages(query: string, mode: "create" | "edit") {
    if (!query.trim() || query.trim().length < 3) { setWebImageResults([]); setShowWebSearch(null); return; }
    setShowWebSearch(mode);
    try {
      const { data } = await searchImages({ variables: { query: query + " servico" } });
      setWebImageResults(data?.searchProductImages || []);
    } catch { setWebImageResults([]); }
  }

  function handleNameChange(value: string, form: any, setForm: (f: any) => void, mode: "create" | "edit") {
    setForm({ ...form, name: value });
    if (nameSearchTimer.current) clearTimeout(nameSearchTimer.current);
    nameSearchTimer.current = setTimeout(() => searchServiceImages(value, mode), 800);
  }

  async function handleSelectWebImage(url: string) {
    setSavingWebImage(true);
    try {
      const { data } = await uploadFromUrl({ variables: { url, folder: "services" } });
      const savedUrl = data.uploadFromUrl;
      if (showWebSearch === "create") { setImagePreview(savedUrl); setImageBase64(null); }
      else { setEditImagePreview(savedUrl); setEditImageBase64(null); }
      if (showWebSearch === "edit" && editingService) {
        await updateService({ variables: { input: { id: editingService.id, imageUrl: savedUrl } } });
        refetchServices();
      }
      setShowWebSearch(null); setWebImageResults([]); setSavingWebImage(false);
    } catch { setSavingWebImage(false); setError("Erro ao salvar imagem"); }
  }

  // ─── Inline category ───
  async function handleInlineCategory(target: "create" | "edit") {
    if (!inlineCategoryName.trim() || !activeStoreId) return;
    try {
      const { data } = await createCategory({
        variables: { name: inlineCategoryName.trim(), storeId: activeStoreId },
      });
      const newCatId = data?.createCategory?.id;
      if (newCatId) {
        if (target === "create") {
          setServiceForm({ ...serviceForm, categoryId: newCatId });
        } else {
          setEditForm({ ...editForm, categoryId: newCatId });
        }
      }
      setInlineNewCategory(null);
      setInlineCategoryName("");
      refetchStores();
    } catch (err: any) {
      setError(err.message || "Erro ao criar categoria");
    }
  }

  // ─── CRUD ───
  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!activeStoreId) {
      setError("Nenhuma loja encontrada.");
      return;
    }
    if (!serviceForm.name.trim()) {
      setError("Nome do servico e obrigatorio.");
      return;
    }
    try {
      setUploading(true);
      let imageUrl: string | undefined;
      if (imageBase64) {
        imageUrl = await uploadImg(imageBase64);
      } else if (imagePreview && imagePreview.startsWith('http')) {
        imageUrl = imagePreview;
      }
      const input: any = {
        storeId: activeStoreId,
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || undefined,
        estimatedDuration: parseInt(serviceForm.estimatedDuration),
        requiresQuote: serviceForm.requiresQuote,
        categoryId: serviceForm.categoryId || undefined,
        imageUrl,
      };
      if (!serviceForm.requiresQuote && serviceForm.price) {
        input.price = parseFloat(serviceForm.price);
      }
      await createService({ variables: { input } });
      setServiceForm(emptyServiceForm());
      setImagePreview(null);
      setImageBase64(null);
      setShowForm(false);
      setSuccess("Servico criado com sucesso!");
      refetchServices();
      setUploading(false);
    } catch (err: any) {
      setUploading(false);
      setError(err.message || "Erro ao criar servico");
    }
  }

  async function handleUpdateService(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!editingService) return;
    try {
      setUploading(true);
      let imageUrl: string | undefined;
      if (editImageBase64) {
        imageUrl = await uploadImg(editImageBase64);
      }
      const input: any = {
        id: editingService.id,
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        estimatedDuration: parseInt(editForm.estimatedDuration),
        requiresQuote: editForm.requiresQuote,
        categoryId: editForm.categoryId || undefined,
      };
      if (!editForm.requiresQuote && editForm.price) {
        input.price = parseFloat(editForm.price);
      }
      if (imageUrl) input.imageUrl = imageUrl;
      await updateService({ variables: { input } });
      setEditingService(null);
      setEditImagePreview(null);
      setEditImageBase64(null);
      setSuccess("Servico atualizado!");
      refetchServices();
      setUploading(false);
    } catch (err: any) {
      setUploading(false);
      setError(err.message || "Erro ao atualizar servico");
    }
  }

  async function handleDeleteService(id: string) {
    try {
      await deleteService({ variables: { id } });
      setDeleteConfirm(null);
      setSuccess("Servico removido.");
      refetchServices();
    } catch (err: any) {
      setError(err.message || "Erro ao remover servico");
    }
  }

  function startEdit(service: any) {
    setEditingService(service);
    setEditForm({
      name: service.name || "",
      description: service.description || "",
      price: service.price ? String(service.price) : "",
      estimatedDuration: String(service.estimatedDuration || 60),
      requiresQuote: service.requiresQuote || false,
      categoryId: service.category?.id || "",
    });
    setEditImagePreview(service.imageUrl || null);
    setEditImageBase64(null);
  }

  // ─── Schedule ───
  async function handleSaveSchedule() {
    if (!activeStoreId) return;
    setSavingSchedule(true);
    setError("");
    try {
      for (const day of schedule) {
        await setScheduleMut({
          variables: {
            input: {
              storeId: activeStoreId,
              dayOfWeek: day.dayOfWeek,
              startTime: day.startTime,
              endTime: day.endTime,
              isActive: day.isActive,
            },
          },
        });
      }
      setSuccess("Horarios salvos com sucesso!");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar horarios");
    } finally {
      setSavingSchedule(false);
    }
  }

  function updateScheduleDay(dayOfWeek: number, field: string, value: any) {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  }

  // ─── Renders ───

  // No service stores
  if (stores.length === 0) {
    return (
      <>
        <CreateStoreModal open={showCreateStore} onClose={() => setShowCreateStore(false)} onCreated={() => refetchStores()} />
        <div className="text-center mt-20">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja de servicos</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Crie uma loja do tipo &quot;Prestador de Servicos&quot; para comecar
          </p>
          <button
            onClick={() => setShowCreateStore(true)}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-6 py-3 rounded-xl font-medium cursor-pointer active:scale-95 transition"
          >
            Criar loja de servicos
          </button>
        </div>
      </>
    );
  }

  // ─── Category select helper ───
  const SERVICE_CATEGORY_SUGGESTIONS = [
    'Barbearia', 'Saude', 'Informatica', 'Eletrica', 'Encanamento',
    'Reformas', 'Limpeza', 'Beleza', 'Aulas', 'Mecanica',
  ];

  function renderCategorySelect(
    value: string,
    onChange: (v: string) => void,
    target: "create" | "edit"
  ) {
    return (
      <div>
        <label className="text-sm text-[var(--text-secondary)] mb-1 block">Categoria</label>
        {inlineNewCategory === target ? (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da categoria"
                value={inlineCategoryName}
                onChange={(e) => setInlineCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInlineCategory(target);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleInlineCategory(target)}
                className="px-3 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => {
                  setInlineNewCategory(null);
                  setInlineCategoryName("");
                }}
                className="px-3 py-2 border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-hover)]"
              >
                Cancelar
              </button>
            </div>
            {!inlineCategoryName && (
              <div className="mt-2">
                <span className="text-xs text-[var(--text-secondary)] mb-1.5 block">ou escolha uma das categorias principais:</span>
                <div className="grid grid-cols-5 gap-1">
                  {SERVICE_CATEGORY_SUGGESTIONS.filter(s => !categories.some((c: any) => c.name.toLowerCase() === s.toLowerCase())).map(s => (
                    <button key={s} type="button" onClick={() => setInlineCategoryName(s)}
                      className="px-1 py-1 text-xs rounded-full bg-[var(--brand-primary-muted)] text-[var(--brand-primary)] hover:opacity-80 cursor-pointer transition text-center">{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <select
            value={value}
            onChange={(e) => {
              if (e.target.value === "__new__") { setInlineNewCategory(target); e.target.value = value; }
              else onChange(e.target.value);
            }}
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="">Sem categoria</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="__new__">+ Criar nova categoria</option>
          </select>
        )}
      </div>
    );
  }

  // ─── Service form (shared between create and edit) ───
  function renderServiceFormFields(
    form: ReturnType<typeof emptyServiceForm>,
    setForm: (f: ReturnType<typeof emptyServiceForm>) => void,
    mode: "create" | "edit"
  ) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1 block">Nome do servico *</label>
          <input
            type="text"
            placeholder="Ex: Corte de cabelo, Consultoria, Massagem..."
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value, form, setForm, mode)}
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
            required
            {...(mode === "create" ? { "data-tour": "service-name" } : {})}
          />
        </div>

        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1 block">Descricao</label>
          <textarea
            placeholder="Descreva o servico..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Duracao estimada</label>
            <select
              value={form.estimatedDuration}
              onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
              {...(mode === "create" ? { "data-tour": "service-duration" } : {})}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div {...(mode === "create" ? { "data-tour": "service-price" } : {})}>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">
              {form.requiresQuote ? "Preco (orcamento)" : "Preco (R$)"}
            </label>
            {form.requiresQuote ? (
              <div className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] bg-[var(--bg-muted)] text-sm">
                Sob orcamento
              </div>
            ) : (
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded-xl">
          <div>
            <span className="text-sm text-[var(--text-primary)]">Solicitar orcamento</span>
            <p className="text-xs text-[var(--text-muted)]">Cliente solicita orcamento em vez de pagar direto</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, requiresQuote: !form.requiresQuote })}
            className={`w-12 h-6 rounded-full transition cursor-pointer ${form.requiresQuote ? "bg-[var(--brand-primary)]" : "bg-[var(--bg-muted)]"}`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.requiresQuote ? "translate-x-6" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {renderCategorySelect(
          form.categoryId,
          (v) => setForm({ ...form, categoryId: v }),
          mode
        )}

        {/* Image */}
        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-2 block">Imagem</label>
          <div className="flex gap-4 items-start">
            {/* Selected image (large) */}
            <div className="relative shrink-0">
              <div
                onClick={() =>
                  mode === "create"
                    ? fileInputRef.current?.click()
                    : editFileInputRef.current?.click()
                }
                className="w-32 h-32 rounded-xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-[var(--brand-primary)] transition overflow-hidden"
              >
                {(mode === "create" ? imagePreview : editImagePreview) ? (
                  <img
                    src={(mode === "create" ? imagePreview : editImagePreview)!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Image className="h-8 w-8 text-[var(--text-muted)]" />
                    <span className="text-[10px] text-[var(--text-muted)]">Clique para adicionar</span>
                  </div>
                )}
              </div>
              {(mode === "create" ? imagePreview : editImagePreview) && (
                <button type="button" onClick={(e) => {
                  e.stopPropagation();
                  if (mode === "create") { setImagePreview(null); setImageBase64(null); }
                  else { setEditImagePreview(null); setEditImageBase64(null); }
                }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition">
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              )}
            </div>

            {/* Web image suggestions (right side) */}
            {showWebSearch === mode && webImageResults.length > 0 && (
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[var(--text-muted)] mb-1.5 block">Clique para usar:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {webImageResults.slice(0, 8).map((url, i) => (
                    <div key={i} onClick={() => !savingWebImage && handleSelectWebImage(url)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 border-[var(--border-color)] cursor-pointer hover:border-[var(--brand-primary)] transition ${savingWebImage ? "opacity-50 pointer-events-none" : ""}`}>
                      <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input
            ref={mode === "create" ? fileInputRef : editFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImage(e, mode)}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div {...fadeIn}>
      {error && (
        <div className="bg-[var(--status-error-bg)] text-[var(--status-error-text)] p-3 rounded-xl text-sm mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">{success}</div>
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
        title={`Servicos ${store ? `— ${store.name}` : ""}`}
        onTourStart={startTour}
        tourNotSeen={!hasSeenTour}
        actions={
          activeTab === "services" ? (
            <button
              data-tour="add-service-btn"
              onClick={() => {
                setShowForm(!showForm);
                setEditingService(null);
              }}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 transition flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Servico
            </button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--bg-muted)] rounded-xl p-1">
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "services"
              ? "bg-[var(--bg-card)] text-[var(--brand-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Servicos ({services.length})
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "schedule"
              ? "bg-[var(--bg-card)] text-[var(--brand-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Horarios
        </button>
      </div>

      {/* ═══ SERVICES TAB ═══ */}
      {activeTab === "services" && (
        <>
          {/* Create form */}
          {showForm && (
            <form onSubmit={handleCreateService} className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[var(--text-primary)]">Novo servico</h3>
                  <button onClick={startServiceFormTour} title="Ver tutorial" className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--brand-primary-muted)] hover:text-[var(--brand-primary)] transition cursor-pointer">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setServiceForm(emptyServiceForm());
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {renderServiceFormFields(serviceForm, setServiceForm, "create")}

              <button
                type="submit"
                disabled={uploading}
                data-tour="service-submit"
                className="mt-4 w-full py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl font-medium cursor-pointer active:scale-95 disabled:opacity-50 transition"
              >
                {uploading ? "Criando..." : "Criar servico"}
              </button>
            </form>
          )}

          {/* Edit modal */}
          {editingService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingService(null)}>
              <motion.div
                {...scaleIn}
                className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Editar servico</h2>
                  <button onClick={() => setEditingService(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer text-2xl leading-none">
                    &times;
                  </button>
                </div>
                <form onSubmit={handleUpdateService} className="p-6">
                  {renderServiceFormFields(editForm, setEditForm, "edit")}
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setEditingService(null)}
                      className="flex-1 py-3 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold cursor-pointer hover:bg-[var(--bg-hover)] active:scale-95 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl font-medium cursor-pointer active:scale-95 disabled:opacity-50 transition"
                    >
                      {uploading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Delete confirmation */}
          {deleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
              <motion.div
                {...scaleIn}
                className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-bold text-[var(--text-primary)] mb-2">Remover servico?</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Esta acao nao pode ser desfeita.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold cursor-pointer hover:bg-[var(--bg-hover)] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteService(deleteConfirm)}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold cursor-pointer hover:bg-red-600 transition"
                  >
                    Remover
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Services list */}
          {services.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Nenhum servico cadastrado"
              description="Crie seu primeiro servico para comecar a receber agendamentos"
              action={{ label: "Cadastrar primeiro servico", onClick: () => setShowForm(true) }}
            />
          ) : (
            <motion.div data-tour="service-grid" variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {services.map((service: any) => (
                <motion.div
                  variants={staggerItem}
                  key={service.id}
                  className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] overflow-hidden hover:shadow-[var(--card-shadow-hover)] transition-shadow"
                >
                  {/* Image */}
                  <div className="w-full h-40 bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                    {service.imageUrl ? (
                      <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <Briefcase className="h-10 w-10 text-[var(--text-muted)]" strokeWidth={1.5} />
                    )}
                  </div>

                  {/* Card content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">{service.name}</h3>
                      <div className="relative flex-shrink-0">
                        <button type="button" onClick={() => setStatusMenuId(statusMenuId === service.id ? null : service.id)}
                          className={`text-xs font-semibold cursor-pointer px-2 py-0.5 rounded-full border transition hover:opacity-80 flex items-center gap-1 ${
                            getServiceStatus(service).color
                          } ${!service.isActive ? "border-[var(--border-light)] bg-[var(--bg-muted)]" : !service.isAvailable ? "border-red-400/30 bg-red-100/10" : "border-green-400/30 bg-green-100/10"}`}>
                          {getServiceStatus(service).label}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {statusMenuId === service.id && (
                          <div className="absolute top-6 right-0 z-20 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl shadow-lg py-1 min-w-[140px]">
                            <button onClick={() => handleStatusChange(service.id, "available")}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] text-green-500 cursor-pointer">Disponivel</button>
                            <button onClick={() => handleStatusChange(service.id, "unavailable")}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] text-red-500 cursor-pointer">Indisponivel</button>
                            <button onClick={() => handleStatusChange(service.id, "hidden")}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer">Oculto</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {service.category && (
                      <span className="inline-block px-2 py-0.5 bg-[var(--brand-primary-muted)] text-[var(--brand-primary)] text-xs rounded-full">
                        {service.category.name}
                      </span>
                    )}

                    {service.description && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{service.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-lg font-bold text-[var(--brand-primary)]">
                        {service.requiresQuote ? "Sob orcamento" : `R$ ${Number(service.price || 0).toFixed(2)}`}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Clock className="h-3.5 w-3.5" />
                        {DURATION_OPTIONS.find((d) => d.value === service.estimatedDuration)?.label ||
                          `${service.estimatedDuration} min`}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-light)]">
                      <button
                        onClick={() => startEdit(service)}
                        className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-pointer transition text-xs font-medium"
                        title="Editar"
                      >
                        <SquarePen className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(service.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-[var(--status-error-bg)] text-[var(--status-error-text)]/60 hover:text-[var(--status-error-text)] cursor-pointer transition text-xs font-medium"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* ═══ SCHEDULE TAB ═══ */}
      {activeTab === "schedule" && (
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">Horarios de atendimento</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Configure os dias e horarios que voce atende
              </p>
            </div>
            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer active:scale-95 disabled:opacity-50 transition"
            >
              {savingSchedule ? "Salvando..." : "Salvar horarios"}
            </button>
          </div>

          <div className="space-y-3">
            {schedule.map((day) => {
              const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day.dayOfWeek)!;
              return (
                <div
                  key={day.dayOfWeek}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition ${
                    day.isActive
                      ? "border-[var(--border-color)] bg-[var(--bg-input)]"
                      : "border-[var(--border-color)] bg-[var(--bg-muted)] opacity-60"
                  }`}
                >
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => updateScheduleDay(day.dayOfWeek, "isActive", !day.isActive)}
                    className={`w-10 h-5 rounded-full transition cursor-pointer flex-shrink-0 ${
                      day.isActive ? "bg-[var(--brand-primary)]" : "bg-[var(--bg-muted)]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        day.isActive ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>

                  {/* Day name */}
                  <span className="text-sm font-semibold text-[var(--text-primary)] w-20 flex-shrink-0">
                    {dayInfo.label}
                  </span>

                  {/* Time inputs */}
                  {day.isActive ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateScheduleDay(day.dayOfWeek, "startTime", e.target.value)}
                        className="px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-card)] focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                      <span className="text-[var(--text-muted)] text-sm">ate</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateScheduleDay(day.dayOfWeek, "endTime", e.target.value)}
                        className="px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-card)] focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--text-muted)] italic">Fechado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CreateStoreModal
        open={showCreateStore}
        onClose={() => setShowCreateStore(false)}
        onCreated={() => refetchStores()}
      />
    </motion.div>
  );
}
