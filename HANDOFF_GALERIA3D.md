# Handoff — Galería 3D `/metaverse` (Niko Alerce)

> Sesión 2026-06-28. Resumen de todo lo tratado y hecho, para el próximo dev.

## TL;DR del estado final
La ruta **`/metaverse`** (link "3D GALLERY" del navbar) ahora es una **galería de arte 3D en
primera persona**: caminás por `nuevagalery.glb`, los **36 cuadros** muestran las obras NFT del
artista (objkt), hacés click en un cuadro → se abre el visor → **comprás on-chain** con wallet Tezos.
Todo el flujo de compra ya existía y se reutiliza.

- Stack: **Next.js 14 + React Three Fiber + three 0.169** (NO es Decentraland).
- Proyecto: `C:\niko\escritorio\Pagina Niko Alerce`. Dev: `npm run dev` (corrió en :3001 porque :3000
  quedó ocupado por un server viejo — matar el viejo o usar el puerto que indique la consola).

---

## Cómo llegamos acá (arco de la sesión)
1. Pedido inicial: usar los GLB optimizados de Mario Kart en la galería/minijuego 3D de la página.
2. Se construyó primero un **circuito de karts conducible** en `/metaverse` (KartCircuit + Karts:
   manejar kart10, track/arboles optimizados, cielo nocturno). **Descartado** por el usuario.
3. Pivote a **galería de arte**: se conectó `MetaverseGallery` (estaba dormida) a `/metaverse`, con
   `artgalery1.glb`. **Descartado** (tenía una ciudad; el usuario quería otra galería).
4. Galería final: **`nuevagalery.glb`** (sin ciudad). Problema: las pinturas venían como **atlas de
   textura sobre malla soldada** → imposible ubicar obras por geometría. Se intentó extracción por
   islas/rectángulos UV (frágil: 11 vs 83).
5. **Solución**: el usuario re-exportó con **cada cuadro como objeto separado**
   (`Object_574.001`–`.036`). Se extrajeron los 36 transforms exactos y se terminó la galería.

---

## Arquitectura actual de la galería
- `src/app/metaverse/page.tsx` → `dynamic(import("@/components/MetaverseGallery"))` (ssr:false).
- `src/components/MetaverseGallery.tsx` — orquestador: Canvas, luces, fetch de tokens, HUD,
  interacción, `FRAME_SPOTS` (36 cuadros), score minijuego (descubrir `[E]`, bonus al comprar).
- `src/components/GalleryScene.tsx` — carga `nuevagalery.glb` con **Draco** (`useGLTF(url, true)`),
  marca todas las mallas `userData.isCollidable` (colisión por raycast de `PlayerControls`).
- `src/components/NftFrame.tsx` — un cuadro: carga la textura de la obra (con fallback de gateways
  IPFS), la ajusta **por aspecto sin deformar** dentro del tamaño real del cuadro (`maxW/maxH`),
  dibuja un **fondo opaco** que tapa el placeholder, marco + etiqueta + `[E]`. Click → `openModal`.
- `src/components/PlayerControls.tsx` — caminata FPS (WASD, mouse, salto). Tiene prop opcional
  `getGroundY` (seguir relieve) que la galería NO usa (piso plano `FLOOR_Y=0`); quedó del circuito.
- Compra: `TokenViewerModal` + `WalletContext` (Beacon/Tezos: Kukai/Temple/Umami, `fulfill_ask`),
  ya montados globalmente en `AppShell` (`src/components/AppShell.tsx`) → disponibles en `/metaverse`.

## Datos de las obras (NFTs)
- API: `src/app/api/objkt/route.ts` → objkt GraphQL (`src/lib/objkt.ts`).
- Colecciones (en `ALIAS_TO_WALLET`): **nikoalerce** `tz1WNzaqX3KWbBbGtDJRR4Z7ZcVQRpKqcizb` (244) +
  **sidequest** `tz1YSF1SJA9AAKQHaTFGGH98NDqowxdH1XWU` (61). MetaverseGallery hace fetch de ambas,
  mergea/dedupea, filtra quemadas y excluye "G0dz #".
