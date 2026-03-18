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

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [login, { loading }] = useMutation(LOGIN);
  const [googleAuth] = useMutation(GOOGLE_AUTH_VENDOR);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

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
      router.push("/dashboard");
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
  }, [googleAuth, router]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === "undefined" || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
    });
    const el = document.getElementById("google-hidden-btn");
    if (el) {
      window.google.accounts.id.renderButton(el, { theme: "outline", size: "large", type: "icon" });
    }
  }, [handleGoogleResponse]);

  async function handleSubmit(e: React.FormEvent, forceLogin: boolean = false) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await login({ variables: { input: { email, password }, forceLogin } });
      localStorage.setItem("token", data.loginVendor.accessToken);
      localStorage.setItem("user", JSON.stringify(data.loginVendor.user));
      await apolloClient.resetStore();
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("ACTIVE_SESSION")) {
        if (confirm("Esta conta já está logada em outro lugar. Deseja desconectar o outro e entrar aqui?")) {
          handleSubmit(e, true);
        }
      } else {
        setError("Email ou senha inválidos");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
              window.google.accounts.id.renderButton(
                document.getElementById("google-hidden-btn"),
                { theme: "outline", size: "large", type: "icon" }
              );
            }
          }}
        />
      )}
      <div id="google-hidden-btn" style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0, overflow: "hidden" }} />
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo-dark.svg" alt="Delivery" className="h-16" />
        </div>
        <p className="text-gray-500 text-center mb-8">Painel do Vendedor</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          <div className="text-right">
            <a href="/forgot-password" className="text-sm text-orange-500 hover:underline">
              Esqueci minha senha
            </a>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">ou</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <button
              type="button"
              onClick={() => {
                const hiddenBtn = document.getElementById("google-hidden-btn");
                const inner = hiddenBtn?.querySelector('[role="button"]') as HTMLElement;
                if (inner) inner.click();
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
              Entrar com Google
            </button>
            {googleLoading && (
              <p className="text-center text-sm text-gray-500 mt-2">Entrando com Google...</p>
            )}
          </>
        )}

        <p className="text-center text-gray-500 mt-6 text-sm">
          Ainda não tem conta?{" "}
          <a href="/register" className="text-orange-500 font-semibold hover:underline">
            Cadastre-se como vendedor
          </a>
        </p>
      </div>
    </div>
  );
}
