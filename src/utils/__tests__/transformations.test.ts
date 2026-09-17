/**
 * Tests for transformation utilities — numericSummary, sumBy, averageBy,
 * maxBy, minBy, countByCategory, categoryDistribution.
 *
 * Covers:
 *  ✅ Happy path — typical aggregations
 *  🔸 Edge cases — empty arrays, single elements, boundaries
 *  ❌ Failure modes — NaN handling, negative values
 */

import {
  numericSummary,
  sumBy,
  averageBy,
  maxBy,
  minBy,
  countByCategory,
  categoryDistribution,
} from "../transformations";

// ── Sample data ──

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
}

const PRODUCTS: Product[] = [
  { id: "P1", name: "Widget", price: 100, category: "tools", quantity: 10 },
  { id: "P2", name: "Gadget", price: 250, category: "electronics", quantity: 5 },
  { id: "P3", name: "Doohickey", price: 50, category: "tools", quantity: 20 },
  { id: "P4", name: "Thingamajig", price: 500, category: "electronics", quantity: 2 },
  { id: "P5", name: "Contraption", price: 150, category: "machinery", quantity: 8 },
];

interface Person {
  name: string;
  age: number;
  joinDate: Date;
}

const PEOPLE: Person[] = [
  { name: "Ana", age: 30, joinDate: new Date("2025-01-15") },
  { name: "Carlos", age: 25, joinDate: new Date("2025-03-01") },
  { name: "Elena", age: 35, joinDate: new Date("2024-11-10") },
];

// ═══════════════════════════════════════════════════════════════
// numericSummary
// ═══════════════════════════════════════════════════════════════

describe("numericSummary", () => {
  // ✅ Happy path
  test("calculates full numeric summary", () => {
    const result = numericSummary(PRODUCTS, (p) => p.price);
    expect(result.sum).toBe(1050); // 100+250+50+500+150
    expect(result.average).toBe(210); // 1050 / 5
    expect(result.min).toBe(50);
    expect(result.max).toBe(500);
    expect(result.count).toBe(5);
  });

  // 🔸 Edge — empty array returns zeros
  test("returns zeros for empty array", () => {
    const result = numericSummary([], (p: Product) => p.price);
    expect(result).toEqual({ sum: 0, average: 0, min: 0, max: 0, count: 0 });
  });

  // 🔸 Edge — single element
  test("handles single element", () => {
    const result = numericSummary([PRODUCTS[0]], (p) => p.price);
    expect(result.sum).toBe(100);
    expect(result.average).toBe(100);
    expect(result.min).toBe(100);
    expect(result.max).toBe(100);
    expect(result.count).toBe(1);
  });

  // 🔸 Edge — all prices zero
  test("handles all-zero values", () => {
    const items = [
      { ...PRODUCTS[0], price: 0 },
      { ...PRODUCTS[1], price: 0 },
    ];
    const result = numericSummary(items, (p) => p.price);
    expect(result.sum).toBe(0);
    expect(result.average).toBe(0);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
    expect(result.count).toBe(2);
  });

  // 🔸 Edge — negative values
  test("handles negative values", () => {
    const items = [
      { ...PRODUCTS[0], price: -100 },
      { ...PRODUCTS[1], price: -50 },
    ];
    const result = numericSummary(items, (p) => p.price);
    expect(result.sum).toBe(-150);
    expect(result.average).toBe(-75);
    expect(result.min).toBe(-100);
    expect(result.max).toBe(-50);
  });
});

// ═══════════════════════════════════════════════════════════════
// sumBy
// ═══════════════════════════════════════════════════════════════

