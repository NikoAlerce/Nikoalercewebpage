"use client";

import { useEffect, useMemo, useState } from "react";
import type { TransientArtwork } from "@/lib/transient";
import { ipfsPath } from "@/lib/objkt";
import { sortArtworks, type GalleryOrder } from "@/lib/gallerySort";
import { useLang } from "@/lib/i18n";
import TitleCharacter from "./TitleCharacter";
import GalleryOrderSelect from "./GalleryOrderSelect";
import ArtworkThumbnail from "./ArtworkThumbnail";

function images(image: string | null): string[] {
  if (!image) return [];
  const params = new URLSearchParams({ url: image, w: "640", output: "webp", n: "0", we: "" });
  params.sort();
  const path = ipfsPath(image);
  return [...(path ? [`/api/thumbnail?source=transient&uri=${encodeURIComponent(path)}`] : []), `https://img.transient.xyz/?${params}`];
}

export default function TransientGallery() {
  const { lang } = useLang();
  const es = lang === "es";
  const [artworks, setArtworks] = useState<TransientArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [order, setOrder] = useState<GalleryOrder>("newest");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false);
    fetch("/api/transient", { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then((data) => { if (!controller.signal.aborted) setArtworks(data.artworks); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  const displayed = useMemo(() => sortArtworks(artworks, order, {
    date: (item) => item.createdAt, price: () => null, id: (item) => item.id,
  }), [artworks, order]);
  return <section id="art-on-evm" className="relative py-24 md:py-32 px-6 md:px-10 max-w-[1600px] mx-auto border-t border-white/5">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
      <div className="max-w-2xl">
        <div className="text-[11px] tracking-[0.4em] uppercase text-ash mb-6">Transient · Niko Alerce</div>
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="font-graffiti text-bone leading-[1] text-[clamp(2.8rem,10vw,7rem)]">{es ? "Arte en EVM" : "Art on EVM"}</h1>
          <TitleCharacter clip="pointing" size={470} flip className="shrink-0" />
        </div>
        <p className="mt-5 max-w-xl text-ash leading-relaxed">{es ? "Mis obras en Transient. Abrí una pieza para explorarla y consultar su disponibilidad." : "My artworks on Transient. Open a piece to explore it and check availability."}</p>
      </div>
      <div className="text-xs text-ash space-y-3">
        <p>{loading ? (es ? "Cargando…" : "Loading…") : error ? (es ? "No disponible" : "Unavailable") : `${artworks.length} ${es ? "obras" : "artworks"}`}</p>
        <a href="https://www.transient.xyz/@NikoAlerce" target="_blank" rel="noopener noreferrer" className="text-bone hover:text-accent">{es ? "Ver perfil en Transient" : "View profile on Transient"} ↗</a>
      </div>
    </div>
    {loading ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" aria-label={es ? "Cargando obras" : "Loading artworks"}>
      {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-square bg-ink animate-pulse" />)}
    </div> : error ? <div role="alert" className="border border-accent/40 p-6 text-bone">
      <p>{es ? "No se pudo conectar con Transient." : "Could not reach Transient."}</p>
      <button className="mt-4 border border-white/20 px-4 py-2" onClick={() => setRetry((value) => value + 1)}>{es ? "Reintentar" : "Retry"}</button>
    </div> : <>
      <div className="mb-8"><GalleryOrderSelect value={order} onChange={setOrder} prices={false} /></div>
      {!displayed.length && <p className="text-ash">{es ? "Todavía no hay obras para mostrar." : "No artworks yet."}</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {displayed.map((item, index) => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="group bg-ink border border-white/5 hover:border-accent/60">
          <div className="relative aspect-square overflow-hidden bg-black"><ArtworkThumbnail sources={images(item.image)} alt={item.name} priority={index < 4} /></div>
          <div className="p-3 border-t border-white/5"><h3 className="text-xs text-bone group-hover:text-accent truncate">{item.name} ↗</h3>
            <p className="mt-1 text-[10px] text-ash">{item.collection} · {item.chain}</p></div>
        </a>)}
      </div>
    </>}
  </section>;
}
