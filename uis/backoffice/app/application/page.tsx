"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";

// ===== TYPES =====
interface FormData {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  experience: string;
  sector: string;
  englishLevel: string;
  linkedin: string;
  availability: string;
  comments: string;
  privacy: boolean;
}

interface FormErrors {
  [key: string]: string;
}

// ===== SVG ICONS =====
const NexovaLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M10 22V10h4l4 8 4-8h4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
  </svg>
);

const ArrowIcon = () => (
  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
  </svg>
);

// ===== VALIDATION RULES =====
const validateField = (name: string, value: string | boolean): string => {
  switch (name) {
    case "fullName": {
      const v = value as string;
      if (!v.trim()) return "El nombre debe contener al menos nombre y apellido";
      if (v.trim().split(/\s+/).length < 2) return "El nombre debe contener al menos nombre y apellido";
      return "";
    }
    case "email": {
      const v = value as string;
      if (!v.trim()) return "Ingresa un email válido (ejemplo: nombre@empresa.com)";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Ingresa un email válido (ejemplo: nombre@empresa.com)";
      return "";
    }
    case "phone": {
      const v = value as string;
      if (!v.trim()) return "El teléfono debe incluir código de país (ejemplo: +34 612 345 678)";
      if (!/^\+/.test(v.trim())) return "El teléfono debe incluir código de país (ejemplo: +34 612 345 678)";
      return "";
    }
    case "country": {
      if (!value) return "Selecciona tu país de residencia";
      return "";
    }
    case "experience": {
      const v = value as string;
      if (v === "") return "Los años de experiencia deben estar entre 0 y 50";
      const num = Number(v);
      if (!Number.isInteger(num) || num < 0 || num > 50) return "Los años de experiencia deben estar entre 0 y 50";
      return "";
    }
    case "sector": {
      if (!value) return "Selecciona el sector de tu interés";
      return "";
    }
    case "englishLevel": {
      if (!value) return "Indica tu nivel de inglés";
      return "";
    }
    case "availability": {
      if (!value) return "Selecciona tu disponibilidad";
      return "";
    }
    case "linkedin": {
      const v = value as string;
      if (!v.trim()) return "";
      if (!/^https?:\/\//.test(v.trim())) return "Si incluyes LinkedIn, debe ser una URL válida";
      return "";
    }
    case "comments": {
      const v = value as string;
      if (v.length > 500) return "Los comentarios no pueden exceder 500 caracteres";
      return "";
    }
    case "privacy": {
      if (!value) return "Debes aceptar la política de tratamiento de datos para continuar";
      return "";
    }
    default:
      return "";
  }
};

// ===== FORM FIELD COMPONENT =====
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  error: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur: () => void;
  children?: React.ReactNode;
  as?: "input" | "select" | "textarea";
  options?: { value: string; label: string }[];
  rows?: number;
  maxLength?: number;
  colSpan?: string;
}

