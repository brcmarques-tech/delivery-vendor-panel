"use client";

import { useQuery, useMutation } from "@apollo/client";
import {
  MY_BALANCE, SIMULATE_ANTICIPATION, REQUEST_ANTICIPATION,
  TOGGLE_AUTO_ANTICIPATION, REGISTER_RECIPIENT, DISCONNECT_PAYMENT, GET_MY_PLAN,
} from "@/lib/graphql";
import { useTour } from "@/hooks/useTour";
import { type DriveStep } from "driver.js";
import { useState, useCallback, useEffect, useRef } from "react";
import { Check, XCircle, AlertCircle, LogOut, DollarSign, Clock, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonStats, SkeletonTable } from "@/components/ui/Skeleton";

const BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "260", name: "Nubank" },
  { code: "077", name: "Inter" },
  { code: "336", name: "C6 Bank" },
  { code: "290", name: "PagBank" },
  { code: "380", name: "PicPay" },
  { code: "212", name: "Banco Original" },
  { code: "756", name: "Sicoob" },
  { code: "748", name: "Sicredi" },
  { code: "422", name: "Safra" },
  { code: "070", name: "BRB" },
  { code: "655", name: "Neon" },
  { code: "085", name: "Ailos" },
  { code: "403", name: "Cora" },
  { code: "197", name: "Stone" },
  { code: "332", name: "Acesso" },
];

// ===== MASKS =====
function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCNPJ(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return "(" + d.slice(0, 2) + ") " + d.slice(2);
  return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
}

function maskCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return d.slice(0, 5) + "-" + d.slice(5);
}

function isValidCPF(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(d[10]);
}

