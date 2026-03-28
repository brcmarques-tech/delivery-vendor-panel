"use client";

import { Suspense, useState } from "react";
import { useMutation } from "@apollo/client";
import { useSearchParams, useRouter } from "next/navigation";
import { RESET_PASSWORD } from "@/lib/graphql";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    try {
      await resetPassword({ variables: { token, newPassword } });
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao redefinir senha";
      setError(message);
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
      <div className="flex justify-center mb-6">
        <img src="/logo-dark.svg" alt="Shopping" className="h-16" />
      </div>
      <p className="text-gray-500 text-center mb-8">Redefinir senha</p>

      {success ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm text-center">
          Senha alterada com sucesso! Redirecionando...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      )}

      <p className="text-center text-gray-500 mt-6 text-sm">
        <a href="/" className="text-orange-500 font-semibold hover:underline">
          Voltar ao login
        </a>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense
        fallback={
          <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center text-gray-500">
            Carregando...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
