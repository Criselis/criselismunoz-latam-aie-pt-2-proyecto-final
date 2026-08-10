/* Algoritmos de búsqueda: Implementaciones de búsqueda lineal 
y búsqueda binaria, correctamente tipadas y con manejo de casos frontera. */


// Búsqueda Lineal

/**
 * Resultado de una búsqueda.
 */
export interface SearchResult<T> {
  found: boolean;
  index: number;
  item: T | null;
}

/**
 * Realiza una búsqueda lineal sobre un array.
 * Útil para arrays desordenados o cuando el array es pequeño.
 *
 * Complejidad: O(n)
 *
 * @param items - Array de elementos donde buscar (no requiere orden)
 * @param predicate - Función que determina si un elemento es el buscado
 * @returns Resultado de la búsqueda con el elemento encontrado y su índice
 */
export function linearSearch<T>(
  items: T[],
  predicate: (item: T) => boolean
): SearchResult<T> {
  for (let i = 0; i < items.length; i++) {
    if (predicate(items[i])) {
      return { found: true, index: i, item: items[i] };
    }
  }
  return { found: false, index: -1, item: null };
}

/**
 * Realiza una búsqueda lineal que encuentra TODAS las coincidencias.
 *
 * @param items - Array de elementos donde buscar
 * @param predicate - Función que determina si un elemento coincide
 * @returns Array con todos los elementos que cumplen el predicado
 */
export function linearSearchAll<T>(
  items: T[],
  predicate: (item: T) => boolean
): T[] {
  return items.filter(predicate);
}

// Búsqueda Binaria

/**
 * Realiza una búsqueda binaria sobre un array ordenado.
 * El array DEBE estar ordenado por el mismo campo usado en la comparación.
 *
 * Complejidad: O(log n)
 *
 * @param items - Array de elementos ordenado ascendentemente
 * @param getValue - Función que extrae el valor comparable del elemento
 * @param target - Valor buscado
 * @returns Resultado de la búsqueda con el elemento encontrado y su índice
 */
export function binarySearch<T>(
  items: T[],
  getValue: (item: T) => number | string | Date,
  target: number | string | Date
): SearchResult<T> {
  if (items.length === 0) {
    return { found: false, index: -1, item: null };
  }

  let left = 0;
  let right = items.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = getValue(items[mid]);

    if (midValue === target) {
      return { found: true, index: mid, item: items[mid] };
    }

    if (midValue < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return { found: false, index: -1, item: null };
}

/**
 * Realiza una búsqueda binaria y devuelve el índice de inserción
 * si el elemento no se encuentra. Útil para mantener arrays ordenados.
 *
 * @param items - Array de elementos ordenado ascendentemente
 * @param getValue - Función que extrae el valor comparable del elemento
 * @param target - Valor buscado
 * @returns Objeto con found, index e item. Si no se encuentra,
 *          insertionIndex indica dónde debería insertarse.
 */
export function binarySearchWithInsertionIndex<T>(
  items: T[],
  getValue: (item: T) => number | string | Date,
  target: number | string | Date
): SearchResult<T> & { insertionIndex: number } {
  if (items.length === 0) {
    return { found: false, index: -1, item: null, insertionIndex: 0 };
  }

  let left = 0;
  let right = items.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = getValue(items[mid]);

    if (midValue === target) {
      return { found: true, index: mid, item: items[mid], insertionIndex: mid };
    }

    if (midValue < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return { found: false, index: -1, item: null, insertionIndex: left };
}

// -------------------------------------------------------
// Función auxiliar: verificar si un array está ordenado
// -------------------------------------------------------

/**
 * Verifica si un array está ordenado ascendentemente según un campo.
 *
 * @param items - Array de elementos
 * @param getValue - Función que extrae el valor comparable
 * @returns true si el array está ordenado ascendentemente
 */
export function isSorted<T>(
  items: T[],
  getValue: (item: T) => number | string | Date
): boolean {
  for (let i = 1; i < items.length; i++) {
    if (getValue(items[i - 1]) > getValue(items[i])) {
      return false;
    }
  }
  return true;
}

// -------------------------------------------------------
// Selector automático de búsqueda
// -------------------------------------------------------

/**
 * Selecciona automáticamente el algoritmo de búsqueda más adecuado.
 * Usa búsqueda binaria si el array está ordenado y tiene más de 32 elementos,
 * de lo contrario usa búsqueda lineal.
 *
 * @param items - Array de elementos donde buscar
 * @param getValue - Función que extrae el valor comparable
 * @param target - Valor buscado
 * @returns Resultado de la búsqueda
 */
export function smartSearch<T>(
  items: T[],
  getValue: (item: T) => number | string | Date,
  target: number | string | Date
): SearchResult<T> {
  if (items.length > 32 && isSorted(items, getValue)) {
    return binarySearch(items, getValue, target);
  }
  return linearSearch(items, (item) => getValue(item) === target);
}