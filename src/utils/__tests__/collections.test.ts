/**
 * Tests for collection utilities — filter, sort, group, paginate, unique, chunk.
 *
 * Covers:
 *  ✅ Happy path — typical usage with data
 *  🔸 Edge cases — empty arrays, boundary values
 *  ❌ Failure modes — invalid inputs, negative page numbers, etc.
 */

import {
  filterItems,
  filterByRange,
  filterBySet,
  sortBy,
  sortByMultiple,
  groupBy,
  countBy,
  paginate,
  uniqueBy,
  take,
  chunk,
} from "../collections";

// ── Sample data ──

interface Person {
  id: string;
  name: string;
  age: number;
  city: string;
}

const PEOPLE: Person[] = [
  { id: "1", name: "Ana", age: 30, city: "Madrid" },
  { id: "2", name: "Carlos", age: 25, city: "Barcelona" },
  { id: "3", name: "Elena", age: 35, city: "Madrid" },
  { id: "4", name: "David", age: 40, city: "Valencia" },
  { id: "5", name: "Beatriz", age: 28, city: "Barcelona" },
];

// ═══════════════════════════════════════════════════════════════
// filterItems
// ═══════════════════════════════════════════════════════════════

describe("filterItems", () => {
  // ✅ Happy path
  test("filters items matching predicate", () => {
    const result = filterItems(PEOPLE, (p) => p.age > 30);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["Elena", "David"]);
  });

  // 🔸 Edge — empty array
  test("returns empty array for empty input", () => {
    expect(filterItems([], () => true)).toEqual([]);
  });

  // 🔸 Edge — all items match
  test("returns all items when predicate always true", () => {
    expect(filterItems(PEOPLE, () => true)).toHaveLength(5);
  });

  // 🔸 Edge — no items match
  test("returns empty array when no items match", () => {
    expect(filterItems(PEOPLE, () => false)).toEqual([]);
  });

  test("predicate receives index", () => {
    const evenIndices = filterItems(PEOPLE, (_, i) => i % 2 === 0);
    expect(evenIndices).toHaveLength(3);
  });
});

// ═══════════════════════════════════════════════════════════════
// filterByRange
// ═══════════════════════════════════════════════════════════════

describe("filterByRange", () => {
  // ✅ Happy path
  test("filters by numeric range inclusive", () => {
    const result = filterByRange(PEOPLE, (p) => p.age, 25, 35);
    // Ana(30), Carlos(25), Elena(35), Beatriz(28) — all 4 in range
    expect(result).toHaveLength(4);
    expect(result.map((p) => p.name)).toEqual([
      "Ana",
      "Carlos",
      "Elena",
      "Beatriz",
    ]);
  });

  // 🔸 Edge — empty array
  test("returns empty for empty array", () => {
    expect(filterByRange([] as Person[], (p) => p.age, 0, 100)).toEqual([]);
  });

  // 🔸 Edge — range with no matches
  test("returns empty when no items in range", () => {
    expect(filterByRange(PEOPLE, (p) => p.age, 100, 200)).toEqual([]);
  });

  // 🔸 Edge — min === max single value
  test("returns items matching exact value when min === max", () => {
    const result = filterByRange(PEOPLE, (p) => p.age, 30, 30);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ana");
  });
});

// ═══════════════════════════════════════════════════════════════
// filterBySet
// ═══════════════════════════════════════════════════════════════

