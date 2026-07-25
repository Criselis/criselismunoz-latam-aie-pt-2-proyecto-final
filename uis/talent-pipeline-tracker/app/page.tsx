"use client";

import { useEffect } from "react";

// SVG Icons as components
const NexovaLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M10 22V10h4l4 8 4-8h4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4 mt-1 text-indigo-500 flex-shrink-0" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
  </svg>
);

const SearchIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
  </svg>
);

const AcademicCapIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
  </svg>
);

const GreenCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
  </svg>
);

const ArrowIcon = () => (
  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const PersonIcon = () => (
  <div className="w-80 h-80 bg-indigo-100 rounded-full flex items-center justify-center">
    <svg className="w-48 h-48 text-indigo-700" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="16" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 40c0-10 7-16 16-16s16 6 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M30 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

export default function Home() {
  useEffect(() => {
    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-sans text-gray-800 antialiased">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100" role="banner">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16" aria-label="Navegación principal">
          <a href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-700" aria-label="Nexova - Ir al inicio">
            <NexovaLogo />
            <span className="font-semibold tracking-tight">Nexova</span>
          </a>
          <ul className="hidden sm:flex items-center gap-8 text-sm font-medium">
            <li><a href="#inicio" className="text-gray-600 hover:text-indigo-700 transition-colors" aria-label="Ir a Inicio">Inicio</a></li>
            <li><a href="#servicios" className="text-gray-600 hover:text-indigo-700 transition-colors" aria-label="Ir a Servicios">Servicios</a></li>
            <li><a href="#por-que-nexova" className="text-gray-600 hover:text-indigo-700 transition-colors" aria-label="Ir a Talento">Talento</a></li>
            <li><a href="#contacto" className="text-gray-600 hover:text-indigo-700 transition-colors" aria-label="Ir a Contacto">Contacto</a></li>
          </ul>
          <a href="/application" className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" aria-label="Únete a nuestro banco de talento">
            Únete al banco de talento
          </a>
        </nav>
      </header>

      <main>
        {/* ===== HERO SECTION ===== */}
        <section id="inicio" className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50" aria-label="Presentación de la empresa">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 fade-in">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">+10 años de experiencia</span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Construimos equipos excepcionales para empresas en crecimiento
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                  Consultora de recursos humanos y adquisición de talento con más de 10 años ayudando a empresas de tecnología, retail y servicios financieros a encontrar y desarrollar el mejor talento.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <a href="/application" className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-white bg-indigo-700 rounded-xl hover:bg-indigo-800 transition-colors shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    Únete a nuestro banco de talento
                    <ArrowIcon />
                  </a>
                  <a href="#servicios" className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-indigo-700 bg-white border-2 border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    Conocer más
                  </a>
                </div>
              </div>
              <div className="hidden lg:flex justify-center fade-in">
                <PersonIcon />
              </div>
            </div>
          </div>
        </section>

        {/* ===== SERVICIOS SECTION ===== */}
        <section id="servicios" className="py-16 sm:py-20 lg:py-24 bg-white" aria-label="Servicios">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Nuestros Servicios</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Soluciones integrales de talento diseñadas para impulsar el crecimiento de tu empresa.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <article className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow fade-in" role="article">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center mb-5">
                  <SearchIcon />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Headhunting Ejecutivo</h3>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Búsqueda y selección de perfiles ejecutivos y mandos medios</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Proceso personalizado con garantía de reemplazo</span>
                  </li>
                </ul>
              </article>
              <article className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow fade-in" role="article">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center mb-5">
                  <UsersIcon />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Outsourcing de Atención al Cliente</h3>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Equipos especializados para empresas tecnológicas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Formación continua y supervisión dedicada</span>
                  </li>
                </ul>
              </article>
              <article className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow fade-in" role="article">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center mb-5">
                  <AcademicCapIcon />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Formación Corporativa</h3>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Programas de soft skills y liderazgo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Cursos presenciales y en línea adaptados a cada organización</span>
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ===== POR QUÉ NEXOVA SECTION ===== */}
        <section id="por-que-nexova" className="py-16 sm:py-20 lg:py-24 bg-gray-50" aria-label="Por qué Nexova">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Por qué Nexova</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Nuestra trayectoria y metodología nos diferencian.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex gap-5 p-6 bg-white rounded-xl shadow-sm fade-in">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <GreenCheckIcon />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">12 años de experiencia en el mercado latinoamericano</h3>
                  <p className="mt-1 text-gray-600">Desde 2011 ayudando a empresas a encontrar el talento que necesitan para crecer.</p>
                </div>
              </div>
              <div className="flex gap-5 p-6 bg-white rounded-xl shadow-sm fade-in">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <GreenCheckIcon />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Presencia regional: España y Estados Unidos</h3>
                  <p className="mt-1 text-gray-600">Oficinas en Valencia y Miami, con alcance global para servir a tu empresa donde la necesites.</p>
                </div>
              </div>
              <div className="flex gap-5 p-6 bg-white rounded-xl shadow-sm fade-in">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <GreenCheckIcon />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">+500 procesos exitosos de selección completados</h3>
                  <p className="mt-1 text-gray-600">Un equipo consolidado de expertos en selección de talento y formación corporativa.</p>
                </div>
              </div>
              <div className="flex gap-5 p-6 bg-white rounded-xl shadow-sm fade-in">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <GreenCheckIcon />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Especialización sectorial en tecnología, retail y finanzas</h3>
                  <p className="mt-1 text-gray-600">Cada cliente es único. Diseñamos estrategias a medida para cada sector y necesidad.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== EXPERIENCIA / CIFRAS ===== */}
        <section id="experiencia" className="py-16 sm:py-20 lg:py-24 bg-indigo-700 text-white" aria-label="Experiencia y cifras">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold">Nuestra trayectoria en cifras</h2>
              <p className="mt-4 text-lg text-indigo-200 max-w-2xl mx-auto">Más de una década impulsando el talento de las empresas.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div className="fade-in">
                <p className="text-4xl sm:text-5xl font-bold">12+</p>
                <p className="mt-2 text-indigo-200 text-sm sm:text-base">Años de experiencia</p>
              </div>
              <div className="fade-in">
                <p className="text-4xl sm:text-5xl font-bold">120</p>
                <p className="mt-2 text-indigo-200 text-sm sm:text-base">Empleados</p>
              </div>
              <div className="fade-in">
                <p className="text-4xl sm:text-5xl font-bold">2</p>
                <p className="mt-2 text-indigo-200 text-sm sm:text-base">Oficinas (Valencia & Miami)</p>
              </div>
              <div className="fade-in">
                <p className="text-4xl sm:text-5xl font-bold">500+</p>
                <p className="mt-2 text-indigo-200 text-sm sm:text-base">Empresas satisfechas</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA / AVISO PARA EMPRESAS ===== */}
        <section className="py-16 sm:py-20 bg-indigo-50" aria-label="Aviso para empresas">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">¿Eres una empresa buscando talento?</h2>
            <p className="mt-4 text-lg text-gray-600">Escríbenos a <a href="mailto:contacto@nexova.com" className="text-indigo-700 font-semibold hover:underline">contacto@nexova.com</a> y descubre cómo podemos ayudarte a encontrar los mejores perfiles para tu organización.</p>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer id="contacto" className="bg-gray-900 text-gray-300" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-2 text-white text-xl font-bold mb-4">
                <NexovaLogo className="w-7 h-7" />
                Nexova
              </div>
              <p className="text-sm leading-relaxed">Consultora de recursos humanos y adquisición de talento. Transformamos empresas a través de las personas.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contacto</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <MailIcon />
                  <a href="mailto:contacto@nexova.com" className="hover:text-white transition-colors" aria-label="Enviar correo a contacto@nexova.com">contacto@nexova.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneIcon />
                  <span><strong>Valencia:</strong> +34 960 123 456</span>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneIcon />
                  <span><strong>Miami:</strong> +1 305 555 0191</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Síguenos</h3>
              <div className="flex gap-4">
                <a href="https://linkedin.com/company/nexova" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn de Nexova">
                  <LinkedInIcon />
                  LinkedIn
                </a>
                <a href="https://instagram.com/nexova" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors" aria-label="Instagram de Nexova">
                  <InstagramIcon />
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 Nexova. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
