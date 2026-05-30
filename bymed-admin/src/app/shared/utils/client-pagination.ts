export function paginateItems<T>(
  items: readonly T[],
  pageNumber: number,
  pageSize: number
): readonly T[] {
  if (pageSize <= 0) {
    return items;
  }

  const start = (pageNumber - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
