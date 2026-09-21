"use client";

import { useId } from "react";
import { useLang } from "@/lib/i18n";
import type { GalleryOrder } from "@/lib/gallerySort";

export default function GalleryOrderSelect({ value, onChange, prices = true }: {
  value: GalleryOrder; onChange: (order: GalleryOrder) => void; prices?: boolean;
}) {
  const { lang } = useLang();
  const id = useId();
  const es = lang === "es";
  return <div className="flex flex-wrap items-center gap-3">
    <label htmlFor={id} className="text-[10px] tracking-[0.2em] uppercase text-ash">{es ? "Orden" : "Order"}</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value as GalleryOrder)}
      className="max-w-full bg-ink text-bone border border-white/20 px-3 py-2 text-xs focus:border-accent">
      <option value="newest">{es ? "Del último al primero" : "Newest first"}</option>
      <option value="oldest">{es ? "Del primero al último" : "Oldest first"}</option>
      {prices && <option value="price-high">{es ? "Precio: mayor a menor" : "Price: high to low"}</option>}
      {prices && <option value="price-low">{es ? "Precio: menor a mayor" : "Price: low to high"}</option>}
    </select>
  </div>;
}
