"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProducts, createInboundOrder } from "@/lib/inventory";
import { AuthGuard } from "@/lib/auth-guard";
import { Header, Spinner } from "@/lib/components";
import type { ProductOut, InboundOrderCreate } from "@/lib/types";

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message.replace("Value error, ", "");
  }
  return fallback;
}

const emptyForm: InboundOrderCreate = {
  product_id: "",
  quantity: 1,
  notes: "",
};

export default function InboundOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("product_id") || "";

  const [products, setProducts] = useState<ProductOut[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [form, setForm] = useState<InboundOrderCreate>({ ...emptyForm, product_id: preselectedId });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setProductsError(friendlyError(err, "No se pudieron cargar los programas."));
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const selectedProduct = products.find((p) => p.id === form.product_id);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.product_id) {
      setSubmitError("Selecciona un programa de formación antes de continuar.");
      return;
    }
    if (form.quantity < 1) {
      setSubmitError("La cantidad debe ser al menos 1.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await createInboundOrder({
        product_id: form.product_id,
        quantity: form.quantity,
        notes: form.notes || null,
      });
      setSubmitSuccess(
        `Recepcion registrada: +${form.quantity} cupo(s) de "${selectedProduct?.name ?? "programa"}".`,
      );
      setForm({ ...emptyForm, product_id: preselectedId });
    } catch (err) {
      setSubmitError(friendlyError(err, "No se pudo registrar la recepcion de inventario."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Title */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/backoffice/inventory/orders")}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2 inline-block"
            >
              ← Volver a historial de movimientos
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Registrar recepcion</h1>
            <p className="mt-1 text-sm text-gray-500">
              Aumenta los cupos de un programa de formación registrando una entrada al inventario.
            </p>
          </div>

          {/* Products loading */}
          {productsLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner className="w-8 h-8 text-indigo-600" />
              <p className="mt-4 text-sm text-gray-500">Cargando programas...</p>
            </div>
          )}

          {/* Products error */}
          {productsError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">{productsError}</p>
              <button
                onClick={() => void fetchProducts()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Success message */}
          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-emerald-800">Recepcion registrada</p>
                  <p className="text-sm text-emerald-700 mt-1">{submitSuccess}</p>
                  <p className="text-xs text-emerald-500 mt-1">El formulario se ha reiniciado para una nueva entrada.</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          {!productsLoading && !productsError && (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6"
            >
              {/* Product selector */}
              <div>
                <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Programa de formacion <span className="text-red-500">*</span>
                </label>
                <select
                  id="product_id"
                  required
                  value={form.product_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, product_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                >
                  <option value="">-- Selecciona un programa --</option>
                  {products
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} — Cupos actuales: {p.current_stock}
                      </option>
                    ))}
                </select>
                {selectedProduct && (
                  <p className="mt-1 text-xs text-gray-500">
                    Cupos actuales de <strong>{selectedProduct.name}</strong>:{" "}
                    <strong className={selectedProduct.current_stock <= 5 ? "text-red-600" : "text-green-600"}>
                      {selectedProduct.current_stock}
                    </strong>
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de cupos a recibir <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  required
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 0) }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                />
                {selectedProduct && form.quantity > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Total estimado tras recepcion:{" "}
                    <strong>{selectedProduct.current_stock + form.quantity} cupos</strong>
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={form.notes || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-y"
                  placeholder="Ej. Recepcion de proveedor, reabastecimiento de cupos..."
                />
              </div>

              {/* Error */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/backoffice/inventory/orders")}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.product_id}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <Spinner className="w-4 h-4" />}
                  {submitting ? "Registrando..." : "Registrar recepcion"}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}