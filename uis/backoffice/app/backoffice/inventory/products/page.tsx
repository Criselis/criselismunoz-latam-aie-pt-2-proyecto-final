"use client";

import { useCallback, useEffect, useState } from "react";
import { getProducts } from "@/lib/inventory";
import { AuthGuard } from "@/lib/auth-guard";
import { Header, Spinner, SearchIcon } from "@/lib/components";
import type { ProductOut } from "@/lib/types";
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

/**
 * Umbrales de nivel de cupo (stock):
 *   - <= 0  → Sin cupo     (rojo)
 *   - 1-5   → Crítico      (rojo)
 *   - 6-15  → Bajo         (ámbar)
 *   - 16-30 → Moderado     (amarillo)
 *   - > 30  → Disponible   (verde)
 */
function stockIndicator(stock: number): { label: string; dot: string; bg: string } {
  if (stock <= 0) return { label: "Sin cupo", dot: "bg-red-500", bg: "bg-red-50" };
  if (stock <= 5) return { label: "Crítico", dot: "bg-red-500", bg: "bg-red-50" };
  if (stock <= 15) return { label: "Bajo", dot: "bg-amber-500", bg: "bg-amber-50" };
  if (stock <= 30) return { label: "Moderado", dot: "bg-yellow-500", bg: "bg-yellow-50" };
  return { label: "Disponible", dot: "bg-green-500", bg: "bg-green-50" };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar los programas de formación."));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filtered = search.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  return (
    <AuthGuard>
      <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Programas de Formación</h1>
              <p className="mt-1 text-sm text-gray-500">
                Catálogo de programas formativos con cupos disponibles y acciones rápidas.
              </p>
            </div>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full sm:w-72 pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-red-800">Error al cargar el catálogo</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={() => void fetchProducts()}
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
              <p className="mt-4 text-sm text-gray-500">Cargando programas...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">
                {search ? "Sin resultados" : "Catálogo vacío"}
              </h2>
              <p className="text-sm text-gray-500">
                {search
                  ? "No se encontraron programas con ese nombre o SKU."
                  : "Aún no se han registrado programas formativos en el catálogo."}
              </p>
            </div>
          )}

          {/* Products table */}
          {!loading && filtered.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Programa</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Cupos disponibles</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Duración</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Participantes</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actualizado</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((product) => {
                      const indicator = stockIndicator(product.current_stock);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          {/* Name + description */}
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
                            )}
                          </td>

                          {/* SKU */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                            {product.sku}
                          </td>

                          {/* Stock indicator */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${indicator.bg}`}>
                              <span className={`w-2 h-2 rounded-full ${indicator.dot}`} aria-hidden="true" />
                              <span>{product.current_stock}</span>
                              <span className="text-gray-500 font-normal">({indicator.label})</span>
                            </div>
                          </td>

                          {/* Duration */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {product.duration_hours} h
                          </td>

                          {/* Price */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                            ${product.price.toLocaleString("es-CL")}
                          </td>

                          {/* Max participants */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {product.max_participants}
                          </td>

                          {/* Updated */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(product.updated_at)}
                          </td>

                          {/* Action buttons */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/backoffice/inventory/orders/inbound?product_id=${product.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Entrada
                              </Link>
                              <Link
                                href={`/backoffice/inventory/orders/outbound?product_id=${product.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                </svg>
                                Salida
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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