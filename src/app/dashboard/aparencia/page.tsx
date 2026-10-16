"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import PageHeader from "@/components/ui/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { Palette, Store as StoreIcon, RotateCcw } from "lucide-react";
import { GET_MY_STORES, UPDATE_STORE } from "@/lib/graphql";

/**
 * APARÊNCIA DA LOJA (KAN-13)
 *
 * A loja já escolhia logo e banner; a cor continuava sendo a da plataforma.
 * Para quem tem marca — e quase todo mundo tem, nem que seja a cor do letreiro
 * — a tela do app não parecia a loja dele.
 *
 * DUAS COISAS QUE ESTA TELA FAZ DE PROPÓSITO:
 *
 * 1. PRÉVIA AO VIVO. Escolher cor sem ver o resultado é adivinhação; o lojista
 *    salvaria, abriria o app, não gostaria, e voltaria. A prévia à direita é a
 *    mesma composição da tela de loja no app (cabeçalho, cartão de produto,
 *    botão de comprar).
 *
 * 2. AVISO DE LEGIBILIDADE antes de salvar. O servidor recusa um par
 *    texto/fundo sem contraste (ele tem que recusar: a vitrine ilegível só
 *    seria descoberta pelo cliente). Mas descobrir isso só no "Salvar" é
 *    frustrante — aqui o aviso aparece enquanto a pessoa escolhe.
 */
const PADROES = {
  primaryColor: "#FF6B35",
  backgroundColor: "#FFFFFF",
  textColor: "#2D3436",
};

