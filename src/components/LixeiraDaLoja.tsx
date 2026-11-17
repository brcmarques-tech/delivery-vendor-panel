"use client";

import { useState } from "react";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { RotateCcw, Trash2, X } from "lucide-react";

/**
 * KAN-326: lixeira de categorias, serviços, cupons e promoções. Nada é apagado
 * de vez na plataforma — o que o lojista exclui fica aqui e pode ser restaurado.
 * (Produtos têm a lixeira própria na tela de Produtos.)
 */
type Tipo = "categorias" | "servicos" | "cupons" | "promocoes";

const CONFIG: Record<Tipo, { titulo: string; vazio: string; query: any; mutation: any; campo: string; restaurar: string; nome: (x: any) => string; detalhe?: (x: any) => string }> = {
  categorias: {
    titulo: "Categorias excluídas",
    vazio: "Nenhuma categoria na lixeira.",
    query: gql`query DeletedCategoriesByStore($storeId: String!) { deletedCategoriesByStore(storeId: $storeId) { id name deletedAt } }`,
    mutation: gql`mutation RestoreCategory($id: String!) { restoreCategory(id: $id) { id } }`,
    campo: "deletedCategoriesByStore",
    restaurar: "Os produtos que estavam nela não voltam sozinhos para a categoria.",
    nome: (x) => x.name,
  },
  servicos: {
    titulo: "Serviços excluídos",
    vazio: "Nenhum serviço na lixeira.",
    query: gql`query DeletedServicesByStore($storeId: String!) { deletedServicesByStore(storeId: $storeId) { id name price deletedAt } }`,
    mutation: gql`mutation RestoreService($id: String!) { restoreService(id: $id) { id } }`,
    campo: "deletedServicesByStore",
    restaurar: "",
    nome: (x) => x.name,
    detalhe: (x) => (x.price != null ? `R$ ${Number(x.price).toFixed(2).replace(".", ",")}` : ""),
  },
  cupons: {
    titulo: "Cupons excluídos",
    vazio: "Nenhum cupom na lixeira.",
    query: gql`query DeletedCouponsByStore($storeId: String!) { deletedCouponsByStore(storeId: $storeId) { id code discountType discountValue deletedAt } }`,
    mutation: gql`mutation RestoreCoupon($id: String!) { restoreCoupon(id: $id) { id } }`,
    campo: "deletedCouponsByStore",
    restaurar: "",
    nome: (x) => x.code,
    detalhe: (x) =>
      x.discountType === "PERCENT" ? `${Number(x.discountValue)}% de desconto` : `R$ ${Number(x.discountValue).toFixed(2).replace(".", ",")} de desconto`,
  },
  promocoes: {
    titulo: "Promoções excluídas",
    vazio: "Nenhuma promoção na lixeira.",
    query: gql`query DeletedPromotionsByStore($storeId: String!) { deletedPromotionsByStore(storeId: $storeId) { id title promotionalPrice deletedAt } }`,
    mutation: gql`mutation RestorePromotion($id: String!) { restorePromotion(id: $id) { id } }`,
    campo: "deletedPromotionsByStore",
    restaurar: "Se ainda estiver no período, o preço promocional volta em alguns minutos.",
    nome: (x) => x.title,
    detalhe: (x) => (x.promotionalPrice != null ? `R$ ${Number(x.promotionalPrice).toFixed(2).replace(".", ",")}` : ""),
  },
};

function dataExclusao(v: any): string {
  if (!v) return "";
  const n = Number(v);
  const d = Number.isNaN(n) ? new Date(v) : new Date(n);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}

export function LixeiraDaLoja({
  tipo,
  lojas,
  lojaInicial,
  onRestaurado,
}: {
  tipo: Tipo;
  lojas: { id: string; name: string }[];
  lojaInicial?: string;
  onRestaurado?: () => void;
}) {
  const cfg = CONFIG[tipo];
  const [aberta, setAberta] = useState(false);
  const [lojaId, setLojaId] = useState(lojaInicial || lojas[0]?.id || "");
  const [erro, setErro] = useState("");
  const [carregar, { data, loading, refetch }] = useLazyQuery(cfg.query, { fetchPolicy: "network-only" });
  const [restaurar, { loading: restaurando }] = useMutation(cfg.mutation);
  const itens: any[] = data?.[cfg.campo] || [];

  const abrir = () => {
    const id = lojaInicial || lojaId;
    setLojaId(id);
    setErro("");
    setAberta(true);
    if (id) carregar({ variables: { storeId: id } });
  };

  const trocarLoja = (id: string) => {
    setLojaId(id);
    carregar({ variables: { storeId: id } });
  };

  const fazerRestaurar = async (id: string) => {
    setErro("");
    try {
      await restaurar({ variables: { id } });
      await refetch?.({ storeId: lojaId });
      onRestaurado?.();
    } catch (e: any) {
      setErro(e?.message || "Não foi possível restaurar.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="px-3 py-2 rounded-xl text-sm font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer transition flex items-center gap-1.5"
      >
        <Trash2 className="h-4 w-4" />
        Lixeira
      </button>

      {aberta && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setAberta(false)}>
          <div
            role="dialog"
            aria-label={cfg.titulo}
            className="bg-[var(--bg-card)] rounded-2xl p-5 w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="h-5 w-5 text-[var(--status-error-text)]" />
              <h3 className="font-bold text-[var(--text-primary)] flex-1">{cfg.titulo}</h3>
              <button aria-label="Fechar" onClick={() => setAberta(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {lojas.length > 1 && (
              <select
                value={lojaId}
                onChange={(e) => trocarLoja(e.target.value)}
                className="w-full mb-3 border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-[var(--bg-input)] text-[var(--text-primary)]"
              >
                {lojas.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            {cfg.restaurar && <p className="text-xs text-[var(--text-muted)] mb-3">{cfg.restaurar}</p>}
            {erro && <p className="text-sm text-[var(--status-error-text)] bg-[var(--status-error-bg)] rounded-lg px-3 py-2 mb-3">{erro}</p>}

            {loading ? (
              <p className="text-[var(--text-muted)] text-sm">Carregando...</p>
            ) : itens.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm">{cfg.vazio}</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {itens.map((x) => (
                  <div key={x.id} className="flex items-center gap-3 p-3 bg-[var(--status-error-bg)]/50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-secondary)] truncate">{cfg.nome(x)}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {[cfg.detalhe?.(x), x.deletedAt ? `excluído em ${dataExclusao(x.deletedAt)}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button
                      onClick={() => fazerRestaurar(x.id)}
                      disabled={restaurando}
                      className="px-4 py-2 bg-[var(--status-success-text)] text-white rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
