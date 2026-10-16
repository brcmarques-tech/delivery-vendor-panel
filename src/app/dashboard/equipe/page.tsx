"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import PageHeader from "@/components/ui/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { Users, Mail, ShieldCheck, Trash2 } from "lucide-react";
import {
  GET_MY_STORES,
  EQUIPE_DA_LOJA,
  CONVIDAR_MEMBRO,
  ATUALIZAR_MEMBRO,
  REVOGAR_MEMBRO,
} from "@/lib/graphql";

/**
 * EQUIPE DA LOJA (KAN-82)
 *
 * Existe porque hoje a loja tem UMA conta: na prática o dono passa a senha
 * para o atendente que despacha pedidos — e com ela vão os recebimentos, os
 * dados bancários e o poder de apagar a loja.
 *
 * A tela foi escrita para o dono entender o que está liberando SEM precisar
 * saber o que é "permissão": cada módulo tem uma frase do que a pessoa poderá
 * fazer, e os dois mais perigosos (Recebimentos e Configurações) são marcados.
 */
const MODULOS: { chave: string; titulo: string; descricao: string; perigo?: boolean }[] = [
  { chave: "ORDERS", titulo: "Pedidos", descricao: "Ver, aceitar, preparar e despachar pedidos." },
  { chave: "PRODUCTS", titulo: "Produtos", descricao: "Criar, editar e remover produtos e categorias." },
  { chave: "PROMOTIONS", titulo: "Promoções", descricao: "Criar e gerenciar campanhas (gera custo de anúncio)." },
  { chave: "COUPONS", titulo: "Cupons", descricao: "Criar cupons de desconto — sai do faturamento da loja." },
  { chave: "REPORTS", titulo: "Relatórios", descricao: "Ver analytics e números de venda." },
  {
    chave: "EARNINGS",
    titulo: "Recebimentos",
    descricao: "Ver o dinheiro da loja, estornar pedidos e pedir antecipação.",
    perigo: true,
  },
  {
    chave: "SETTINGS",
    titulo: "Configurações",
    descricao: "Editar dados da loja, horários e entrega.",
    perigo: true,
  },
];

const PAPEIS = [
  { valor: "EMPLOYEE", titulo: "Funcionário", descricao: "Acessa só os módulos liberados." },
  { valor: "MANAGER", titulo: "Gerente", descricao: "Os módulos liberados + convidar e remover gente." },
];

