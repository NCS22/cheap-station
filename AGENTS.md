# AGENTS.md — CheapStation

Buscador de gasolineras baratas en España: el usuario busca por código postal o por su ubicación GPS, elige combustible y radio, y la app muestra las 20 estaciones más baratas cercanas, ordenadas por precio. Va dirigido a todos los conductores, con foco en jóvenes que pagan su propia gasolina. Se piensa publicar, así que prima que sea rápida, clara y usable desde el móvil.

> Además de este archivo, lee siempre `MEMORY.md` (raíz del proyecto) al empezar cada sesión: contiene indicaciones adicionales. Si algo de `MEMORY.md` contradice este archivo, pregunta antes de decidir.

## Stack y estructura

- Vite 8 + React 19 + TypeScript + Tailwind CSS v4 (`@tailwindcss/vite`). SPA estática: sin backend, sin base de datos, sin tests, sin CI.
- Node 20.19+ (desarrollado con Node 24); con Node 18 el build de Vite 8 falla.
- Lint con oxlint. Los assets se generan con `sharp`.
- Datos: API oficial de precios del Ministerio + geocodificación con Nominatim y Zippopotam. Sin claves ni variables de entorno.
- Estructura de `src/` (solo lo no obvio):
  - `pages/` → pantallas. `hooks/` → lógica de UI (p. ej. `useStationSearch`: validar → geocodificar → precios → ranking).
  - `services/` → **todo** el acceso a red (`carburantes.service.ts`, `geocoding.service.ts`, `geolocation.service.ts`).
  - `utils/` → cálculos puros (`geo.utils.ts`: Haversine, parseo, centroide robusto; `format.utils.ts`).
  - `config/app.config.ts` → valores "mágicos" (combustibles, radios, TTL de caché, validación de CP).
  - `estilos/` → **todo** el CSS (`base.css`, `layout.css`, `componentes.css`), importado una sola vez desde `main.tsx`.
  - `types/` → tipos (`Estacion`, `RawEstacion`, `PuntoBusqueda` con `origen: 'postal' | 'gps'`…).
- Flujo de dependencias (obligatorio): `pages/` → `hooks/` → `services/` → `utils/` + `config/`.
- `public/` se copia tal cual a `dist/`. `src/assets/*.svg` (logo de la cabecera) se empaqueta con el build.

## Comandos

- `npm install` — instala dependencias.
- `npm run dev` — servidor de desarrollo en `http://localhost:5173`.
- `npm run build` — equivale a `tsc -b && vite build`; es la verificación real.
- `npm run lint` — oxlint.
- `npm run preview` — sirve el build de producción en local.
- `npm run assets` — regenera `public/*.png` y `favicon.svg` desde `src/assets/cheap-station-logo-master.svg`. Ejecútalo tras cualquier cambio en el logo.
- No hay runner de tests. Para validar lógica con datos reales, usa un script `python` desechable en `%TEMP%`.
- Entorno Windows PowerShell: no existe `head`, no uses `&` suelto, `curl` es alias de `Invoke-WebRequest` (usa `curl.exe`) y Python se llama `python` (no `python3`).

## Convenciones

