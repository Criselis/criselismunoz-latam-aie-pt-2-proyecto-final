// ============================================================
// Nexova Solutions — Sistema de gestión de colecciones
// ============================================================
// Funciones para filtrar, ordenar, buscar y agrupar elementos
// dentro de arrays. Funciones puras, tipadas y reutilizables.
// ============================================================

// -------------------------------------------------------
// Filtrado
// -------------------------------------------------------

/**
 * Filtra elementos de un array aplicando un predicado.
 * Versión genérica que funciona con cualquier tipo de colección.
 *
 * @param items - Array de elementos a filtrar
 * @param predicate - Función que determina qué elementos conservar
 * @returns Nuevo array con los elementos que cumplen el predicado
 */
export function filterItems<T>(
  items: T[],
  predicate: (item: T, index: number) => boolean
): T[] {
  return items.filter(predicate);
}

/**
 * Filtra elementos por un rango numérico (inclusive).
 *
 * @param items - Array de elementos
 * @param getValue - Función que extrae el valor numérico del elemento
 * @param min - Valor mínimo (inclusive)
 * @param max - Valor máximo (inclusive)
 * @returns Elementos cuyo valor está dentro del rango
 */
export function filterByRange<T>(
  items: T[],
  getValue: (item: T) => number,
  min: number,
  max: number
): T[] {
  return items.filter((item) => {
    const value = getValue(item);
    return value >= min && value <= max;
  });
}

/**
 * Filtra elementos que coinciden con al menos un valor de un conjunto.
 *
 * @param items - Array de elementos
 * @param getField - Función que extrae el campo a comparar
 * @param allowedValues - Conjunto de valores permitidos
 * @returns Elementos cuyo campo está en el conjunto permitido
 */
export function filterBySet<T, V>(
  items: T[],
  getField: (item: T) => V,
  allowedValues: V[]
): T[] {
  const allowed = new Set(allowedValues);
  return items.filter((item) => allowed.has(getField(item)));
}

// -------------------------------------------------------
// Ordenamiento
// -------------------------------------------------------

export type SortDirection = 'asc' | 'desc';

/**
 * Ordena elementos por un campo extraíble, de forma ascendente o descendente.
 *
 * @param items - Array de elementos a ordenar
 * @param getValue - Función que extrae el valor por el que ordenar
 * @param direction - Dirección del ordenamiento
 * @returns Nuevo array ordenado (no muta el original)
 */
export function sortBy<T>(
  items: T[],
  getValue: (item: T) => number | string | Date,
  direction: SortDirection = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const valA = getValue(a);
    const valB = getValue(b);

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Ordena elementos por múltiples criterios (orden por prioridad).
 *
 * @param items - Array de elementos a ordenar
 * @param criteria - Array de criterios de ordenación (por prioridad)
 * @returns Nuevo array ordenado
 */
export function sortByMultiple<T>(
  items: T[],
  criteria: {
    getValue: (item: T) => number | string | Date;
    direction: SortDirection;
  }[]
): T[] {
  return [...items].sort((a, b) => {
    for (const { getValue, direction } of criteria) {
      const valA = getValue(a);
      const valB = getValue(b);

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

// -------------------------------------------------------
// Agrupación
// -------------------------------------------------------

/**
 * Agrupa elementos de un array según un campo clave.
 *
 * @param items - Array de elementos a agrupar
 * @param getKey - Función que extrae la clave de agrupación
 * @returns Objeto con las claves como propiedades y arrays como valores
 */
export function groupBy<T, K extends string | number | symbol>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = getKey(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Agrupa elementos y cuenta cuántos hay en cada grupo.
 *
 * @param items - Array de elementos
 * @param getKey - Función que extrae la clave de agrupación
 * @returns Array de pares { category, count }
 */
export function countBy<T, K extends string | number | symbol>(
  items: T[],
  getKey: (item: T) => K
): { category: string; count: number }[] {
  const grouped = groupBy(items, getKey);
  return (Object.entries(grouped) as [string, T[]][]).map(([category, group]) => ({
    category,
    count: group.length,
  }));
}

// -------------------------------------------------------
// Paginación
// -------------------------------------------------------

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Pagina un array de elementos.
 *
 * @param items - Array completo de elementos
 * @param page - Número de página (1-based)
 * @param pageSize - Elementos por página
 * @returns Resultado paginado con metadatos
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

// -------------------------------------------------------
// Utilidades adicionales
// -------------------------------------------------------

/**
 * Obtiene los elementos únicos de un array.
 *
 * @param items - Array de elementos
 * @param getKey - Función que extrae la clave de unicidad
 * @returns Array con elementos únicos (primera ocurrencia)
 */
export function uniqueBy<T, K>(items: T[], getKey: (item: T) => K): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Obtiene los primeros N elementos de un array.
 *
 * @param items - Array de elementos
 * @param n - Número de elementos a tomar
 * @returns Primeros N elementos
 */
export function take<T>(items: T[], n: number): T[] {
  return items.slice(0, Math.max(0, n));
}

/**
 * Divide un array en fragmentos de tamaño fijo.
 *
 * @param items - Array de elementos
 * @param chunkSize - Tamaño de cada fragmento
 * @returns Array de fragmentos
 */
export function chunk<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    result.push(items.slice(i, i + chunkSize));
  }
  return result;
}