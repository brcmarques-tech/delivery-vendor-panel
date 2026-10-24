"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { KeyRound, Megaphone, CheckCircle, AlertCircle } from "lucide-react";
import { CODIGO_DA_MINHA_LOJA, REGISTRAR_CODIGO_DO_ENTREGADOR } from "@/lib/graphql";

/**
 * O CARTÃO DE CÓDIGOS DA COLETA, no painel do lojista.
 *
 * O lojista tem dois papéis aqui, e eles são opostos:
 *
 *   DITAR   o código da loja ao entregador, que o digita no app dele.
 *   DIGITAR o código que o entregador dita.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A SEGUNDA METADE ESTÁ EM DISCUSSÃO — E ESTE É O ÚNICO LUGAR DO PAINEL QUE
 * DEPENDE DELA.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Há a opção de o fluxo ficar em DOIS códigos, com o entregador apenas
 * RECOLHENDO o da loja e o do cliente, sem ditar nada. Se essa decisão vier,
 * some o bloco de digitação deste arquivo (a prop `pedirCodigoDoEntregador`
 * já existe para desligá-lo) e o resto do painel não muda.
 *
 * O que se perde, para a escolha ser informada: a digitação do lojista é a
 * ÚNICA prova de que a loja entregou AQUELE pedido ao entregador certo. Sem
 * ela, um entregador que coletou pode alegar que coletou outro pedido, e não
 * existe nada do lado da loja que diga o contrário. Um meio-caminho possível é
 * exigir a digitação só acima de um determinado valor de pedido.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `network-only` na leitura do código: código em cache é código que pode
 * aparecer na tela depois de trocar de loja ou de sessão.
 */

export interface CartaoDeCodigosProps {
  orderId: string;
  orderNumber: string;
  /** O entregador já registrou o código da loja? */
  codigoDaLojaJaRegistrado: boolean;
  /**
   * Mostrar o campo onde o lojista digita o código do entregador?
   *
   * Existe para a decisão de 2-vs-3 códigos ser um parâmetro, e não uma
   * cirurgia. Em `false`, o cartão só DITA.
   */
  pedirCodigoDoEntregador?: boolean;
  onRegistrado?: () => void;
}

const TAMANHO = 6;

export function CartaoDeCodigos({
  orderId,
  orderNumber,
  codigoDaLojaJaRegistrado,
  pedirCodigoDoEntregador = true,
  onRegistrado,
}: CartaoDeCodigosProps) {
  const { data, loading } = useQuery(CODIGO_DA_MINHA_LOJA, {
    variables: { orderId },
    fetchPolicy: "network-only",
  });
  const [registrar] = useMutation(REGISTRAR_CODIGO_DO_ENTREGADOR);

  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  // Trocou de pedido: limpa. Sem isso, o código digitado para um pedido
  // apareceria no campo de outro — e o lojista gastaria uma das 5 tentativas
  // do pedido NOVO com o número do pedido ANTIGO.
  useEffect(() => {
    setCodigo("");
    setErro(null);
    setPronto(false);
  }, [orderId]);

  const codigoDaLoja: string | null = data?.codigoDaMinhaLoja || null;
  const completo = codigo.length === TAMANHO;

  async function enviar() {
    if (!completo || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await registrar({ variables: { orderId, codigo } });
      setPronto(true);
      setCodigo("");
      onRegistrado?.();
    } catch (e: any) {
      // A mensagem do servidor vai literal. Ela diz coisas diferentes que
      // pedem ações diferentes: "Restam 3 tentativas", "Tente novamente em 15
      // minutos", "quem digita é o entregador". Trocar as três por "Erro ao
      // registrar" deixaria o lojista sem saber se insiste ou se espera.
      setErro(e?.graphQLErrors?.[0]?.message || e?.message || "Não deu para registrar o código.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="border border-dashed border-blue-400 dark:border-blue-600 rounded-xl p-3 mb-3 bg-blue-50/50 dark:bg-blue-900/10">
      {/* ── DITAR ── */}
      <div className="flex items-center gap-2 mb-1">
        <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          Dite este código ao entregador
        </span>
      </div>
      {loading ? (
        <div className="h-9 animate-pulse rounded bg-blue-100 dark:bg-blue-900/30" />
      ) : (
        <p className="text-3xl font-bold tracking-[0.3em] text-blue-600 dark:text-blue-400 text-center py-1">
          {codigoDaLoja || "—"}
        </p>
      )}
      <p className="text-[11px] text-[var(--text-secondary)] text-center">
        {codigoDaLojaJaRegistrado
          ? "O entregador já registrou este código."
          : "Ele digita no app, e isso registra a coleta."}
      </p>

      {/* ── DIGITAR ── */}
      {pedirCodigoDoEntregador && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          {pronto ? (
            <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-1.5 py-1">
              <CheckCircle className="w-4 h-4" /> Coleta confirmada
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Digite o código do entregador
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  value={codigo}
                  // Aceita o que o lojista colar ou ouvir e limpa: espaço,
                  // ponto, hífen. Recusar "12 34 56" seria rigor sem motivo.
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, TAMANHO))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000000"
                  aria-label={`Código do entregador do pedido ${orderNumber}`}
                  className="flex-1 min-w-0 text-center text-2xl font-bold tracking-[0.25em] rounded-lg border-2 px-2 py-1.5 bg-[var(--bg-input,white)] text-[var(--text-primary)] border-[var(--border-light)] focus:border-blue-500 outline-none"
                />
                <button
                  onClick={enviar}
                  disabled={!completo || enviando}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {enviando ? "Registrando..." : "Confirmar"}
                </button>
              </div>
              {/* Diz quanto falta em vez de acusar erro de quem ainda digita. */}
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                {codigo.length}/{TAMANHO} dígitos
              </p>
            </>
          )}

          {erro && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{erro}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
