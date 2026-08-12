"use client";

import { useState, useEffect, useCallback, Suspense, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getRecords, createRecord } from "@/lib/api";
import type { RecordOut, Filters, RecordCreate } from "@/lib/types";
import {
  STATUS_LABELS, STAGE_LABELS, STATUS_COLORS, STAGE_COLORS,
  STATUS_VALUES, STAGE_VALUES,
} from "@/lib/types";
import {
  Header, Spinner, SearchIcon, PlusIcon, CloseIcon,
} from "@/lib/components";

function TrackerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [records, setRecords] = useState<RecordOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: searchParams.get("status") || "",
    stage: searchParams.get("stage") || "",
    search: searchParams.get("search") || "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Create form state
  const [newCandidate, setNewCandidate] = useState<RecordCreate>({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    experience_years: 0,
    linkedin_url: "",
    cv_url: "",
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | undefined> = {};
      if (filters.status) params.status = filters.status;
      if (filters.stage) params.stage = filters.stage;
      if (filters.search) params.search = filters.search;
      // Set a high limit to get all candidates
      params.limit = 100;
      const data = await getRecords(params);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar candidatos");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    syncUrlParams(next);
  };

  const clearFilters = () => {
    const cleared = { status: "", stage: "", search: "" };
    setFilters(cleared);
    syncUrlParams(cleared);
  };

  const syncUrlParams = (f: Filters) => {
    const params = new URLSearchParams();
    if (f.status) params.set("status", f.status);
    if (f.stage) params.set("stage", f.stage);
    if (f.search) params.set("search", f.search);
    const qs = params.toString();
    router.replace(`/tracker${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const hasActiveFilters = filters.status || filters.stage || filters.search;

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createRecord(newCandidate);
      setShowCreateModal(false);
      setNewCandidate({
        full_name: "",
        email: "",
        phone: "",
        position: "",
        experience_years: 0,
        linkedin_url: "",
        cv_url: "",
      });
      fetchRecords();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear candidato");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pipeline de Talento</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona los candidatos, su estado y etapa en el proceso de selección.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon />
            Nuevo candidato
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <label htmlFor="search" className="block text-xs font-medium text-gray-500 mb-1">
                Buscar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Nombre o email..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange("search", "")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label="Limpiar búsqueda"
                  >
                    <CloseIcon className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Status filter */}
            <div>
              <label htmlFor="status" className="block text-xs font-medium text-gray-500 mb-1">
                Estado
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="">Todos los estados</option>
                {STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {/* Stage filter */}
            <div>
              <label htmlFor="stage" className="block text-xs font-medium text-gray-500 mb-1">
                Etapa
              </label>
              <select
                id="stage"
                value={filters.stage}
                onChange={(e) => handleFilterChange("stage", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="">Todas las etapas</option>
                {STAGE_VALUES.map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {records.length} candidato{records.length !== 1 ? "s" : ""} encontrado{records.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg leading-none mt-0.5">⚠</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error al cargar candidatos</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={fetchRecords}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner className="w-8 h-8 text-indigo-600" />
            <p className="mt-4 text-sm text-gray-500">Cargando candidatos...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && records.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay candidatos</h3>
            <p className="text-sm text-gray-500 mb-4">
              {hasActiveFilters
                ? "No se encontraron candidatos con los filtros seleccionados."
                : "Aún no se han registrado candidatos en el pipeline."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Limpiar filtros
              </button>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors"
              >
                <PlusIcon />
                Registrar primer candidato
              </button>
            )}
          </div>
        )}

        {/* Candidate list */}
        {!loading && !error && records.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Candidato
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Puesto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Etapa
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Experiencia
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/candidates/${record.id}`}
                          className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
                        >
                          {record.full_name}
                        </Link>
                        <div className="text-xs text-gray-500">{record.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[record.status] || "bg-gray-100 text-gray-800"}`}>
                          {STATUS_LABELS[record.status] || record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[record.stage] || "bg-gray-100 text-gray-800"}`}>
                          {STAGE_LABELS[record.stage] || record.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.experience_years} años
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.notes_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/candidates/${record.id}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Ver detalle →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-8 text-left">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nuevo candidato</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Cerrar"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    required
                    value={newCandidate.full_name}
                    onChange={(e) => setNewCandidate((prev) => ({ ...prev, full_name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                    placeholder="María García López"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={newCandidate.email}
                      onChange={(e) => setNewCandidate((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                      placeholder="maria@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      type="text"
                      required
                      value={newCandidate.phone}
                      onChange={(e) => setNewCandidate((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                      placeholder="+34 612 345 678"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    Puesto <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="position"
                    type="text"
                    required
                    value={newCandidate.position}
                    onChange={(e) => setNewCandidate((prev) => ({ ...prev, position: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                    placeholder="Ingeniero de Software Senior"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700 mb-1">
                      Años de experiencia <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="experience_years"
                      type="number"
                      required
                      min={0}
                      max={50}
                      value={newCandidate.experience_years}
                      onChange={(e) => setNewCandidate((prev) => ({ ...prev, experience_years: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input
                      id="linkedin_url"
                      type="url"
                      value={newCandidate.linkedin_url || ""}
                      onChange={(e) => setNewCandidate((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                      placeholder="https://linkedin.com/in/maria"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cv_url" className="block text-sm font-medium text-gray-700 mb-1">
                    URL del CV
                  </label>
                  <input
                    id="cv_url"
                    type="url"
                    value={newCandidate.cv_url || ""}
                    onChange={(e) => setNewCandidate((prev) => ({ ...prev, cv_url: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{createError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {creating && <Spinner className="w-4 h-4" />}
                    {creating ? "Creando..." : "Crear candidato"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={
      <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner className="w-8 h-8 text-indigo-600 mx-auto" />
            <p className="mt-4 text-sm text-gray-500">Cargando...</p>
          </div>
        </main>
      </div>
    }>
      <TrackerContent />
    </Suspense>
  );
}
