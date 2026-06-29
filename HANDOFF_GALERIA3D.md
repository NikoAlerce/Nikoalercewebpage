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

## Actualización (2026-06-29 · sesión 2) — GIFs pesados → mp4 local, redirect de gateway, reproducción por cercanía

Síntoma reportado: **en local todo fluido, pero en Vercel los assets cargan y cuesta muchísimo que se reproduzcan al acercarse** ("me quedo esperando bocha de rato"). Diagnóstico y fixes:

### 1) Reproducción por CERCANÍA, no por mirada (`MetaverseGallery.tsx`)
El "play budget" (`videoPlayFrames`) ordenaba los videos **por mirada** (`dot`, qué tan centrado en la vista) → acercarse no alcanzaba, había que apuntar la cámara justo. Ahora ordena **por distancia** (`a.d2 - b.d2`); el único filtro de mirada que queda descarta lo que tenés casi a la espalda (`dot > -0.45`) para liberar el cupo de decoder. Caminar hacia una pieza ahora la reproduce.

### 2) Causa raíz en Vercel: el proxy serverless en el camino de los bytes
El proxy `/api/ipfs` transmitía **cada Range request del `<video>` a través de una función serverless**, re-buscando gateway cada vez (el `Map` `fastestGateway` en memoria **no sobrevive entre invocaciones serverless**) y haciendo doble salto del archivo entero. En local es un solo proceso caliente → por eso ahí volaba.
- **Fix (`src/app/api/ipfs/route.ts`)**: las URLs de media animada llevan `&redirect=1`. En ese modo el route **prueba (probe Range bytes=0-1) un gateway rápido con CORS+Range, lo fija por CID y devuelve un `307` directo al gateway** (`pickVideoUrl`/`probeGateway`, `VIDEO_GATEWAYS`). El navegador baja directo, con Range nativo, **sin lambda en el camino de los bytes**. Imágenes/GIFs estáticos (miniaturas) siguen por el proxy normal (chicos, se cachean en el edge). Probado: pinata.cloud e ipfs.io sirven el mp4 directo con `access-control-allow-origin: *`.
- `proxied(uri, { redirect: true })` en `useNftMedia` genera la URL con el flag (videos, playlist y el fetch del GIF para decode).

### 3) Lo más importante: los GIFs son monstruosos → transcodificados a mp4 local
La colección **sidequest** son **57 GIFs de 14–40MB cada uno** (vs. solo 3 videos). Eso es lo que realmente hacía que tardaran: bajar 14-40MB + decodificar todos los frames con `ImageDecoder`. El redirect ayuda pero un GIF de 40MB tarda igual.
- **`scripts/optimize-nft-gifs.mjs`** (nuevo): baja cada GIF de un gateway y lo transcodifica con **ffmpeg → mp4 H.264, 640px, sin audio, `+faststart`** a `public/nft-opt/<cid>.mp4`, y anota los CIDs OK en `src/lib/optimizedManifest.json`. Es **resumible** (saltea los que ya existen) e idempotente. Correr con el dev server arriba en `:3000` (de ahí saca la lista de tokens): `node scripts/optimize-nft-gifs.mjs [limit]`. **Resultado: 799MB → 117MB** (~1–4MB c/u).
- **`src/lib/optimizedMedia.ts`** (nuevo): `optimizedVideoUrl(uri)` → `/nft-opt/<cid>.mp4` si el CID está en el manifest, si no `null`.
- **`useNftMedia.ts`**: si hay mp4 local, `treatAsVideo=true` → reproduce por el path **VideoTexture** (barato, mismo origen) y **saltea el decode del GIF**. La miniatura estática nunca usa el artifact pesado.
- **`MetaverseGallery.tsx`**: `unitIsVideo` ahora cuenta también los GIFs optimizados → entran al presupuesto de videos concurrentes (animan ~6 a la vez, el resto muestra still). Fallback al pipeline IPFS original para cualquier CID que no esté en el manifest.
- **Si el artista agrega/cambia GIFs**: re-correr el script (solo procesa los nuevos) y commitear `public/nft-opt/` + `optimizedManifest.json`.

### 4) Bug arreglado (regresión introducida y corregida en esta misma sesión)
Al marcar los GIFs como "video", el still pasó por error de `thumbnail_uri` (~1.3MB) a `display_uri` (~8.9MB). Como **los 57 cuadros cargan su still de entrada**, eran **~500MB de imágenes** bajando + subiendo a la GPU de golpe → "nunca termina de cargar" + **GPU al palo**. Revertido: el still vuelve a `thumbnail_uri` (chico).

