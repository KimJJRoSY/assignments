import { describe, expect, it } from "vitest";
import { createResults } from "./data";
import { getVisibleRange, searchResults } from "./search";

const items = createResults(100);

describe("searchResults", () => {
  it("matches normalized text and applies category filters", () => {
    const matching = searchResults(items, "  김지민  ", "전체", "recent");
    expect(matching.length).toBeGreaterThan(0);
    expect(matching.every((item) => item.author === "김지민")).toBe(true);
    expect(
      searchResults(items, "", "디자인", "recent").every(
        (item) => item.category === "디자인",
      ),
    ).toBe(true);
  });

  it("sorts deterministically by date and popularity", () => {
    const recent = searchResults(items, "", "전체", "recent");
    const popular = searchResults(items, "", "전체", "popular");
    expect(recent[0].date >= recent[1].date).toBe(true);
    expect(popular[0].views >= popular[1].views).toBe(true);
  });

  it("returns an empty result for unmatched text", () => {
    expect(
      searchResults(items, "존재하지않는검색어", "전체", "recent"),
    ).toEqual([]);
  });
});

describe("getVisibleRange", () => {
  it("renders a bounded window near the start and end", () => {
    expect(getVisibleRange(0, 560, 20000, 112)).toEqual({ start: 0, end: 10 });
    expect(getVisibleRange(20000 * 112 - 560, 560, 20000, 112)).toEqual({
      start: 19990,
      end: 20000,
    });
  });

  it("handles empty lists and negative scroll positions", () => {
    expect(getVisibleRange(-50, 560, 0, 112)).toEqual({ start: 0, end: 0 });
  });
});