- Mantén la convención general que ya sigue el proyecto en nombres de carpetas, archivos, variables y funciones (hay mezcla de español e inglés). No renombres ni "unifiques" idioma sin preguntar.
- Textos de interfaz, comentarios y mensajes de error al usuario: en español. El README, en inglés.
- `public/icons.svg` es un resto huérfano de la plantilla Vite (sin referencias): no lo uses; eliminarlo requiere confirmación.
- Patrones de referencia: para un servicio nuevo, imita `services/geocoding.service.ts` y `services/carburantes.service.ts`; para cálculos, `utils/geo.utils.ts`; para lógica de UI, `hooks/useStationSearch`.
- Nueva fuente de datos → archivo nuevo en `services/`. Nueva pantalla → `pages/`. Nuevo cálculo o formateo → `utils/`. Valores mágicos → `config/app.config.ts`. Nuevos estilos → `estilos/`.
- Los componentes de UI nunca llaman a `fetch`. Nunca coloques CSS junto a un componente.
- TypeScript estricto (el build se rompe con facilidad): `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (usa `import type` para tipos) y `erasableSyntaxOnly` (sin `enum` ni `namespace`).
- Los tipos de SVG dependen de `src/vite-env.d.ts` (tipos de `vite/client`).

## Reglas de dominio / trampas conocidas

- **Feed del Ministerio** (`EstacionesTerrestres/`, ~11.500 estaciones, ~12 MB): usa **decimales con coma** (`"39,211417"`, `"1,849"`) y **claves con tildes** (`Rótulo`, `Dirección`, `Precio Gasoleo A`). Pasa siempre por `parseCoordenada` / `parsePrecio` de `utils/geo.utils.ts`; nunca uses `Number()` sobre campos crudos.
- **Caché**: el feed completo se carga en memoria y se guarda en `localStorage` durante 30 min (`CACHE_TTL_MS`). Es el diseño deliberado sin base de datos, no un fallo.
- **Código postal → coordenadas** (cascada en `geocoding.service.ts`): centroide del código postal en Nominatim (principal) → centroide robusto de todos los lugares de Zippopotam (respaldo). Nunca uses `places[0]`: un mismo CP puede abarcar localidades a más de 30 km (ver el 38628). El nombre de localidad mostrado es el lugar más cercano al centro elegido, por diseño.
- Zippopotam 404 = código postal desconocido (error del usuario, se le muestra). Fallo de Nominatim = respaldo silencioso, nunca un error visible.
- **GPS**: una sola lectura con `getCurrentPosition` (nunca `watchPosition`); opciones en `GPS_OPTIONS` (`config`). La geolocalización **exige HTTPS o localhost**: en `http://` el botón debe ocultarse (si falla igual, el problema es el contexto, no el código). Permiso denegado / sin señal / timeout tienen mensaje propio en `geolocation.service.ts`; la etiqueta del punto GPS sale de Nominatim `/reverse` y si falla son strings vacíos, nunca un error.
- Las distancias son en línea recta (Haversine), no por carretera.
- Los precios sin valor para el combustible elegido van al final del ranking.
- **Antes de publicar**: `index.html` tiene la URL provisional `https://cheapstation.es/` en `canonical`, `og:url` y `og:image` (marcadas con `TODO`); hay que sustituirla por el dominio real o quitarla. `og:image` debe ser siempre un PNG con URL absoluta, nunca SVG.
- `explanation.txt` y `dist/` son borradores/salida de build ignorados por git: no los referencies ni los incluyas.

## Forma de trabajar

- No hace falta presentar un plan antes de empezar, pero **pide confirmación antes de añadir o modificar** contenido más allá de lo pedido (archivos, dependencias, componentes, funciones, estructura o formato de datos).
- Antes de **eliminar** contenido, pregunta y deja clara la razón.
- El tamaño de la solución depende del requerimiento: cambios pequeños y acotados para ajustes; soluciones completas cuando la petición lo exija.
- Responde siempre en español.
- Al terminar, explica de forma sencilla: todos los cambios realizados, las incorporaciones nuevas, los archivos tocados y el porqué de cada cambio.

## Límites

- ✅ **Siempre**:
  - Pasar por `parseCoordenada` / `parsePrecio` al leer datos del Ministerio.
  - Mantener la red en `services/` y el CSS en `estilos/`.
  - Usar `import type` para tipos y llevar los valores mágicos a `config/app.config.ts`.
  - Ejecutar la verificación antes de dar algo por terminado.
  - Explicar al final qué se ha hecho y por qué.
- ⚠️ **Pregunta antes**:
  - Añadir dependencias nuevas.
  - Crear archivos o carpetas nuevos.
  - Cambiar la estructura de carpetas o el flujo de dependencias.
  - Cambiar el formato de datos, la lógica de caché o la cascada de geocodificación.
  - Modificar código o contenido existente más allá de lo pedido.
  - Eliminar cualquier cosa (explicando el motivo).
- 🚫 **Nunca**:
  - Ejecutar comandos de git (commit, push, etc.): eso lo hago yo.
  - Usar `Number()` sobre campos crudos del feed ni `places[0]` para geocodificar.
  - Llamar a `fetch` desde componentes ni colocar CSS junto a componentes.
  - Mostrar al usuario un fallo de Nominatim como error.
  - Borrar o modificar `src/vite-env.d.ts` sin preguntar.
  - Tocar, referenciar o commitear `dist/` y `explanation.txt`.
  - Poner un SVG como `og:image`.

## Verificación

- Todo cambio debe pasar `npm run build` (comprobación de tipos + bundle) y `npm run lint` sin errores ni avisos nuevos.
- Para cambios de UI o de lógica de búsqueda, prueba en el navegador (`npm run dev`) con un código peninsular (`28001`) y uno de isla (`38628`): número de resultados, orden por precio y distancias coherentes con el radio, y sin errores en consola. Para el modo GPS usa DevTools → Sensors (emular coordenadas y permiso denegado).
- Si tocas el logo, ejecuta `npm run assets` y comprueba que se han regenerado los PNG y el favicon.
- Para validar parseo o ranking con datos reales, usa un script `python` desechable en `%TEMP%` (no lo añadas al repo).
- Al terminar, indica qué has verificado y qué no has podido comprobar.