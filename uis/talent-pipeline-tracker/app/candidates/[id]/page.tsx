"use client";

import { useState, useEffect, useCallback, use, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRecordById, getNotes, addNote, deleteNote, patchRecord, replaceRecord } from "@/lib/api";
import type { RecordOut, NoteOut, RecordPatch, RecordCreate } from "@/lib/types";
import {
  STATUS_LABELS, STAGE_LABELS, STATUS_COLORS, STAGE_COLORS,
  STATUS_VALUES, STAGE_VALUES,
} from "@/lib/types";
import {
  Header, Spinner, ChevronLeft, TrashIcon, EditIcon, CloseIcon, PlusIcon,
  MailIcon, PhoneIcon, LinkedInIcon,
} from "@/lib/components";

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [candidate, setCandidate] = useState<RecordOut | null>(null);
  const [notes, setNotes] = useState<NoteOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Notes
  const [newNoteContent, setNewNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RecordCreate>({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    experience_years: 0,
    linkedin_url: "",
    cv_url: "",
  });

  const fetchCandidate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [candidateData, notesData] = await Promise.all([
        getRecordById(id),
        getNotes(id),
      ]);
      setCandidate(candidateData);
      setNotes(notesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el candidato");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  // Open edit modal with current data
  const openEditModal = () => {
    if (!candidate) return;
    setEditForm({
      full_name: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      experience_years: candidate.experience_years,
      linkedin_url: candidate.linkedin_url || "",
      cv_url: candidate.cv_url || "",
    });
    setEditError(null);
    setShowEditModal(true);
  };

  // Handle status/stage change
  const handlePatch = async (field: "status" | "stage", value: string) => {
    setActionLoading(`${field}-${value}`);
    try {
      const updated = await patchRecord(id, { [field]: value } as RecordPatch);
      setCandidate(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle add note
  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    setAddingNote(true);
    setNoteError(null);
    try {
      const newNote = await addNote(id, { content: newNoteContent.trim() });
      setNotes((prev) => [...prev, newNote]);
      setNewNoteContent("");
      // Update notes count
      setCandidate((prev) => prev ? { ...prev, notes_count: prev.notes_count + 1 } : null);
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Error al añadir nota");
    } finally {
      setAddingNote(false);
    }
  };

  // Handle delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("¿Eliminar esta nota?")) return;
    setActionLoading(`delete-note-${noteId}`);
    try {
      await deleteNote(id, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setCandidate((prev) => prev ? { ...prev, notes_count: prev.notes_count - 1 } : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar nota");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEditing(true);
    setEditError(null);
    try {
      const updated = await replaceRecord(id, editForm);
      setCandidate(updated);
      setShowEditModal(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al actualizar candidato");
    } finally {
      setEditing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner className="w-10 h-10 text-indigo-600 mx-auto" />
            <p className="mt-4 text-sm text-gray-500">Cargando candidato...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !candidate) {
    return (
      <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-2xl leading-none mt-1">⚠</span>
              <div>
                <h2 className="text-lg font-semibold text-red-800">Error</h2>
                <p className="text-sm text-red-600 mt-1">{error || "Candidato no encontrado"}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={fetchCandidate}
                    className="text-sm font-medium text-red-700 hover:text-red-900 underline"
                  >
                    Intentar de nuevo
                  </button>
                  <Link
                    href="/"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Volver al listado
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-700 transition-colors mb-6"
        >
          <ChevronLeft />
          Volver al listado
        </Link>

        {/* Candidate header card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {candidate.full_name}
              </h1>
              <p className="text-lg text-gray-600 mt-1">{candidate.position}</p>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[candidate.status] || "bg-gray-100 text-gray-800"}`}>
                  {STATUS_LABELS[candidate.status] || candidate.status}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STAGE_COLORS[candidate.stage] || "bg-gray-100 text-gray-800"}`}>
                  {STAGE_LABELS[candidate.stage] || candidate.stage}
                </span>
                <span className="text-sm text-gray-400">
                  {candidate.experience_years} años de exp.
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MailIcon />
                  <a href={`mailto:${candidate.email}`} className="text-indigo-600 hover:text-indigo-800">
                    {candidate.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <PhoneIcon />
                  <a href={`tel:${candidate.phone}`} className="hover:text-indigo-600">
                    {candidate.phone}
                  </a>
                </div>
                {candidate.linkedin_url && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <LinkedInIcon />
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                {candidate.cv_url && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <a
                      href={candidate.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Ver CV
                    </a>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <EditIcon />
              Editar datos
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex flex-wrap gap-x-6">
            <span>Postulado: {formatDate(candidate.applied_at)}</span>
            <span>Actualizado: {formatDate(candidate.updated_at)}</span>
            <span>{candidate.notes_count} nota{candidate.notes_count !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Status/Stage quick update */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Status selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_VALUES.map((s) => (
                <button
                  key={s}
                  onClick={() => handlePatch("status", s)}
                  disabled={actionLoading?.startsWith("status")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    candidate.status === s
                      ? `${STATUS_COLORS[s]} border-current shadow-sm`
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {STATUS_LABELS[s]}
                  {actionLoading === `status-${s}` && (
                    <Spinner className="w-3 h-3 ml-1.5 inline-block" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stage selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Etapa</label>
            <div className="flex flex-wrap gap-2">
              {STAGE_VALUES.map((s) => (
                <button
                  key={s}
                  onClick={() => handlePatch("stage", s)}
                  disabled={actionLoading?.startsWith("stage")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    candidate.stage === s
                      ? `${STAGE_COLORS[s]} border-current shadow-sm`
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {STAGE_LABELS[s]}
                  {actionLoading === `stage-${s}` && (
                    <Spinner className="w-3 h-3 ml-1.5 inline-block" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notas internas
            {notes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({notes.length})</span>
            )}
          </h2>

          {/* Add note form */}
          <form onSubmit={handleAddNote} className="mb-6">
            <label htmlFor="new-note" className="sr-only">Nueva nota</label>
            <textarea
              id="new-note"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Añade una nota interna sobre este candidato..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-none"
            />
            {noteError && (
              <p className="mt-1.5 text-sm text-red-600">{noteError}</p>
            )}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!newNoteContent.trim() || addingNote}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addingNote ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Añadiendo...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Añadir nota
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Notes list */}
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No hay notas internas para este candidato.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...notes].reverse().map((note) => (
                <div
                  key={note.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(note.created_at).toLocaleString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={actionLoading === `delete-note-${note.id}`}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1"
                    aria-label="Eliminar nota"
                  >
                    {actionLoading === `delete-note-${note.id}` ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <TrashIcon />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={() => setShowEditModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-8 text-left">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar candidato</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Cerrar"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label htmlFor="edit_full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit_full_name"
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit_email"
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit_phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit_phone"
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit_position" className="block text-sm font-medium text-gray-700 mb-1">
                    Puesto <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit_position"
                    type="text"
                    required
                    value={editForm.position}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, position: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit_experience_years" className="block text-sm font-medium text-gray-700 mb-1">
                      Años de experiencia <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit_experience_years"
                      type="number"
                      required
                      min={0}
                      max={50}
                      value={editForm.experience_years}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, experience_years: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit_linkedin_url" className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input
                      id="edit_linkedin_url"
                      type="url"
                      value={editForm.linkedin_url || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit_cv_url" className="block text-sm font-medium text-gray-700 mb-1">
                    URL del CV
                  </label>
                  <input
                    id="edit_cv_url"
                    type="url"
                    value={editForm.cv_url || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, cv_url: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                {editError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{editError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editing}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {editing && <Spinner className="w-4 h-4" />}
                    {editing ? "Guardando..." : "Guardar cambios"}
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
