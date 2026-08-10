// ============================================================
// Nexova Solutions — Transformaciones y agregaciones
// ============================================================
// Funciones que toman colecciones de objetos y generan reportes:
// conteos por categoría, sumas, máximos, mínimos, promedios.
// ============================================================

import { NumericSummary } from '../types/models';

// -------------------------------------------------------
// Resumen numérico
// -------------------------------------------------------

/**
 * Calcula el resumen estadístico de una colección de valores numéricos.
 * Incluye suma, promedio, mínimo, máximo y cantidad de elementos.
 *
 * @param items - Array de elementos
 * @param getValue - Función que extrae el valor numérico
 * @returns Resumen numérico (suma, promedio, min, max, count)
 */
export function numericSummary<T>(
  items: T[],
  getValue: (item: T) => number
): NumericSummary {
  if (items.length === 0) {
    return { sum: 0, average: 0, min: 0, max: 0, count: 0 };
  }

  const values = items.map(getValue);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    sum,
    average: sum / values.length,
    min,
    max,
    count: values.length,
  };
}

// -------------------------------------------------------
// Suma
// -------------------------------------------------------

/**
 * Suma los valores numéricos extraídos de una colección.
 *
 * @param items - Array de elementos
 * @param getValue - Función que extrae el valor numérico
 * @returns Suma total
 */
export function sumBy<T>(items: T[], getValue: (item: T) => number): number {
  return items.reduce((acc, item) => acc + getValue(item), 0);
}

// -------------------------------------------------------
// Promedio
// -------------------------------------------------------

/**
 * Calcula el promedio de los valores numéricos de una colección.
 *
 * @param items - Array de elementos
 * @param getValue - Función que extrae el valor numérico
 * @returns Promedio, o 0 si el array está vacío
 */
export function averageBy<T>(
  items: T[],
  getValue: (item: T) => number
): number {
  if (items.length === 0) return 0;
  return sumBy(items, getValue) / items.length;
}

// -------------------------------------------------------
// Máximo y mínimo
// -------------------------------------------------------

/**
 * Encuentra el elemento con el valor máximo según un campo.
 *
 * @param items - Array de elementos
 * @param getValue - Función que extrae el valor comparable
 * @returns Elemento con el valor máximo, o null si el array está vacío
 */
export function maxBy<T>(
  items: T[],
  getValue: (item: T) => number | string | Date
): T | null {
  if (items.length === 0) return null;

  return items.reduce((best, current) =>
    getValue(current) > getValue(best) ? current : best
  );
}

/**
 * Encuentra el elemento con el valor mínimo según un campo.
 *
 * @param items - Array de elementos
 * @param getValue - Función que extrae el valor comparable
 * @returns Elemento con el valor mínimo, o null si el array está vacío
 */
export function minBy<T>(
  items: T[],
  getValue: (item: T) => number | string | Date
): T | null {
  if (items.length === 0) return null;

  return items.reduce((best, current) =>
    getValue(current) < getValue(best) ? current : best
  );
}

// -------------------------------------------------------
// Conteo por categoría
// -------------------------------------------------------

/**
 * Cuenta elementos por un campo categórico y devuelve un resumen ordenado.
 *
 * @param items - Array de elementos
 * @param getKey - Función que extrae la categoría
 * @returns Array de { category, count } ordenado por count descendente
 */
export function countByCategory<T>(
  items: T[],
  getKey: (item: T) => string
): { category: string; count: number }[] {
  const counts: Record<string, number> = {};

  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// -------------------------------------------------------
// Distribución de valores
// -------------------------------------------------------

/**
 * Calcula el porcentaje que representa cada categoría sobre el total.
 *
 * @param items - Array de elementos
 * @param getKey - Función que extrae la categoría
 * @returns Array de { category, count, percentage }
 */
export function categoryDistribution<T>(
  items: T[],
  getKey: (item: T) => string
): { category: string; count: number; percentage: number }[] {
  if (items.length === 0) return [];

  const counts = countByCategory(items, getKey);
  return counts.map(({ category, count }) => ({
    category,
    count,
    percentage: Math.round((count / items.length) * 100 * 100) / 100, // 2 decimales
  }));
}

// -------------------------------------------------------
// Reporte de ventas (pipeline)
// -------------------------------------------------------

export interface SalesPipelineReport {
  totalAmount: number;
  weightedAmount: number;
  avgDealSize: number;
  dealsByStage: { stage: string; count: number; amount: number }[];
  topDeals: { id: string; amount: number; stage: string }[];
}

// -------------------------------------------------------
// Reporte de tickets de soporte
// -------------------------------------------------------

export interface SupportReport {
  total: number;
  open: number;
  resolved: number;
  slaComplianceRate: number;
  avgResolutionHours: number;
  byPriority: { category: string; count: number }[];
  bySentiment: { category: string; count: number }[];
}

// -------------------------------------------------------
// Reporte de formación
// -------------------------------------------------------

export interface TrainingReport {
  totalActive: number;
  totalParticipants: number;
  averageProgress: number;
  completionRate: number;
  revenuePotential: number;
  byCategory: { category: string; count: number }[];
}

// -------------------------------------------------------
// Reporte de candidatos
// -------------------------------------------------------

export interface CandidateReport {
  total: number;
  averageScore: number;
  byStatus: { category: string; count: number }[];
  byEnglishLevel: { category: string; count: number }[];
  topSkills: { category: string; count: number }[];
}