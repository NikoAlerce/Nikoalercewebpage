# Handoff — Sesión 2026-06-30 (audio, galería, mobile, fix eyección + personajes en títulos)

> Resumen de todo lo hecho y dónde quedó cada cosa, para el próximo dev.
> Proyecto: `C:\niko\escritorio\Pagina Niko Alerce` — **Next.js 14 + React Three Fiber + three 0.169**.
> Dev: `npm run dev` (:3000). **Nada está commiteado**; el usuario commitea a mano.

---

## ⚡ ACTUALIZACIÓN (parte 2 de la sesión) — personajes: rollout + fix de memory leak + tamaño

- El usuario **ubicó los personajes en todos los títulos** (About, Art on Tezos, Music, Shop,
  Decentraland, AR Labs, Footer, Home) con el patrón `flex items-center` + `<h2 flex-1>` +
  `<TitleCharacter ... className="shrink-0 hidden md:block" />`, todos `size={340}`.
- El usuario **re-buildeó `public/characters/character.glb` desde Blender** (5.2 MB, **sin Draco**,
  conserva WebP + 9 clips). El nombre de huesos es `mixamorig:*` y el Armature trae una rotación
  de axis-convert que `TitleCharacter` compensa con un quaternion inverso.
- **Bug encontrado: `THREE.WebGLRenderer: Context Lost` (decenas) + memory leak.** Causa: cada
  `<TitleCharacter>` montaba **su propio `<Canvas>`** → un contexto WebGL por personaje; el browser
  tope ~16 y mata los viejos. **Arreglado migrando a UN solo contexto compartido** con drei
  `<View>`:
  - **Nuevo** `src/components/CharacterStage.tsx`: un único `<Canvas>` fixed full-viewport,
    `pointer-events:none`, `z-5`, con `<View.Port/>`. Montado en `AppShell`. Se desactiva en
    `/metaverse`.
  - `TitleCharacter` ahora renderiza `<View className style>…</View>` (drei `View` crea **su propio
    div** de tracking y scissorea el personaje dentro; **OJO:** fuera de un Canvas, `View` ignora
    cualquier prop `track` y el div propio — hay que usar `<View>` directo, sin envolverlo).
  - Resultado verificado: navegando por todo el sitio quedan **2 canvas** (stage + hero) y ambos
    contextos `OK`, sin "Context Lost".
- **Bug "tamaños distintos":** el fit viejo escalaba con `min(ancho,alto)` del bbox del clip → los
  clips anchos (baile) se achicaban. Ahora la escala sale de una **altura de referencia FIJA** (los
  huesos en pose de bind), igual para todos los clips → **mismo tamaño de cuerpo en todas las
  secciones**. Knob: `FILL` en `TitleCharacter.tsx` (hoy `0.55` = el cuerpo ocupa 55% del alto del
  frame; subir para agrandar). El figure se **centra sobre el bbox muestreado del clip** para que
  saltos/poses anchas no se corten.
- **Warning dev-only** que queda: *"Cannot update a component while rendering a different
  component"* desde `TitleCharacter` → es el tunnel-rat interno de drei `<View>` (setState-in-render).
  **Es benigno y NO aparece en build de producción.**

---

## TL;DR
Cinco frentes tocados en esta sesión:
1. **Música de fondo** sitewide (`audio.mp3`) con botón mute. ✅ hecho
2. **Galería `/metaverse`**: clic derecho libera el puntero + **nav bar** para cambiar de sección sin salir. ✅ hecho
3. **Optimización mobile** del sitio, sobre todo el **hero** (la palabra 3D no entra en pantalla vertical → se reemplaza por una etiqueta HTML nítida en mobile). ✅ hecho
4. **Fix del bug de "salir eyectado de la galería"** (tunneling por `dt` sin clamp). ✅ hecho
5. **Personajes animados (Mixamo) al lado de cada título.** ⚠️ **EN PROGRESO** — pipeline de assets y componente listos y verificados, pero **falta el rollout a todos los títulos** (hay 1 personaje de prueba en la home). Esperando confirmación del mapeo animación→sección.