function isValidCNPJ(cnpj: string) {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Section({ title, children, "data-tour": dataTour }: { title: string; children: React.ReactNode; "data-tour"?: string }) {
  return (
    <div data-tour={dataTour} className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 mb-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function BalanceCard({ label, value, icon, iconBg }: { label: string; value: number; icon: React.ReactNode; iconBg: string }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
      </div>
      <p className="text-3xl font-bold text-[var(--text-primary)]">
        R$ {value.toFixed(2)}
      </p>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-[var(--status-error-text)] mt-1">{error}</p>;
}

// ===== RECIPIENT FORM (2 sections: Personal+Address, Bank) =====
function RecipientForm({ onSuccess }: { onSuccess: () => void }) {
  const [registerRecipient, { loading }] = useMutation(REGISTER_RECIPIENT);
  const [type, setType] = useState<"individual" | "corporation">("individual");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetchingCep, setFetchingCep] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", document: "", birthdate: "", phone: "",
    street: "", streetNumber: "", neighborhood: "", city: "", state: "", zipCode: "",
    bank: "", branchNumber: "", branchCheckDigit: "", accountNumber: "", accountCheckDigit: "",
    accountType: "checking" as "checking" | "savings",
    companyName: "", tradingName: "", foundingDate: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  const fetchCep = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setFetchingCep(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_VIACEP_URL || 'https://viacep.com.br'}/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch { /* ignore */ }
    setFetchingCep(false);
  }, []);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Informe o nome completo";
    if (!form.email.trim()) e.email = "Informe o email";
    else if (!isValidEmail(form.email)) e.email = "Email invalido";

    const docDigits = form.document.replace(/\D/g, "");
    if (!docDigits) e.document = type === "corporation" ? "Informe o CNPJ" : "Informe o CPF";
    else if (type === "individual" && !isValidCPF(docDigits)) e.document = "CPF invalido";
    else if (type === "corporation" && !isValidCNPJ(docDigits)) e.document = "CNPJ invalido";

    if (!form.birthdate) e.birthdate = "Informe a data de nascimento";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) e.phone = "Informe DDD + numero";
    if (type === "corporation" && !form.companyName.trim()) e.companyName = "Informe a razao social";
    if (type === "corporation" && !form.foundingDate) e.foundingDate = "Informe a data de fundacao";

    if (form.zipCode.replace(/\D/g, "").length !== 8) e.zipCode = "CEP invalido";
    if (!form.street.trim()) e.street = "Informe a rua";
    if (!form.streetNumber.trim()) e.streetNumber = "Obrigatorio";
    if (!form.neighborhood.trim()) e.neighborhood = "Informe o bairro";
    if (!form.city.trim()) e.city = "Informe a cidade";
    if (!form.state) e.state = "Selecione";

    if (!form.bank) e.bank = "Selecione o banco";
    const branch = form.branchNumber.replace(/\D/g, "");
    if (!branch) e.branchNumber = "Obrigatório";
    else if (branch.length < 3 || branch.length > 5) e.branchNumber = "Agência deve ter 3 a 5 dígitos";
    const account = form.accountNumber.replace(/\D/g, "");
    if (!account) e.accountNumber = "Obrigatório";
    else if (account.length < 3 || account.length > 13) e.accountNumber = "Conta deve ter 3 a 13 dígitos";
    const checkDigit = form.accountCheckDigit.trim();
    if (!checkDigit) e.accountCheckDigit = "Obrigatório";
    else if (!/^[0-9Xx]$/.test(checkDigit)) e.accountCheckDigit = "Dígito inválido";

    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstEl = document.querySelector("[data-has-error]");
      firstEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    const phoneDigits = form.phone.replace(/\D/g, "");

    const recipientData: any = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      document: form.document.replace(/\D/g, ""),
      type,
      birthdate: form.birthdate,
      phone: { ddd: phoneDigits.slice(0, 2), number: phoneDigits.slice(2) },
      address: {
        street: form.street.trim(), streetNumber: form.streetNumber.trim(),
        neighborhood: form.neighborhood.trim(), city: form.city.trim(),
        state: form.state, zipCode: form.zipCode.replace(/\D/g, ""),
      },
      bankAccount: {
        holderName: form.name.trim(),
        bank: form.bank, branchNumber: form.branchNumber.trim(),
        branchCheckDigit: form.branchCheckDigit.trim() || undefined,
        accountNumber: form.accountNumber.trim(),
        accountCheckDigit: form.accountCheckDigit.trim(),
        type: form.accountType,
      },
    };

    if (type === "corporation") {
      recipientData.companyName = form.companyName.trim();
      recipientData.tradingName = form.tradingName.trim();
      recipientData.foundingDate = form.foundingDate;
      recipientData.managingPartners = [{ name: form.name.trim(), email: form.email.trim().toLowerCase(), document: form.document.replace(/\D/g, "") }];
    }

    // M4: Validate required fields before sending
    if (!recipientData.document || !recipientData.type || !recipientData.name || !recipientData.bankAccount) {
      setGlobalError("Dados obrigatorios ausentes: documento, tipo, nome e conta bancaria.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    let recipientDataStr: string;
    try {
      recipientDataStr = JSON.stringify(recipientData);
    } catch (jsonErr: any) {
      setGlobalError("Erro ao serializar dados. Verifique os campos e tente novamente.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      await registerRecipient({
        variables: { recipientData: recipientDataStr },
      });
      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (err: any) {
      const msg = err.message || "Erro ao cadastrar. Tente novamente.";
      setGlobalError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[var(--status-success-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-[var(--status-success-text)]" strokeWidth={2} />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Cadastro realizado!</h3>
        <p className="text-sm text-[var(--text-secondary)]">Seus dados bancarios foram salvos com sucesso.</p>
      </div>
    );
  }

  const inputClass = (field?: string) =>
    `w-full px-3 py-2.5 rounded-lg border ${errors[field || ""] ? "border-[var(--status-error-text)] bg-[var(--status-error-bg)]" : "border-[var(--border-color)] bg-[var(--bg-page)]"} text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition`;
  const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="bg-[var(--status-error-bg)] border border-[var(--border-color)] text-[var(--status-error-text)] px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          {globalError}
        </div>
      )}

      {/* Type selector */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setType("individual")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${type === "individual" ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
          Pessoa Fisica
        </button>
        <button type="button" onClick={() => setType("corporation")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${type === "corporation" ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
          Pessoa Juridica
        </button>
      </div>

      {/* Personal data */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
          {type === "corporation" ? "Dados do Responsavel" : "Dados Pessoais"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div data-has-error={errors.name ? "" : undefined}>
            <label className={labelClass}>Nome Completo</label>
            <input className={inputClass("name")} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Seu nome completo" />
            <FieldError error={errors.name} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass("email")} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="seu@email.com" />
            <FieldError error={errors.email} />
          </div>
          <div>
            <label className={labelClass}>{type === "corporation" ? "CNPJ" : "CPF"}</label>
            <input className={inputClass("document")}
              placeholder={type === "corporation" ? "00.000.000/0000-00" : "000.000.000-00"}
              value={form.document}
              onChange={(e) => set("document", type === "corporation" ? maskCNPJ(e.target.value) : maskCPF(e.target.value))}
              maxLength={type === "corporation" ? 18 : 14}
            />
            <FieldError error={errors.document} />
          </div>
          <div>
            <label className={labelClass}>Data de Nascimento</label>
            <input type="date" className={inputClass("birthdate")} value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
            <FieldError error={errors.birthdate} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Telefone com DDD</label>
            <input className={inputClass("phone")} placeholder="(53) 99999-9999" value={form.phone}
              onChange={(e) => set("phone", maskPhone(e.target.value))} maxLength={15}
            />
            <FieldError error={errors.phone} />
          </div>
        </div>
      </div>

      {type === "corporation" && (
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Dados da Empresa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Razao Social</label>
              <input className={inputClass("companyName")} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Nome juridico da empresa" />
              <FieldError error={errors.companyName} />
            </div>
            <div>
              <label className={labelClass}>Nome Fantasia</label>
              <input className={inputClass()} value={form.tradingName} onChange={(e) => set("tradingName", e.target.value)} placeholder="Nome comercial" />
            </div>
            <div>
              <label className={labelClass}>Data de Fundacao</label>
              <input type="date" className={inputClass("foundingDate")} value={form.foundingDate} onChange={(e) => set("foundingDate", e.target.value)} />
              <FieldError error={errors.foundingDate} />
            </div>
          </div>
        </div>
      )}

      {/* Address */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
          Endereco
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>CEP</label>
            <div className="relative">
              <input className={inputClass("zipCode")} placeholder="00000-000" value={form.zipCode}
                onChange={(e) => {
                  const masked = maskCEP(e.target.value);
                  set("zipCode", masked);
                  if (masked.replace(/\D/g, "").length === 8) fetchCep(masked);
                }}
                maxLength={9}
              />
              {fetchingCep && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <FieldError error={errors.zipCode} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Rua</label>
            <input className={inputClass("street")} value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="Nome da rua" />
            <FieldError error={errors.street} />
          </div>
          <div>
            <label className={labelClass}>Numero</label>
            <input className={inputClass("streetNumber")} value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} placeholder="123" />
            <FieldError error={errors.streetNumber} />
          </div>
          <div>
            <label className={labelClass}>Bairro</label>
            <input className={inputClass("neighborhood")} value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Seu bairro" />
            <FieldError error={errors.neighborhood} />
          </div>
          <div>
            <label className={labelClass}>Cidade</label>
            <input className={inputClass("city")} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Sua cidade" />
            <FieldError error={errors.city} />
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select className={inputClass("state")} value={form.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">Selecione</option>
              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
            <FieldError error={errors.state} />
          </div>
        </div>
      </div>

      {/* Bank Account */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
          Conta Bancaria
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Banco</label>
            <select className={inputClass("bank")} value={form.bank} onChange={(e) => set("bank", e.target.value)}>
              <option value="">Selecione o banco</option>
              {BANKS.map((b) => (
                <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
              ))}
            </select>
            <FieldError error={errors.bank} />
          </div>
          <div>
            <label className={labelClass}>Tipo de Conta</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => set("accountType", "checking")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${form.accountType === "checking" ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[var(--border-color)]"}`}>
                Corrente
              </button>
              <button type="button" onClick={() => set("accountType", "savings")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${form.accountType === "savings" ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[var(--border-color)]"}`}>
                Poupanca
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Agencia</label>
              <input className={inputClass("branchNumber")} placeholder="0001" value={form.branchNumber}
                onChange={(e) => set("branchNumber", e.target.value.replace(/\D/g, ""))} />
              <FieldError error={errors.branchNumber} />
            </div>
            <div>
              <label className={labelClass}>Digito</label>
              <input className={inputClass()} placeholder="0" maxLength={1} value={form.branchCheckDigit}
                onChange={(e) => set("branchCheckDigit", e.target.value.replace(/[^0-9Xx]/g, "").toUpperCase())} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Conta</label>
            <input className={inputClass("accountNumber")} placeholder="00000" value={form.accountNumber}
              onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, ""))} />
            <FieldError error={errors.accountNumber} />
          </div>
          <div>
            <label className={labelClass}>Digito da Conta</label>
            <input className={inputClass("accountCheckDigit")} placeholder="0" maxLength={1} value={form.accountCheckDigit}
              onChange={(e) => set("accountCheckDigit", e.target.value.replace(/[^0-9Xx]/g, "").toUpperCase())} />
            <FieldError error={errors.accountCheckDigit} />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl font-medium transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Cadastrando...
          </>
        ) : (
          "Cadastrar Dados Bancarios"
        )}
      </button>
    </form>
  );
}

// ===== EARNINGS DASHBOARD =====
function EarningsDashboard() {
  const { data: balanceData, loading: loadingBalance, error: balanceError, refetch: refetchBalance } = useQuery(MY_BALANCE, { fetchPolicy: "network-only" });
  const { data: simData, loading: loadingSim, refetch: refetchSim } = useQuery(SIMULATE_ANTICIPATION, { fetchPolicy: "network-only" });
  const [requestAnticipation, { loading: requesting }] = useMutation(REQUEST_ANTICIPATION);
  const [toggleAutoAnticipation] = useMutation(TOGGLE_AUTO_ANTICIPATION);
  const [disconnectPayment] = useMutation(DISCONNECT_PAYMENT);
  const { refetch: refetchPlan } = useQuery(GET_MY_PLAN);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [autoAnticipation, setAutoAnticipation] = useState(false);
  const [autoInitialized, setAutoInitialized] = useState(false);
  const [togglingAuto, setTogglingAuto] = useState(false);
  const anticipatingRef = useRef(false); // H3: double-click prevention guard
  const [showDisconnectModal, setShowDisconnectModal] = useState(false); // L1: styled modal instead of confirm()

  const balance = balanceData?.myBalance;
  const simulation = simData?.simulateAnticipation;

  useEffect(() => {
    if (balance && !autoInitialized) {
      setAutoAnticipation(balance.autoAnticipationEnabled ?? false);
      setAutoInitialized(true);
    }
  }, [balance, autoInitialized]);

  async function handleAnticipate() {
    // H3: double-click prevention
    if (anticipatingRef.current) return;
    anticipatingRef.current = true;

    setError("");
    try {
      const { data } = await requestAnticipation();
      setResult(data.requestAnticipation);
      setShowConfirm(false);
      // M3: refetch both balance and simulation after anticipation
      refetchBalance();
      refetchSim();
    } catch (err: any) {
      const msg = err.message?.includes("network") ? "Sem conexao com a internet." : err.message || "Erro ao solicitar antecipacao.";
      setError(msg);
    } finally {
      anticipatingRef.current = false; // H3: reset guard
    }
  }

  async function handleDisconnect() {
    // L1: Uses styled modal instead of confirm() — triggered via showDisconnectModal
    setShowDisconnectModal(false);
    try {
      await disconnectPayment();
      refetchPlan();
      window.location.reload();
    } catch (err: any) {
      const msg = err.message?.includes("network") ? "Sem conexao com a internet." : err.message || "Erro ao desconectar.";
      setError(msg);
    }
  }

  if (loadingBalance) {
    return (
      <div className="space-y-6">
        <SkeletonStats count={4} />
        <SkeletonTable rows={3} cols={3} />
      </div>
    );
  }

  if (balanceError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mb-4" strokeWidth={1.5} />
        <p className="text-[var(--text-secondary)] text-sm mb-4 text-center">Nao foi possivel carregar seu saldo.<br/>Verifique sua conexao.</p>
        <button onClick={() => refetchBalance()} className="px-4 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-sm font-medium transition cursor-pointer">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {error && (
        <div className="bg-[var(--status-error-bg)] border border-[var(--border-color)] text-[var(--status-error-text)] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Balance Cards */}
      <motion.div data-tour="earnings-stats" variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={staggerItem}><BalanceCard label="Disponivel para saque" value={balance?.availableAmount || 0} icon={<DollarSign className="w-5 h-5 text-[var(--status-success-text)]" />} iconBg="bg-[var(--status-success-bg)]" /></motion.div>
        <motion.div variants={staggerItem}><BalanceCard label="A receber" value={balance?.waitingFundsAmount || 0} icon={<Clock className="w-5 h-5 text-[var(--brand-primary)]" />} iconBg="bg-[var(--brand-primary-light)]" /></motion.div>
        <motion.div variants={staggerItem}><BalanceCard label="Ja transferido" value={balance?.transferredAmount || 0} icon={<CheckCircle2 className="w-5 h-5 text-[var(--status-info-text)]" />} iconBg="bg-[var(--status-info-bg)]" /></motion.div>
      </motion.div>

      {/* Anticipation Section */}
      {(balance?.waitingFundsAmount || 0) > 0 && (
        <Section title="Antecipar Recebiveis">
          <div className="bg-[var(--bg-page)] rounded-xl p-4 mb-4">
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Voce tem <strong className="text-[var(--text-primary)]">R$ {(balance?.waitingFundsAmount || 0).toFixed(2)}</strong> aguardando liberacao.
            </p>

            {loadingSim ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <div className="w-3 h-3 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
                Calculando...
              </div>
            ) : simulation && simulation.originalAmount > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Valor pendente</span>
                  <span className="font-semibold text-[var(--text-primary)]">R$ {simulation.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--status-error-text)]">Taxa (~{simulation.feePercentage}%)</span>
                  <span className="font-semibold text-[var(--status-error-text)]">- R$ {simulation.fee.toFixed(2)}</span>
                </div>
                <hr className="border-[var(--border-color)]" />
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--status-success-text)] font-semibold">Voce recebe</span>
                  <span className="font-bold text-[var(--status-success-text)] text-lg">R$ {simulation.anticipatedAmount.toFixed(2)}</span>
                </div>
              </div>
            ) : null}
          </div>

          {result ? (
            <div className="bg-[var(--status-success-bg)] border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-sm font-semibold text-[var(--status-success-text)]">Antecipacao solicitada!</p>
              <p className="text-sm text-[var(--status-success-text)] mt-1">
                Valor aprovado: <strong>R$ {result.approvedAmount?.toFixed(2)}</strong> &middot; Taxa: <strong>R$ {result.fee?.toFixed(2)}</strong>
              </p>
            </div>
          ) : !showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-6 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl font-medium transition-all cursor-pointer"
            >
              Quero Antecipar
            </button>
          ) : (
            <div className="bg-[var(--status-warning-bg)] border border-[var(--border-color)] rounded-xl p-4">
              <p className="text-sm text-[var(--status-warning-text)] mb-3">
                Confirma? Sera cobrada uma taxa de <strong>R$ {simulation?.fee?.toFixed(2) || "0.00"}</strong>.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAnticipate}
                  disabled={requesting}
                  className="px-4 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl font-medium transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {requesting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {requesting ? "Processando..." : "Confirmar"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2.5 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl font-medium hover:bg-[var(--bg-hover)] transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Auto Anticipation Toggle */}
      <Section title="Antecipacao Automatica" data-tour="earnings-table">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-primary)] font-medium">Antecipar automaticamente</p>
            <p className="text-xs text-[var(--text-secondary)]">Quando ativado, seus recebiveis sao antecipados automaticamente.</p>
          </div>
          <button
            onClick={async () => {
              setTogglingAuto(true);
              try {
                const next = !autoAnticipation;
                await toggleAutoAnticipation({ variables: { enabled: next } });
                setAutoAnticipation(next);
                // M3: refetch balance after toggling auto anticipation
                refetchBalance();
              } catch (err: any) {
                setError(err.message || "Erro ao alterar antecipacao automatica.");
              }
              setTogglingAuto(false);
            }}
            disabled={togglingAuto}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${autoAnticipation ? "bg-[var(--brand-primary)]" : "bg-[var(--bg-muted)]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoAnticipation ? "translate-x-6" : ""}`} />
          </button>
        </div>
      </Section>

      {/* Info Section */}
      <Section title="Como funciona?">
        <div className="space-y-4 text-sm text-[var(--text-secondary)]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-[var(--status-info-bg)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#128179;</span>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Cartao de credito</p>
              <p>Disponivel em <strong>30 dias</strong>. Com antecipacao, ~2 dias (com taxa).</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-[var(--status-info-bg)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#128241;</span>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">PIX</p>
              <p>Disponivel em <strong>2 dias uteis</strong> (D+2).</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-[var(--brand-primary-light)] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#127974;</span>
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Transferencia automatica</p>
              <p>Quando disponivel, transfere para sua conta <strong>todo dia</strong>.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* L1: Disconnect confirmation modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Desconectar Dados Bancarios</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Ao desconectar, voce deixara de receber pagamentos automaticamente. Tem certeza?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDisconnect}
                className="flex-1 py-3 bg-[var(--status-error-text)] text-white rounded-xl font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Desconectar
              </button>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-3 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl font-semibold hover:bg-[var(--bg-hover)] transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect */}
      <div className="text-center pb-4">
        <button
          onClick={() => setShowDisconnectModal(true)}
          className="text-sm text-[var(--status-error-text)] hover:opacity-80 cursor-pointer transition inline-flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Desconectar dados bancarios
        </button>
      </div>
    </motion.div>
  );
}

// ===== MAIN PAGE =====
const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo aos Recebimentos!",
      description: "Aqui você acompanha todos os seus ganhos e o histórico de repasses da plataforma.",
    },
  },
  {
    element: '[data-tour="earnings-stats"]',
    popover: {
      title: "Seus recebimentos",
      description: "Acompanhe o total recebido, valor pendente e histórico de repasses. Os valores são atualizados após a entrega.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="earnings-table"]',
    popover: {
      title: "✅ Histórico de transações",
      description: "Veja cada transação em detalhe: pedido, valor, comissão da plataforma e status do repasse.\n\nIsso é tudo! Para rever, clique no ❓ ao lado do título 'Recebimentos'.",
      side: "top",
      align: "start",
    },
  },
];

export default function EarningsPage() {
  const { data, loading, refetch } = useQuery(GET_MY_PLAN);
  const isConnected = data?.meVendor?.paymentConnected;
  const { startTour, hasSeenTour } = useTour("earnings", TOUR_STEPS);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStats count={4} />
        <SkeletonTable rows={3} cols={3} />
      </div>
    );
  }

  return (
    <motion.div {...fadeIn}>
      <PageHeader title="Recebimentos" description="Gerencie seus recebimentos e dados bancarios" onTourStart={startTour} tourNotSeen={!hasSeenTour} />

      {isConnected ? (
        <EarningsDashboard />
      ) : (
        <Section title="Cadastrar Dados Bancarios">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Para receber pagamentos das suas vendas, cadastre seus dados abaixo.
            Apos o cadastro, os valores serao transferidos automaticamente para sua conta.
          </p>
          <RecipientForm onSuccess={() => refetch()} />
        </Section>
      )}
    </motion.div>
  );
}
