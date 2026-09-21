export type GalleryOrder = "newest" | "oldest" | "price-high" | "price-low";

/** Missing dates/prices always go last; ties remain deterministic across reloads. */
export function sortArtworks<T>(items: readonly T[], order: GalleryOrder, fields: {
  date: (item: T) => string | null | undefined;
  price: (item: T) => number | null;
  id: (item: T) => string;
}): T[] {
  const priceOrder = order.startsWith("price-");
  const direction = order === "oldest" || order === "price-low" ? 1 : -1;
  const value = (item: T) => {
    const n = priceOrder ? fields.price(item) : Date.parse(fields.date(item) ?? "");
    return n !== null && Number.isFinite(n) ? n : null;
  };
  return [...items].sort((a, b) => {
    const av = value(a), bv = value(b);
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    return (av !== null && bv !== null ? (av - bv) * direction : 0) ||
      fields.id(a).localeCompare(fields.id(b), "en", { numeric: true });
  });
}