### Archivos tocados / nuevos (esta sesión)
- `src/app/api/ipfs/route.ts` — modo `redirect=1`: 307 a gateway directo (probe + pin por CID).
- `src/components/useNftMedia.ts` — `proxied(...,{redirect})`, `treatAsVideo`/mp4 local, skip de decode GIF, still = thumbnail.
- `src/components/MetaverseGallery.tsx` — play budget por distancia; `unitIsVideo` incluye GIFs optimizados.
- `scripts/optimize-nft-gifs.mjs` — **nuevo**: transcodificador GIF→mp4 (resumible).
- `src/lib/optimizedMedia.ts` + `src/lib/optimizedManifest.json` — **nuevos**: mapa CID→mp4 local.
- `public/nft-opt/*.mp4` — **nuevos**: los 57 GIFs optimizados (117MB).

### Pendientes nuevos
- **El repo creció +117MB** (los mp4 en `public/nft-opt`). Vercel los sirve por CDN sin problema, pero si molesta el peso del repo → mover a **Vercel Blob / CDN externo** y ajustar `optimizedVideoUrl` para apuntar ahí.
- **VRAM de miniaturas**: 57 stills × ~1.3MB webp sigue siendo bastante textura. Si la GPU sigue cargada, **cap de tamaño de textura** (resize de thumbnails / `texture.minFilter` + dimensiones menores) es el próximo escalón.
- **Los 3 videos reales** (mp4 en IPFS) siguen dependiendo del gateway público vía redirect; para esos, gateway dedicado (Pinata key) o re-hostear sigue siendo lo ideal.
- (Sigue pendiente de antes) **esconder el overlay de diagnóstico** FPS/draws/tris/vid para usuarios finales.

---

## Actualización (2026-06-29) — Performance de video, interacción por mira, playlist y tiers

Sesión posterior: hacer la galería **fluida** y la reproducción de video **inmediata**, sumar una **playlist con sonido**, **selección por mira** y un **indicador de carga**.

