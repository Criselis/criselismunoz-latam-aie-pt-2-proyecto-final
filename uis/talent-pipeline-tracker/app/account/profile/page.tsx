"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getProfile, updateProfile } from "@/lib/auth-api";
import { AuthGuard } from "@/lib/auth-guard";
import type { UserProfile } from "@/lib/types";

const NexovaLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M10 22V10h4l4 8 4-8h4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function ProfileContent() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch profile from GET /auth/me
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      setProfile(data);
      setFormData({
        name: data.name || data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
      });
      setProfile((prev) => prev ? { ...prev, ...updated } : updated);
      setIsEditing(false);
      setMessage({ type: "success", text: "Perfil actualizado correctamente" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar el perfil";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: profile?.name || profile?.full_name || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    });
    setMessage(null);
  };

  // Loading
  if (loading) {
    return (
      <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">Cargando perfil...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error
  if (error && !profile) {
    return (
      <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6" role="alert">
            <h2 className="text-lg font-semibold text-red-800">Error al cargar el perfil</h2>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchProfile}
              className="mt-4 text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Intentar de nuevo
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mi Cuenta</h1>
        <p className="text-sm text-gray-500 mb-8">Gestiona tu información personal</p>

        {/* Success/Error message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
            role="alert"
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {!isEditing ? (
            /* ===== VIEW MODE ===== */
            <div className="space-y-6">
              {/* Avatar + email */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-indigo-700">
                      {(profile?.name || profile?.full_name || profile?.email || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {profile?.name || profile?.full_name || "Sin nombre"}
                    </h2>
                    <p className="text-sm text-gray-500">{profile?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Editar
                </button>
              </div>

              <hr className="border-gray-100" />

              {/* Profile details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo electrónico
                  </p>
                  <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre completo
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.name || profile?.full_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </p>
                  <p className="mt-1 text-sm text-gray-900">{profile?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </p>
                  <p className="mt-1 text-sm text-gray-900">{profile?.address || "—"}</p>
                </div>
                {profile?.role && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</p>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{profile.role}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miembro desde
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Change password link */}
              <div className="pt-2">
                <Link
                  href="/account/change-password"
                  className="inline-flex items-center text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Cambiar contraseña
                </Link>
              </div>
            </div>
          ) : (
            /* ===== EDIT MODE ===== */
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Editar perfil</h2>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <p className="text-sm text-gray-500 py-2.5 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  {profile?.email}
                </p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+34 612 345 678"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Dirección
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Calle, ciudad, país"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function Header() {
  const { logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100" role="banner">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/tracker" className="flex items-center gap-2 text-xl font-bold text-indigo-700" aria-label="Nexova - Ir al tracker">
          <NexovaLogo />
          <span className="font-semibold tracking-tight">Nexova</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/tracker"
            className="text-sm font-medium text-gray-500 hover:text-indigo-700 transition-colors"
          >
            ← Pipeline
          </Link>
          <button
            onClick={logout}
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
    </header>
  );
}

export default function AccountProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}