"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { REGISTER } from "@/lib/graphql";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [register, { loading }] = useMutation(REGISTER);
  const router = useRouter();

  function validateCpf(value: string): boolean {
    const d = value.replace(/\D/g, "");
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
    let c = 11 - (s % 11); if (c >= 10) c = 0;
    if (parseInt(d[9]) !== c) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
    c = 11 - (s % 11); if (c >= 10) c = 0;
    return parseInt(d[10]) === c;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validateCpf(cpf)) {
      setError("CPF inválido");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      await register({
        variables: {
          input: { name, email, password, phone, cpf: cpf.replace(/\D/g, ""), role: "VENDOR" },
        },
      });
      setSuccess(true);
    } catch {
      setError("Erro ao criar conta. Verifique se o email ou telefone já estão cadastrados.");
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <div className="text-5xl mb-4">&#9203;</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cadastro enviado!</h2>
          <p className="text-gray-500 mb-6">
            Sua solicitação para ser vendedor foi enviada e está aguardando aprovação do administrador.
            Você será notificado quando sua conta for aprovada.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 transition"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-orange-500 mb-2">Delivery</h1>
        <p className="text-gray-500 text-center mb-8">Cadastro de Vendedor</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="tel"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="text"
            placeholder="CPF"
            value={cpf}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 11);
              const formatted = v.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) =>
                [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
              );
              setCpf(formatted);
            }}
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
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirm ? (
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

          <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-700">
            Seu cadastro precisará de aprovação do administrador antes de poder acessar o painel.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Já tem conta?{" "}
          <a href="/" className="text-orange-500 font-semibold hover:underline">
            Fazer login
          </a>
        </p>
      </div>
    </div>
  );
}