### Streaming y carga de video — proxy IPFS (`src/app/api/ipfs/route.ts`)
- **Range requests**: reenvía el header `Range` al gateway y devuelve `206 Partial Content` con `Content-Range`/`Accept-Ranges` → el `<video>` reproduce en streaming en vez de bajar el mp4 entero (era la causa #1 de la demora).
- **Carrera de gateways + pinning**: la 1ª petición de cada CID corre 3 gateways en paralelo (`Promise.any`), usa el más rápido y lo **fija por CID** (Map en memoria) para los Range siguientes. Fallback secuencial, timeout 8s/gateway. Se quitó `cloudflare-ipfs.com` (muerto), se sumó `4everland.io`.
- **Cache `immutable` 1 año** (`public, max-age=31536000, immutable`): IPFS es content-addressed. En Vercel llena el edge cache (2º visitante instantáneo). **OJO**: los `206` de video no siempre se cachean en el edge → el escalón real para video pesado sigue siendo **gateway dedicado** (Pinata con key) o re-hostear.

### Reproducción inmediata + presupuesto de videos (lo más importante de perf)
Síntoma: pared con muchos videos → **10 FPS**. Causa: el navegador tiene un **límite de decoders de video por hardware** (~5–6); pasado eso cae a software (CPU) y se desploma. **No es la GPU** (una Arc A730M también caía).
- **Presupuesto priorizado por la mirada** (`videoPlayFrames`): solo reproducen los N videos más **centrados en tu vista** (`dot` = dirección de cámara · dirección-a-obra, en XZ); el resto muestra su **still a resolución completa** (`display_uri`). El set sigue tu mirada.
- **Pre-buffer** (`videoBufferFrames`): los videos cercanos (≈2× el presupuesto, por distancia) **descargan apenas entrás al radio** (`preload=auto`, en pausa, sin textura → cero GPU). Girar a otro grupo = solo play/pause, sin recargar. Esto arregla el "cargan pero tardan en reproducir" del deploy.
- **GIFs** siguen por proximidad (`activeFrames`); son más baratos.
- Hook central: `useNftMedia(token, { active, videoActive, bufferActive })` — `active`=gif, `videoActive`=reproduce, `bufferActive`=precarga. La VideoTexture solo se muestra cuando hay frame decodificado (sin flash negro).

### Tiers de calidad (adaptación a la máquina) — en `MetaverseGallery`
- `TIERS` LOW/MED/HIGH → `videoBudget` (3/6/9), `dpr` ([1,1]/[1,1.25]/[1,1.4]), `maxActive` (8/16/24).
- `detectTier()` por GPU (`WEBGL_debug_renderer_info`), cores y RAM. **MED es el default sano** (techo real de decoders de casi cualquier máquina, laptops con GPU discreta incluidas); HIGH es opt-in solo para GPUs de escritorio tope; LOW para software/integradas.
- **Hotkeys `1`/`2`/`3`** cambian tier en vivo (sirven con pointer-lock) + selector **GFX** arriba-derecha. Overlay diagnóstico arriba: `FPS / draws / tris / active / vid X/Y` (**sigue visible para usuarios finales → esconder antes de "producción final"**).

### Selección por mira (raycast) + click
- `TargetingController` (en el Canvas) lanza un rayo por el centro de pantalla cada frame → resuelve el primer NFT apuntado (registro en `targetsRef`: `NftFrame` registra su grupo, `MeshScreen` su malla), hasta 18 unidades.
- El frame **apuntado** maneja HUD, brillo, `[E]` y **click** (mousedown global mientras estás locked). Preciso aunque haya muchos NFTs juntos; la mira se pone cyan al apuntar. La proximidad ya **no** maneja selección.

### Playlist con sonido en la pantalla "Wicked World"
- La pantalla que mostraba **"Wicked World"** (token 23, gif; pantalla **curva** spot 26 = `Object_574.027`) ahora reproduce una **playlist de 3 videos en bucle, con sonido**:
  1. `KT1G1wt3PFhfLf6UW6bJGsuNuhgnNWKSh7sW:353` — Niko Alerce
  2. `KT1PUZFdBCVscamVfr91rcZPpPau5MHiS3ip:2` — The Blender Cube
  3. `KT1PUZFdBCVscamVfr91rcZPpPau5MHiS3ip:0` — Mask (Music Video)
- `PLAYLIST_IDS` + `PLAYLIST_HOST` (`/wicked\s*world/i`) en `MetaverseGallery`; la unidad que matchea recibe `playlist`. `usePlaylistMedia(tokens, { active, withSound, onTrack })` cicla con el evento `ended`, sin mute (si el browser bloquea autoplay-con-sonido reintenta muteado), y reporta el track actual.
- **HUD muestra el track en reproducción** (no "Wicked World") vía `tokenForUnit()`; `[E]`/click abren el track actual.
- Nuevo endpoint **`/api/tokens?ids=contrato:id,...`** + `fetchTokensByIds` en `objkt.ts` (trae tokens de **cualquier** contrato, no solo de las colecciones del artista).

### Fixes visuales
- **Mallas en negro antes de cargar**: `MeshScreen` pinta la malla en negro hasta que llega el NFT (antes asomaba el placeholder beige horneado del GLB).
- **Paneles verticales (slots:3) en negro**: `BlackoutMesh` pinta las mallas `Object_574.011/.012/.016/.023/.024/.025/.034` (paneles altos) → sin beige ni z-fight contra los planos flotantes apilados.
- **Espejado en la pantalla curva**: `flipU` en `applyCover` (invierte el eje U). La proyección planar de UV de la malla curva corría al revés del sentido de visión → video/texto espejado. Atado a `curved:true`.

### Indicador de carga
- `AssetProgressHUD` (DOM) lee `useProgress` (DefaultLoadingManager): muestra **`cargados / total`** + % + barra mientras cargan GLB/HDR/miniaturas (TextureLoader). Se oculta solo al terminar.

### Interactivo Eyejack — NO se pudo (revertido)
- Se intentó embeber `KT1DZDmc2x8XvwiqYFCVrbSYMA7RZhEeNAtR:0` ("The observer and the observed") como objeto 3D, pero es **WebAR de Eyejack** (`application/x-directory`, HTML), no un GLB. El iframe en 3D (`InteractiveKiosk`) no funciona porque Eyejack pide cámara/AR. **Borrado** a pedido. Vía futura: un cuadro normal que abra la experiencia a pantalla completa / nueva pestaña.

### Archivos tocados / nuevos (esta actualización)
- `src/app/api/ipfs/route.ts` — Range + race + pinning + cache immutable.
- `src/app/api/tokens/route.ts` — **nuevo**: fetch por contrato:id.
- `src/lib/objkt.ts` — `fetchTokensByIds` + query `TOKENS_BY_IDS`.
- `src/components/useNftMedia.ts` — split buffer/play, `usePlaylistMedia`, still de video = `display_uri`.
- `src/components/NftFrame.tsx` — `shouldPlayVideo`/`shouldBufferVideo`/`isTargeted`, registro en `targetsRef`, playlist.
- `src/components/MeshScreen.tsx` — black-before-load, `BlackoutMesh` (export), `flipU`, playlist, registro target, gates de video.
- `src/components/MetaverseGallery.tsx` — tiers + auto-detect + hotkeys + GFX, `TargetingController`, `videoPlayFrames`/`videoBufferFrames`/gaze, `AssetProgressHUD`, playlist host, blackout slotted, perf overlay.

### Pendientes nuevos
- **Gateway IPFS dedicado** (Pinata/own con key) o re-hostear videos: único escalón que queda para video pesado en prod.
- **Esconder el overlay de diagnóstico** (FPS/draws/tris/vid) para usuarios finales.
- **Rediseño del hero/landing**: recomendación acordada = "la obra es el hero" (sacar orbe/ruido, un foco, placa de museo, glitch como puntuación, paleta neutra + color de la obra). **Pendiente prototipar en branch `hero-redesign`.**

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