function FormField({
  label, name, type = "text", placeholder, value, error, required, onChange, onBlur,
  children, as = "input", options, rows, maxLength, colSpan = ""
}: FormFieldProps) {
  const baseClasses = "w-full rounded-lg border px-4 py-2.5 text-sm placeholder-gray-400 transition-colors focus:ring-2 focus:outline-none";
  const normalBorder = "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200";
  const errorBorder = "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200";
  const className = `${baseClasses} ${error ? errorBorder : normalBorder}`;

  const colSpanClass = colSpan === "2" ? "sm:col-span-2" : "";

  return (
    <div className={colSpanClass}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      {as === "input" && (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={onChange}
          onBlur={onBlur}
          className={className}
        />
      )}
      {as === "select" && (
        <select
          id={name}
          name={name}
          value={value}
          required={required}
          onChange={onChange}
          onBlur={onBlur}
          className={className}
        >
          {children}
        </select>
      )}
      {as === "textarea" && (
        <textarea
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          onChange={onChange}
          onBlur={onBlur}
          className={`${className} resize-y`}
        />
      )}
      {error && <p className="mt-1.5 text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}
    </div>
  );
}

// ===== MAIN PAGE =====
export default function ApplicationPage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "", email: "", phone: "", country: "",
    experience: "", sector: "", englishLevel: "", linkedin: "",
    availability: "", comments: "", privacy: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fade-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Clear error when user starts typing
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[name] = error;
        } else {
          delete next[name];
        }
        return next;
      });
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const value = name === "privacy" ? formData.privacy : (formData as unknown as Record<string, string>)[name];
    const error = validateField(name, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[name] = error;
      } else {
        delete next[name];
      }
      return next;
    });
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    const allTouched: Record<string, boolean> = {};

    for (const key of Object.keys(formData)) {
      allTouched[key] = true;
      const value = key === "privacy" ? formData.privacy : (formData as unknown as Record<string, string>)[key];
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    }

    setTouched(allTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      setSubmitted(true);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "", email: "", phone: "", country: "",
      experience: "", sector: "", englishLevel: "", linkedin: "",
      availability: "", comments: "", privacy: false,
    });
    setErrors({});
    setSubmitted(false);
    setTouched({});
  };

  if (submitted) {
    return (
      <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100" role="banner">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16" aria-label="Navegación principal">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-700" aria-label="Nexova - Volver al inicio">
              <NexovaLogo />
              <span className="font-semibold tracking-tight">Nexova</span>
            </Link>
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors" aria-label="Volver a la página principal">
              ← Volver al sitio
            </Link>
          </nav>
        </header>

        <main className="flex-1 flex items-center justify-center py-16">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon />
              </div>
              <h2 className="text-2xl font-bold text-green-800">¡Gracias por tu interés en Nexova!</h2>
              <p className="mt-2 text-green-700">Hemos recibido tu información. Nuestro equipo de selección la revisará y te contactaremos en caso de que tu perfil encaje con alguna de nuestras oportunidades actuales o futuras.</p>
              <p className="mt-3 text-green-600 text-sm">Mientras tanto, síguenos en LinkedIn para estar al día de nuestras vacantes y contenido sobre desarrollo profesional.</p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-6 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Enviar otra solicitud
              </button>
            </div>
          </div>
        </main>

        <footer className="bg-gray-900 text-gray-400 text-sm py-6" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2025 Nexova. Todos los derechos reservados.</p>
            <Link href="/" className="hover:text-white transition-colors">Volver al sitio principal</Link>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100" role="banner">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16" aria-label="Navegación principal">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-700" aria-label="Nexova - Volver al inicio">
            <NexovaLogo />
            <span className="font-semibold tracking-tight">Nexova</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors" aria-label="Volver a la página principal">
            ← Volver al sitio
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero del formulario */}
        <section className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 sm:py-16" aria-label="Encabezado del formulario">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 fade-in">Banco de Talento</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto fade-in">Regístrate en nuestro banco de talento para que nuestro equipo de selección pueda evaluar tu perfil y contactarte cuando encaje con alguna de nuestras oportunidades.</p>
          </div>
        </section>

        {/* Formulario */}
        <section className="py-10 sm:py-14" aria-label="Formulario de registro de talento">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Aviso para empresas */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-center" role="note" aria-label="Aviso para empresas">
              <p className="text-amber-800 text-sm sm:text-base">
                <strong>¿Eres una empresa buscando talento?</strong>{" "}
                Escríbenos a <a href="mailto:contacto@nexova.com" className="text-indigo-700 font-semibold hover:underline">contacto@nexova.com</a>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8" noValidate aria-label="Formulario de registro de talento">

              {/* ===== DATOS PERSONALES ===== */}
              <fieldset className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm fade-in">
                <legend className="text-lg font-semibold text-gray-900 px-2 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold" aria-hidden="true">1</span>
                  Datos Personales
                </legend>
                <div className="mt-6 grid sm:grid-cols-2 gap-6">
                  <FormField label="Nombre completo" name="fullName" placeholder="Ej: María García López" value={formData.fullName} error={errors.fullName || ""} required onChange={handleChange} onBlur={() => handleBlur("fullName")} colSpan="2" />
                  <FormField label="Email" name="email" type="email" placeholder="nombre@dominio.com" value={formData.email} error={errors.email || ""} required onChange={handleChange} onBlur={() => handleBlur("email")} />
                  <FormField label="Teléfono" name="phone" type="tel" placeholder="+34 612 345 678" value={formData.phone} error={errors.phone || ""} required onChange={handleChange} onBlur={() => handleBlur("phone")} />
                  <FormField label="País de residencia" name="country" as="select" value={formData.country} error={errors.country || ""} required onChange={handleChange} onBlur={() => handleBlur("country")} colSpan="2">
                    <option value="" disabled>Selecciona tu país de residencia</option>
                    <option value="españa">España</option>
                    <option value="estados-unidos">Estados Unidos</option>
                    <option value="otro">Otro</option>
                  </FormField>
                </div>
              </fieldset>

              {/* ===== EXPERIENCIA PROFESIONAL ===== */}
              <fieldset className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm fade-in">
                <legend className="text-lg font-semibold text-gray-900 px-2 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold" aria-hidden="true">2</span>
                  Experiencia Profesional
                </legend>
                <div className="mt-6 grid sm:grid-cols-2 gap-6">
                  <FormField label="Años de experiencia" name="experience" type="number" placeholder="Ej: 5" value={formData.experience} error={errors.experience || ""} required onChange={handleChange} onBlur={() => handleBlur("experience")} />
                  <FormField label="Sector de interés" name="sector" as="select" value={formData.sector} error={errors.sector || ""} required onChange={handleChange} onBlur={() => handleBlur("sector")}>
                    <option value="" disabled>Selecciona el sector de tu interés</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="retail">Retail</option>
                    <option value="servicios-financieros">Servicios Financieros</option>
                    <option value="consultoria">Consultoría</option>
                    <option value="otro">Otro</option>
                  </FormField>
                  <FormField label="Nivel de inglés" name="englishLevel" as="select" value={formData.englishLevel} error={errors.englishLevel || ""} required onChange={handleChange} onBlur={() => handleBlur("englishLevel")}>
                    <option value="" disabled>Selecciona tu nivel de inglés</option>
                    <option value="basico">Básico</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                    <option value="nativo">Nativo</option>
                  </FormField>
                  <FormField label="LinkedIn (URL del perfil)" name="linkedin" type="url" placeholder="https://linkedin.com/in/tuperfil" value={formData.linkedin} error={errors.linkedin || ""} onChange={handleChange} onBlur={() => handleBlur("linkedin")} />
                </div>
              </fieldset>

              {/* ===== DISPONIBILIDAD Y COMENTARIOS ===== */}
              <fieldset className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm fade-in">
                <legend className="text-lg font-semibold text-gray-900 px-2 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold" aria-hidden="true">3</span>
                  Disponibilidad y Comentarios
                </legend>
                <div className="mt-6 space-y-6">

                  {/* Disponibilidad (radio) */}
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-3">
                      Disponibilidad <span className="text-red-500" aria-hidden="true">*</span>
                    </span>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {[
                        { id: "inmediata", label: "Inmediata" },
                        { id: "1mes", label: "1 mes" },
                        { id: "2-3meses", label: "2-3 meses" },
                        { id: "explorando", label: "Solo explorando" },
                      ].map((opt) => (
                        <label key={opt.id} className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="availability"
                            value={opt.id === "inmediata" ? "inmediata" : opt.id === "1mes" ? "1 mes" : opt.id === "2-3meses" ? "2-3 meses" : "solo explorando"}
                            checked={formData.availability === (opt.id === "inmediata" ? "inmediata" : opt.id === "1mes" ? "1 mes" : opt.id === "2-3meses" ? "2-3 meses" : "solo explorando")}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.availability && <p className="mt-1.5 text-sm text-red-600" role="alert" aria-live="polite">{errors.availability}</p>}
                  </div>

                  {/* Comentarios adicionales */}
                  <div>
                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Comentarios adicionales{" "}
                      <span className="text-gray-400 font-normal">(máximo 500 caracteres)</span>
                    </label>
                    <textarea
                      id="comments"
                      name="comments"
                      value={formData.comments}
                      rows={4}
                      maxLength={500}
                      placeholder="Cuéntanos cualquier información adicional que consideres relevante..."
                      onChange={handleChange}
                      onBlur={() => handleBlur("comments")}
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm placeholder-gray-400 transition-colors focus:ring-2 focus:outline-none resize-y ${
                        errors.comments ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
                      }`}
                    />
                    {errors.comments && <p className="mt-1.5 text-sm text-red-600" role="alert" aria-live="polite">{errors.comments}</p>}
                    <p className="mt-1 text-xs text-gray-400">
                      {formData.comments.length}/500 caracteres
                    </p>
                  </div>

                  {/* Aceptación de política de datos */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="privacy"
                      name="privacy"
                      checked={formData.privacy}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="privacy" className="text-sm text-gray-600">
                      Acepto la política de tratamiento de datos <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                  </div>
                  {errors.privacy && <p className="text-sm text-red-600" role="alert" aria-live="polite">{errors.privacy}</p>}

                </div>
              </fieldset>

              {/* ===== BOTONES ===== */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end fade-in">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  aria-label="Limpiar todos los campos del formulario"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-8 py-3 text-sm font-semibold text-white bg-indigo-700 rounded-xl hover:bg-indigo-800 transition-colors shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-label="Enviar solicitud"
                >
                  Enviar solicitud
                  <ArrowIcon />
                </button>
              </div>

            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-sm py-6" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2025 Nexova. Todos los derechos reservados.</p>
          <Link href="/" className="hover:text-white transition-colors">Volver al sitio principal</Link>
        </div>
      </footer>
    </div>
  );
}
