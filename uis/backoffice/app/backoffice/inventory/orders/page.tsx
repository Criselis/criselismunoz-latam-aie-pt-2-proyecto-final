"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrders } from "@/lib/inventory";
import { AuthGuard } from "@/lib/auth-guard";
import { Header, Spinner } from "@/lib/components";
import type { OrderOut } from "@/lib/types";
import Link from "next/link";

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message.replace("Value error, ", "");
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

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<OrderOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "inbound" | "outbound">("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders();
      data.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setOrders(data);
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar los movimientos de inventario."));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const filtered = filterType === "all"
    ? orders
    : orders.filter((o) => o.order_type === filterType);

  return (
    <AuthGuard>
      <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Title + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Historial de movimientos</h1>
              <p className="mt-1 text-sm text-gray-500">
                Registro de recepciones y entregas de programas de formación.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/backoffice/inventory/orders/inbound"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Nueva recepcion
              </Link>
              <Link
                href="/backoffice/inventory/orders/outbound"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Nueva entrega
              </Link>
            </div>
          </div>

          {/* Type filter tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
            {(["all", "inbound", "outbound"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterType === t
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t === "all" ? "Todos" : t === "inbound" ? "Recepciones" : "Entregas"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-red-800">Error al cargar</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={() => void fetchOrders()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner className="w-8 h-8 text-indigo-600" />
              <p className="mt-4 text-sm text-gray-500">Cargando movimientos...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">No hay movimientos</h2>
              <p className="text-sm text-gray-500 mb-4">
                {filterType !== "all"
                  ? `No hay movimientos de tipo "${filterType === "inbound" ? "recepcion" : "entrega"}".`
                  : "Aun no se han registrado movimientos de inventario."}
              </p>
              <Link
                href="/backoffice/inventory/orders/inbound"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800"
              >
                Registrar primera recepcion
              </Link>
            </div>
          )}

          {/* Orders table — read-only */}
          {!loading && filtered.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Programa</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cupos</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrado por</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notas</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors align-top"
                      >
                        {/* Type badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              order.order_type === "inbound"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.order_type === "inbound" ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Recepcion
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                </svg>
                                Entrega
                              </>
                            )}
                          </span>
                        </td>

                        {/* Product name */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.product_name}
                        </td>

                        {/* Quantity */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                          <span
                            className={
                              order.order_type === "inbound"
                                ? "text-green-600"
                                : "text-amber-600"
                            }
                          >
                            {order.order_type === "inbound" ? "+" : "-"}
                            {order.quantity}
                          </span>
                        </td>

                        {/* Reason (only for outbound) */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {order.reason || "—"}
                        </td>

                        {/* User UUID */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {order.user_uuid.slice(0, 8)}...
                        </td>

                        {/* Notes */}
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          {order.notes ? (
                            <p className="line-clamp-2">{order.notes}</p>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}