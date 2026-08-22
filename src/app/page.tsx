/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

declare global {
  interface Window {
    google?: any;
  }
}

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN, GOOGLE_AUTH_VENDOR } from "@/lib/graphql";
import { apolloClient } from "@/lib/apollo";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const spring = { type: "spring" as const, stiffness: 80, damping: 20 };
const formContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
};
const formItem = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: spring },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [login, { loading }] = useMutation(LOGIN);
  const [googleAuth] = useMutation(GOOGLE_AUTH_VENDOR);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  async function doGoogleAuth(idToken: string) {
    setError("");
    setGoogleLoading(true);
    try {
      const { data } = await googleAuth({ variables: { idToken, forceLogin: true } });
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
      if (msg.includes("GOOGLE_NO_ACCOUNT")) {
        setError("Nenhuma conta encontrada com este email. Cadastre-se primeiro.");
      } else {
        setError("Erro ao entrar com Google. Tente novamente.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const handleGoogleResponse = useCallback(async (response: any) => {
    doGoogleAuth(response.credential);
  }, [googleAuth, router]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === "undefined" || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
    });
  }, [handleGoogleResponse]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // KAN-280: antes era forceLogin: true DIRETO — quem estivesse logado no
    // balcao era expulso em silencio, sem ninguem confirmar nada. Agora tenta
    // sem forcar; se o servidor acusar sessao ativa, pergunta antes de assumir.
    async function tentar(force: boolean) {
      const { data } = await login({ variables: { input: { email, password }, forceLogin: force } });
      localStorage.setItem("token", data.loginVendor.accessToken);
      localStorage.setItem("user", JSON.stringify(data.loginVendor.user));
      await apolloClient.resetStore();
      router.replace("/dashboard");
    }
    try {
      await tentar(false);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "";
      if (msg.includes("ACTIVE_SESSION")) {
        const assumir = confirm(
          "Esta conta já está conectada em outro dispositivo. Conectar aqui e desconectar o outro?",
        );
        if (!assumir) return;
        try {
          await tentar(true);
        } catch {
          setError("Email ou senha inválidos");
        }
        return;
      }
      setError("Email ou senha inválidos");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => {
            if (window.google) {
              window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
                auto_select: false,
              });
            }
          }}
        />
      )}

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
            <h2 className="text-xl font-bold text-[var(--text-primary)] text-center">Painel do Vendedor</h2>
            <p className="text-[var(--text-muted)] text-center text-sm mb-6">Entre para gerenciar sua loja</p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            variants={formContainer}
            initial="hidden"
            animate="show"
          >
            {error && (
              <div className="bg-[var(--status-error-bg)] text-[var(--status-error-text)] p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <motion.div variants={formItem}>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={formItem}>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Senha</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div className="text-right" variants={formItem}>
              <Link href="/forgot-password" className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] hover:underline transition">
                Esqueci minha senha
              </Link>
            </motion.div>

            <motion.div variants={formItem}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </motion.div>
          </motion.form>

          {GOOGLE_CLIENT_ID && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 1.1 }}
            >
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[var(--border-color)]" />
                <span className="text-sm text-[var(--text-muted)]">ou</span>
                <div className="flex-1 h-px bg-[var(--border-color)]" />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.google) {
                    window.google.accounts.id.prompt();
                  }
                }}
                disabled={googleLoading}
                className="w-full py-3 border border-[var(--border-color)] rounded-xl font-semibold text-[var(--text-secondary)] flex items-center justify-center gap-3 hover:bg-[var(--bg-muted)] hover:border-[var(--border-color)] active:scale-[0.98] disabled:opacity-40 transition-all duration-200 cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Entrar com Google
              </button>
              {googleLoading && (
                <p className="text-center text-sm text-[var(--text-muted)] mt-2">Entrando com Google...</p>
              )}
            </motion.div>
          )}

          <motion.p
            className="text-center text-[var(--text-muted)] mt-6 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            Ainda não tem conta?{" "}
            <Link href="/register" className="text-[var(--brand-primary)] font-semibold hover:underline">
              Cadastre-se como vendedor
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
