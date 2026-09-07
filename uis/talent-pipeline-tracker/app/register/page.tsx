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

interface FieldErrors {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    linkedin_url: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (serverError) setServerError(null);
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "El nombre completo es obligatorio";
    } else if (formData.full_name.trim().split(/\s+/).length < 2) {
      newErrors.full_name = "Ingresa al menos nombre y apellido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Ingresa un correo electrónico válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Las contraseñas no coinciden";
    }

    if (formData.phone && !/^\+/.test(formData.phone.trim())) {
      newErrors.phone = "El teléfono debe incluir código de país (ej: +34 612 345 678)";
    }

    if (formData.linkedin_url && !/^https?:\/\//.test(formData.linkedin_url.trim())) {
      newErrors.linkedin_url = "Debe ser una URL válida (https://...)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || undefined,
        linkedin_url: formData.linkedin_url.trim() || undefined,
      });
      router.push("/tracker");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrarse";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm placeholder-gray-400 transition-colors focus:ring-2 focus:outline-none ${
      errors[field]
        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200"
        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
    }`;

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
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
              <p className="mt-2 text-sm text-gray-500">
                Regístrate para gestionar el pipeline de talento
              </p>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            {/* Register form */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Full name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre completo <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Ej: María García López"
                  autoComplete="name"
                  className={inputClass("full_name")}
                />
                {errors.full_name && (
                  <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.full_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  className={inputClass("email")}
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className={inputClass("password")}
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.password}</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar contraseña <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  className={inputClass("confirm_password")}
                />
                {errors.confirm_password && (
                  <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.confirm_password}</p>
                )}
              </div>

              {/* Phone (optional) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+34 612 345 678"
                  autoComplete="tel"
                  className={inputClass("phone")}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.phone}</p>
                )}
              </div>

              {/* LinkedIn URL (optional) */}
              <div>
                <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-1.5">
                  LinkedIn <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/tuperfil"
                  className={inputClass("linkedin_url")}
                />
                {errors.linkedin_url && (
                  <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.linkedin_url}</p>
                )}
              </div>

              {/* Submit */}
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
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="text-indigo-700 font-semibold hover:text-indigo-800 transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}