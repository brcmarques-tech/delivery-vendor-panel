'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CardFormProps {
  onTokenGenerated: (token: string) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export default function CardForm({ onTokenGenerated, onCancel, loading, submitLabel = 'Confirmar' }: CardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [tokenizing, setTokenizing] = useState(false);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13) {
      setError('Número do cartão inválido');
      return;
    }
    if (!holderName.trim()) {
      setError('Nome do titular é obrigatório');
      return;
    }
    const month = parseInt(expMonth);
    const year = parseInt(expYear);
    if (!month || month < 1 || month > 12) {
      setError('Mês de validade inválido');
      return;
    }
    if (!year || year < new Date().getFullYear() % 100) {
      setError('Ano de validade inválido');
      return;
    }
    if (cvv.length < 3) {
      setError('CVV inválido');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY;
    if (!publicKey) {
      setError('Chave pública do Pagar.me não configurada');
      return;
    }

    setTokenizing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PAGARME_API_URL || 'https://api.pagar.me/core/v5'}/tokens?appId=${publicKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'card',
          card: {
            number: digits,
            holder_name: holderName.trim().toUpperCase(),
            exp_month: month,
            exp_year: year < 100 ? 2000 + year : year,
            cvv,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Erro ao tokenizar cartão');
      }

      const data = await response.json();
      onTokenGenerated(data.id);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar cartão. Verifique os dados.');
    } finally {
      setTokenizing(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-lg border text-sm transition-colors ' +
    'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] ' +
    'placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40 focus:border-[var(--brand-primary)]';

  const isProcessing = loading || tokenizing;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
          Número do cartão
        </label>
        <input
          type="text"
          inputMode="numeric"
          className={inputClass}
          placeholder="0000 0000 0000 0000"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          disabled={isProcessing}
          autoComplete="cc-number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
          Nome do titular
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="NOME COMO NO CARTÃO"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          disabled={isProcessing}
          autoComplete="cc-name"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Mês</label>
          <input
            type="text"
            inputMode="numeric"
            className={inputClass}
            placeholder="MM"
            maxLength={2}
            value={expMonth}
            onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
            disabled={isProcessing}
            autoComplete="cc-exp-month"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ano</label>
          <input
            type="text"
            inputMode="numeric"
            className={inputClass}
            placeholder="AA"
            maxLength={2}
            value={expYear}
            onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
            disabled={isProcessing}
            autoComplete="cc-exp-year"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">CVV</label>
          <input
            type="text"
            inputMode="numeric"
            className={inputClass}
            placeholder="000"
            maxLength={4}
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            disabled={isProcessing}
            autoComplete="cc-csc"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing && (
            <Loader2 className="animate-spin h-4 w-4" />
          )}
          {submitLabel}
        </button>
      </div>

      <p className="text-xs text-[var(--text-muted)] text-center">
        Seus dados de cartão são tokenizados diretamente pelo Pagar.me e nunca passam pelo nosso servidor.
      </p>
    </form>
  );
}
