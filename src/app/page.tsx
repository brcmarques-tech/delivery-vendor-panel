"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN } from "@/lib/graphql";
import { apolloClient } from "@/lib/apollo";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [login, { loading }] = useMutation(LOGIN);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await login({ variables: { input: { email, password } } });
      if (data.login.user.role !== "VENDOR") {
        setError("Acesso permitido apenas para vendedores");
        return;
      }
      localStorage.setItem("token", data.login.accessToken);
      localStorage.setItem("user", JSON.stringify(data.login.user));
      await apolloClient.resetStore();
      router.push("/dashboard");
    } catch {
      setError("Email ou senha inválidos");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

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