---

## 1. Música de fondo ✅
- **Nuevo:** `src/components/BackgroundMusic.tsx`. Montado en `src/components/AppShell.tsx`.
- Reproduce `/public/audio.mp3` en loop (vol 0.4). Autoplay bloqueado por el navegador → reintenta en el primer gesto del usuario. Preferencia (on/off) persistida en `localStorage` (`nikoalerce:music`).
- **Botón** flotante abajo-derecha (ícono altavoz/mute), `z-[55]`.
- **Se pausa y se oculta el botón en `/metaverse`** (la galería tiene su propio sonido + videos NFT con audio; chocarían).

## 2. Galería `/metaverse`: clic derecho + nav bar ✅
- `src/components/MetaverseGallery.tsx`:
  - **Clic derecho** mientras estás "dentro" → `unlock()` del pointer lock (y se suprime el menú contextual del browser). El clic izquierdo sigue abriendo la obra apuntada (ahora chequea `e.button === 0`).
  - Al liberar el cursor aparece una **`<nav>` superior** (solo desktop) con los links de sección (reusa `NAV_LINKS`, exportado desde `src/components/Navbar.tsx`). `3D GALLERY` queda en rojo (activo).
  - **Sin solapamientos:** el overlay de FPS/perf se oculta cuando el cursor está liberado (`interactive`), y el selector GFX queda justo debajo de la nav.
  - Instrucciones del overlay de entrada actualizadas: `RIGHT-CLICK — MENU · CHANGE SECTION`.
- `src/app/globals.css`: agregada utilidad `.no-scrollbar` (para la nav scrolleable).
- En mobile no hay pointer lock → la nav no aplica; se sale con el botón EXIT (vuelve a la home).

## 3. Optimización mobile (incl. hero) ✅
- **Hero** (`src/components/HeroExperience.tsx`): la palabra 3D de cada sección **no entra legible** en el frustum angosto de un celular vertical (se cortaba, ej. "Music"→"M"). Solución: en mobile **se oculta la palabra 3D** (`{!mobile && <ActiveLabel/>}`) y se muestra una **etiqueta HTML** centrada y tocable ("Tap to enter") que cambia con el carrusel. En desktop queda igual que antes.
  - **Gotcha encontrado:** `animate-fade-up` define `transform: translateY()` y **pisa** las utilidades `-translate-x/y-1/2` de Tailwind. Por eso el centrado va en un **contenedor** y la animación en el **hijo**.
- Recorrido a 375px de home, art-on-tezos, music, shop, galería: **sin overflow horizontal**, grillas/filtros ya responsivos de sesiones previas. No hizo falta más.

## 4. Fix "salís eyectado de la galería y no podés volver" ✅
- **Causa:** en `src/components/PlayerControls.tsx` el `dt` **no se clampeaba** ("para movimiento más suave") y la colisión lanzaba un rayo fijo de 1 m. En un tirón de frame (la galería streamea/decodea videos → stalls), el `dt` se dispara, el jugador avanza varios metros en un frame y **atraviesa la pared** (tunneling), quedando afuera sin poder volver.
- **Arreglos (3):**
  1. **Clamp del `dt`** a `0.1` s máximo.
  2. **Colisión barrida (swept):** el rayo cubre **todo el paso del frame** (`moveDist + playerRadius`), no 1 m fijo. El jugador se desliza hasta la pared pero **nunca la cruza**.
  3. **"Correa" de seguridad:** si igual termina lejísimos fuera del edificio (footprint ~ `x[-32..10] z[-12..9]`), se lo reubica en el `startPosition`. Solo se activa con `getGroundY` ausente (= la galería plana), así no afecta usos con terreno.
- Quien ya quedó atrapado afuera con la versión vieja: al recargar entra normal.

---

## 5. Personajes animados en los títulos ⚠️ EN PROGRESO

