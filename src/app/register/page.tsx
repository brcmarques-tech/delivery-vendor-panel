"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { REGISTER, VALIDATE_REGISTRATION, SEND_VERIFICATION_CODE, VERIFY_CODE, GOOGLE_AUTH_VENDOR, REGISTER_VENDOR_WITH_GOOGLE } from "@/lib/graphql";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { apolloClient } from "@/lib/apollo";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, EyeOff, Eye, ChevronLeft, FileText, Download, Package, CreditCard, MapPin, Store, BarChart3, Trophy, Mail } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const spring = { type: "spring" as const, stiffness: 80, damping: 20 };

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
};
const staggerItem = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: spring },
};

const featuresContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.4 } },
};
const featureItem = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: spring },
};

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
              <div className={`w-8 h-0.5 ${done ? "bg-green-500" : "bg-[var(--border-color)]"}`} />
            )}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${done ? "bg-green-500 text-white" : active ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--border-color)] text-[var(--text-muted)]"}`}
              >
                {done ? (
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                ) : stepNum}
              </div>
              <span className={`text-[10px] mt-1 ${active ? "text-[var(--brand-primary)] font-semibold" : "text-[var(--text-muted)]"}`}>
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
  const [otpMethod, setOtpMethod] = useState<"whatsapp" | "email">("whatsapp");
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
      const { data: otpData } = await sendVerificationCode({
        variables: { input: { value: phone.replace(/\D/g, ""), channel: "whatsapp", fallbackEmail: email } },
      });
      const method = otpData?.sendVerificationCode;
      setOtpMethod(method === "email" ? "email" : "whatsapp");
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
        // Se o WhatsApp falhou e o codigo saiu pelo fallback de e-mail, ele foi
        // gravado sob a chave do e-mail: conferir pelo telefone dava sempre
        // "Codigo nao encontrado" e o cadastro nao passava daqui.
        variables: {
          input: otpMethod === "email"
            ? { value: email, code, channel: "email" }
            : { value: phone.replace(/\D/g, ""), code, channel: "whatsapp" },
        },
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[var(--brand-primary)]/20 rounded-full blur-3xl" animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.95, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" animate={{ x: [0, -15, 20, 0], y: [0, 15, -20, 0], scale: [1, 0.95, 1.05, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <div className="relative z-10 w-full max-w-md px-4">
        <motion.div className="flex flex-col items-center mb-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}>
          <img src="/logo.svg" alt="Shopping" className="w-56 drop-shadow-lg" />
        </motion.div>
        <motion.div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl w-full text-center" initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...spring, delay: 0.3 }}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" strokeWidth={2} stroke="#22c55e" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">Cadastro enviado!</h2>
          <p className="text-[var(--text-muted)] mb-6">
            Sua solicitacao para ser vendedor foi enviada e esta aguardando aprovacao do administrador.
            Voce sera notificado quando sua conta for aprovada.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] active:scale-[0.98] transition"
          >
            Voltar ao login
          </button>
        </motion.div>
        </div>
      </div>
    );
  }

  // Step 1: Form
  if (step === 1) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background blobs */}
        <motion.div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[var(--brand-primary)]/20 rounded-full blur-3xl" animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.95, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" animate={{ x: [0, -15, 20, 0], y: [0, 15, -20, 0], scale: [1, 0.95, 1.05, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />

        {/* Logo top */}
        <motion.div className="flex flex-col items-center pt-8 pb-4" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}>
          <img src="/logo.svg" alt="Shopping" className="w-64 drop-shadow-lg" />
        </motion.div>

        <div className="flex gap-6 max-w-6xl mx-auto px-4 pb-8">
          {/* Left: Features panel */}
          <motion.div className="hidden lg:flex lg:w-[380px] flex-shrink-0" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.3 }}>
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 w-full">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">BCM Tech Shopping AG</h2>
              <p className="text-slate-400 text-sm mb-6">Plataforma Completa de Marketplace Multi-Vendedor</p>
              <motion.div className="space-y-4" variants={featuresContainer} initial="hidden" animate="show">
                <motion.div className="flex items-center gap-3" variants={featureItem}>
                  <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-slate-300 text-sm">80+ Funcionalidades integradas</span>
                </motion.div>
                <motion.div className="flex items-center gap-3" variants={featureItem}>
                  <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-300 text-sm">Split Payment automatico com Pagar.me</span>
                </motion.div>
                <motion.div className="flex items-center gap-3" variants={featureItem}>
                  <div className="w-9 h-9 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-slate-300 text-sm">Rastreamento em tempo real de entregas</span>
                </motion.div>
                <motion.div className="flex items-center gap-3" variants={featureItem}>
                  <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-slate-300 text-sm">Multi-loja: gerencie varias lojas em um so lugar</span>
                </motion.div>
                <motion.div className="flex items-center gap-3" variants={featureItem}>
                  <div className="w-9 h-9 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-slate-300 text-sm">Analytics completo com dashboard avancado</span>
                </motion.div>
                <motion.div className="flex items-center gap-3" variants={featureItem}>
                  <div className="w-9 h-9 bg-[var(--brand-primary)]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-slate-300 text-sm">Sistema de gamificacao com badges e recompensas</span>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Form card */}
          <motion.div className="flex-1 flex items-start justify-center" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.4 }}>
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <StepIndicator current={1} />

            <h1 className="text-xl md:text-2xl font-bold text-center text-[var(--brand-primary)] mb-1">Shopping</h1>
            <p className="text-[var(--text-muted)] text-center text-sm mb-6">Cadastro de Vendedor</p>

            <motion.form onSubmit={handleNext} className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
              {error && (
                <motion.div variants={staggerItem} className="bg-[var(--status-error-bg)] text-[var(--status-error-text)] p-3 rounded-xl text-sm">{error}</motion.div>
              )}

              <motion.div variants={staggerItem}>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!!googleIdToken}
                  tabIndex={googleIdToken ? -1 : undefined}
                  className={`w-full px-4 py-3 rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] ${googleIdToken ? "bg-[var(--bg-muted)] cursor-not-allowed pointer-events-none select-none" : "bg-[var(--bg-muted)]"}`}
                  required
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, emailError: undefined })); }}
                  readOnly={!!googleIdToken}
                  tabIndex={googleIdToken ? -1 : undefined}
                  className={`w-full px-4 py-3 rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 ${googleIdToken ? "bg-[var(--bg-muted)] cursor-not-allowed pointer-events-none select-none" : fieldErrors.emailError ? "ring-2 ring-[var(--status-error-text)] bg-[var(--status-error-bg)]" : "bg-[var(--bg-muted)] focus:ring-[var(--brand-primary)]"}`}
                  required
                />
                {fieldErrors.emailError && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.emailError}</p>}
              </motion.div>
              <motion.div variants={staggerItem}>
                <input
                  type="tel"
                  placeholder="(DD) 99999-9999"
                  value={phone}
                  onChange={(e) => { setPhone(formatPhone(e.target.value)); setFieldErrors(f => ({ ...f, phoneError: undefined })); }}
                  maxLength={15}
                  className={`w-full px-4 py-3 bg-[var(--bg-muted)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 ${fieldErrors.phoneError ? "ring-2 ring-[var(--status-error-text)] bg-[var(--status-error-bg)]" : "focus:ring-[var(--brand-primary)]"}`}
                  required
                />
                {fieldErrors.phoneError && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.phoneError}</p>}
              </motion.div>
              <motion.div variants={staggerItem}>
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
                  className={`w-full px-4 py-3 bg-[var(--bg-muted)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 ${fieldErrors.cpfError ? "ring-2 ring-[var(--status-error-text)] bg-[var(--status-error-bg)]" : "focus:ring-[var(--brand-primary)]"}`}
                  required
                />
                {fieldErrors.cpfError && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.cpfError}</p>}
              </motion.div>
              {!googleIdToken && (
                <>
                  <motion.div variants={staggerItem} className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha (min. 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-[var(--bg-muted)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </motion.div>
                  <motion.div variants={staggerItem} className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirmar senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-[var(--bg-muted)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </motion.div>
                </>
              )}

              <motion.div variants={staggerItem}>
                <button
                  type="submit"
                  disabled={otpSending}
                  className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] active:scale-[0.98] disabled:opacity-40 transition"
                >
                  {otpSending ? "Enviando codigo..." : "Continuar"}
                </button>
              </motion.div>
            </motion.form>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[var(--border-color)]" />
                  <span className="text-sm text-[var(--text-muted)]">ou</span>
                  <div className="flex-1 h-px bg-[var(--border-color)]" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if ((window as any).google) {
                      (window as any).google.accounts.id.prompt();
                    }
                  }}
                  disabled={googleLoading}
                  className="w-full py-3 border border-[var(--border-color)] rounded-xl font-semibold text-[var(--text-secondary)] flex items-center justify-center gap-3 hover:bg-[var(--bg-muted)] active:scale-[0.98] disabled:opacity-40 transition cursor-pointer"
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
                  <p className="text-center text-sm text-[var(--text-muted)] mt-2">Entrando com Google...</p>
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

            <p className="text-center text-[var(--text-muted)] mt-6 text-sm">
              Ja tem conta?{" "}
              <Link href="/" className="text-[var(--brand-primary)] font-semibold hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 2: WhatsApp verification
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[var(--brand-primary)]/20 rounded-full blur-3xl" animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.95, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" animate={{ x: [0, -15, 20, 0], y: [0, 15, -20, 0], scale: [1, 0.95, 1.05, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <div className="relative z-10 w-full max-w-md px-4">
        <motion.div className="flex flex-col items-center mb-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}>
          <img src="/logo.svg" alt="Shopping" className="w-56 drop-shadow-lg" />
        </motion.div>
        <motion.div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-2xl w-full max-w-md text-center relative" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.3 }}>
          <StepIndicator current={2} />

          <button
            onClick={() => setStep(1)}
            className="absolute left-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2} />
          </button>

          {otpMethod === "whatsapp" ? (
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-green-500 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
          ) : (
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-blue-500" />
            </div>
          )}

          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">
            {otpMethod === "whatsapp" ? "Verifique seu WhatsApp" : "Verifique seu Email"}
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            Enviamos um codigo de 6 digitos para<br />
            <span className="font-semibold text-[var(--text-primary)]">
              {otpMethod === "whatsapp" ? formatPhoneDisplay(phone.replace(/\D/g, "")) : email}
            </span>
          </p>

          {error && (
            <div className="bg-[var(--status-error-bg)] text-[var(--status-error-text)] p-3 rounded-xl text-sm mb-4">{error}</div>
          )}

          <motion.div className="flex gap-3 justify-center mb-8" variants={staggerContainer} initial="hidden" animate="show">
            {otpDigits.map((digit, i) => (
              <motion.div key={i} variants={staggerItem}>
                <input
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e.key)}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none transition
                    ${digit ? "border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--text-primary)]" : "border-[var(--border-color)] bg-[var(--bg-muted)] text-[var(--text-primary)]"}
                    focus:border-[var(--brand-primary)]`}
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.8 }}>
            <button
              onClick={handleVerifyOtp}
              disabled={otpVerifying || otpDigits.join("").length !== 6}
              className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] active:scale-[0.98] disabled:opacity-40 transition mb-4"
            >
              {otpVerifying ? "Verificando..." : "Verificar"}
            </button>

            <button
              onClick={sendOtp}
              disabled={resendTimer > 0 || otpSending}
              className="text-[var(--brand-primary)] font-semibold text-sm cursor-pointer hover:underline disabled:text-[var(--text-muted)] disabled:no-underline"
            >
              {resendTimer > 0 ? `Reenviar codigo em ${resendTimer}s` : "Reenviar codigo"}
            </button>
          </motion.div>
        </motion.div>
        </div>
      </div>
    );
  }

  // Step 3: Contract
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[var(--brand-primary)]/20 rounded-full blur-3xl" animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.95, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" animate={{ x: [0, -15, 20, 0], y: [0, 15, -20, 0], scale: [1, 0.95, 1.05, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />

      <div className="relative z-10 w-full max-w-2xl px-4">
        <motion.div className="flex flex-col items-center mb-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}>
          <img src="/logo.svg" alt="Shopping" className="w-56 drop-shadow-lg" />
        </motion.div>

        <motion.div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full flex flex-col overflow-y-auto" style={{ maxHeight: "80vh" }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.3 }}>
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-color)] text-center relative">
            <StepIndicator current={3} />
            <button
              onClick={() => { setStep(2); setScrolledToEnd(false); setChecked(false); }}
              className="absolute left-4 top-6 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2} />
            </button>
            <div className="text-[var(--brand-primary)] text-3xl mb-2">
              <FileText className="w-8 h-8 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Termos de Uso (Vendedor)</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Leia o contrato antes de finalizar o cadastro</p>
          </div>

          {/* Scrollable contract */}
          <div className="flex-1 overflow-y-auto p-6" onScroll={handleScroll}>
            <div className="bg-[var(--bg-muted)] rounded-xl p-4 mb-6">
              <p className="text-[10px] text-[var(--text-muted)] font-semibold mb-1 uppercase">Parte Contratante / Assinante:</p>
              <p className="text-base font-semibold text-[var(--text-primary)]">{name}</p>
              <p className="text-sm text-[var(--text-muted)]">CPF: {formatCpfDisplay(cpf)}</p>
              <p className="text-sm text-[var(--text-muted)]">Telefone: {formatPhoneDisplay(phone.replace(/\D/g, ""))}</p>
            </div>
            <pre className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-sans">
              {VENDOR_CONTRACT}
            </pre>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--border-color)]">
            {error && (
              <div className="bg-[var(--status-error-bg)] text-[var(--status-error-text)] p-3 rounded-xl text-sm mb-4">{error}</div>
            )}
            {!scrolledToEnd && (
              <p className="text-xs text-[var(--brand-primary)] font-semibold text-center mb-3">
                Role ate o final do contrato para poder aceitar.
              </p>
            )}
            <button
              onClick={handleDownloadPdf}
              className="w-full py-2.5 mb-3 border border-[var(--brand-primary)] text-[var(--brand-primary)] rounded-xl font-semibold text-sm hover:bg-[var(--brand-primary-light)] cursor-pointer flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" />
              Baixar contrato em PDF
            </button>
            <label className={`flex items-start gap-3 mb-4 ${!scrolledToEnd ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => setChecked(!checked)}
                className="mt-1 w-5 h-5 accent-[var(--brand-primary)]"
                disabled={!scrolledToEnd}
              />
              <span className="text-sm text-[var(--text-secondary)] leading-snug">
                Li e aceito os Termos de Uso da Plataforma e estou ciente das minhas responsabilidades como vendedor.
              </span>
            </label>
            <button
              onClick={handleAcceptAndRegister}
              disabled={!checked || !scrolledToEnd || loading}
              className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] active:scale-[0.98] disabled:opacity-40 transition"
            >
              {loading ? "Cadastrando..." : "Aceitar e Cadastrar"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
