# NIKO ALERCE // THE VOID

Sitio personal de **Niko Alerce** — artista visual 3D & glitch.
Estética brutalista oscura, escena 3D en tiempo real con React Three Fiber, y galería NFT sincronizada en vivo con la blockchain de **Tezos** vía la API GraphQL pública de **Objkt**.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **React Three Fiber** + **drei** + **postprocessing** (Bloom, Chromatic Aberration, Noise, Vignette)
- **graphql-request** contra `https://data.objkt.com/v3/graphql`
- Fuentes Google: `JetBrains Mono` + `Space Grotesk`

## Estructura

```
src/
  app/
    layout.tsx          # fuentes, metadata, scanlines globales
    page.tsx            # composición de secciones
    globals.css         # glitch, scanlines, vignette CRT
    api/objkt/route.ts  # proxy + cache (revalidate 300s)
  components/
    Hero.tsx            # héroe con escena 3D + marquee
    Scene3D.tsx         # R3F: orb distorsionado + bloom + chromatic
    ModelViewer.tsx     # visor de .glb con OrbitControls
    MediaRenderer.tsx   # decide mp4 / image / glb
    NFTGallery.tsx      # grid din\u00e1mico desde Objkt
    NFTCard.tsx
    Shop.tsx            # productos f\u00edsicos (placeholder checkout)
    Navbar.tsx
    Footer.tsx
    GlitchText.tsx
  lib/
    objkt.ts            # cliente GraphQL + queries + helpers IPFS
    types.ts
```

## Setup

```bash
npm install
cp .env.example .env.local   # opcional, valores por defecto ya funcionan
npm run dev
```

Abrir <http://localhost:3000>.

## Galer\u00eda din\u00e1mica

La galer\u00eda consulta tokens **creados** por un alias de Objkt:

```graphql
query TokensByAlias($alias: String!) {
  token(
    where: {
      creators: { holder: { alias: { _eq: $alias } } }
      supply: { _gt: "0" }
    }
    order_by: { timestamp: desc }
    limit: 60
  ) {
    token_id name display_uri artifact_uri thumbnail_uri mime
    fa_contract timestamp supply
    creators { holder { address alias } }
  }
}
```

Por defecto se consultan los aliases **`nikoalerce`** y **`sidequest`**.
Cambialos editando `src/app/page.tsx` o seteando `NEXT_PUBLIC_OBJKT_ALIASES` en `.env.local`.

El handler `/api/objkt?alias=...` cachea 5 min con `stale-while-revalidate` para no machacar el endpoint p\u00fablico.

## Manejo de medios

`MediaRenderer.tsx` detecta el `mime` y elige render:

- `video/*` &rarr; `<video autoplay loop muted playsinline>`
- `model/gltf-binary` &rarr; visor R3F con OrbitControls (carga al hover)
- `image/*` &rarr; thumbnail v\u00eda CDN de Objkt (`assets.objkt.media`)
- fallback &rarr; `display_uri` o `artifact_uri` v\u00eda IPFS gateway

## Est\u00e9tica

- Fondo `#000000` absoluto
- **Scanlines** + **vignette CRT** globales en `globals.css`
- **Glitch text** con dos pseudo-elementos (rojo/cyan) clipeados
- En la escena 3D: **Bloom**, **ChromaticAberration**, **Noise**, **Vignette**
- HDRI `night` de drei + rim lights `#ff0040` y `#00fff0`

## Deploy

Compatible con **Vercel** (recomendado). El route handler se cachea en edge,
las consultas a Objkt se proxean para evitar CORS y permitir cache.

```bash
npm run build
npm run start
```

## Pr\u00f3ximos pasos sugeridos

- [ ] Subir un `.glb` propio a `/public/models/` y reemplazar el orb procedural por una pieza tuya en el Hero.
- [ ] Conectar el Shop a Stripe / Shopify Storefront (o pago directo en XTZ con Beacon Wallet).
- [ ] Filtros de la galer\u00eda por colecci\u00f3n / mime / a\u00f1o.
- [ ] P\u00e1gina de detalle por token (`/asset/[fa_contract]/[token_id]`) con visor 3D fullscreen.
- [ ] Modo "live mint" con webhook desde TzKT para notificar drops nuevos.

## Cr\u00e9ditos

- API: [Objkt GraphQL](https://data.objkt.com/v3/graphql)
- Indexer alternativo: [TzKT](https://api.tzkt.io)
- Inspiraci\u00f3n: brutalismo digital, MS-DOS, demoscene, vaporwave colapsado.
