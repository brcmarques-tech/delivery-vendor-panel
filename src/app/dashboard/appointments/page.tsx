"use client";

import { useQuery, useMutation } from "@apollo/client";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";
import {
  GET_MY_STORES,
  STORE_APPOINTMENTS,
  CONFIRM_APPOINTMENT,
  VENDOR_CANCEL_APPOINTMENT,
  COMPLETE_APPOINTMENT,
  MARK_NO_SHOW,
  RESPOND_QUOTE,
} from "@/lib/graphql";
import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarX, Calendar, Clock, User, MapPin, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem, scaleIn } from "@/lib/motion";

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo aos Agendamentos!",
      description: "Aqui você gerencia os agendamentos de serviços. Vou te mostrar como filtrar e gerenciar cada um.",
    },
  },
  {
    element: '[data-tour="appointments-tabs"]',
    popover: {
      title: "Períodos de agendamento",
      description: "Visualize agendamentos de hoje, da semana, todos ou filtre por orçamentos pendentes.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="appointments-filters"]',
    popover: {
      title: "Filtros de agendamento",
      description: "Refine por status (confirmado, pendente, concluído...) ou por uma data específica.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="appointment-card"]',
    popover: {
      title: "✅ Gerenciar agendamentos",
      description: "Veja os detalhes do cliente, serviço, data e hora. Use os botões para confirmar, concluir ou cancelar.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Agendamentos'.",
      side: "top",
      align: "start",
    },
  },
];

const statusLabels: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Pendente", variant: "warning" },
  CONFIRMED: { label: "Confirmado", variant: "info" },
  COMPLETED: { label: "Concluido", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "error" },
  NO_SHOW: { label: "Nao compareceu", variant: "error" },
  QUOTE_REQUESTED: { label: "Orcamento solicitado", variant: "warning" },
  QUOTED: { label: "Orcamento enviado", variant: "info" },
  QUOTE_ACCEPTED: { label: "Orcamento aceito", variant: "success" },
  QUOTE_REJECTED: { label: "Orcamento recusado", variant: "neutral" },
};

type TabKey = "today" | "week" | "all" | "quotes";