### Qué pidió el usuario
Sumar, **al lado de cada título de todo el sitio**, un **personaje 3D animado** que interactúe; elegir las animaciones de una carpeta de FBX; mandar al `.gitignore` las que no se usen.

### Qué pasó con los assets (importante)
- El usuario subió 15 FBX de Mixamo (mismo personaje, una animación c/u) a `public/fbx/` y **los convirtió él a GLB** (`*.fbx.glb`, ~6 MB c/u).
- **Esos GLB no tenían textura** (material gris plano `baseColorFactor 0.6`); la conversión la descartó. El mesh (105k vért.) venía **duplicado en cada archivo**, sin Draco.
- **Rescaté la textura del FBX:** los FBX originales estaban en `C:\Users\Mami\Downloads\*.fbx`. Cada uno tenía **1 PNG embebido** (2048², el personaje de capucha verde), **idéntico en los 15** (mismo MD5). Extraído a `public/fbx/character.png`.

### Pipeline de optimización (lo que faltaba: unificar + Draco + WebP)
- **Script:** `scripts/build-character.mjs` (Node, usa `@gltf-transform/*` + `draco3dgltf` + `sharp`, instalados como devDeps).
- Qué hace: toma un GLB base (Idle) → conserva **el mesh una sola vez**; **mergea las animaciones** de los demás re-bindeándolas al esqueleto compartido por **nombre de hueso** (`mergeDocuments` + retarget de channels); **hornea** `character.png` como `baseColorTexture`; `weld()` (indexa el mesh, requisito de Draco) + `resample` + `prune` + `textureCompress` a **WebP 1024²**; consolida buffers; **Draco** (`KHR_draco_mesh_compression`).
- **Output:** `public/characters/character.glb` — **1.49 MB**, 1 mesh, 1 material (WebP), **9 clips**: `idle, waving, pointing, hiphop, robot, searching, breakdance, pushing, sitting`. (vs ~90 MB de los 15 sueltos).
- **Re-build:** `node scripts/build-character.mjs` (necesita `public/fbx/` con los `*.fbx.glb` + `character.png` localmente).

### Componente
- **Nuevo:** `src/components/TitleCharacter.tsx`.
  - Props: `clip` (uno de los 9), `size` (px de alto), `className` (posicionamiento), `flip`.
  - Carga el **GLB único** (`useGLTF(MODEL_URL, true)` → 2º arg activa el **decoder Draco**, que viene del CDN de gstatic). Lo **clona** (`SkeletonUtils.clone`) y reproduce el clip por nombre con `useAnimations`. Textura ya horneada (no se aplica en runtime).
  - **Lazy:** el `<Canvas>` recién se monta cuando el div entra en viewport (`IntersectionObserver`, `rootMargin 300px`), así no se crea contexto WebGL ni se descarga nada hasta que hace falta. El GLB se cachea y se comparte entre todos los personajes del sitio.
  - Auto-fit: normaliza altura y **centra en el origen**; cámara de frente (`[0,0,4.2]`, `lookAt(0,0,0)`), con luz key + fill + **rim cálida** para separar del fondo negro.
- **Verificado en navegador:** renderiza **de cuerpo entero, texturizado** (capucha verde), animado. Typecheck OK.

### Estado del rollout
- **Solo hay 1 personaje de prueba** en `src/app/page.tsx`, en el header "Five ways into the studio" (`clip="waving"`, `size={420}`, posición `absolute ... right-0 md:-right-10`). **Tapa un poco el título** — es de prueba, hay que reposicionar (idealmente **al costado**, sin pisar el texto).
- **FALTA:** poner el personaje en el resto de los títulos del sitio.