- **Filtro de medios**: solo `image/gif/video` en los cuadros (sin glb/html); los 3D igual se ven
  completos al abrir el visor.

## Los 36 cuadros (clave)
- `nuevagalery.glb`: nodo `Object_574` = galería entera; `Object_574.001`–`.036` = 36 cuadros (quads).
- Transforms exactos extraídos con `…/scratchpad/extract36.js` (parser GLB binario: por cada quad
  calcula centro, normal→`rotY`, ancho/alto; orienta la normal hacia el interior). Salida volcada a
  `FRAME_SPOTS` en `MetaverseGallery.tsx`.
- **Si el artista re-exporta la galería, hay que re-correr `extract36.js`** y pegar la salida en
  `FRAME_SPOTS`.

## Pipeline de optimización GLB (reutilizable)
Vive en el repo DCL `C:\niko\escritorio\bakup\mariokart2\tools` (tiene `@gltf-transform` + `draco3d`
+ `sharp` instalados). Correr desde ahí:
- `node tools/optimize-textures.mjs <in> <out> [size]` — solo reescala texturas webp (sin draco/weld;
  preserva UVs especiales).
- `node tools/draco-one.mjs <in> <out>` — weld + Draco (geometría).
- `node tools/optimize-one.mjs <in> <out>` — pipeline completo (texturas 512 + weld + draco).
Resultados: `nuevagalery.glb` **75.7MB → 3.47MB** (texturas 1024 + draco).

## Bugs arreglados notables
- **Cuadros ~1.6m demasiado arriba**: el float vertical de `NftFrame` sumaba `position[1]` de nuevo
  sobre el grupo ya posicionado (doble offset). Corregido a float local (`*0.012`).

---

## Limpieza ya hecha (2026-06-28)
Se borró el código muerto (circuito de karts + escena de pasto + galería vieja). Eliminados:
- Componentes: `KartCircuit.tsx`, `Karts.tsx`, `MagicGrassScene.tsx`, `ForestSkybox.tsx`,
  `GroundPlane.tsx`, `GrassField.tsx`, `MagicParticles.tsx`.
- `public/`: `kart.glb`, `kart2/5/9/10.glb`, `track.glb`, `arboles.glb`, `artgalery1.glb`,
  `artgalery.glb`, `forest_skybox.glb`. Root: `artgalery1.glb.glb`, `forest_clearing_*.glb`.
- Único GLB que queda en `public/`: **`nuevagalery.glb`**. Typecheck OK, `/metaverse` 200.

## Pendientes / próximos pasos
- **Verificación visual**: confirmar que los 36 cuadros calzan y miran bien (la `rotY` se calcula por
  centroide de la galería; algún cuadro de pared interior podría mirar al revés → ajustar ese `rotY`).
- **Decoder Draco/WebP** se baja del CDN gstatic en runtime (drei `useGLTF(url, true)`) → considerar
  self-hostear el decoder para no depender de la red en producción.
- **Perf mobile**: se cargan 36 texturas de obras; en mobile se limita a 18. Revisar memoria/carga.
- **Minijuego de score**: sigue activo (puntos por descubrir/comprar). Definir si se queda o se pulen
  las reglas.
- **Estética del marco/HUD**: se suavizó la paleta (oro/crema). Afinar a gusto si se quiere más sobrio.

## Archivos tocados esta sesión (en la página)
- `src/app/metaverse/page.tsx` — rutea a MetaverseGallery.
- `src/components/MetaverseGallery.tsx` — FRAME_SPOTS(36), fetch 2 colecciones, filtro de medios,
  luces delicadas, `PLAYER_START`, mostrar los 36.
- `src/components/GalleryScene.tsx` — carga nuevagalery.glb (draco) + colisión.
- `src/components/NftFrame.tsx` — `maxW/maxH`, fondo opaco, fix del float, paleta suave, escala de
  etiqueta en cuadros chicos.
- `src/components/PlayerControls.tsx` — prop opcional `getGroundY` (terreno; sin uso en la galería).
- `nuevagalery.glb` (fuente, root) + `public/nuevagalery.glb` (optimizado).
