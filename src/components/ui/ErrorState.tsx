import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  /** Linha principal: o que nao foi possivel carregar. */
  title?: string;
  /** Linha de apoio: o que o usuario pode fazer. */
  description?: string;
  /** Se informado, mostra o botao "Tentar novamente". */
  onRetry?: () => void;
}

/**
 * Estado de erro de carregamento (query falhou).
 *
 * Existe para que uma query com erro nunca caia no estado vazio: sem isto,
 * `loading` vira false, `data` fica undefined e a tela mostra "Nenhum X
 * cadastrado" ou "R$ 0,00" — o usuario acha que perdeu os dados.
 * Sempre renderizar ANTES do empty state.
 */
export default function ErrorState({
  title = "Nao foi possivel carregar os dados.",
  description = "Verifique sua conexao e tente novamente.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mb-4" strokeWidth={1.5} />
      <p className="text-[var(--text-secondary)] text-sm mb-4 max-w-sm">
        {title}
        <br />
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-sm font-medium transition cursor-pointer"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
