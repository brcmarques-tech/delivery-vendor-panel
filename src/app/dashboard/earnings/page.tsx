"use client";

import { useQuery, useMutation } from "@apollo/client";
import {
  MY_BALANCE, SIMULATE_ANTICIPATION, REQUEST_ANTICIPATION,
  TOGGLE_AUTO_ANTICIPATION, REGISTER_RECIPIENT, DISCONNECT_PAYMENT, GET_MY_PLAN,
} from "@/lib/graphql";
import { useState } from "react";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 mb-6">
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function BalanceCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 border ${color}`}>
      <p className="text-sm text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)]">
        R$ {value.toFixed(2)}
      </p>
    </div>
  );
}

// ===== RECIPIENT FORM =====
function RecipientForm({ onSuccess }: { onSuccess: () => void }) {
  const [registerRecipient, { loading }] = useMutation(REGISTER_RECIPIENT);
  const [type, setType] = useState<"individual" | "corporation">("individual");
  const [form, setForm] = useState({
    name: "", email: "", document: "", birthdate: "",
    monthlyIncome: "", professionalOccupation: "", motherName: "",
    phoneDdd: "", phoneNumber: "",
    street: "", streetNumber: "", neighborhood: "", city: "", state: "", zipCode: "", complementary: "",
    bank: "", branchNumber: "", branchCheckDigit: "", accountNumber: "", accountCheckDigit: "", accountType: "checking" as "checking" | "savings",
    holderName: "",
    // Corporation
    companyName: "", tradingName: "",
  });
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const recipientData: any = {
      name: form.name,
      email: form.email,
      document: form.document.replace(/\D/g, ""),
      type,
      birthdate: form.birthdate,
      monthlyIncome: parseInt(form.monthlyIncome) || 1000,
      professionalOccupation: form.professionalOccupation || "Comerciante",
      motherName: form.motherName,
      phone: { ddd: form.phoneDdd, number: form.phoneNumber },
      address: {
        street: form.street,
        streetNumber: form.streetNumber,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode.replace(/\D/g, ""),
        complementary: form.complementary,
      },
      bankAccount: {
        holderName: form.holderName || form.name,
        bank: form.bank,
        branchNumber: form.branchNumber,
        branchCheckDigit: form.branchCheckDigit || undefined,
        accountNumber: form.accountNumber,
        accountCheckDigit: form.accountCheckDigit,
        type: form.accountType,
      },
    };

    if (type === "corporation") {
      recipientData.companyName = form.companyName;
      recipientData.tradingName = form.tradingName;
    }

    try {
      await registerRecipient({
        variables: { recipientData: JSON.stringify(recipientData) },
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar");
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Type selector */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setType("individual")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition ${type === "individual" ? "bg-orange-500 text-white" : "bg-[var(--bg-page)] text-[var(--text-secondary)]"}`}>
          Pessoa Fisica
        </button>
        <button type="button" onClick={() => setType("corporation")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition ${type === "corporation" ? "bg-orange-500 text-white" : "bg-[var(--bg-page)] text-[var(--text-secondary)]"}`}>
          Pessoa Juridica
        </button>
      </div>

      {/* Personal data */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Dados Pessoais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nome Completo *</label>
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>{type === "corporation" ? "CNPJ *" : "CPF *"}</label>
            <input className={inputClass} placeholder={type === "corporation" ? "00.000.000/0000-00" : "000.000.000-00"} value={form.document} onChange={(e) => set("document", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Data de Nascimento *</label>
            <input type="date" className={inputClass} value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Renda Mensal (R$)</label>
            <input type="number" className={inputClass} value={form.monthlyIncome} onChange={(e) => set("monthlyIncome", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Profissao</label>
            <input className={inputClass} value={form.professionalOccupation} onChange={(e) => set("professionalOccupation", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Nome da Mae</label>
            <input className={inputClass} value={form.motherName} onChange={(e) => set("motherName", e.target.value)} />
          </div>
        </div>
      </div>

      {type === "corporation" && (
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Dados da Empresa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Razao Social *</label>
              <input className={inputClass} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Nome Fantasia</label>
              <input className={inputClass} value={form.tradingName} onChange={(e) => set("tradingName", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Phone */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Telefone</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>DDD *</label>
            <input className={inputClass} placeholder="53" maxLength={2} value={form.phoneDdd} onChange={(e) => set("phoneDdd", e.target.value)} required />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Numero *</label>
            <input className={inputClass} placeholder="999999999" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Endereco</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>CEP *</label>
            <input className={inputClass} placeholder="00000-000" value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Rua *</label>
            <input className={inputClass} value={form.street} onChange={(e) => set("street", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Numero *</label>
            <input className={inputClass} value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Complemento</label>
            <input className={inputClass} value={form.complementary} onChange={(e) => set("complementary", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Bairro *</label>
            <input className={inputClass} value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Cidade *</label>
            <input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Estado *</label>
            <select className={inputClass} value={form.state} onChange={(e) => set("state", e.target.value)} required>
              <option value="">Selecione</option>
              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bank Account */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Conta Bancaria</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Banco *</label>
            <select className={inputClass} value={form.bank} onChange={(e) => set("bank", e.target.value)} required>
              <option value="">Selecione o banco</option>
              {BANKS.map((b) => (
                <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Titular da Conta *</label>
            <input className={inputClass} placeholder="Nome completo" value={form.holderName} onChange={(e) => set("holderName", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Tipo *</label>
            <select className={inputClass} value={form.accountType} onChange={(e) => set("accountType", e.target.value as "checking" | "savings")} required>
              <option value="checking">Conta Corrente</option>
              <option value="savings">Poupanca</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Agencia *</label>
            <input className={inputClass} placeholder="0001" value={form.branchNumber} onChange={(e) => set("branchNumber", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Digito da Agencia</label>
            <input className={inputClass} placeholder="0" maxLength={1} value={form.branchCheckDigit} onChange={(e) => set("branchCheckDigit", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Conta *</label>
            <input className={inputClass} placeholder="00000" value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Digito da Conta *</label>
            <input className={inputClass} placeholder="0" maxLength={1} value={form.accountCheckDigit} onChange={(e) => set("accountCheckDigit", e.target.value)} required />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
      >
        {loading ? "Cadastrando..." : "Cadastrar Dados Bancarios"}
      </button>
    </form>
  );
}

// ===== EARNINGS DASHBOARD =====
function EarningsDashboard() {
  const { data: balanceData, loading: loadingBalance } = useQuery(MY_BALANCE, { fetchPolicy: "network-only" });
  const { data: simData, loading: loadingSim } = useQuery(SIMULATE_ANTICIPATION, { fetchPolicy: "network-only" });
  const [requestAnticipation, { loading: requesting }] = useMutation(REQUEST_ANTICIPATION);
  const [toggleAuto] = useMutation(TOGGLE_AUTO_ANTICIPATION);
  const [disconnectPayment] = useMutation(DISCONNECT_PAYMENT);
  const { refetch: refetchPlan } = useQuery(GET_MY_PLAN);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<any>(null);

  const balance = balanceData?.myBalance;
  const simulation = simData?.simulateAnticipation;

  async function handleAnticipate() {
    try {
      const { data } = await requestAnticipation();
      setResult(data.requestAnticipation);
      setShowConfirm(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Tem certeza que deseja desconectar seus dados bancarios?")) return;
    try {
      await disconnectPayment();
      refetchPlan();
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loadingBalance) return <p className="text-[var(--text-secondary)]">Carregando...</p>;

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard label="Disponivel para saque" value={balance?.availableAmount || 0} color="border-green-200 bg-green-50" />
        <BalanceCard label="A receber" value={balance?.waitingFundsAmount || 0} color="border-orange-200 bg-orange-50" />
        <BalanceCard label="Ja transferido" value={balance?.transferredAmount || 0} color="border-blue-200 bg-blue-50" />
      </div>

      {/* Anticipation Section */}
      {(balance?.waitingFundsAmount || 0) > 0 && (
        <Section title="Antecipacao de Recebiveis">
          <div className="bg-[var(--bg-page)] rounded-xl p-4 mb-4">
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Voce tem <strong>R$ {(balance?.waitingFundsAmount || 0).toFixed(2)}</strong> aguardando liberacao.
              Voce pode antecipar esse valor, mas sera cobrada uma taxa de juros.
            </p>

            {loadingSim ? (
              <p className="text-sm text-[var(--text-muted)]">Calculando...</p>
            ) : simulation && simulation.originalAmount > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Valor total pendente:</span>
                  <span className="font-semibold text-[var(--text-primary)]">R$ {simulation.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-500">Taxa de antecipacao (~{simulation.feePercentage}%):</span>
                  <span className="font-semibold text-red-500">- R$ {simulation.fee.toFixed(2)}</span>
                </div>
                <hr className="border-[var(--border-color)]" />
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-semibold">Voce receberia:</span>
                  <span className="font-bold text-green-600 text-lg">R$ {simulation.anticipatedAmount.toFixed(2)}</span>
                </div>
              </div>
            ) : null}
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer"
            >
              Quero Antecipar
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800 mb-3">
                Confirma a antecipacao? Voce perdera <strong>R$ {simulation?.fee?.toFixed(2) || "0.00"}</strong> em taxas.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAnticipate}
                  disabled={requesting}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
                >
                  {requesting ? "Processando..." : "Confirmar Antecipacao"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800">
                Antecipacao solicitada! Status: <strong>{result.status}</strong>.
                Valor aprovado: <strong>R$ {result.approvedAmount?.toFixed(2)}</strong>.
                Taxa: <strong>R$ {result.fee?.toFixed(2)}</strong>.
              </p>
            </div>
          )}
        </Section>
      )}

      {/* Info Section */}
      <Section title="Como funciona o recebimento?">
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <div className="flex items-start gap-3">
            <span className="text-lg">💳</span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Cartao de credito</p>
              <p>O valor fica disponivel em <strong>30 dias</strong> apos o pagamento. Com antecipacao, pode receber em <strong>~2 dias</strong> (com taxa).</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📱</span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">PIX</p>
              <p>O valor fica disponivel em <strong>2 dias uteis</strong> (D+2).</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🏦</span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Transferencia automatica</p>
              <p>Quando o valor esta disponivel, a transferencia para sua conta bancaria e feita <strong>automaticamente todos os dias</strong>.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Disconnect */}
      <div className="text-center">
        <button
          onClick={handleDisconnect}
          className="text-sm text-red-500 hover:text-red-600 cursor-pointer transition"
        >
          Desconectar dados bancarios
        </button>
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====
export default function EarningsPage() {
  const { data, loading, refetch } = useQuery(GET_MY_PLAN);
  const isConnected = data?.meVendor?.paymentConnected;

  if (loading) return <p className="text-[var(--text-secondary)]">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Recebimentos</h1>

      {isConnected ? (
        <EarningsDashboard />
      ) : (
        <Section title="Cadastrar Dados Bancarios">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Para receber pagamentos das suas vendas, cadastre seus dados bancarios abaixo.
            Apos o cadastro, os valores serao transferidos automaticamente para sua conta.
          </p>
          <RecipientForm onSuccess={() => refetch()} />
        </Section>
      )}
    </div>
  );
}