describe("filterBySet", () => {
  // ✅ Happy path
  test("filters by allowed set of values", () => {
    const result = filterBySet(PEOPLE, (p) => p.city, ["Madrid", "Valencia"]);
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.name)).toEqual(["Ana", "Elena", "David"]);
  });

  // 🔸 Edge — empty allowed set
  test("returns empty when allowed set is empty", () => {
    expect(filterBySet(PEOPLE, (p) => p.city, [])).toEqual([]);
  });

  // 🔸 Edge — all allowed
  test("returns all when all values are allowed", () => {
    expect(
      filterBySet(PEOPLE, (p) => p.city, ["Madrid", "Barcelona", "Valencia"])
    ).toHaveLength(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// sortBy
// ═══════════════════════════════════════════════════════════════

describe("sortBy", () => {
  // ✅ Happy path — ascending
  test("sorts ascending by number", () => {
    const result = sortBy(PEOPLE, (p) => p.age, "asc");
    expect(result.map((p) => p.age)).toEqual([25, 28, 30, 35, 40]);
  });

  // ✅ Happy path — descending
  test("sorts descending by number", () => {
    const result = sortBy(PEOPLE, (p) => p.age, "desc");
    expect(result.map((p) => p.age)).toEqual([40, 35, 30, 28, 25]);
  });

  // 🔸 Edge — sorts by string
  test("sorts by string field ascending", () => {
    const result = sortBy(PEOPLE, (p) => p.name, "asc");
    expect(result.map((p) => p.name)).toEqual([
      "Ana",
      "Beatriz",
      "Carlos",
      "David",
      "Elena",
    ]);
  });

  // 🔸 Edge — empty array
  test("returns empty for empty array", () => {
    expect(sortBy([], (p: Person) => p.age)).toEqual([]);
  });

  // 🔸 Edge — single element
  test("returns same single element", () => {
    const result = sortBy([PEOPLE[0]], (p) => p.age);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ana");
  });

  // 🔸 Edge — does NOT mutate original
  test("does not mutate original array", () => {
    const original = [...PEOPLE];
    sortBy(PEOPLE, (p) => p.age, "desc");
    expect(PEOPLE).toEqual(original);
  });

  // 🔸 Edge — equal values are stable (return 0 in comparator)
  test("equal values preserve relative order", () => {
    const items = [
      { name: "Ana", age: 30 },
      { name: "Ana", age: 30 },
      { name: "Carlos", age: 25 },
    ];
    const result = sortBy(items, (p) => p.age);
    expect(result).toHaveLength(3);
    // Carlos(25) comes first, then the two Anas(30) in original order
    expect(result[0].name).toBe("Carlos");
    expect(result[1].name).toBe("Ana");
    expect(result[2].name).toBe("Ana");
  });

  // 🔸 Edge — default direction is asc
  test("defaults to ascending", () => {
    const result = sortBy(PEOPLE, (p) => p.age);
    expect(result.map((p) => p.age)).toEqual([25, 28, 30, 35, 40]);
  });
});

// ═══════════════════════════════════════════════════════════════
// sortByMultiple
// ═══════════════════════════════════════════════════════════════

describe("sortByMultiple", () => {
  const DATA: Person[] = [
    { id: "1", name: "Ana", age: 30, city: "Madrid" },
    { id: "2", name: "Ana", age: 25, city: "Barcelona" },
    { id: "3", name: "Carlos", age: 30, city: "Madrid" },
  ];

  // ✅ Happy path — primary + secondary
  test("sorts by multiple criteria in priority order", () => {
    const result = sortByMultiple(DATA, [
      { getValue: (p) => p.name, direction: "asc" },
      { getValue: (p) => p.age, direction: "asc" },
    ]);
    expect(result.map((p) => `${p.name}-${p.age}`)).toEqual([
      "Ana-25",
      "Ana-30",
      "Carlos-30",
    ]);
  });

  // ✅ Mixed directions
  test("supports mixed ascending/descending", () => {
    const result = sortByMultiple(DATA, [
      { getValue: (p) => p.name, direction: "asc" },
      { getValue: (p) => p.age, direction: "desc" },
    ]);
    expect(result.map((p) => `${p.name}-${p.age}`)).toEqual([
      "Ana-30",
      "Ana-25",
      "Carlos-30",
    ]);
  });

  // 🔸 Edge — single criterion acts like sortBy
  test("works with single criterion", () => {
    const result = sortByMultiple(PEOPLE, [
      { getValue: (p) => p.age, direction: "desc" },
    ]);
    expect(result.map((p) => p.age)).toEqual([40, 35, 30, 28, 25]);
  });

  // 🔸 Edge — empty criteria
  test("returns unmodified for empty criteria", () => {
    const result = sortByMultiple(PEOPLE, []);
    expect(result).toHaveLength(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// groupBy
// ═══════════════════════════════════════════════════════════════

describe("groupBy", () => {
  // ✅ Happy path
  test("groups items by a key", () => {
    const result = groupBy(PEOPLE, (p) => p.city);
    expect(Object.keys(result)).toEqual(["Madrid", "Barcelona", "Valencia"]);
    expect(result["Madrid"]).toHaveLength(2);
    expect(result["Barcelona"]).toHaveLength(2);
    expect(result["Valencia"]).toHaveLength(1);
  });

  // 🔸 Edge — empty array
  test("returns empty object for empty array", () => {
    expect(groupBy([], (p: Person) => p.city)).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════
// countBy
// ═══════════════════════════════════════════════════════════════

describe("countBy", () => {
  test("counts items per category", () => {
    const result = countBy(PEOPLE, (p) => p.city);
    expect(result).toEqual([
      { category: "Madrid", count: 2 },
      { category: "Barcelona", count: 2 },
      { category: "Valencia", count: 1 },
    ]);
  });

  test("returns empty for empty array", () => {
    expect(countBy([], (p: Person) => p.city)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// paginate
// ═══════════════════════════════════════════════════════════════

describe("paginate", () => {
  // ✅ Happy path — page 1
  test("returns first page correctly", () => {
    const result = paginate(PEOPLE, 1, 2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe("Ana");
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(5);
  });

  // ✅ Happy path — last page
  test("returns last page with remaining items", () => {
    const result = paginate(PEOPLE, 3, 2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Beatriz");
    expect(result.page).toBe(3);
  });

  // 🔸 Edge — page exceeds total pages (clamps to last)
  test("clamps page beyond total to last page", () => {
    const result = paginate(PEOPLE, 99, 2);
    expect(result.page).toBe(3);
    expect(result.items[0].name).toBe("Beatriz");
  });

  // 🔸 Edge — page less than 1 (clamps to first)
  test("clamps page < 1 to first page", () => {
    const result = paginate(PEOPLE, 0, 2);
    expect(result.page).toBe(1);
  });

  test("clamps page -5 to first page", () => {
    const result = paginate(PEOPLE, -5, 2);
    expect(result.page).toBe(1);
  });

  // 🔸 Edge — empty array
  test("returns empty items for empty array", () => {
    const result = paginate([], 1, 10);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
  });

  // 🔸 Edge — pageSize larger than total
  test("returns all items when pageSize exceeds total", () => {
    const result = paginate(PEOPLE, 1, 100);
    expect(result.items).toHaveLength(5);
    expect(result.totalPages).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// uniqueBy
// ═══════════════════════════════════════════════════════════════

describe("uniqueBy", () => {
  const DUPLICATES: Person[] = [
    { id: "1", name: "Ana", age: 30, city: "Madrid" },
    { id: "1", name: "Ana", age: 30, city: "Madrid" }, // duplicate id
    { id: "2", name: "Carlos", age: 25, city: "Barcelona" },
  ];

  test("returns unique items by key", () => {
    const result = uniqueBy(DUPLICATES, (p) => p.id);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["Ana", "Carlos"]);
  });

  // 🔸 Edge — empty array
  test("returns empty for empty array", () => {
    expect(uniqueBy([], (p: Person) => p.id)).toEqual([]);
  });

  // 🔸 Edge — all unique
  test("returns all when all are unique", () => {
    expect(uniqueBy(PEOPLE, (p) => p.id)).toHaveLength(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// take
// ═══════════════════════════════════════════════════════════════

describe("take", () => {
  test("returns first n items", () => {
    expect(take(PEOPLE, 2).map((p) => p.name)).toEqual(["Ana", "Carlos"]);
  });

  // 🔸 Edge — n = 0
  test("returns empty for n = 0", () => {
    expect(take(PEOPLE, 0)).toEqual([]);
  });

  // 🔸 Edge — negative n
  test("returns empty for negative n", () => {
    expect(take(PEOPLE, -1)).toEqual([]);
  });

  // 🔸 Edge — n > length
  test("returns all items when n exceeds length", () => {
    expect(take(PEOPLE, 100)).toHaveLength(5);
  });

  // 🔸 Edge — empty array
  test("returns empty for empty array", () => {
    expect(take([], 5)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// chunk
// ═══════════════════════════════════════════════════════════════

describe("chunk", () => {
  test("splits array into chunks of given size", () => {
    const result = chunk(PEOPLE, 2);
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toHaveLength(2);
    expect(result[2]).toHaveLength(1);
  });

  // 🔸 Edge — chunkSize = 1
  test("each element is its own chunk for size 1", () => {
    const result = chunk(PEOPLE, 1);
    expect(result).toHaveLength(5);
  });

  // 🔸 Edge — chunkSize > length
  test("returns single chunk when size exceeds length", () => {
    const result = chunk(PEOPLE, 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(5);
  });

  // 🔸 Edge — chunkSize = 0
  test("returns empty for chunkSize = 0", () => {
    expect(chunk(PEOPLE, 0)).toEqual([]);
  });

  // 🔸 Edge — negative chunkSize
  test("returns empty for negative chunkSize", () => {
    expect(chunk(PEOPLE, -3)).toEqual([]);
  });

  // 🔸 Edge — empty array
  test("returns empty for empty array", () => {
    expect(chunk([], 3)).toEqual([]);
  });
});