### Títulos del sitio (dónde irían) y mapeo PROPUESTO (sin confirmar)
Los `<h2>` con `font-graffiti` de cada sección (grep `font-graffiti`):
| Sección | Archivo / título | Animación propuesta |
|---|---|---|
| Home índice | `src/app/page.tsx` — "Five ways into the studio." | `waving` |
| About | `src/components/About.tsx` — "Full-stack creative." | `pointing` |
| Art on Tezos | `src/components/NFTGallery.tsx` — `{title}` | `pointing` |
| Music | `src/components/Music.tsx` — "Music" | `hiphop` |
| Shop | `src/components/Shop.tsx` — "Shop" | `searching` |
| Decentraland | `src/components/Decentraland.tsx` — "I build" | `robot` |
| AR Labs | `src/components/ArLabs.tsx` — "AR is not the future." | `breakdance` |
| Footer | `src/components/Footer.tsx` — "Let's build" | `waving` |

(Hero y overlay de `/metaverse` se saltean: ya son 3D inmersivo.)

### Decisiones pendientes de confirmar con el usuario (lo último que se preguntó)
1. **¿El mapeo de arriba va, o el usuario elige otras animaciones por sección?** (delegó "elegí de la carpeta", pero conviene confirmar antes de estampar ~8 ubicaciones).
2. **¿Mostrar también en mobile** (más chico) **o solo desktop?** Recomendado **solo desktop**: varios `<Canvas>` 3D a la vez pueden pesar en celulares lentos. (En el hero mobile ya se reemplazó la palabra 3D por HTML, así que ahí no aplica.)
3. **Estilo de ubicación:** al costado del título sin tapar (recomendado) vs. solapado.

### Pendientes técnicos / notas
- **Por título cae un `<Canvas>` propio** (lazy). En una página con varios títulos visibles a la vez, son varios contextos WebGL. Por ahora cada página tiene 1 título principal → 1 contexto. Si se quisiera densificar (ej. un personaje por cada tarjeta del índice), conviene migrar a **un solo canvas compartido con `<View>` de drei** (scissor por div) para no multiplicar contextos.
- **Clips no usados:** quedaron baked en el GLB (idle/pushing/sitting si no se mapean). Son baratos (solo keyframes sobre el mesh compartido). Si se quiere un GLB más chico, sacar clips de `CLIPS` en `scripts/build-character.mjs` y re-buildear.
- El personaje sale un poco oscuro sobre negro pese a la rim light; si molesta, subir `ambientLight`/key o meter un `Environment` neutro (suma carga).

---

## Archivos tocados/creados esta sesión
**Nuevos:**
- `src/components/BackgroundMusic.tsx`
- `src/components/TitleCharacter.tsx`
- `scripts/build-character.mjs`
- `public/characters/character.glb` (versionar — 1.49 MB)
- `HANDOFF_PERSONAJES.md` (este archivo)

**Modificados:**
- `src/components/AppShell.tsx` (monta `BackgroundMusic`)
- `src/components/Navbar.tsx` (`links` → `export const NAV_LINKS`)
- `src/components/MetaverseGallery.tsx` (clic derecho + nav + ocultar perf)
- `src/components/HeroExperience.tsx` (etiqueta mobile HTML, oculta palabra 3D en mobile)
- `src/components/PlayerControls.tsx` (clamp `dt` + colisión barrida + correa)
- `src/app/page.tsx` (personaje de prueba — **provisorio**)
- `src/app/globals.css` (`.no-scrollbar`)
- `.gitignore` (ignora `/public/fbx/` — volcado crudo; el GLB final en `/public/characters/` SÍ se versiona)
- `package.json` / `package-lock.json` (devDeps: `@gltf-transform/*`, `draco3dgltf`, `sharp`)

## .gitignore
- **Ignorado:** `/public/fbx/` (los 15 `*.fbx.glb` crudos + `character.png` fuente). Son insumos del build script; quedan locales.
- **Versionado:** `/public/characters/character.glb` (el único que usa la app).

## Estado del dev server
Corriendo en `http://localhost:3000` (lo levantó el preview). Si se cae: `npm run dev` desde `C:\niko\escritorio\Pagina Niko Alerce`.
