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

  const [fetchSchedule] = useLazyQuery(STORE_SCHEDULE, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data?.storeSchedule?.length > 0) {
        const loaded = defaultSchedule();
        for (const item of data.storeSchedule) {
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
    },
  });

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
    if (!s.isActive) return { label: "Oculto", color: "text-gray-400" };
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
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja de servicos</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Crie uma loja do tipo &quot;Prestador de Servicos&quot; para comecar
          </p>
          <button
            onClick={() => setShowCreateStore(true)}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition"
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
                className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400"
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
                className="px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-600"
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
                      className="px-1 py-1 text-xs rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer transition text-center">{s}</button>
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
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400"
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
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400"
            required
          />
        </div>

        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1 block">Descricao</label>
          <textarea
            placeholder="Descreva o servico..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Duracao estimada</label>
            <select
              value={form.estimatedDuration}
              onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
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
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400"
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
            className={`w-12 h-6 rounded-full transition cursor-pointer ${form.requiresQuote ? "bg-orange-500" : "bg-gray-300"}`}
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
                className="w-32 h-32 rounded-xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:border-orange-400 transition overflow-hidden"
              >
                {(mode === "create" ? imagePreview : editImagePreview) ? (
                  <img
                    src={(mode === "create" ? imagePreview : editImagePreview)!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Web image suggestions (right side) */}
            {showWebSearch === mode && webImageResults.length > 0 && (
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[var(--text-muted)] mb-1.5 block">Clique para usar:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {webImageResults.slice(0, 8).map((url, i) => (
                    <div key={i} onClick={() => !savingWebImage && handleSelectWebImage(url)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 border-[var(--border-color)] cursor-pointer hover:border-orange-400 transition ${savingWebImage ? "opacity-50 pointer-events-none" : ""}`}>
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
    <div>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">{success}</div>
      )}

      {/* Store selector */}
      {stores.length > 1 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Loja:</span>
          <select value={activeStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}
            className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-orange-400">
            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Servicos {store ? `— ${store.name}` : ""}</h1>
        </div>
        {activeTab === "services" && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingService(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition flex items-center gap-2 ${showForm ? "bg-orange-600 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Servico
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--bg-muted)] rounded-xl p-1">
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "services"
              ? "bg-[var(--bg-card)] text-orange-500 shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Servicos ({services.length})
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "schedule"
              ? "bg-[var(--bg-card)] text-orange-500 shadow-sm"
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
                <h3 className="font-bold text-[var(--text-primary)]">Novo servico</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setServiceForm(emptyServiceForm());
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                  className="text-gray-400 hover:text-[var(--text-secondary)] cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {renderServiceFormFields(serviceForm, setServiceForm, "create")}

              <button
                type="submit"
                disabled={uploading}
                className="mt-4 w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
              >
                {uploading ? "Criando..." : "Criar servico"}
              </button>
            </form>
          )}

          {/* Edit modal */}
          {editingService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingService(null)}>
              <div
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
                      className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
                    >
                      {uploading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {deleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
              <div
                className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
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
              </div>
            </div>
          )}

          {/* Services list */}
          {services.length === 0 ? (
            <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-[var(--text-secondary)] mb-3">Nenhum servico cadastrado</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition"
              >
                Cadastrar primeiro servico
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service: any) => (
                <div
                  key={service.id}
                  className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-sm flex items-center gap-4"
                >
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {service.imageUrl ? (
                      <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-[var(--text-muted)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">{service.name}</h3>
                      {service.category && (
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full flex-shrink-0">
                          {service.category.name}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{service.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {service.requiresQuote ? "Sob orcamento" : `R$ ${Number(service.price || 0).toFixed(2)}`}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {DURATION_OPTIONS.find((d) => d.value === service.estimatedDuration)?.label ||
                          `${service.estimatedDuration} min`}
                      </span>
                      <div className="relative">
                        <button type="button" onClick={() => setStatusMenuId(statusMenuId === service.id ? null : service.id)}
                          className={`text-xs font-semibold cursor-pointer px-2 py-0.5 rounded-full border transition hover:opacity-80 flex items-center gap-1 ${
                            getServiceStatus(service).color
                          } ${!service.isActive ? "border-gray-400/30 bg-gray-100/10" : !service.isAvailable ? "border-red-400/30 bg-red-100/10" : "border-green-400/30 bg-green-100/10"}`}>
                          {getServiceStatus(service).label}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {statusMenuId === service.id && (
                          <div className="absolute top-5 left-0 z-20 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[140px]">
                            <button onClick={() => handleStatusChange(service.id, "available")}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] text-green-500 cursor-pointer">Disponivel</button>
                            <button onClick={() => handleStatusChange(service.id, "unavailable")}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] text-red-500 cursor-pointer">Indisponivel</button>
                            <button onClick={() => handleStatusChange(service.id, "hidden")}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] text-gray-400 cursor-pointer">Oculto</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(service)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] cursor-pointer transition"
                      title="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(service.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 cursor-pointer transition"
                      title="Remover"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
              className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
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
                      day.isActive ? "bg-orange-500" : "bg-gray-300"
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
                        className="px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-card)] focus:outline-none focus:border-orange-400"
                      />
                      <span className="text-[var(--text-muted)] text-sm">ate</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateScheduleDay(day.dayOfWeek, "endTime", e.target.value)}
                        className="px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-card)] focus:outline-none focus:border-orange-400"
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
    </div>
  );
}
