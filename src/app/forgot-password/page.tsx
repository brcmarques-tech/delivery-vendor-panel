"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { REQUEST_PASSWORD_RESET } from "@/lib/graphql";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 80, damping: 20 };
const formContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
};
const formItem = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: spring },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [requestReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    try {
      await requestReset({ variables: { email } });
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao enviar email";
      setError(message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
        animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.95, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        animate={{ x: [0, -15, 20, 0], y: [0, 15, -20, 0], scale: [1, 0.95, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[40%] left-[20%] w-64 h-64 bg-orange-400/10 rounded-full blur-3xl"
        animate={{ x: [0, 15, -10, 0], y: [0, -10, 20, 0], scale: [1, 1.03, 0.97, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
        >
          <img src="/logo.svg" alt="Shopping" className="w-80 mb-2 drop-shadow-lg" />
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-[var(--bg-card)] rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-white/20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-xl font-bold text-[var(--text-primary)] text-center">Recuperar senha</h2>
            <p className="text-[var(--text-muted)] text-center text-sm mb-6">
              Informe seu email para receber o link de recuperação
            </p>
          </motion.div>

          {success ? (
            <motion.div
              className="flex flex-col items-center gap-3 py-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring}
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--status-success-bg)] flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-[var(--status-success-text)]" />
              </div>
              <p className="text-sm text-[var(--text-secondary)] text-center">
                Email enviado! Verifique sua caixa de entrada.
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              variants={formContainer}
              initial="hidden"
              animate="show"
            >
              {error && (
                <motion.div
                  className="bg-[var(--status-error-bg)] text-[var(--status-error-text)] p-3 rounded-xl text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <motion.div variants={formItem} className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-muted)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40 focus:border-[var(--brand-primary)] transition"
                  required
                />
              </motion.div>

              <motion.div variants={formItem}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </button>
              </motion.div>
            </motion.form>
          )}

          <motion.p
            className="text-center mt-6 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <a href="/" className="inline-flex items-center gap-1.5 text-[var(--brand-primary)] font-semibold hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