export default function EquipePage() {
  const { data: storesData, error: storesError, refetch: refetchStores } = useQuery(GET_MY_STORES);
  const stores = storesData?.myStores || [];
  const [lojaSelecionada, setLojaSelecionada] = useState("");
  const storeId = lojaSelecionada || stores[0]?.id || "";

  const { data, error, refetch } = useQuery(EQUIPE_DA_LOJA, {
    variables: { storeId },
    skip: !storeId,
  });

  const [convidar, { loading: convidando }] = useMutation(CONVIDAR_MEMBRO);
  const [atualizar] = useMutation(ATUALIZAR_MEMBRO);
  const [revogar] = useMutation(REVOGAR_MEMBRO);

  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("EMPLOYEE");
  const [selecionados, setSelecionados] = useState<string[]>(["ORDERS"]);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const membros = data?.equipeDaLoja || [];
  const ativos = membros.filter((m: any) => !m.revokedAt);
  const revogados = membros.filter((m: any) => m.revokedAt);

  const alternar = (chave: string) =>
    setSelecionados((atual) =>
      atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave],
    );

  const enviarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setAviso("");
    if (!email.trim()) return setErro("Informe o e-mail de quem você quer convidar.");
    if (selecionados.length === 0) return setErro("Escolha pelo menos um módulo.");
    try {
      await convidar({
        variables: { storeId, email: email.trim(), role: papel, permissions: selecionados },
      });
      setAviso(`Convite enviado para ${email.trim()}. Ele vale por 7 dias.`);
      setEmail("");
      setSelecionados(["ORDERS"]);
      refetch();
    } catch (err: any) {
      setErro(err?.message || "Não consegui enviar o convite.");
    }
  };

  const mudarPermissoes = async (membro: any, chave: string) => {
    const novas = membro.permissions.includes(chave)
      ? membro.permissions.filter((p: string) => p !== chave)
      : [...membro.permissions, chave];
    if (novas.length === 0) {
      setErro("Um membro precisa de pelo menos um módulo. Para tirar tudo, remova o acesso.");
      return;
    }
    setErro("");
    try {
      await atualizar({ variables: { membroId: membro.id, permissions: novas, role: membro.role } });
      refetch();
    } catch (err: any) {
      setErro(err?.message || "Não consegui atualizar as permissões.");
    }
  };

  const removerAcesso = async (membro: any) => {
    // Sem confirmação dupla: é reversível (basta convidar de novo) e o aviso
    // em texto já diz o que acontece. Confirmação para tudo treina o usuário a
    // clicar em "sim" sem ler.
    setErro("");
    try {
      await revogar({ variables: { membroId: membro.id } });
      refetch();
    } catch (err: any) {
      setErro(err?.message || "Não consegui remover o acesso.");
    }
  };

  if (storesError && !storesData) {
    return (
      <div>
        <PageHeader title="Equipe" />
        <ErrorState
          title="Não foi possível carregar suas lojas."
          description="Verifique sua conexão e tente novamente."
          onRetry={() => refetchStores()}
        />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div>
        <PageHeader title="Equipe" />
        <EmptyState
          icon={Users}
          title="Crie uma loja primeiro"
          description="A equipe é por loja: cada pessoa recebe acesso à loja em que vai trabalhar."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Equipe" description="Cada pessoa com a própria conta, só no que você liberar." />

      {stores.length > 1 && (
        <select
          value={storeId}
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

      {error && (
        <ErrorState
          title="Não foi possível carregar a equipe."
          description={error.message}
          onRetry={() => refetch()}
        />
      )}
      {erro && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{erro}</p>
      )}
      {aviso && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{aviso}</p>
      )}

      {/* Convite */}
      <form
        onSubmit={enviarConvite}
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[var(--text-muted)]" />
          <h2 className="font-semibold">Convidar alguém</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@dapessoa.com"
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm"
          />
          <select
            value={papel}
            onChange={(e) => setPapel(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm"
          >
            {PAPEIS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.titulo} — {p.descricao}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {MODULOS.map((m) => {
            const marcado = selecionados.includes(m.chave);
            return (
              <label
                key={m.chave}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${
                  marcado
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-[var(--border)] bg-[var(--bg-input)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternar(m.chave)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-medium">
                    {m.titulo}
                    {m.perigo && (
                      <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                        sensível
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-[var(--text-muted)]">{m.descricao}</span>
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={convidando}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {convidando ? "Enviando…" : "Enviar convite"}
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          A pessoa recebe um e-mail e precisa <strong>aceitar</strong> com a conta dela. Nada é
          liberado antes disso.
        </p>
      </form>

      {/* Membros */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-[var(--text-muted)]" />
          <h2 className="font-semibold">Quem tem acesso</h2>
        </div>

        {ativos.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Só você. Convide alguém acima para dividir o trabalho sem dividir a sua senha.
          </p>
        ) : (
          <div className="space-y-3">
            {ativos.map((m: any) => (
              <div key={m.id} className="rounded-lg border border-[var(--border)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {m.member?.name || m.memberEmail}{" "}
                      <span className="text-xs text-[var(--text-muted)]">
                        ({m.role === "MANAGER" ? "gerente" : "funcionário"})
                      </span>
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {m.acceptedAt
                        ? `aceitou em ${new Date(m.acceptedAt).toLocaleDateString("pt-BR")}`
                        : "convite pendente — ainda sem acesso"}
                    </p>
                  </div>
                  <button
                    onClick={() => removerAcesso(m)}
                    className="flex items-center gap-1 rounded-lg border border-red-500/40 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover acesso
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MODULOS.map((mod) => {
                    const tem = m.permissions.includes(mod.chave);
                    return (
                      <button
                        key={mod.chave}
                        onClick={() => mudarPermissoes(m, mod.chave)}
                        className={`rounded-full px-2.5 py-1 text-xs transition ${
                          tem
                            ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                            : "bg-[var(--bg-input)] text-[var(--text-muted)]"
                        }`}
                        title={mod.descricao}
                      >
                        {tem ? "✓ " : ""}
                        {mod.titulo}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {revogados.length > 0 && (
          <div className="mt-4 border-t border-[var(--border)] pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Acessos encerrados
            </p>
            {revogados.map((m: any) => (
              <p key={m.id} className="text-xs text-[var(--text-muted)]">
                {m.memberEmail} — até {new Date(m.revokedAt).toLocaleDateString("pt-BR")}
              </p>
            ))}
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              O histórico fica aqui de propósito: é a resposta para “quem tinha acesso quando
              isso aconteceu?”.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