function getDateStr(date: Date): string {
  // Usa a data LOCAL, não UTC. Com toISOString() um vendedor no BR (UTC-3) via,
  // das ~21h até a meia-noite, a aba "Hoje" e a contagem já mostrando o dia
  // seguinte (e a janela "Semana" deslocada), porque scheduledDate é comparado
  // como string YYYY-MM-DD do calendário local.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekDates(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: getDateStr(start), end: getDateStr(end) };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function AppointmentsPage() {
  const { startTour, hasSeenTour } = useTour("appointments", TOUR_STEPS);
  const { data: storesData, error: storesError, refetch: refetchStores } = useQuery(GET_MY_STORES);
  const allStores = storesData?.myStores || [];
  // Filter only SERVICES type stores
  const stores = useMemo(() => allStores.filter((s: any) => s.storeType === "SERVICES"), [allStores]);

  const [selectedStore, setSelectedStore] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteResponse, setQuoteResponse] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);

  const { data: appointmentsData, loading, error: appointmentsError, refetch } = useQuery(STORE_APPOINTMENTS, {
    variables: { storeId: selectedStore },
    skip: !selectedStore,
  });

  const allAppointments = appointmentsData?.storeAppointments || [];

  const [confirmAppointment] = useMutation(CONFIRM_APPOINTMENT);
  const [cancelAppointment] = useMutation(VENDOR_CANCEL_APPOINTMENT);
  const [completeAppointment] = useMutation(COMPLETE_APPOINTMENT);
  const [markNoShow] = useMutation(MARK_NO_SHOW);
  const [respondQuote] = useMutation(RESPOND_QUOTE);

  const filteredAppointments = useMemo(() => {
    let list = [...allAppointments];

    // Tab filter
    if (activeTab === "today") {
      const today = getDateStr(new Date());
      list = list.filter((a: any) => a.scheduledDate === today);
    } else if (activeTab === "week") {
      const { start, end } = getWeekDates();
      list = list.filter((a: any) => a.scheduledDate >= start && a.scheduledDate <= end);
    } else if (activeTab === "quotes") {
      list = list.filter((a: any) => ["QUOTE_REQUESTED", "QUOTED", "QUOTE_ACCEPTED", "QUOTE_REJECTED"].includes(a.status));
    }

    // Status filter
    if (statusFilter) {
      list = list.filter((a: any) => a.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      list = list.filter((a: any) => a.scheduledDate === dateFilter);
    }

    // Sort by date/time
    list.sort((a: any, b: any) => {
      const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
      if (dateCompare !== 0) return dateCompare;
      return (a.scheduledTime || "").localeCompare(b.scheduledTime || "");
    });

    return list;
  }, [allAppointments, activeTab, statusFilter, dateFilter]);

  async function handleAction(id: string, action: () => Promise<any>) {
    setActionLoading((prev) => new Set(prev).add(id));
    setStatusError(null);
    try {
      await action();
      refetch();
    } catch (err: any) {
      setStatusError(err.message || "Erro ao executar acao.");
      setTimeout(() => setStatusError(null), 5000);
    } finally {
      setActionLoading((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  }

  async function handleRespondQuote(id: string) {
    const price = parseFloat(quotePrice);
    if (!price || price <= 0 || !quoteResponse.trim()) {
      setStatusError("Informe preco e resposta do orcamento.");
      setTimeout(() => setStatusError(null), 5000);
      return;
    }
    await handleAction(id, () =>
      respondQuote({ variables: { id, price, response: quoteResponse.trim() } })
    );
    setRespondingTo(null);
    setQuotePrice("");
    setQuoteResponse("");
  }

  // ANTES do skeleton e do empty state: com `!storesData` sozinho a tela ficava
  // num skeleton infinito quando a query falhava.
  if (storesError && !storesData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agendamentos" />
        <ErrorState
          title="Nao foi possivel carregar suas lojas."
          description="Verifique sua conexao e tente novamente."
          onRetry={() => refetchStores()}
        />
      </div>
    );
  }

  if (!storesData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agendamentos" />
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="Nenhuma loja de servicos"
        description="Crie uma loja do tipo Servicos para gerenciar agendamentos."
      />
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "week", label: "Semana" },
    { key: "all", label: "Todos" },
    { key: "quotes", label: "Orcamentos" },
  ];

  const allStatuses = Object.keys(statusLabels);

  return (
    <motion.div {...fadeIn}>
      {statusError && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-red-500 text-white px-6 py-4 rounded-2xl shadow-lg z-50">
          <p className="font-semibold text-sm">{statusError}</p>
        </div>
      )}

      <PageHeader
        title="Agendamentos"
        onTourStart={startTour}
        tourNotSeen={!hasSeenTour}
        badge={
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
            {filteredAppointments.length}
          </span>
        }
        actions={
          stores.length > 1 ? (
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]"
            >
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          ) : undefined
        }
      />

      {/* Toolbar — tabs à esquerda, filtros colados à direita */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-2 mb-6">
        {/* Grupo esquerdo: tabs */}
        <div data-tour="appointments-tabs" className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const count = tab.key === "today"
              ? allAppointments.filter((a: any) => a.scheduledDate === getDateStr(new Date())).length
              : tab.key === "week"
              ? allAppointments.filter((a: any) => { const w = getWeekDates(); return a.scheduledDate >= w.start && a.scheduledDate <= w.end; }).length
              : tab.key === "quotes"
              ? allAppointments.filter((a: any) => ["QUOTE_REQUESTED", "QUOTED", "QUOTE_ACCEPTED", "QUOTE_REJECTED"].includes(a.status)).length
              : allAppointments.length;

            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setDateFilter(""); }}
                className={`h-9 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? "bg-[var(--brand-primary)] text-white shadow-md"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-light)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                }`}
              >
                {tab.label}
                <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20"
                    : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grupo direito: filtros colados */}
        <div data-tour="appointments-filters" className="flex items-center gap-0">
          {/* Status dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none h-9 pl-8 pr-7 rounded-l-xl rounded-r-none text-xs sm:text-sm font-medium border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] transition"
            >
              <option value="">Todos os status</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>{statusLabels[s].label}</option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
          </div>

          {/* Date input */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`h-9 pl-8 pr-2.5 text-xs sm:text-sm border-y border-r border-[var(--border-light)] border-l-0 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition ${
                statusFilter || dateFilter ? "rounded-none" : "rounded-r-xl"
              }`}
            />
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
          </div>

          {/* Limpar filtros */}
          {(statusFilter || dateFilter) && (
            <button
              onClick={() => { setStatusFilter(""); setDateFilter(""); }}
              className="h-9 flex items-center gap-1 px-2.5 rounded-r-xl text-xs sm:text-sm font-medium text-[var(--status-error-text)] bg-[var(--status-error-bg)] border border-l-0 border-[var(--border-light)] hover:opacity-80 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <SkeletonTable rows={4} cols={4} />
      )}

      {/* Erro — ANTES do empty state: uma falha aqui virava "Nenhum agendamento"
          e o prestador perdia clientes que estavam agendados de verdade. */}
      {!loading && appointmentsError && !appointmentsData && (
        <ErrorState
          title="Nao foi possivel carregar os agendamentos."
          description="Isto nao significa que a agenda esta vazia — a consulta falhou."
          onRetry={() => refetch()}
        />
      )}

      {/* Empty state */}
      {!loading && !(appointmentsError && !appointmentsData) && filteredAppointments.length === 0 && (
        <EmptyState
          icon={CalendarX}
          title="Nenhum agendamento"
          description="Nenhum agendamento encontrado com os filtros selecionados."
        />
      )}

      {/* Cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
        {filteredAppointments.map((appt: any, apptIndex: number) => {
          const status = statusLabels[appt.status] || { label: appt.status, variant: "neutral" as BadgeVariant };
          const isLoading = actionLoading.has(appt.id);

          return (
            <motion.div
              key={appt.id}
              variants={staggerItem}
              data-tour={apptIndex === 0 ? "appointment-card" : undefined}
              className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-[var(--text-muted)]">#{appt.appointmentNumber}</span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{appt.service?.name}</h3>
                </div>
                <StatusBadge variant={status.variant} dot>
                  {status.label}
                </StatusBadge>
              </div>

              {/* Customer */}
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-primary)]">{appt.customer?.name}</span>
                {appt.customer?.phone && (
                  <span className="text-xs text-[var(--text-muted)]">({appt.customer.phone})</span>
                )}
              </div>

              {/* Date/time */}
              <div className="flex items-center gap-4 mb-2 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>{formatDate(appt.scheduledDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>{appt.scheduledTime}{appt.endTime ? ` - ${appt.endTime}` : ""}</span>
                </div>
                {appt.service?.estimatedDuration && (
                  <span className="text-xs text-[var(--text-muted)]">({appt.service.estimatedDuration} min)</span>
                )}
              </div>

              {/* Price */}
              {appt.price && (
                <div className="mb-2">
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    R$ {Number(appt.price).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Quote description */}
              {appt.quoteDescription && (
                <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Descricao do orcamento:</p>
                  <p className="text-sm text-[var(--text-secondary)]">{appt.quoteDescription}</p>
                </div>
              )}

              {/* Quote response */}
              {appt.quoteResponse && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Resposta do orcamento:</p>
                  <p className="text-sm text-[var(--text-secondary)]">{appt.quoteResponse}</p>
                </div>
              )}

              {/* Notes */}
              {appt.notes && (
                <p className="text-xs text-[var(--text-muted)] mb-2">Obs: {appt.notes}</p>
              )}

              {/* Address */}
              {appt.address && (
                <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {appt.address}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border-light)]">
                {appt.status === "PENDING" && (
                  <>
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(appt.id, () => confirmAppointment({ variables: { id: appt.id } }))}
                      className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "..." : "Confirmar"}
                    </button>
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(appt.id, () => cancelAppointment({ variables: { id: appt.id } }))}
                      className="px-4 py-2 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-xl text-xs font-semibold hover:opacity-80 transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "..." : "Cancelar"}
                    </button>
                  </>
                )}

                {appt.status === "CONFIRMED" && (
                  <>
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(appt.id, () => completeAppointment({ variables: { id: appt.id } }))}
                      className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "..." : "Concluir"}
                    </button>
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(appt.id, () => markNoShow({ variables: { id: appt.id } }))}
                      className="px-4 py-2 bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] rounded-xl text-xs font-semibold hover:opacity-80 transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "..." : "No-Show"}
                    </button>
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(appt.id, () => cancelAppointment({ variables: { id: appt.id } }))}
                      className="px-4 py-2 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-xl text-xs font-semibold hover:opacity-80 transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "..." : "Cancelar"}
                    </button>
                  </>
                )}

                {appt.status === "QUOTE_REQUESTED" && (
                  <>
                    {respondingTo === appt.id ? (
                      <div className="w-full space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Preco (R$)"
                            value={quotePrice}
                            onChange={(e) => setQuotePrice(e.target.value)}
                            className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-input)] text-[var(--text-primary)]"
                          />
                        </div>
                        <textarea
                          placeholder="Resposta do orcamento..."
                          value={quoteResponse}
                          onChange={(e) => setQuoteResponse(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-input)] text-[var(--text-primary)] resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={isLoading}
                            onClick={() => handleRespondQuote(appt.id)}
                            className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                          >
                            {isLoading ? "..." : "Enviar orcamento"}
                          </button>
                          <button
                            onClick={() => { setRespondingTo(null); setQuotePrice(""); setQuoteResponse(""); }}
                            className="px-4 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold hover:bg-[var(--bg-hover)] transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(appt.id)}
                        className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Responder orcamento
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
