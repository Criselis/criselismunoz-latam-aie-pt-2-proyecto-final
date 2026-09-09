"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, createIncident, getIncidents, getIncidentsSummary, transitionIncidentStatus } from "@/lib/api";
import {
  INCIDENT_BRANCH_LABELS,
  INCIDENT_BRANCH_VALUES,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_CATEGORY_VALUES,
  INCIDENT_ORIGIN_LABELS,
  INCIDENT_ORIGIN_VALUES,
  INCIDENT_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_VALUES,
  type IncidentCreate,
  type IncidentFilters,
  type IncidentOut,
  type IncidentStatusValue,
} from "@/lib/types";
import { CloseIcon, Header, PlusIcon, SearchIcon, Spinner } from "@/lib/components";

const emptyIncident: IncidentCreate = {
  title: "",
  description: "",
  category: "customer_support",
  origin: "customer",
  branch: "central",
};

function friendlyError(error: unknown, fallback: string) {
  const labels: Record<string, string> = {
    title: "Título",
    description: "Descripción",
    category: "Categoría",
    status: "Estado",
    origin: "Origen",
    branch: "Sede",
    open: "abierta",
    in_progress: "en progreso",
    resolved: "resuelta",
    discarded: "descartada",
  };

  if (error instanceof ApiError && error.status >= 500) {
    return "El servidor no pudo completar la operación. Inténtalo de nuevo en unos minutos.";
  }
  if (error instanceof Error) {
    return Object.entries(labels).reduce(
      (message, [technicalValue, readableValue]) => message.replaceAll(technicalValue, readableValue),
      error.message.replaceAll("Value error, ", ""),
    );
  }
  return fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentOut[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
    by_origin: Record<string, number>;
    by_branch: Record<string, number>;
  }>({
    total: 0,
    by_status: {},
    by_category: {},
    by_origin: {},
    by_branch: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [filters, setFilters] = useState<IncidentFilters>({
    status: "",
    category: "",
    origin: "",
    branch: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [newIncident, setNewIncident] = useState<IncidentCreate>(emptyIncident);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await getIncidentsSummary();
      setSummary(data);
    } catch (err) {
      setSummaryError(friendlyError(err, "No se pudieron cargar las métricas."));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchIncidents = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getIncidents(filters);
      setIncidents(data);
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar las incidencias."));
      setIncidents([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialIncidents() {
      try {
        const data = await getIncidents(filters);
        if (!cancelled) {
          setIncidents(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(friendlyError(err, "No se pudieron cargar las incidencias."));
          setIncidents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialIncidents();
    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [filters, loadSummary]);

  const retryFetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIncidents(filters);
      setIncidents(data);
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar las incidencias."));
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (key: keyof IncidentFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: "", category: "", origin: "", branch: "", search: "" });
  };

  const handleCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!newIncident.title.trim() || !newIncident.description.trim()) {
      setCreateError("Completa el título y la descripción antes de registrar la incidencia.");
      return;
    }

    if (newIncident.origin === "branch" && !newIncident.branch) {
      setCreateError("La sede es obligatoria cuando la incidencia se reporta desde una sede.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      await createIncident({
        ...newIncident,
        title: newIncident.title.trim(),
        description: newIncident.description.trim(),
      });
      setCreateSuccess("Incidencia registrada correctamente. Ya está visible en el panel principal.");
      setShowCreateModal(false);
      setNewIncident(emptyIncident);
      await Promise.all([fetchIncidents(false), loadSummary()]);
    } catch (err) {
      setCreateError(friendlyError(err, "No se pudo registrar la incidencia."));
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (incidentId: string, status: IncidentStatusValue) => {
    const previousIncident = incidents.find((incident) => incident.id === incidentId);
    if (!previousIncident || previousIncident.status === status) {
      return;
    }

    setUpdatingId(incidentId);
    setError(null);
    setIncidents((prev) => prev.map((incident) => (
      incident.id === incidentId ? { ...incident, status } : incident
    )));
    try {
      const updated = await transitionIncidentStatus(incidentId, status);
      setIncidents((prev) => prev.map((incident) => incident.id === incidentId ? updated : incident));
      await loadSummary();
    } catch (err) {
      setIncidents((prev) => prev.map((incident) => incident.id === incidentId ? previousIncident : incident));
      setError(friendlyError(err, "No se pudo actualizar el estado de la incidencia."));
    } finally {
      setUpdatingId(null);
    }
  };

  const summaryCards = [
    { label: "Total", value: summary.total, accent: "bg-indigo-50 text-indigo-700" },
    { label: "Abiertas", value: summary.by_status.open ?? 0, accent: "bg-blue-50 text-blue-700" },
    { label: "En progreso", value: summary.by_status.in_progress ?? 0, accent: "bg-amber-50 text-amber-700" },
    { label: "Resueltas", value: summary.by_status.resolved ?? 0, accent: "bg-green-50 text-green-700" },
    { label: "Descartadas", value: summary.by_status.discarded ?? 0, accent: "bg-gray-100 text-gray-700" },
  ];

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestor de Incidencias</h1>
            <p className="mt-1 text-sm text-gray-500">
              Registra, filtra y actualiza incidencias de clientes, sedes y equipos internos.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon />
            Nueva incidencia
          </button>
        </div>

        {createSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-emerald-800">Incidencia registrada</p>
            <p className="text-sm text-emerald-700 mt-1">{createSuccess}</p>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className={`rounded-xl border border-gray-200 ${card.accent} p-4`}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">{card.label}</p>
              <p className="mt-3 text-3xl font-bold">{card.value}</p>
            </div>
          ))}
        </section>

        {summaryError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">No se pudieron cargar las métricas.</p>
            <p className="text-sm text-amber-700 mt-1">{summaryError}</p>
          </div>
        )}

        {!summaryLoading && !summaryError && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Por categoría</h2>
              <ul className="space-y-2">
                {INCIDENT_CATEGORY_VALUES.map((category) => (
                  <li key={category} className="flex items-center justify-between text-sm text-gray-600">
                    <span>{INCIDENT_CATEGORY_LABELS[category]}</span>
                    <span className="font-semibold text-gray-900">{summary.by_category[category] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Por origen</h2>
              <ul className="space-y-2">
                {INCIDENT_ORIGIN_VALUES.map((origin) => (
                  <li key={origin} className="flex items-center justify-between text-sm text-gray-600">
                    <span>{INCIDENT_ORIGIN_LABELS[origin]}</span>
                    <span className="font-semibold text-gray-900">{summary.by_origin[origin] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Por sede</h2>
              <ul className="space-y-2">
                {INCIDENT_BRANCH_VALUES.map((branch) => (
                  <li key={branch} className="flex items-center justify-between text-sm text-gray-600">
                    <span>{INCIDENT_BRANCH_LABELS[branch]}</span>
                    <span className="font-semibold text-gray-900">{summary.by_branch[branch] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="incident-search" className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  id="incident-search"
                  type="text"
                  value={filters.search}
                  onChange={(event) => handleFilterChange("search", event.target.value)}
                  placeholder="Título o descripción..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="incident-status" className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <select id="incident-status" value={filters.status} onChange={(event) => handleFilterChange("status", event.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none">
                <option value="">Todos</option>
                {INCIDENT_STATUS_VALUES.map((status) => <option key={status} value={status}>{INCIDENT_STATUS_LABELS[status]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="incident-category" className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
              <select id="incident-category" value={filters.category} onChange={(event) => handleFilterChange("category", event.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none">
                <option value="">Todas</option>
                {INCIDENT_CATEGORY_VALUES.map((category) => <option key={category} value={category}>{INCIDENT_CATEGORY_LABELS[category]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="incident-origin" className="block text-xs font-medium text-gray-500 mb-1">Origen</label>
              <select id="incident-origin" value={filters.origin} onChange={(event) => handleFilterChange("origin", event.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none">
                <option value="">Todos</option>
                {INCIDENT_ORIGIN_VALUES.map((origin) => <option key={origin} value={origin}>{INCIDENT_ORIGIN_LABELS[origin]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="incident-branch" className="block text-xs font-medium text-gray-500 mb-1">Sede</label>
              <select id="incident-branch" value={filters.branch} onChange={(event) => handleFilterChange("branch", event.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none">
                <option value="">Todas</option>
                {INCIDENT_BRANCH_VALUES.map((branch) => <option key={branch} value={branch}>{INCIDENT_BRANCH_LABELS[branch]}</option>)}
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">{incidents.length} incidencia{incidents.length !== 1 ? "s" : ""} encontrada{incidents.length !== 1 ? "s" : ""}</p>
              <button onClick={clearFilters} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Limpiar filtros</button>
            </div>
          )}
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-red-800">No se pudo completar la operación</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button onClick={retryFetchIncidents} className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline">Intentar de nuevo</button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner className="w-8 h-8 text-indigo-600" />
            <p className="mt-4 text-sm text-gray-500">Cargando incidencias...</p>
          </div>
        )}

        {!loading && !error && incidents.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">No hay incidencias</h2>
            <p className="text-sm text-gray-500 mb-4">{hasActiveFilters ? "No se encontraron incidencias con esos filtros." : "Registra la primera incidencia desde el formulario."}</p>
            <button onClick={hasActiveFilters ? clearFilters : () => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors">
              {hasActiveFilters ? "Limpiar filtros" : "Registrar incidencia"}
            </button>
          </div>
        )}

        {!loading && incidents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Incidencia</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Origen</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sede</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actualizada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-gray-50 transition-colors align-top">
                      <td className="px-6 py-4 max-w-sm">
                        <p className="text-sm font-medium text-gray-900">{incident.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{incident.description}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{INCIDENT_CATEGORY_LABELS[incident.category]}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{INCIDENT_ORIGIN_LABELS[incident.origin]}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{INCIDENT_BRANCH_LABELS[incident.branch]}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={incident.status}
                          disabled={updatingId === incident.id}
                          onChange={(event) => handleStatusChange(incident.id, event.target.value as IncidentStatusValue)}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${INCIDENT_STATUS_COLORS[incident.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {INCIDENT_STATUS_VALUES.map((status) => <option key={status} value={status}>{INCIDENT_STATUS_LABELS[status]}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(incident.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 sm:p-8 text-left">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nueva incidencia</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Cerrar">
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
                  <input id="title" required value={newIncident.title} onChange={(event) => setNewIncident((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none" placeholder="Ej. Cliente no puede acceder al portal" />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
                  <textarea id="description" required rows={5} value={newIncident.description} onChange={(event) => setNewIncident((prev) => ({ ...prev, description: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-y" placeholder="Describe qué ocurrió, a quién afecta y qué impacto tiene." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select id="category" value={newIncident.category} onChange={(event) => setNewIncident((prev) => ({ ...prev, category: event.target.value as IncidentCreate["category"] }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none">
                      {INCIDENT_CATEGORY_VALUES.map((category) => <option key={category} value={category}>{INCIDENT_CATEGORY_LABELS[category]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                    <select id="origin" value={newIncident.origin} onChange={(event) => setNewIncident((prev) => ({ ...prev, origin: event.target.value as IncidentCreate["origin"] }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none">
                      {INCIDENT_ORIGIN_VALUES.map((origin) => <option key={origin} value={origin}>{INCIDENT_ORIGIN_LABELS[origin]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">Sede <span className="text-red-500">*</span></label>
                    <select
                      id="branch"
                      value={newIncident.branch}
                      onChange={(event) => setNewIncident((prev) => ({ ...prev, branch: event.target.value as IncidentCreate["branch"] }))}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white focus:ring-2 focus:border-indigo-500 outline-none ${newIncident.origin === "branch" ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100" : "border-gray-300 focus:ring-indigo-200"}`}
                    >
                      {INCIDENT_BRANCH_VALUES.map((branch) => <option key={branch} value={branch}>{INCIDENT_BRANCH_LABELS[branch]}</option>)}
                    </select>
                    {newIncident.origin === "branch" && (
                      <p className="mt-1 text-xs text-amber-700">La incidencia reportada desde una sede requiere asignar la sede responsable.</p>
                    )}
                  </div>
                </div>

                {createError && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-sm text-red-700">{createError}</p></div>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" disabled={creating} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                    {creating && <Spinner className="w-4 h-4" />}
                    {creating ? "Registrando..." : "Registrar incidencia"}
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