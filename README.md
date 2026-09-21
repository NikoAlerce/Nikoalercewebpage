# Niko Alerce — sitio personal

Sitio publicado: https://www.nikoalerce.xyz/

Next.js 15.5, React 19, TypeScript y Tailwind CSS. Las escenas 3D usan React Three Fiber 9, drei 10 y Three.js; las colecciones se consultan mediante Objkt GraphQL. El sitio incluye música, galería 3D, Decentraland, AR Labs, herramientas, catálogo y página de ayuda.

## Desarrollo

Usar Node.js 22 o 24.

```sh
npm ci
npm run dev
```

Abrir http://localhost:3000. `.env.example` documenta las opciones; copiarlas a `.env.local` solo cuando se necesiten. Nunca subir secretos al repositorio.

## Validación

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Con el servidor de producción en ejecución y sin credenciales de analytics:

```sh
npm run test:smoke
```

`TEST_BASE_URL` permite usar otro puerto. Las pruebas verifican páginas, idioma, metadata, consultas de tienda, validación de API y privacidad de estadísticas. No envían mensajes ni transacciones.

## Colecciones y medios

`src/lib/objkt.ts` mapea `nikoalerce` y `sidequest` a sus wallets. `/api/objkt?alias=...` acepta hasta 300 obras por consulta y un offset no negativo. `/api/tokens?ids=contrato:token` permite recuperar hasta 100 obras específicas. Una caída de Objkt devuelve 502 sin cachear una colección vacía.

`/api/ipfs` distribuye contenido por gateways con soporte Range. Acepta CIDs con rutas sin traversal; las respuestas llevan una política sandbox para que HTML o SVG no ejecuten código con el origen de la web.

## Tienda y compras NFT

La tienda física es un catálogo de muestra. Sus enlaces abren una consulta por correo; precios, stock, pagos y envíos deben confirmarse con el artista. No hay carrito ni checkout de productos físicos.

Las compras NFT mediante Beacon se envían a Tezos. Tras el envío se muestra el enlace a TzKT para verificar el resultado. El sitio no declara una compra confirmada por tiempo transcurrido. La comprobación de una compra real requiere una wallet y autorización del titular.

## Estadísticas

Configurar `GOATCOUNTER_API_TOKEN` y `STATS_ACCESS_KEY` en el hosting para habilitar `/stats`. Si falta la clave, el panel privado queda deshabilitado. La clave se transmite mediante `x-stats-key`, nunca en la URL. `/api/stats/public` conserva únicamente el resumen público de visitas y países.

## Dependencias y despliegue

Compatible con Vercel. `npm run build` descarga las fuentes de Google y requiere acceso a Internet. La carga del metaverso sin SSR se declara en un componente cliente, como requiere Next.js 15.

PostCSS se fija en 8.5.28 también para dependencias transitivas mediante `overrides`, para incluir sus correcciones de seguridad. Auditoría del 21/09/2026: 0 alertas críticas, 0 altas, 17 moderadas y 11 bajas; las pendientes corresponden a Beacon/Taquito/WalletConnect y sus dependencias criptográficas. Revisar `npm audit` antes de futuros despliegues. Su migración mayor requiere probar el emparejamiento y las compras con wallets compatibles.
