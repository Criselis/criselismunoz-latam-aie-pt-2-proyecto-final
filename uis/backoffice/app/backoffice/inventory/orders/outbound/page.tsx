"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProducts, createOutboundOrder } from "@/lib/inventory";
import { AuthGuard } from "@/lib/auth-guard";
import { Header, Spinner } from "@/lib/components";
import type { ProductOut, OutboundOrderCreate } from "@/lib/types";

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message.replace("Value error, ", "");
  }
  return fallback;
}

const emptyForm: OutboundOrderCreate = {
  product_id: "",
  quantity: 1,
  reason: "",
  notes: "",
};

export default function OutboundOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("product_id") || "";

  const [products, setProducts] = useState<ProductOut[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [form, setForm] = useState<OutboundOrderCreate>({ ...emptyForm, product_id: preselectedId });
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
  const exceedsStock = selectedProduct ? form.quantity > selectedProduct.current_stock : false;
  const stockLevel =
    selectedProduct && selectedProduct.current_stock <= 0
      ? "empty"
      : selectedProduct && selectedProduct.current_stock <= 5
      ? "critical"
      : selectedProduct && selectedProduct.current_stock <= 15
      ? "low"
      : "ok";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.product_id) {
      setSubmitError("Selecciona un programa antes de continuar.");
      return;
    }
    if (form.quantity < 1) {
      setSubmitError("La cantidad debe ser al menos 1.");
      return;
    }
    if (selectedProduct && form.quantity > selectedProduct.current_stock) {
      setSubmitError(
        `Cupos insuficientes. Disponibles: ${selectedProduct.current_stock}, solicitados: ${form.quantity}.`,
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await createOutboundOrder({
        product_id: form.product_id,
        quantity: form.quantity,
        reason: form.reason || null,
        notes: form.notes || null,
      });
      setSubmitSuccess(
        `Entrega registrada: -${form.quantity} cupo(s) de "${selectedProduct?.name ?? "programa"}".`,
      );
      setForm({ ...emptyForm, product_id: preselectedId });
    } catch (err) {
      const msg = friendlyError(err, "No se pudo registrar la entrega.");
      // Show error inline next to the quantity field — the API returns 400 for insufficient stock
      setSubmitError(msg);
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Registrar entrega</h1>
            <p className="mt-1 text-sm text-gray-500">
              Disminuye los cupos de un programa de formación registrando una salida del inventario.
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
                  <p className="text-sm font-medium text-emerald-800">Entrega registrada</p>
                  <p className="text-sm text-emerald-700 mt-1">{submitSuccess}</p>
                  <p className="text-xs text-emerald-500 mt-1">El formulario se ha reiniciado para una nueva salida.</p>
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
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, product_id: e.target.value, quantity: 1 }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                >
                  <option value="">-- Selecciona un programa --</option>
                  {products
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} — Cupos disponibles: {p.current_stock}
                      </option>
                    ))}
                </select>
              </div>

              {/* Stock info card — updates reactively when product changes */}
              {selectedProduct && (
                <div
                  className={`rounded-lg p-4 border ${
                    stockLevel === "empty"
                      ? "bg-red-50 border-red-200"
                      : stockLevel === "critical"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700">
                    Cupos disponibles de <strong>{selectedProduct.name}</strong>
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      stockLevel === "empty"
                        ? "text-red-700"
                        : stockLevel === "critical"
                        ? "text-amber-700"
                        : "text-blue-700"
                    }`}
                  >
                    {selectedProduct.current_stock} cupos
                  </p>
                  {stockLevel === "empty" && (
                    <p className="text-xs text-red-600 mt-1">
                      No puedes registrar una entrega porque no hay cupos disponibles.
                    </p>
                  )}
                  {stockLevel === "critical" && (
                    <p className="text-xs text-amber-600 mt-1">
                      El stock es muy bajo. Verifica que realmente necesitas hacer esta entrega.
                    </p>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de cupos a retirar <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  required
                  min={1}
                  max={selectedProduct?.current_stock ?? 1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:border-indigo-500 outline-none ${
                    exceedsStock ? "border-red-400 bg-red-50 ring-2 ring-red-200" : "border-gray-300 focus:ring-indigo-200"
                  }`}
                />
                {exceedsStock && (
                  <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
                    <svg className="w-4 h-4 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-xs text-red-700">
                      <strong>Stock insuficiente.</strong> Solo hay {selectedProduct!.current_stock} cupos disponibles y se han solicitado {form.quantity}.
                    </p>
                  </div>
                )}
                {selectedProduct && !exceedsStock && form.quantity > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Cupos posteriores estimados:{" "}
                    <strong>{selectedProduct.current_stock - form.quantity} cupos</strong>
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de la entrega <span className="text-red-500">*</span>
                </label>
                <select
                  id="reason"
                  required
                  value={form.reason ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                >
                  <option value="">-- Selecciona un motivo --</option>
                  <option value="Venta">Venta</option>
                  <option value="Capacitacion">Capacitación</option>
                  <option value="Prestamo">Préstamo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Perdida">Pérdida / Extravío</option>
                  <option value="Dano">Daño / Merma</option>
                  <option value="Otro">Otro</option>
                </select>
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
                  placeholder="Ej. Entregado a equipo de ventas, retiro para cliente..."
                />
              </div>

              {/* Error (includes HTTP 400 from API) */}
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
                  disabled={
                    submitting ||
                    !form.product_id ||
                    !form.reason ||
                    (selectedProduct ? form.quantity > selectedProduct.current_stock : false)
                  }
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <Spinner className="w-4 h-4" />}
                  {submitting ? "Registrando..." : "Registrar entrega"}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}