describe("sumBy", () => {
  // ✅ Happy path
  test("sums prices correctly", () => {
    expect(sumBy(PRODUCTS, (p) => p.price)).toBe(1050);
  });

  test("sums quantities correctly", () => {
    expect(sumBy(PRODUCTS, (p) => p.quantity)).toBe(45);
  });

  // 🔸 Edge — empty array
  test("returns 0 for empty array", () => {
    expect(sumBy([], (p: Product) => p.price)).toBe(0);
  });

  // 🔸 Edge — single element
  test("sums single element", () => {
    expect(sumBy([PRODUCTS[0]], (p) => p.price)).toBe(100);
  });

  // 🔸 Edge — negative values
  test("sums negative values correctly", () => {
    const items = [
      { ...PRODUCTS[0], price: -50 },
      { ...PRODUCTS[1], price: -30 },
    ];
    expect(sumBy(items, (p) => p.price)).toBe(-80);
  });
});

// ═══════════════════════════════════════════════════════════════
// averageBy
// ═══════════════════════════════════════════════════════════════

describe("averageBy", () => {
  // ✅ Happy path
  test("calculates average of prices", () => {
    expect(averageBy(PRODUCTS, (p) => p.price)).toBe(210);
  });

  // 🔸 Edge — empty array returns 0
  test("returns 0 for empty array", () => {
    expect(averageBy([], (p: Product) => p.price)).toBe(0);
  });

  test("returns 0 for empty array of length 0", () => {
    expect(averageBy([], (x: number) => x)).toBe(0);
  });

  // 🔸 Edge — single element
  test("returns the value itself for single element", () => {
    expect(averageBy([PRODUCTS[0]], (p) => p.price)).toBe(100);
  });

  // 🔸 Edge — two elements
  test("averages two elements", () => {
    expect(
      averageBy(
        [PRODUCTS[0], PRODUCTS[1]],
        (p) => p.price
      )
    ).toBe(175); // (100 + 250) / 2
  });

  // 🔸 Edge — all values zero
  test("returns 0 when all values are zero", () => {
    const items = [
      { ...PRODUCTS[0], price: 0 },
      { ...PRODUCTS[1], price: 0 },
    ];
    expect(averageBy(items, (p) => p.price)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// maxBy
// ═══════════════════════════════════════════════════════════════

describe("maxBy", () => {
  // ✅ Happy path — number
  test("finds product with max price", () => {
    const result = maxBy(PRODUCTS, (p) => p.price);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Thingamajig");
    expect(result!.price).toBe(500);
  });

  // ✅ Happy path — string
  test("finds person with max name (alphabetically)", () => {
    const result = maxBy(PEOPLE, (p) => p.name);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Elena");
  });

  // ✅ Happy path — Date
  test("finds person with latest joinDate", () => {
    const result = maxBy(PEOPLE, (p) => p.joinDate);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Carlos"); // 2025-03-01 is latest
  });

  // ❌ Failure — empty array returns null
  test("returns null for empty array", () => {
    expect(maxBy([], (p: Product) => p.price)).toBeNull();
  });

  // 🔸 Edge — single element
  test("returns the single element", () => {
    const result = maxBy([PRODUCTS[0]], (p) => p.price);
    expect(result!.name).toBe("Widget");
  });

  // 🔸 Edge — tie (first is returned)
  test("returns first of tied elements", () => {
    const items = [
      { name: "A", value: 100 },
      { name: "B", value: 100 },
    ];
    const result = maxBy(items, (i) => i.value);
    expect(result!.name).toBe("A");
  });
});

// ═══════════════════════════════════════════════════════════════
// minBy
// ═══════════════════════════════════════════════════════════════

describe("minBy", () => {
  // ✅ Happy path — number
  test("finds product with min price", () => {
    const result = minBy(PRODUCTS, (p) => p.price);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Doohickey");
    expect(result!.price).toBe(50);
  });

  // ✅ Happy path — string
  test("finds person with min name (alphabetically)", () => {
    const result = minBy(PEOPLE, (p) => p.name);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Ana");
  });

  // ✅ Happy path — Date
  test("finds person with earliest joinDate", () => {
    const result = minBy(PEOPLE, (p) => p.joinDate);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Elena"); // 2024-11-10 is earliest
  });

  // ❌ Failure — empty array returns null
  test("returns null for empty array", () => {
    expect(minBy([], (p: Product) => p.price)).toBeNull();
  });

  // 🔸 Edge — single element
  test("returns the single element", () => {
    const result = minBy([PRODUCTS[0]], (p) => p.price);
    expect(result!.name).toBe("Widget");
  });

  // 🔸 Edge — tie (first is returned)
  test("returns first of tied elements", () => {
    const items = [
      { name: "A", value: 100 },
      { name: "B", value: 100 },
    ];
    const result = minBy(items, (i) => i.value);
    expect(result!.name).toBe("A");
  });
});

// ═══════════════════════════════════════════════════════════════
// countByCategory
// ═══════════════════════════════════════════════════════════════

describe("countByCategory", () => {
  // ✅ Happy path
  test("counts products by category, sorted descending", () => {
    const result = countByCategory(PRODUCTS, (p) => p.category);
    expect(result).toHaveLength(3);
    // Two categories with count 2 should be first
    expect(result[0].count).toBe(2);
    expect(result[1].count).toBe(2);
    expect(result[2].count).toBe(1);
  });

  test("category names are correct", () => {
    const result = countByCategory(PRODUCTS, (p) => p.category);
    const categories = result.map((r) => r.category).sort();
    expect(categories).toEqual(["electronics", "machinery", "tools"]);
  });

  // 🔸 Edge — empty array
  test("returns empty for empty array", () => {
    expect(countByCategory([], (p: Product) => p.category)).toEqual([]);
  });

  // 🔸 Edge — single category
  test("single category with multiple items", () => {
    const items = [PRODUCTS[0], PRODUCTS[2]]; // both tools
    const result = countByCategory(items, (p) => p.category);
    expect(result).toEqual([{ category: "tools", count: 2 }]);
  });

  // 🔸 Edge — all unique categories
  test("each item in its own category", () => {
    const items = [
      { ...PRODUCTS[0], category: "a" },
      { ...PRODUCTS[1], category: "b" },
      { ...PRODUCTS[2], category: "c" },
    ];
    const result = countByCategory(items, (p) => p.category);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.count === 1)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// categoryDistribution
// ═══════════════════════════════════════════════════════════════

describe("categoryDistribution", () => {
  // ✅ Happy path
  test("calculates distribution with percentages", () => {
    const result = categoryDistribution(PRODUCTS, (p) => p.category);
    // 5 products: 2 tools (40%), 2 electronics (40%), 1 machinery (20%)
    expect(result).toHaveLength(3);

    const tools = result.find((r) => r.category === "tools")!;
    expect(tools.count).toBe(2);
    expect(tools.percentage).toBe(40);

    const machinery = result.find((r) => r.category === "machinery")!;
    expect(machinery.count).toBe(1);
    expect(machinery.percentage).toBe(20);
  });

  // 🔸 Edge — empty array
  test("returns empty for empty array", () => {
    expect(categoryDistribution([], (p: Product) => p.category)).toEqual([]);
  });

  // 🔸 Edge — single category = 100%
  test("single category yields 100%", () => {
    const items = [PRODUCTS[0], PRODUCTS[2]]; // both tools
    const result = categoryDistribution(items, (p) => p.category);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("tools");
    expect(result[0].percentage).toBe(100);
  });

  // 🔸 Edge — large numbers (percentage precision)
  test("percentage is rounded to 2 decimal places", () => {
    const items = Array.from({ length: 3 }, (_, i) => ({
      ...PRODUCTS[0],
      category: i === 0 ? "a" : "b",
    }));
    const result = categoryDistribution(items, (p) => p.category);
    // a = 1/3 = 33.33%, b = 2/3 = 66.67%
    const catA = result.find((r) => r.category === "a")!;
    expect(catA.percentage).toBe(33.33);
    const catB = result.find((r) => r.category === "b")!;
    expect(catB.percentage).toBe(66.67);
  });
});