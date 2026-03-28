"use client";

import { useQuery, useMutation } from "@apollo/client";
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

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  COMPLETED: { label: "Concluido", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400" },
  NO_SHOW: { label: "Nao compareceu", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  QUOTE_REQUESTED: { label: "Orcamento solicitado", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  QUOTED: { label: "Orcamento enviado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  QUOTE_ACCEPTED: { label: "Orcamento aceito", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  QUOTE_REJECTED: { label: "Orcamento recusado", color: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400" },
};

type TabKey = "today" | "week" | "all" | "quotes";

function getDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
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
  const { data: storesData } = useQuery(GET_MY_STORES);
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

  const { data: appointmentsData, loading, refetch } = useQuery(STORE_APPOINTMENTS, {
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

  if (!storesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma loja de servicos</h2>
        <p className="text-[var(--text-secondary)]">Crie uma loja do tipo Servicos para gerenciar agendamentos.</p>
      </div>
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
    <div>
      {statusError && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-red-500 text-white px-6 py-4 rounded-2xl shadow-lg z-50">
          <p className="font-semibold text-sm">{statusError}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Agendamentos</h1>
        {stores.length > 1 && (
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)]"
          >
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[var(--bg-input)] rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setDateFilter(""); }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === tab.key
                ? "bg-orange-500 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Status chips */}
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            !statusFilter
              ? "bg-orange-500 text-white"
              : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Todos
        </button>
        {allStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              statusFilter === s
                ? "bg-orange-500 text-white"
                : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {statusLabels[s].label}
          </button>
        ))}

        {/* Date filter */}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)]"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 cursor-pointer"
          >
            Limpar data
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredAppointments.length === 0 && (
        <div className="text-center mt-16">
          <p className="text-4xl mb-3">📅</p>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Nenhum agendamento</h3>
          <p className="text-sm text-[var(--text-secondary)]">Nenhum agendamento encontrado com os filtros selecionados.</p>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {filteredAppointments.map((appt: any) => {
          const status = statusLabels[appt.status] || { label: appt.status, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" };
          const isLoading = actionLoading.has(appt.id);

          return (
            <div
              key={appt.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-[var(--text-muted)]">#{appt.appointmentNumber}</span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{appt.service?.name}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                  {status.label}
                </span>
              </div>

              {/* Customer */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">👤</span>
                <span className="text-sm text-[var(--text-primary)]">{appt.customer?.name}</span>
                {appt.customer?.phone && (
                  <span className="text-xs text-[var(--text-muted)]">({appt.customer.phone})</span>
                )}
              </div>

              {/* Date/time */}
              <div className="flex items-center gap-4 mb-2 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>{formatDate(appt.scheduledDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🕐</span>
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
                <p className="text-xs text-[var(--text-muted)] mb-2">📍 {appt.address}</p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border-light)]">
                {appt.status === "PENDING" && (
                  <>
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(appt.id, () => confirmAppointment({ variables: { id: appt.id } }))}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "..." : "Confirmar"}
                    </button>
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(appt.id, () => cancelAppointment({ variables: { id: appt.id } }))}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition cursor-pointer disabled:opacity-50"
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
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "..." : "Concluir"}
                    </button>
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(appt.id, () => markNoShow({ variables: { id: appt.id } }))}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-xs font-semibold hover:bg-yellow-600 transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "..." : "No-Show"}
                    </button>
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(appt.id, () => cancelAppointment({ variables: { id: appt.id } }))}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition cursor-pointer disabled:opacity-50"
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
                            className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition cursor-pointer disabled:opacity-50"
                          >
                            {isLoading ? "..." : "Enviar orcamento"}
                          </button>
                          <button
                            onClick={() => { setRespondingTo(null); setQuotePrice(""); setQuoteResponse(""); }}
                            className="px-4 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-lg text-xs font-semibold hover:bg-[var(--bg-hover)] transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(appt.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition cursor-pointer"
                      >
                        Responder orcamento
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
