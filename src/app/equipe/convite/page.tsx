"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { ACEITAR_CONVITE } from "@/lib/graphql";
import { ShieldCheck, LogIn } from "lucide-react";

/**
 * ACEITAR CONVITE DE EQUIPE (KAN-82)
 *
 * O link do e-mail cai aqui. Três situações, e a tela trata as três:
 *
 *   1. a pessoa já está logada com a conta convidada -> aceita e entra;
 *   2. não está logada -> manda logar/criar conta e VOLTA para cá com o token
 *      preservado (perder o token no caminho é perder o convite);
 *   3. está logada com OUTRA conta -> o servidor recusa, e a tela explica em
 *      vez de mostrar "erro".
 */
function Conteudo() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [aceitar] = useMutation(ACEITAR_CONVITE);
  const [estado, setEstado] = useState<"verificando" | "semLogin" | "ok" | "erro">("verificando");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("erro");
      setMensagem("O link do convite está incompleto. Peça um novo ao dono da loja.");
      return;
    }
    const logado = typeof window !== "undefined" && !!localStorage.getItem("token");
    if (!logado) {
      setEstado("semLogin");
      return;
    }
    aceitar({ variables: { token } })
      .then(() => {
        setEstado("ok");
        setTimeout(() => router.push("/dashboard"), 1800);
      })
      .catch((err: any) => {
        setEstado("erro");
        setMensagem(err?.message || "Não consegui aceitar este convite.");
      });
  }, [token, aceitar, router]);

  const irParaLogin = () => {
    // O token volta junto: sem isso, logar significa perder o convite e ter
    // que pedir outro.
    sessionStorage.setItem("conviteDeEquipe", token);
    router.push(`/?next=${encodeURIComponent(`/equipe/convite?token=${token}`)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center space-y-4">
        <ShieldCheck className="mx-auto h-10 w-10 text-[var(--primary)]" />
        <h1 className="text-lg font-bold">Convite para equipe</h1>

        {estado === "verificando" && (
          <p className="text-sm text-[var(--text-muted)]">Validando seu convite…</p>
        )}

        {estado === "semLogin" && (
          <>
            <p className="text-sm text-[var(--text-muted)]">
              Entre com a conta do e-mail que recebeu o convite — ou crie uma com esse mesmo
              e-mail. O convite fica guardado.
            </p>
            <button
              onClick={irParaLogin}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              <LogIn className="h-4 w-4" />
              Entrar e aceitar
            </button>
          </>
        )}

        {estado === "ok" && (
          <p className="text-sm text-emerald-400">
            Pronto! Você agora faz parte da equipe. Levando você ao painel…
          </p>
        )}

        {estado === "erro" && (
          <>
            <p className="text-sm text-red-400">{mensagem}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            >
              Ir para o painel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConvitePage() {
  // useSearchParams exige Suspense no App Router.
  return (
    <Suspense fallback={<div className="p-6 text-sm">Carregando…</div>}>
      <Conteudo />
    </Suspense>
  );
}
