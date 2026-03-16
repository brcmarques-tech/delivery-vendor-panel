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
      localStorage.setItem("token", data.googleAuthVendor.accessToken);
      localStorage.setItem("user", JSON.stringify(data.googleAuthVendor.user));
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
    });
    window.google.accounts.id.renderButton(
      document.getElementById("google-signin-btn"),
      { theme: "outline", size: "large", width: "100%", text: "continue_with", locale: "pt-BR" }
    );
  }, [handleGoogleResponse]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await login({ variables: { input: { email, password } } });
      localStorage.setItem("token", data.loginVendor.accessToken);
      localStorage.setItem("user", JSON.stringify(data.loginVendor.user));
      await apolloClient.resetStore();
      router.push("/dashboard");
    } catch {
      setError("Email ou senha inválidos");
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
              });
              window.google.accounts.id.renderButton(
                document.getElementById("google-signin-btn"),
                { theme: "outline", size: "large", width: "100%", text: "continue_with", locale: "pt-BR" }
              );
            }
          }}
        />
      )}
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
            <div id="google-signin-btn" className="flex justify-center" />
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
