"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { REQUEST_PASSWORD_RESET } from "@/lib/graphql";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo-dark.svg" alt="Shopping" className="h-16" />
        </div>
        <p className="text-gray-500 text-center mb-8">Recuperar senha</p>

        {success ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm text-center">
            Email enviado! Verifique sua caixa de entrada.
          </div>
        ) : (
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
        )}

        <p className="text-center text-gray-500 mt-6 text-sm">
          <a href="/" className="text-orange-500 font-semibold hover:underline">
            Voltar ao login
          </a>
        </p>
      </div>
    </div>
  );
}