/** Luminância relativa (WCAG) — a mesma conta do servidor. */
function luminancia(hex: string): number | null {
  const limpo = hex.replace("#", "");
  const cheio = limpo.length === 3 ? limpo.split("").map((c) => c + c).join("") : limpo.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(cheio)) return null;
  const canal = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = [0, 2, 4].map((i) => canal(parseInt(cheio.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number | null {
  const la = luminancia(a);
  const lb = luminancia(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function CampoDeCor({
  rotulo,
  ajuda,
  valor,
  padrao,
  aoMudar,
}: {
  rotulo: string;
  ajuda: string;
  valor: string;
  padrao: string;
  aoMudar: (v: string) => void;
}) {
  const usandoPadrao = !valor;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{rotulo}</label>
        {!usandoPadrao && (
          <button
            onClick={() => aoMudar("")}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <RotateCcw className="h-3 w-3" />
            usar padrão
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valor || padrao}
          onChange={(e) => aoMudar(e.target.value.toUpperCase())}
          className="h-9 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
        />
        <input
          type="text"
          value={valor}
          placeholder={`${padrao} (padrão)`}
          onChange={(e) => aoMudar(e.target.value.toUpperCase())}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm font-mono"
        />
      </div>
      <p className="text-xs text-[var(--text-muted)]">{ajuda}</p>
    </div>
  );
}

export default function AparenciaPage() {
  const { data, error, refetch } = useQuery(GET_MY_STORES);
  const stores = data?.myStores || [];
  const [lojaSelecionada, setLojaSelecionada] = useState("");
  const loja = stores.find((s: any) => s.id === lojaSelecionada) || stores[0];

  const [primaria, setPrimaria] = useState("");
  const [fundo, setFundo] = useState("");
  const [texto, setTexto] = useState("");
  const [layout, setLayout] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const [updateStore, { loading: salvando }] = useMutation(UPDATE_STORE);

  // Quando troca de loja, carrega o que ela já tem.
  useEffect(() => {
    if (!loja) return;
    setPrimaria(loja.primaryColor || "");
    setFundo(loja.backgroundColor || "");
    setTexto(loja.textColor || "");
    setLayout(loja.productLayout || "");
    setMsg("");
    setErro("");
  }, [loja?.id]);

  const corPrimaria = primaria || PADROES.primaryColor;
  const corFundo = fundo || PADROES.backgroundColor;
  const corTexto = texto || PADROES.textColor;

  const razao = useMemo(() => contraste(corFundo, corTexto), [corFundo, corTexto]);
  const ilegivel = razao !== null && razao < 3;

  const salvar = async () => {
    setErro("");
    setMsg("");
    try {
      await updateStore({
        variables: {
          input: {
            id: loja.id,
            // String vazia = voltar ao padrão da plataforma (o servidor
            // transforma em NULL). `undefined` significaria "não mexi".
            primaryColor: primaria,
            backgroundColor: fundo,
            textColor: texto,
            productLayout: layout,
          },
        },
      });
      setMsg("Aparência salva. Quem abrir sua loja no app já vê assim.");
      refetch();
    } catch (err: any) {
      setErro(err?.message || "Não consegui salvar.");
    }
  };

  if (error && !data) {
    return (
      <div>
        <PageHeader title="Aparência" />
        <ErrorState
          title="Não foi possível carregar suas lojas."
          description="Verifique sua conexão e tente novamente."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div>
        <PageHeader title="Aparência" />
        <EmptyState
          icon={Palette}
          title="Crie uma loja primeiro"
          description="A aparência é por loja: cada uma pode ter a própria cara no app."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Aparência"
        description="Como sua loja aparece para o cliente dentro do app."
      />

      {stores.length > 1 && (
        <select
          value={loja?.id || ""}
          onChange={(e) => setLojaSelecionada(e.target.value)}
          className="w-full sm:w-72 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm"
        >
          {stores.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Escolhas */}
        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <CampoDeCor
            rotulo="Cor principal"
            ajuda="Botões, preços e destaques. Normalmente a cor da sua marca."
            valor={primaria}
            padrao={PADROES.primaryColor}
            aoMudar={setPrimaria}
          />
          <CampoDeCor
            rotulo="Fundo"
            ajuda="O fundo das telas da sua loja."
            valor={fundo}
            padrao={PADROES.backgroundColor}
            aoMudar={setFundo}
          />
          <CampoDeCor
            rotulo="Texto"
            ajuda="Nome dos produtos, descrições e preços."
            valor={texto}
            padrao={PADROES.textColor}
            aoMudar={setTexto}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Como mostrar os produtos</label>
            <div className="flex gap-2">
              {[
                { valor: "", titulo: "Padrão", ajuda: "Lista com foto pequena" },
                { valor: "LIST", titulo: "Lista", ajuda: "Mais itens na tela" },
                { valor: "GRID", titulo: "Grade", ajuda: "Foto grande, 2 por linha" },
              ].map((op) => (
                <button
                  key={op.valor || "padrao"}
                  onClick={() => setLayout(op.valor)}
                  className={`flex-1 rounded-lg border p-2.5 text-left text-xs transition ${
                    layout === op.valor
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] bg-[var(--bg-input)]"
                  }`}
                >
                  <span className="block text-sm font-medium">{op.titulo}</span>
                  <span className="block text-[var(--text-muted)]">{op.ajuda}</span>
                </button>
              ))}
            </div>
          </div>

          {ilegivel && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              Esse texto quase some nesse fundo (contraste {razao?.toFixed(1)}:1). O cliente vai
              ter dificuldade para ler sua vitrine — escolha um texto mais escuro ou um fundo
              mais claro.
            </p>
          )}
          {erro && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{erro}</p>}
          {msg && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{msg}</p>
          )}

          <button
            onClick={salvar}
            disabled={salvando || ilegivel}
            className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            title={ilegivel ? "Ajuste o contraste antes de salvar" : undefined}
          >
            {salvando ? "Salvando…" : "Salvar aparência"}
          </button>
        </div>

        {/* Prévia */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="mb-3 text-sm font-medium">Prévia</p>
          <div
            className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[28px] border-[6px] border-[var(--border)] shadow-lg"
            style={{ backgroundColor: corFundo }}
          >
            {/* cabeçalho da loja */}
            <div className="flex items-center gap-2 p-3" style={{ backgroundColor: corPrimaria }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/25">
                <StoreIcon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{loja?.name || "Sua loja"}</p>
                <p className="text-[10px] text-white/80">Aberta agora</p>
              </div>
            </div>

            <div className="space-y-2 p-3">
              <p className="text-xs font-semibold" style={{ color: corTexto }}>
                Mais vendidos
              </p>

              {layout === "GRID" ? (
                <div className="grid grid-cols-2 gap-2">
                  {["Produto A", "Produto B"].map((nome) => (
                    <div
                      key={nome}
                      className="rounded-lg p-2"
                      style={{ backgroundColor: corFundo, border: `1px solid ${corTexto}22` }}
                    >
                      <div
                        className="mb-1.5 h-16 w-full rounded"
                        style={{ backgroundColor: `${corTexto}14` }}
                      />
                      <p className="text-[11px] font-medium" style={{ color: corTexto }}>
                        {nome}
                      </p>
                      <p className="text-[11px] font-bold" style={{ color: corPrimaria }}>
                        R$ 19,90
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                ["Produto A", "Produto B"].map((nome) => (
                  <div
                    key={nome}
                    className="flex items-center gap-2 rounded-lg p-2"
                    style={{ backgroundColor: corFundo, border: `1px solid ${corTexto}22` }}
                  >
                    <div className="flex-1">
                      <p className="text-[11px] font-medium" style={{ color: corTexto }}>
                        {nome}
                      </p>
                      <p className="text-[10px]" style={{ color: `${corTexto}99` }}>
                        Descrição curta do item
                      </p>
                      <p className="text-[11px] font-bold" style={{ color: corPrimaria }}>
                        R$ 19,90
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded" style={{ backgroundColor: `${corTexto}14` }} />
                  </div>
                ))
              )}

              <button
                className="w-full rounded-lg py-2 text-[11px] font-bold text-white"
                style={{ backgroundColor: corPrimaria }}
              >
                Adicionar ao carrinho
              </button>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            Os avisos do app (indisponível, erro, sucesso) mantêm as cores do sistema — eles
            precisam ser reconhecidos na hora.
          </p>
        </div>
      </div>
    </div>
  );
}
