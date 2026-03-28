"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { REGISTER, VALIDATE_REGISTRATION, SEND_VERIFICATION_CODE, VERIFY_CODE, GOOGLE_AUTH_VENDOR, REGISTER_VENDOR_WITH_GOOGLE } from "@/lib/graphql";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { apolloClient } from "@/lib/apollo";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const VENDOR_CONTRACT = `TERMOS DE USO DA PLATAFORMA BCM TECH SHOPPING (VENDEDOR)
Ultima atualizacao: Marco de 2026

Estes Termos regulam o uso da plataforma bcmTech Shopping por Vendedores (estabelecimentos comerciais).

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
3.2. Pagamentos processados pelo Pagar.me, intermediador autorizado pelo Banco Central do Brasil.

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

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function formatPhoneDisplay(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return phone;
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
      <div class="header"><h1>bcmTech Shopping</h1></div>
      <div class="signee">
        <div class="signee-label">PARTE CONTRATANTE / ASSINANTE:</div>
        <div class="signee-name">${userName}</div>
        <div class="signee-info">CPF: ${formatCpfDisplay(userCpf)}</div>
        <div class="signee-info">Telefone: ${userPhone}</div>
      </div>
      <div class="contract">${VENDOR_CONTRACT}</div>
      <div class="footer">Contrato aceito digitalmente em ${dateStr} na plataforma bcmTech Shopping.</div>
    </body></html>
  `;
}

// Step indicator component
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { label: "Dados", icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
    { label: "Verificacao", icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" },
    { label: "Contrato", icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-8 h-0.5 ${done ? "bg-green-500" : "bg-gray-200"}`} />
            )}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${done ? "bg-green-500 text-white" : active ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400"}`}
              >
                {done ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : stepNum}
              </div>
              <span className={`text-[10px] mt-1 ${active ? "text-orange-500 font-semibold" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
  const [registerMutation, { loading }] = useMutation(REGISTER);
  const router = useRouter();

  // OTP state
  const [fieldErrors, setFieldErrors] = useState<{ emailError?: string; cpfError?: string; phoneError?: string }>({});
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [validateRegistration] = useMutation(VALIDATE_REGISTRATION);
  const [sendVerificationCode] = useMutation(SEND_VERIFICATION_CODE);
  const [verifyCodeMutation] = useMutation(VERIFY_CODE);
  const [googleAuth] = useMutation(GOOGLE_AUTH_VENDOR);
  const [registerWithGoogle] = useMutation(REGISTER_VENDOR_WITH_GOOGLE);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState("");

  const handleGoogleResponse = useCallback(async (response: any) => {
    setError("");
    setGoogleLoading(true);
    try {
      const { data } = await googleAuth({ variables: { idToken: response.credential } });
      const user = data.googleAuthVendor.user;
      if (user.role !== "VENDOR") {
        setError("Sua conta esta aguardando aprovacao do administrador.");
        setGoogleLoading(false);
        return;
      }
      localStorage.setItem("token", data.googleAuthVendor.accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      await apolloClient.resetStore();
      router.replace("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "";
      // Extract name/email from Google JWT to pre-fill the form
      try {
        const payload = JSON.parse(atob(response.credential.split(".")[1]));
        if (payload.name) setName(payload.name);
        if (payload.email) setEmail(payload.email);
      } catch {}
      if (msg.includes("GOOGLE_NO_ACCOUNT")) {
        setGoogleIdToken(response.credential);
        setError("Nenhuma conta encontrada com este email Google. Complete o cadastro abaixo.");
      } else {
        setError("Erro ao entrar com Google. Tente novamente.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [googleAuth, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

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

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validateCpf(cpf)) {
      setError("CPF invalido");
      return;
    }
    if (!googleIdToken) {
      if (password !== confirmPassword) {
        setError("As senhas nao coincidem");
        return;
      }
      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres");
        return;
      }
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError("Telefone invalido. Use DDD + numero");
      return;
    }
    // Valida email, CPF e telefone no servidor antes de enviar codigo
    setOtpSending(true);
    setFieldErrors({});
    try {
      const { data: valData } = await validateRegistration({
        variables: { email, cpf: cpf.replace(/\D/g, ""), phone: phoneDigits, userType: "vendor" },
      });
      const result = valData?.validateRegistration;
      if (result && !result.valid) {
        setFieldErrors({
          emailError: result.emailError || undefined,
          cpfError: result.cpfError || undefined,
          phoneError: result.phoneError || undefined,
        });
        setOtpSending(false);
        return;
      }
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || "Erro na validacao";
      setError(msg);
      setOtpSending(false);
      return;
    }
    setOtpSending(false);
    await sendOtp();
  }

  async function sendOtp() {
    setOtpSending(true);
    setError("");
    try {
      await sendVerificationCode({
        variables: { input: { value: phone.replace(/\D/g, ""), channel: "whatsapp" } },
      });
      setStep(2);
      setResendTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || "Erro ao enviar codigo";
      setError(msg);
    } finally {
      setOtpSending(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) value = value[value.length - 1];
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, key: string) {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp() {
    const code = otpDigits.join("");
    if (code.length !== 6) return;
    setOtpVerifying(true);
    setError("");
    try {
      await verifyCodeMutation({
        variables: { input: { value: phone.replace(/\D/g, ""), code, channel: "whatsapp" } },
      });
      setStep(3);
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || "Codigo incorreto";
      setError(msg);
    } finally {
      setOtpVerifying(false);
    }
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.8) {
      setScrolledToEnd(true);
    }
  }

  function handleDownloadPdf() {
    const html = buildContractHtml(name, cpf.replace(/\D/g, ""), phone);
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
      if (googleIdToken) {
        await registerWithGoogle({
          variables: {
            idToken: googleIdToken,
            phone: phone.replace(/\D/g, ""),
            cpf: cpf.replace(/\D/g, ""),
          },
        });
        setSuccess(true);
      } else {
        await registerMutation({
          variables: {
            input: { name, email, password, phone: phone.replace(/\D/g, ""), cpf: cpf.replace(/\D/g, "") },
          },
        });
        setSuccess(true);
      }
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || "";
      setError(msg || "Erro ao criar conta. Tente novamente.");
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#22c55e" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
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
      <div className="min-h-screen flex">
        {/* Left side - branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 items-center justify-center p-12">
          <div className="text-center text-white max-w-md">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">bcmTech Shopping</h1>
            <p className="text-lg text-white/80 mb-8">
              Cadastre sua loja e comece a vender para milhares de clientes.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span>Painel completo para gerenciar pedidos</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span>Pagamentos via Pagar.me</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span>Notificacoes em tempo real</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - form */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
            <StepIndicator current={1} />

            <h1 className="text-3xl font-bold text-center text-orange-500 mb-2">Shopping</h1>
            <p className="text-gray-500 text-center mb-6">Cadastro de Vendedor</p>

            <form onSubmit={handleNext} className="space-y-3">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
              )}

              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={!!googleIdToken}
                tabIndex={googleIdToken ? -1 : undefined}
                className={`w-full px-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 ${googleIdToken ? "bg-gray-200 cursor-not-allowed pointer-events-none select-none" : "bg-gray-100"}`}
                required
              />
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, emailError: undefined })); }}
                  readOnly={!!googleIdToken}
                  tabIndex={googleIdToken ? -1 : undefined}
                  className={`w-full px-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 ${googleIdToken ? "bg-gray-200 cursor-not-allowed pointer-events-none select-none" : fieldErrors.emailError ? "ring-2 ring-red-400 bg-red-50" : "bg-gray-100 focus:ring-orange-500"}`}
                  required
                />
                {fieldErrors.emailError && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.emailError}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="(DD) 99999-9999"
                  value={phone}
                  onChange={(e) => { setPhone(formatPhone(e.target.value)); setFieldErrors(f => ({ ...f, phoneError: undefined })); }}
                  maxLength={15}
                  className={`w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 ${fieldErrors.phoneError ? "ring-2 ring-red-400 bg-red-50" : "focus:ring-orange-500"}`}
                  required
                />
                {fieldErrors.phoneError && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.phoneError}</p>}
              </div>
              <div>
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
                    setFieldErrors(f => ({ ...f, cpfError: undefined }));
                  }}
                  className={`w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 ${fieldErrors.cpfError ? "ring-2 ring-red-400 bg-red-50" : "focus:ring-orange-500"}`}
                  required
                />
                {fieldErrors.cpfError && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.cpfError}</p>}
              </div>
              {!googleIdToken && (
                <>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha (min. 6 caracteres)"
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
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        ) : (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </>
                        )}
                      </svg>
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
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        {showConfirm ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        ) : (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={otpSending}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-40 transition"
              >
                {otpSending ? "Enviando codigo..." : "Continuar"}
              </button>
            </form>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400">ou</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if ((window as any).google) {
                      (window as any).google.accounts.id.prompt();
                    }
                  }}
                  disabled={googleLoading}
                  className="w-full py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40 transition cursor-pointer"
                >
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Cadastrar com Google
                </button>
                {googleLoading && (
                  <p className="text-center text-sm text-gray-500 mt-2">Entrando com Google...</p>
                )}
                <Script
                  src="https://accounts.google.com/gsi/client"
                  strategy="afterInteractive"
                  onLoad={() => {
                    if ((window as any).google) {
                      (window as any).google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: handleGoogleResponse,
                        auto_select: false,
                      });
                    }
                  }}
                />
              </>
            )}

            <p className="text-center text-gray-500 mt-6 text-sm">
              Ja tem conta?{" "}
              <a href="/" className="text-orange-500 font-semibold hover:underline">
                Fazer login
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: WhatsApp verification
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <StepIndicator current={2} />

          <button
            onClick={() => setStep(1)}
            className="absolute left-4 top-4 text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-green-500 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifique seu WhatsApp</h2>
          <p className="text-gray-500 mb-8">
            Enviamos um codigo de 6 digitos para<br />
            <span className="font-semibold text-gray-800">{formatPhoneDisplay(phone.replace(/\D/g, ""))}</span>
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          <div className="flex gap-3 justify-center mb-8">
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e.key)}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none transition
                  ${digit ? "border-orange-500 bg-orange-50 text-gray-800" : "border-gray-200 bg-gray-50 text-gray-800"}
                  focus:border-orange-500`}
              />
            ))}
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={otpVerifying || otpDigits.join("").length !== 6}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-40 transition mb-4"
          >
            {otpVerifying ? "Verificando..." : "Verificar"}
          </button>

          <button
            onClick={sendOtp}
            disabled={resendTimer > 0 || otpSending}
            className="text-orange-500 font-semibold text-sm cursor-pointer hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {resendTimer > 0 ? `Reenviar codigo em ${resendTimer}s` : "Reenviar codigo"}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Contract
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl flex flex-col overflow-y-auto" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 text-center relative">
          <StepIndicator current={3} />
          <button
            onClick={() => { setStep(2); setScrolledToEnd(false); setChecked(false); }}
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
        <div className="flex-1 overflow-y-auto p-6" onScroll={handleScroll}>
          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase">Parte Contratante / Assinante:</p>
            <p className="text-base font-semibold text-gray-800">{name}</p>
            <p className="text-sm text-gray-500">CPF: {formatCpfDisplay(cpf)}</p>
            <p className="text-sm text-gray-500">Telefone: {formatPhoneDisplay(phone.replace(/\D/g, ""))}</p>
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
          <button
            onClick={handleDownloadPdf}
            className="w-full py-2.5 mb-3 border border-orange-500 text-orange-500 rounded-xl font-semibold text-sm hover:bg-orange-50 cursor-pointer flex items-center justify-center gap-2 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Baixar contrato em PDF
          </button>
          <label className={`flex items-start gap-3 mb-4 ${!scrolledToEnd ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}>
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
