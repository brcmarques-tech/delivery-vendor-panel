'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { MY_SUBSCRIPTION, CANCEL_SUBSCRIPTION, UPDATE_SUBSCRIPTION_CARD, REACTIVATE_SUBSCRIPTION } from '@/lib/graphql';
import CardForm from './CardForm';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativa', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  canceled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  past_due: { label: 'Pagamento Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: 'Processando', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const PERIOD_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function SubscriptionManager() {
  const { data, loading, refetch } = useQuery(MY_SUBSCRIPTION, { fetchPolicy: 'network-only' });
  const [cancelSubscription, { loading: canceling }] = useMutation(CANCEL_SUBSCRIPTION);
  const [updateCard, { loading: updatingCard }] = useMutation(UPDATE_SUBSCRIPTION_CARD);
  const [reactivate, { loading: reactivating }] = useMutation(REACTIVATE_SUBSCRIPTION);

  const [showCardForm, setShowCardForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sub = data?.mySubscription;

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <div className="h-4 bg-[var(--bg-muted)] rounded w-1/3 mb-4" />
        <div className="h-3 bg-[var(--bg-muted)] rounded w-2/3 mb-2" />
        <div className="h-3 bg-[var(--bg-muted)] rounded w-1/2" />
      </div>
    );
  }

  if (!sub) return null;

  const status = STATUS_LABELS[sub.status] || STATUS_LABELS.pending;

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      setShowCancelConfirm(false);
      setMessage({ type: 'success', text: 'Assinatura cancelada. Você mantém o acesso até o fim do período.' });
      refetch();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao cancelar assinatura.' });
    }
  };

  const handleUpdateCard = async (token: string) => {
    try {
      await updateCard({ variables: { cardToken: token } });
      setShowCardForm(false);
      setMessage({ type: 'success', text: 'Cartão atualizado com sucesso!' });
      refetch();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar cartão.' });
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivate();
      setMessage({ type: 'success', text: 'Assinatura reativada!' });
      refetch();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao reativar assinatura.' });
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Minha Assinatura</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Past due warning */}
      {sub.status === 'past_due' && (
        <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ⚠️ Não conseguimos processar seu pagamento. Atualize seu cartão para manter o plano ativo.
          </p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`px-6 py-3 border-b border-[var(--border-color)] ${
          message.type === 'success' ? 'bg-[var(--status-success-bg)]' : 'bg-[var(--status-error-bg)]'
        }`}>
          <p className={`text-sm ${
            message.type === 'success' ? 'text-[var(--status-success-text)]' : 'text-[var(--status-error-text)]'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Details */}
      <div className="px-6 py-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">Plano</span>
            <p className="font-semibold text-[var(--text-primary)]">{sub.plan}</p>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Período</span>
            <p className="font-semibold text-[var(--text-primary)]">{PERIOD_LABELS[sub.billingPeriod] || sub.billingPeriod}</p>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Valor</span>
            <p className="font-semibold text-[var(--text-primary)]">
              {sub.installments > 1
                ? `${sub.installments}x de R$ ${(sub.amount / sub.installments).toFixed(2)}`
                : `R$ ${Number(sub.amount).toFixed(2)}/mês`
              }
            </p>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Próxima cobrança</span>
            <p className="font-semibold text-[var(--text-primary)]">{formatDate(sub.currentPeriodEnd)}</p>
          </div>
        </div>

        {sub.cancelAtPeriodEnd && (
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Cancelamento agendado — acesso até {formatDate(sub.currentPeriodEnd)}
            </p>
          </div>
        )}
      </div>

      {/* Card form */}
      {showCardForm && (
        <div className="px-6 pb-5 border-t border-[var(--border-color)] pt-5">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Atualizar cartão de crédito</h4>
          <CardForm
            onTokenGenerated={handleUpdateCard}
            onCancel={() => setShowCardForm(false)}
            loading={updatingCard}
            submitLabel="Atualizar Cartão"
          />
        </div>
      )}

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="px-6 pb-5 border-t border-[var(--border-color)] pt-5">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Tem certeza que deseja cancelar? Você manterá o acesso ao plano <strong>{sub.plan}</strong> até{' '}
            <strong>{formatDate(sub.currentPeriodEnd)}</strong>.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              Manter assinatura
            </button>
            <button
              onClick={handleCancel}
              disabled={canceling}
              className="flex-1 px-4 py-2 rounded-xl bg-[var(--status-error-text)] text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {canceling ? 'Cancelando...' : 'Confirmar cancelamento'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!showCardForm && !showCancelConfirm && (
        <div className="px-6 py-4 border-t border-[var(--border-color)] flex gap-3">
          <button
            onClick={() => { setShowCardForm(true); setMessage(null); }}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            Trocar Cartão
          </button>

          {sub.cancelAtPeriodEnd ? (
            <button
              onClick={handleReactivate}
              disabled={reactivating}
              className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {reactivating ? 'Reativando...' : 'Reativar Assinatura'}
            </button>
          ) : sub.status === 'active' ? (
            <button
              onClick={() => { setShowCancelConfirm(true); setMessage(null); }}
              className="px-4 py-2 rounded-xl text-sm text-[var(--status-error-text)] hover:bg-[var(--status-error-bg)] transition-colors"
            >
              Cancelar Assinatura
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
