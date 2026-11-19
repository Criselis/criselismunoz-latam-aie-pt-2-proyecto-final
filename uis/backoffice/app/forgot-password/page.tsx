"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth-api";
import { friendlyError } from "@/lib/errors";
import type { ForgotPasswordRequest } from "@/lib/types";

const NexovaLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M10 22V10h4l4 8 4-8h4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    try {
      const data: ForgotPasswordRequest = { email: email.trim() };
      await forgotPassword(data);
      setSent(true);
    } catch (err) {
      const message = friendlyError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-100" role="banner">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-700" aria-label="Nexova - Ir al inicio">
            <NexovaLogo />
            <span className="font-semibold tracking-tight">Nexova</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-500 hover:text-indigo-700 transition-colors"
          >
            ← Volver al inicio de sesión
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
              <p className="mt-2 text-sm text-gray-500">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Correo enviado</h2>
                <p className="text-sm text-gray-500">
                  Si el correo ingresado está registrado, recibirás un enlace para restablecer tu contraseña.
                  Revisa también tu bandeja de spam.
                </p>
                <Link
                  href="/login"
                  className="inline-block mt-4 text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors underline"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-indigo-700 rounded-xl hover:bg-indigo-800 transition-colors shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    "Enviar enlace"
                  )}
                </button>
              </form>
            )}

            {!sent && (
              <p className="mt-6 text-center text-sm text-gray-500">
                ¿Recordaste tu contraseña?{" "}
                <Link
                  href="/login"
                  className="text-indigo-700 font-semibold hover:text-indigo-800 transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}