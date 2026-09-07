"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const NexovaLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M10 22V10h4l4 8 4-8h4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }
    if (!password) {
      setError("Por favor ingresa tu contraseña");
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.push("/tracker");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
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
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-indigo-700 transition-colors"
          >
            ← Sitio público
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
              <p className="mt-2 text-sm text-gray-500">
                Accede al panel de gestión de talento
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Login form */}
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-6 text-center text-sm text-gray-500">
              ¿No tienes cuenta?{" "}
              <Link
                href="/register"
                className="text-indigo-700 font-semibold hover:text-indigo-800 transition-colors"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}