"use client";

import { useState, useRef, UIEvent } from "react";
import { useMutation } from "@apollo/client";
import { REGISTER } from "@/lib/graphql";
import { useRouter } from "next/navigation";

const VENDOR_CONTRACT = `TERMOS DE USO DA PLATAFORMA BCM TECH DELIVERY (VENDEDOR)
Ultima atualizacao: Marco de 2026

Estes Termos regulam o uso da plataforma bcmTech Delivery por Vendedores (estabelecimentos comerciais).

Operada por BCM TECH, inscrita no CNPJ sob o n. 59.858.037/0001-06, com sede na Avenida Nossa Senhora da Graca, 19, Centro, CEP 96330-000, Arroio Grande - RS.

1. OBJETO
1.1. A Plataforma e um marketplace que conecta vendedores a consumidores finais.
1.2. A Empresa atua como intermediaria tecnologica.

2. RESPONSABILIDADES DO VENDEDOR
2.1. Qualidade, seguranca e legalidade dos produtos anunciados.
2.2. Cumprimento do CDC, normas sanitarias e fiscais.
2.3. Veracidade das informacoes dos produtos.
2.4. Emissao de nota fiscal conforme legislacao.
2.5. Preparo dos pedidos dentro do prazo informado.

3. PAGAMENTOS E COMISSOES
3.1. A Empresa cobra comissao conforme o plano contratado.
3.2. Pagamentos processados pelo Mercado Pago, intermediador autorizado pelo Banco Central do Brasil.

4. PROTECAO DE DADOS (LGPD)
4.1. Os dados pessoais sao tratados conforme a Lei 13.709/2018 (LGPD).
4.2. O Vendedor pode exercer seus direitos pelo e-mail bcmtechdev@gmail.com.

5. LIMITACAO DE RESPONSABILIDADE
5.1. A Empresa nao garante disponibilidade ininterrupta da Plataforma.
5.2. A Empresa nao se responsabiliza por prejuizos decorrentes de informacoes incorretas fornecidas pelo Vendedor.

6. DISPOSICOES GERAIS
6.1. Estes Termos sao regidos pela legislacao brasileira.
6.2. Foro: comarca de Arroio Grande - RS.
6.3. A Empresa pode alterar estes Termos, notificando o Vendedor pela Plataforma.

Ao aceitar, voce manifesta seu consentimento livre, informado e inequivoco com todos os termos acima.`;

function formatCpfDisplay(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function buildContractHtml(userName: string, userCpf: string, userPhone: string) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return `
    <html><head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
      .header { background: #F97316; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
      .header h1 { color: white; margin: 0; font-size: 22px; }
      .signee { background: #f5f5f5; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
      .signee-label { font-size: 10px; color: #888; font-weight: 600; margin-bottom: 6px; }
      .signee-name { font-size: 16px; font-weight: 600; }
      .signee-info { font-size: 13px; color: #666; margin-top: 2px; }
      .contract { font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
      .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
    </style></head><body>
      <div class="header"><h1>bcmTech Delivery</h1></div>
      <div class="signee">
        <div class="signee-label">PARTE CONTRATANTE / ASSINANTE:</div>
        <div class="signee-name">${userName}</div>
        <div class="signee-info">CPF: ${formatCpfDisplay(userCpf)}</div>
        <div class="signee-info">Telefone: ${userPhone}</div>
      </div>
      <div class="contract">${VENDOR_CONTRACT}</div>
      <div class="footer">Contrato aceito digitalmente em ${dateStr} na plataforma bcmTech Delivery.</div>
    </body></html>
  `;
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  const [register, { loading }] = useMutation(REGISTER);
  const router = useRouter();

  function validateCpf(value: string): boolean {
    const d = value.replace(/\D/g, "");
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
    let c = 11 - (s % 11); if (c >= 10) c = 0;
    if (parseInt(d[9]) !== c) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
    c = 11 - (s % 11); if (c >= 10) c = 0;
    return parseInt(d[10]) === c;
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validateCpf(cpf)) {
      setError("CPF invalido");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas nao coincidem");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setStep(2);
  }

  function handleScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.8) {
      setScrolledToEnd(true);
    }
  }

  function handleDownloadPdf() {
    const html = buildContractHtml(name, cpf.replace(/\D/g, ""), phone);
    const blob = new Blob([html], { type: "text/html" });
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  }

  async function handleAcceptAndRegister() {
    setError("");
    try {
      await register({
        variables: {
          input: { name, email, password, phone, cpf: cpf.replace(/\D/g, "") },
        },
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || "";
      setError(msg || "Erro ao criar conta. Tente novamente.");
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <div className="text-5xl mb-4">&#9203;</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cadastro enviado!</h2>
          <p className="text-gray-500 mb-6">
            Sua solicitacao para ser vendedor foi enviada e esta aguardando aprovacao do administrador.
            Voce sera notificado quando sua conta for aprovada.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Form
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-orange-500 mb-2">Delivery</h1>
          <p className="text-gray-500 text-center mb-8">Cadastro de Vendedor</p>

          <form onSubmit={handleNext} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
            )}

            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="tel"
              placeholder="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="text"
              placeholder="CPF"
              value={cpf}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                const formatted = v.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_: string, a: string, b?: string, c?: string, d?: string) =>
                  [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
                );
                setCpf(formatted);
              }}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition"
            >
              Continuar
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Ja tem conta?{" "}
            <a href="/" className="text-orange-500 font-semibold hover:underline">
              Fazer login
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Contract
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 text-center relative">
          <button
            onClick={() => { setStep(1); setScrolledToEnd(false); setChecked(false); }}
            className="absolute left-4 top-6 text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="text-orange-500 text-3xl mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Termos de Uso (Vendedor)</h2>
          <p className="text-sm text-gray-500 mt-1">Leia o contrato antes de finalizar o cadastro</p>
        </div>

        {/* Scrollable contract */}
        <div
          className="flex-1 overflow-y-auto p-6"
          onScroll={handleScroll}
        >
          {/* Signee info */}
          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase">Parte Contratante / Assinante:</p>
            <p className="text-base font-semibold text-gray-800">{name}</p>
            <p className="text-sm text-gray-500">CPF: {formatCpfDisplay(cpf)}</p>
            <p className="text-sm text-gray-500">Telefone: {phone}</p>
          </div>

          <pre className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">
            {VENDOR_CONTRACT}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          {!scrolledToEnd && (
            <p className="text-xs text-orange-500 font-semibold text-center mb-3">
              Role ate o final do contrato para poder aceitar.
            </p>
          )}

          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            className="w-full py-2.5 mb-3 border border-orange-500 text-orange-500 rounded-xl font-semibold text-sm hover:bg-orange-50 cursor-pointer flex items-center justify-center gap-2 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Baixar contrato em PDF
          </button>

          {/* Checkbox */}
          <label
            className={`flex items-start gap-3 mb-4 ${!scrolledToEnd ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => setChecked(!checked)}
              className="mt-1 w-5 h-5 accent-orange-500"
              disabled={!scrolledToEnd}
            />
            <span className="text-sm text-gray-700 leading-snug">
              Li e aceito os Termos de Uso da Plataforma e estou ciente das minhas responsabilidades como vendedor.
            </span>
          </label>

          {/* Submit */}
          <button
            onClick={handleAcceptAndRegister}
            disabled={!checked || !scrolledToEnd || loading}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-40 transition"
          >
            {loading ? "Cadastrando..." : "Aceitar e Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
