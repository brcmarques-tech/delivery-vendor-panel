"use client";

import { useMutation, useQuery } from "@apollo/client";
import { GET_MY_PROFILE, UPDATE_PROFILE, SEND_EMAIL_VERIFICATION, CONFIRM_EMAIL_VERIFICATION, GET_MY_PLAN } from "@/lib/graphql";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import TermsModal from "@/components/TermsModal";
import { useTheme } from "@/lib/ThemeProvider";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

function Section({ title, children, "data-tour": dataTour }: { title: string; children: React.ReactNode; "data-tour"?: string }) {
  return (
    <div data-tour={dataTour} className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 mb-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition cursor-pointer ${value ? "bg-[var(--brand-primary)]" : "bg-[var(--bg-muted)]"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value ? "translate-x-6" : ""}`} />
      </button>
      <span className="text-sm text-[var(--text-primary)] font-medium">{label}</span>
    </div>
  );
}

function ProfileSection() {
  const { data, loading, refetch } = useQuery(GET_MY_PROFILE);
  const [updateProfile, { loading: saving }] = useMutation(UPDATE_PROFILE);
  const [sendEmailVerification] = useMutation(SEND_EMAIL_VERIFICATION);
  const [confirmEmailVerification] = useMutation(CONFIRM_EMAIL_VERIFICATION);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [passForm, setPassForm] = useState({ current: "", new: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailVerifyMsg, setEmailVerifyMsg] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (data?.meVendor) {
      setForm({ name: data.meVendor.name || "", phone: data.meVendor.phone || "", email: data.meVendor.email || "" });
    }
  }, [data]);

  async function handleSaveProfile() {
    try {
      const vars: any = { name: form.name, phone: form.phone };
      if (form.email !== data?.meVendor?.email) vars.email = form.email;
      await updateProfile({ variables: vars });
      setMsg("Perfil atualizado!");
      refetch();
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  async function handleChangePassword() {
    if (passForm.new !== passForm.confirm) {
      setMsg("As senhas nao coincidem");
      return;
    }
    if (passForm.new.length < 6) {
      setMsg("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    try {
      const vars: any = { newPassword: passForm.new };
      if (!isGoogleAccount) vars.currentPassword = passForm.current;
      await updateProfile({ variables: vars });
      setMsg("Senha alterada com sucesso!");
      setPassForm({ current: "", new: "", confirm: "" });
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleSendEmailCode() {
    setSendingCode(true);
    setEmailVerifyMsg("");
    try {
      await sendEmailVerification({ variables: { userType: "vendor" } });
      setShowEmailVerify(true);
      setEmailCode("");
      setResendTimer(60);
      setEmailVerifyMsg("Codigo enviado para seu email!");
    } catch (err: any) {
      setEmailVerifyMsg(err.message);
    } finally {
      setSendingCode(false);
    }
  }

  async function handleConfirmEmailCode() {
    if (emailCode.length !== 6) {
      setEmailVerifyMsg("Digite o codigo de 6 digitos");
      return;
    }
    setVerifyingCode(true);
    setEmailVerifyMsg("");
    try {
      await confirmEmailVerification({ variables: { code: emailCode, userType: "vendor" } });
      setShowEmailVerify(false);
      setEmailCode("");
      setEmailVerifyMsg("");
      refetch();
    } catch (err: any) {
      setEmailVerifyMsg(err.message);
    } finally {
      setVerifyingCode(false);
    }
  }

  if (loading) return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 mb-6 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  const emailVerified = data?.meVendor?.emailVerified;
  const isGoogleAccount = !!data?.meVendor?.googleId;

  return (
    <Section title="Minha Conta" data-tour="profile-section">
      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${msg.includes("sucesso") || msg.includes("atualizado") ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]" : "bg-[var(--status-error-bg)] text-[var(--status-error-text)]"}`}>
          {msg}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Nome</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]" />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Telefone</label>
          <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]" />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Email</label>
          <div className="flex items-center gap-2 mt-1">
            {isGoogleAccount ? (
              <div className="flex-1 flex items-center gap-2 px-4 py-2 border border-[var(--border-light)] rounded-xl bg-[var(--bg-muted)]">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="text-[var(--text-muted)]">{data?.meVendor?.email}</span>
              </div>
            ) : (
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]" />
            )}
            {emailVerified ? (
              <span className="flex items-center gap-1 px-3 py-2 bg-[var(--status-success-bg)] text-[var(--status-success-text)] rounded-xl text-sm font-medium whitespace-nowrap">
                ✓ Verificado
              </span>
            ) : (
              <button
                onClick={handleSendEmailCode}
                disabled={sendingCode}
                className="px-3 py-2 bg-[var(--status-warning-text)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {sendingCode ? "Enviando..." : "Verificar email"}
              </button>
            )}
          </div>
          {showEmailVerify && !emailVerified && (
            <div className="mt-3 p-4 border border-[var(--status-warning-text)]/20 bg-[var(--status-warning-bg)] rounded-xl">
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Digite o codigo de 6 digitos enviado para <strong>{data?.meVendor?.email}</strong>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-32 px-4 py-2 border border-[var(--border-color)] rounded-xl text-center text-lg font-mono tracking-widest bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
                <button
                  onClick={handleConfirmEmailCode}
                  disabled={verifyingCode}
                  className="px-4 py-2.5 bg-[var(--status-success-text)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {verifyingCode ? "Verificando..." : "Confirmar"}
                </button>
                <button
                  onClick={handleSendEmailCode}
                  disabled={sendingCode || resendTimer > 0}
                  className="px-4 py-2 text-[var(--brand-primary)] text-sm font-medium hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                >
                  {resendTimer > 0 ? `Reenviar (${resendTimer}s)` : "Reenviar"}
                </button>
              </div>
              {emailVerifyMsg && (
                <p className={`mt-2 text-sm ${emailVerifyMsg.includes("enviado") ? "text-[var(--status-success-text)]" : "text-[var(--status-error-text)]"}`}>
                  {emailVerifyMsg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <button onClick={handleSaveProfile} disabled={saving} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl px-4 py-2.5 font-medium transition cursor-pointer disabled:opacity-50">
        {saving ? "Salvando..." : "Salvar perfil"}
      </button>

      <hr className="my-6 border-[var(--border-light)]" />
      <h3 className="font-semibold text-[var(--text-primary)] mb-3">
        {isGoogleAccount ? "Definir senha" : "Alterar senha"}
      </h3>
      {isGoogleAccount && (
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Sua conta foi criada com Google. Defina uma senha para tambem poder entrar com email e senha.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {!isGoogleAccount && (
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Senha atual</label>
            <input type="password" value={passForm.current} onChange={(e) => setPassForm({ ...passForm, current: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]" />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Nova senha</label>
          <input type="password" value={passForm.new} onChange={(e) => setPassForm({ ...passForm, new: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]" />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Confirmar nova senha</label>
          <input type="password" value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })} className="w-full mt-1 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:border-[var(--brand-primary)]" />
        </div>
      </div>
      <button onClick={handleChangePassword} disabled={saving} className="px-6 py-2 bg-[var(--text-secondary)] text-white rounded-xl font-semibold hover:opacity-80 transition cursor-pointer disabled:opacity-50">
        {isGoogleAccount ? "Definir senha" : "Alterar senha"}
      </button>
    </Section>
  );
}

function AppearanceSection() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Section title="Aparencia" data-tour="appearance-section">
      <Toggle value={isDark} onChange={toggleTheme} label={isDark ? "Modo escuro ativado" : "Modo claro"} />
    </Section>
  );
}

function ContractsSection() {
  const { data } = useQuery(GET_MY_PLAN);
  const [viewingTerms, setViewingTerms] = useState<"terms" | "subscription" | null>(null);

  const acceptedTermsAt = data?.meVendor?.acceptedTermsAt;
  const acceptedSubAt = data?.meVendor?.acceptedSubscriptionTermsAt;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <Section title="Contratos e Termos">
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 border border-[var(--border-light)] rounded-xl">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Termos de Uso da Plataforma</p>
            {acceptedTermsAt ? (
              <p className="text-xs text-[var(--status-success-text)] mt-1">Aceito em {formatDate(acceptedTermsAt)}</p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] mt-1">Ainda n&atilde;o aceito</p>
            )}
          </div>
          <button
            onClick={() => setViewingTerms("terms")}
            className="px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition cursor-pointer"
          >
            Visualizar
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border border-[var(--border-light)] rounded-xl">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Contrato de Assinatura de Plano</p>
            {acceptedSubAt ? (
              <p className="text-xs text-[var(--status-success-text)] mt-1">Aceito em {formatDate(acceptedSubAt)}</p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] mt-1">Ainda n&atilde;o aceito</p>
            )}
          </div>
          <button
            onClick={() => setViewingTerms("subscription")}
            className="px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition cursor-pointer"
          >
            Visualizar
          </button>
        </div>
      </div>

      {viewingTerms && (
        <TermsModal
          type={viewingTerms}
          readOnly
          onClose={() => setViewingTerms(null)}
          userName={data?.meVendor?.name}
          userCpf={data?.meVendor?.cpf}
        />
      )}
    </Section>
  );
}

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo ao seu Perfil!",
      description: "Aqui você gerencia seus dados pessoais e preferências de aparência do painel.",
    },
  },
  {
    element: '[data-tour="profile-section"]',
    popover: {
      title: "Seus dados pessoais",
      description: "Atualize nome, e-mail, telefone e senha. Mantenha seus dados sempre corretos para garantir acesso à conta.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="appearance-section"]',
    popover: {
      title: "✅ Aparência do painel",
      description: "Prefere o modo escuro? Ative aqui. Sua preferência fica salva para as próximas visitas.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Perfil'.",
      side: "top",
      align: "start",
    },
  },
];

export default function ProfilePage() {
  const { startTour, hasSeenTour } = useTour("profile", TOUR_STEPS);

  return (
    <motion.div className="max-w-4xl mx-auto pb-20" {...fadeIn}>
      <PageHeader title="Meu Perfil" description="Gerencie seus dados pessoais e preferencias" onTourStart={startTour} tourNotSeen={!hasSeenTour} />
      <ProfileSection />
      <AppearanceSection />
      <ContractsSection />
    </motion.div>
  );
}
