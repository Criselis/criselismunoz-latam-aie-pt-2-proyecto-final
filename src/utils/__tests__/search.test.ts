/**
 * Tests for search utilities — linear/linear-all/binary search,
 * binary-search-with-insertion-index, sorted check, and smart search.
 *
 * Covers:
 *  ✅ Happy path — item present, standard queries
 *  🔸 Edge cases — empty arrays, single elements, boundaries
 *  ❌ Failure modes — item absent, unsorted input for binary
 */

import {
  linearSearch,
  linearSearchAll,
  binarySearch,
  binarySearchWithInsertionIndex,
  isSorted,
  smartSearch,
} from "../search";

// ── Sample data ──

interface NumItem {
  value: number;
}

const NUM_ITEMS: NumItem[] = [
  { value: 10 },
  { value: 20 },
  { value: 30 },
  { value: 40 },
  { value: 50 },
];

interface StrItem {
  label: string;
}

const STR_ITEMS: StrItem[] = [
  { label: "apple" },
  { label: "banana" },
  { label: "cherry" },
  { label: "date" },
];

// ═══════════════════════════════════════════════════════════════
// linearSearch — predicate form
// ═══════════════════════════════════════════════════════════════

describe("linearSearch", () => {
  // ✅ Happy path
  test("finds existing element", () => {
    const result = linearSearch(NUM_ITEMS, (item) => item.value === 30);
    expect(result.found).toBe(true);
    expect(result.index).toBe(2);
    expect(result.item).toEqual({ value: 30 });
  });

  test("finds first element", () => {
    const result = linearSearch(NUM_ITEMS, (item) => item.value === 10);
    expect(result.found).toBe(true);
    expect(result.index).toBe(0);
  });

  test("finds last element", () => {
    const result = linearSearch(NUM_ITEMS, (item) => item.value === 50);
    expect(result.found).toBe(true);
    expect(result.index).toBe(4);
  });

  // ❌ Failure — element not found
  test("returns not-found when element not present", () => {
    const result = linearSearch(NUM_ITEMS, (item) => item.value === 99);
    expect(result.found).toBe(false);
    expect(result.index).toBe(-1);
    expect(result.item).toBeNull();
  });

  // 🔸 Edge — empty array
  test("returns not-found for empty array", () => {
    const result = linearSearch([], (item: unknown) => item === 1);
    expect(result.found).toBe(false);
    expect(result.index).toBe(-1);
  });

  // 🔸 Edge — single element found
  test("finds element in single-element array", () => {
    const result = linearSearch([{ value: 42 }], (item) => item.value === 42);
    expect(result.found).toBe(true);
    expect(result.index).toBe(0);
  });

  test("returns not-found for single-element without match", () => {
    const result = linearSearch([{ value: 42 }], (item) => item.value === 0);
    expect(result.found).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// linearSearchAll — predicate form
// ═══════════════════════════════════════════════════════════════

describe("linearSearchAll", () => {
  const WITH_DUPLICATES = [
    { value: 10 },
    { value: 20 },
    { value: 10 },
    { value: 30 },
    { value: 10 },
  ];

  // ✅ Happy path
  test("finds all occurrences", () => {
    const result = linearSearchAll(WITH_DUPLICATES, (item) => item.value === 10);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.value === 10)).toBe(true);
  });

  // ❌ Failure — element not present
  test("returns empty array when element not found", () => {
    const result = linearSearchAll(WITH_DUPLICATES, (item) => item.value === 99);
    expect(result).toEqual([]);
  });

  // 🔸 Edge — empty array
  test("returns empty for empty array", () => {
    const result = linearSearchAll([], (item: unknown) => item === 1);
    expect(result).toEqual([]);
  });

  // 🔸 Edge — single match
  test("finds single match", () => {
    const result = linearSearchAll(WITH_DUPLICATES, (item) => item.value === 20);
    expect(result).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// binarySearch — (items, getValue, target)
// ═══════════════════════════════════════════════════════════════

describe("binarySearch", () => {
  // ✅ Happy path — element present
  test("finds existing element", () => {
    const result = binarySearch(NUM_ITEMS, (item) => item.value, 30);
    expect(result.found).toBe(true);
    expect(result.index).toBe(2);
    expect(result.item).toEqual({ value: 30 });
  });

  test("finds first element", () => {
    const result = binarySearch(NUM_ITEMS, (item) => item.value, 10);
    expect(result.found).toBe(true);
    expect(result.index).toBe(0);
  });

  test("finds last element", () => {
    const result = binarySearch(NUM_ITEMS, (item) => item.value, 50);
    expect(result.found).toBe(true);
    expect(result.index).toBe(4);
  });

  // ❌ Failure — element not present
  test("returns not-found when element not present", () => {
    const result = binarySearch(NUM_ITEMS, (item) => item.value, 99);
    expect(result.found).toBe(false);
    expect(result.index).toBe(-1);
  });

  test("returns not-found when element between values", () => {
    const result = binarySearch(NUM_ITEMS, (item) => item.value, 25);
    expect(result.found).toBe(false);
  });

  // 🔸 Edge — empty array
  test("returns not-found for empty array", () => {
    const result = binarySearch([], (item: NumItem) => item.value, 1);
    expect(result.found).toBe(false);
  });

  // 🔸 Edge — single element
  test("finds element in single-element array", () => {
    const result = binarySearch([{ value: 42 }], (item) => item.value, 42);
    expect(result.found).toBe(true);
    expect(result.index).toBe(0);
  });

  test("returns not-found for single element not matching", () => {
    const result = binarySearch([{ value: 42 }], (item) => item.value, 0);
    expect(result.found).toBe(false);
  });

  // 🔸 Edge — strings
  test("finds string in sorted strings", () => {
    const result = binarySearch(STR_ITEMS, (item) => item.label, "cherry");
    expect(result.found).toBe(true);
    expect(result.index).toBe(2);
  });

  test("returns not-found for missing string", () => {
    const result = binarySearch(STR_ITEMS, (item) => item.label, "fig");
    expect(result.found).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// binarySearchWithInsertionIndex
// ═══════════════════════════════════════════════════════════════

describe("binarySearchWithInsertionIndex", () => {
  // ✅ Happy path — exact match
  test("returns index when element is found", () => {
    const result = binarySearchWithInsertionIndex(
      NUM_ITEMS,
      (item) => item.value,
      30
    );
    expect(result.found).toBe(true);
    expect(result.index).toBe(2);
    expect(result.insertionIndex).toBe(2);
  });

  // ❌ Where element would be inserted (not found)
  test("returns insertion index for element between values", () => {
    const result = binarySearchWithInsertionIndex(
      NUM_ITEMS,
      (item) => item.value,
      25
    );
    expect(result.found).toBe(false);
    expect(result.insertionIndex).toBe(2);
  });

  // ❌ Insertion at beginning
  test("returns insertionIndex 0 for element before first", () => {
    const result = binarySearchWithInsertionIndex(
      NUM_ITEMS,
      (item) => item.value,
      5
    );
    expect(result.found).toBe(false);
    expect(result.insertionIndex).toBe(0);
  });

  // ❌ Insertion at end
  test("returns insertionIndex at end for element after last", () => {
    const result = binarySearchWithInsertionIndex(
      NUM_ITEMS,
      (item) => item.value,
      60
    );
    expect(result.found).toBe(false);
    expect(result.insertionIndex).toBe(5);
  });

  // 🔸 Edge — empty array
  test("returns insertionIndex 0 for empty array", () => {
    const result = binarySearchWithInsertionIndex(
      [],
      (item: NumItem) => item.value,
      10
    );
    expect(result.found).toBe(false);
    expect(result.insertionIndex).toBe(0);
  });

  // 🔸 Edge — single element found
  test("finds in single-element array", () => {
    const result = binarySearchWithInsertionIndex(
      [{ value: 42 }],
      (item) => item.value,
      42
    );
    expect(result.found).toBe(true);
    expect(result.index).toBe(0);
  });

  test("insertionIndex 0 for not-matching element before", () => {
    const result = binarySearchWithInsertionIndex(
      [{ value: 42 }],
      (item) => item.value,
      10
    );
    expect(result.found).toBe(false);
    expect(result.insertionIndex).toBe(0);
  });

  test("insertionIndex 1 for not-matching element after", () => {
    const result = binarySearchWithInsertionIndex(
      [{ value: 42 }],
      (item) => item.value,
      50
    );
    expect(result.found).toBe(false);
    expect(result.insertionIndex).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// isSorted — (items, getValue)
// ═══════════════════════════════════════════════════════════════

describe("isSorted", () => {
  // ✅ Happy path
  test("returns true for ascending array", () => {
    expect(isSorted(NUM_ITEMS, (item) => item.value)).toBe(true);
  });

  test("returns true for array with equal values", () => {
    const items = [{ value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }];
    expect(isSorted(items, (item) => item.value)).toBe(true);
  });

  test("returns true for single element", () => {
    expect(isSorted([{ value: 42 }], (item) => item.value)).toBe(true);
  });

  // 🔸 Edge — empty array
  test("returns true for empty array", () => {
    expect(isSorted([], (item: NumItem) => item.value)).toBe(true);
  });

  // ❌ Failure — descending
  test("returns false for descending array", () => {
    const items = [{ value: 50 }, { value: 40 }, { value: 30 }];
    expect(isSorted(items, (item) => item.value)).toBe(false);
  });

  test("returns false for unsorted array", () => {
    const items = [{ value: 10 }, { value: 50 }, { value: 20 }];
    expect(isSorted(items, (item) => item.value)).toBe(false);
  });

  // 🔸 Strings
  test("works with string values", () => {
    expect(isSorted(STR_ITEMS, (item) => item.label)).toBe(true);
  });

  test("returns false for unsorted strings", () => {
    const items = [{ label: "z" }, { label: "a" }];
    expect(isSorted(items, (item) => item.label)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// smartSearch — (items, getValue, target)
// ═══════════════════════════════════════════════════════════════

describe("smartSearch", () => {
  // ✅ Happy path — linear search (small, unsorted)
  test("uses linear search for small unsorted arrays", () => {
    const items = [
      { value: 50 },
      { value: 10 },
      { value: 40 },
      { value: 20 },
      { value: 30 },
    ];
    const result = smartSearch(items, (item) => item.value, 20);
    expect(result.found).toBe(true);
    expect(result.index).toBe(3);
  });

  test("returns not-found in unsorted array", () => {
    const items = [{ value: 50 }, { value: 10 }, { value: 40 }];
    const result = smartSearch(items, (item) => item.value, 99);
    expect(result.found).toBe(false);
  });

  // ✅ Happy path — binary search (large sorted)
  test("uses binary search for large sorted arrays", () => {
    const big = Array.from({ length: 100 }, (_, i) => ({ value: i * 2 }));
    const result = smartSearch(big, (item) => item.value, 50);
    expect(result.found).toBe(true);
    expect(result.index).toBe(25);
  });

  test("returns not-found for missing element in large sorted array", () => {
    const big = Array.from({ length: 100 }, (_, i) => ({ value: i * 2 }));
    const result = smartSearch(big, (item) => item.value, 51);
    expect(result.found).toBe(false);
  });

  // 🔸 Edge — exactly at threshold (32 items)
  test("handles array of 32 sorted items", () => {
    const arr = Array.from({ length: 32 }, (_, i) => ({ value: i }));
    const result = smartSearch(arr, (item) => item.value, 10);
    expect(result.found).toBe(true);
    expect(result.index).toBe(10);
  });

  // 🔸 Edge — 33 items (binary search path)
  test("uses binary for 33 sorted items", () => {
    const arr = Array.from({ length: 33 }, (_, i) => ({ value: i }));
    const result = smartSearch(arr, (item) => item.value, 0);
    expect(result.found).toBe(true);
    expect(result.index).toBe(0);
  });

  // 🔸 Edge — empty array
  test("returns not-found for empty array", () => {
    const result = smartSearch([], (item: NumItem) => item.value, 1);
    expect(result.found).toBe(false);
  });
});