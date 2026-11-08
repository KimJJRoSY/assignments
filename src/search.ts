import type { Category, Result } from "./data";

export type SortOrder = "recent" | "popular" | "oldest";

export function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

export function searchResults(
  items: Result[],
  query: string,
  category: Category | "전체",
  sort: SortOrder,
): Result[] {
  const term = normalize(query);
  const filtered = items.filter((item) => {
    if (category !== "전체" && item.category !== category) return false;
    if (!term) return true;
    return normalize(
      `${item.title} ${item.description} ${item.author} ${item.category}`,
    ).includes(term);
  });
  return filtered.sort((a, b) => {
    if (sort === "popular") return b.views - a.views || a.id - b.id;
    if (sort === "oldest") return a.date.localeCompare(b.date) || a.id - b.id;
    return b.date.localeCompare(a.date) || a.id - b.id;
  });
}

export function getVisibleRange(
  scrollTop: number,
  viewportHeight: number,
  itemCount: number,
  rowHeight: number,
  overscan = 5,
) {
  const start = Math.max(
    0,
    Math.floor(Math.max(0, scrollTop) / rowHeight) - overscan,
  );
  const end = Math.min(
    itemCount,
    Math.ceil(
      (Math.max(0, scrollTop) + Math.max(0, viewportHeight)) / rowHeight,
    ) + overscan,
  );
  return { start, end };
}
