# Revisión técnica — 21 de septiembre de 2026

Repositorio: NikoAlerce/Nikoalercewebpage. Cambios en `fix/site-audit-2026-09`, PR #1. Esta revisión incluye lectura del código, análisis de dependencias, compilación de producción, pruebas automatizadas y navegación local. No es una certificación de seguridad ni una prueba de carga.

## Hallazgos corregidos en la revisión profunda

| Prioridad | Problema y consecuencia | Corrección |
| --- | --- | --- |
| Alta | Una moneda distinta de XTZ podía mostrarse usando su importe nativo como XTZ; los redondeos perdían precisión y una conversión podía usarse como importe pagable. | Separación entre precio nativo y conversión, seis decimales, enteros seguros, validación de moneda, cantidad y contrato antes de enviar. |
| Alta | Clics repetidos o cerrar/cambiar una obra durante la conexión podían dejar solicitudes de compra concurrentes o estados de otra obra. | Guardas de concurrencia en visor y proveedor; invalidación al cerrar/cambiar; comprobación después de conectar. Una solicitud ya enviada a la wallet no se cancela por cerrar el visor. |
| Media | GIF grandes decodificaban todos sus fotogramas a resolución completa; errores o cancelaciones podían retener bitmaps y VideoFrames. | Presupuesto de 16 MiB por animación decodificada, máximo 300 fotogramas y dimensión 512; liberación en éxito, fallo y cancelación. Este presupuesto no limita el archivo comprimido ni toda la memoria del navegador. |
| Media | Las texturas estáticas y los materiales clonados carecían de una propiedad y limpieza consistentes. | Disposición de recursos propios; conservación de geometrías y texturas compartidas del caché GLTF. |
| Media | Fallos de modelos/WebGL podían propagarse a toda la página; el visor perdía el URI IPFS necesario para cambiar de gateway. | Límites de error para escenas, reintentos por gateway, detección de modelos planos y recuperación hacia la galería. |
| Media | URLs arbitrarias o rutas IPFS ambiguas entraban en componentes de medios. | Parser común que rechaza protocolos ejecutables, credenciales, traversal y separadores codificados; URLs HTTP normales se conservan fuera del proxy IPFS. |
| Media | Respuestas comprimidas del proxy podían reenviar una longitud incompatible; sondeos dejaban cuerpos abiertos o redirigían a gateways sin CORS apto. | Cierre de cuerpos, validación CORS para redirección y omisión de longitud al descomprimir. |
| Media | Las obras HTML compartían permisos de origen innecesarios. | Iframe con scripts y pointer lock, sin `allow-same-origin`; proxy con sandbox y nosniff. Algunas obras que dependen de almacenamiento propio pueden requerir abrirse en Objkt. |
| Media | Cambiar de rango o bloquear estadísticas podía dejar que una respuesta anterior sobrescribiera la nueva pantalla; se guardaba la clave de forma persistente. | AbortController, descarte de respuestas obsoletas, reintento con la misma clave, almacenamiento por sesión y eliminación de la copia persistente anterior. |
| Media | Rangos arbitrarios y consultas simultáneas multiplicaban llamadas a GoatCounter y entradas del caché. | Tres rangos permitidos, agrupación de solicitudes concurrentes, cola por proceso y timeout de red. No es un límite global entre instancias serverless. |
| Media | Soltar controles fuera del área o perder el foco podía dejar movimiento/salto activados. | Captura de puntero, limpieza por pérdida de captura/foco y al desmontar; teclado limitado a la interacción 3D activa. |
| Media | Un fallo de Objkt se presentaba como un metaverso vacío cargado correctamente. | Estado de error con reintento, comprobación HTTP y cancelación al desmontar. |
| Baja | El visor no gestionaba el foco; cookies malformadas o almacenamiento bloqueado podían romper preferencias. | Foco inicial, ciclo Tab y restauración al cerrar; acceso tolerante a almacenamiento y cookie inválida. |
| Baja | La música podía empezar antes de recuperar la preferencia guardada. | Espera a la inicialización de preferencias antes de reproducir. |

La interpretación de `price`, `price_xtz` y moneda se contrastó con la [documentación de Objkt](https://data.objkt.com/docs/).

## Primera revisión incluida en el mismo PR

Actualización de Next/React y del conjunto de librerías 3D; corrección de SSR del metaverso; dominio de metadata e idioma del HTML; errores reales y cancelación en galerías; estadísticas privadas deshabilitadas sin clave y clave fuera de la URL; tienda de muestra con consultas por correo; eliminación del éxito de compra simulado por temporizador.

## Evidencia de validación

- `npm run lint`, `npm run typecheck` y `npm run build`: correctos; 26 páginas generadas.
- `npm test`: 8 pruebas correctas, incluidas fallas y cancelaciones de GIF, importes, URLs, fallas de Objkt, almacenamiento no disponible y concurrencia/recuperación de estadísticas.
- `npm run test:smoke`: 5 pruebas correctas contra producción local: nueve páginas, idioma/metadata/tienda y validación de APIs/privacidad.
- Navegador local a 390 × 844: Sidequest carga 64 obras; visor carga imagen de 1920 px; sin desbordamiento horizontal; Shift+Tab mantiene foco en el diálogo y Escape restaura el foco en la obra. Metaverso carga, permite entrar y muestra joystick y salto.
- La primera revisión también comprobó inicio, tienda, idioma, Works (185 obras), visor y renderizado del metaverso en escritorio.
- `npm audit`: 0 críticas, 0 altas, 17 moderadas y 11 bajas. Las 28 pendientes pertenecen a Beacon/Taquito/WalletConnect y dependencias transitivas.

## Pendientes y límites

- No se realizaron compras ni se firmaron transacciones. Emparejamiento, rechazo/firma y confirmación real necesitan una wallet del titular; las guardas de UI no reemplazan las validaciones del contrato.
- La migración mayor de wallets sigue pendiente: requiere compatibilidad de SDK y pruebas de emparejamiento/operaciones antes de resolver las alertas restantes.
- El navegador integrado no permite validar correctamente pointer lock de escritorio. Se comprobó la entrada móvil, pero no equivale a probar movimiento multitáctil en un teléfono físico ni rendimiento sostenido en hardware de baja gama.
- No se usaron credenciales reales de GoatCounter. La recuperación y concurrencia se probaron con respuestas controladas; el panel real depende de las variables del hosting.
- La disponibilidad de IPFS/Objkt y el contenido de todas las obras no pueden garantizarse. No se recorrieron individualmente todas las piezas, ni se hicieron pruebas exhaustivas de cada formato HTML/GLB.
- La vista previa de Vercel exige acceso adicional a una sesión privada y no se abrió. La validación visual se hizo en producción local; el estado del despliegue se consulta mediante GitHub.
- El PR no está fusionado: estos cambios todavía no actualizan el dominio público.
