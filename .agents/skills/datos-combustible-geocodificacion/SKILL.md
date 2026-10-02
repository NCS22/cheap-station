---
name: datos-combustible-geocodificacion
description: Úsala siempre que trabajes con datos de estaciones, precios, geocodificación de códigos postales, GPS o ranking por distancia en CheapStation — implementar, revisar o validar cualquier spec que toque el feed del Ministerio, Nominatim/Zippopotam o la geolocalización.
---

# Datos de combustible y geocodificación

## Feed del Ministerio (`carburantes.service.ts`)
- Listado oficial completo (~11.500 estaciones, ~12 MB) en `ListaEESSPrecio`. Sin backend: se descarga en vivo y se cachea en `localStorage` (`cheapstation:estaciones:v1`) durante 30 min (`CACHE_TTL_MS`). Es el diseño, no un fallo.
- **Decimales con coma** (`"39,211417"`, `"1,849"`) y **claves con tildes** (`Rótulo`, `Dirección`, `Precio Gasoleo A`, `Longitud (WGS84)`, `C.P.`). Pasa siempre por `parseCoordenada` / `parsePrecio` (`utils/geo.utils.ts`); nunca `Number()` sobre campos crudos. `parsePrecio`: `""` → `null`, solo acepta > 0.
- La tabla `COMBUSTIBLES` (`config/app.config.ts`) mapea cada combustible a su campo exacto del feed: añadir un combustible es una línea.
- Si el Ministerio no responde: mensaje amable de reintento, nunca página en blanco.

## Cascada código postal → coordenadas (`geocoding.service.ts`)
1. **Principal:** centroide del polígono del CP en Nominatim (centro geométrico del área).
2. **Respaldo:** centroide robusto de **todos** los lugares de Zippopotam (`centroideRobusto`: deduplica, mediana, rechaza atípicos a más de 15 km). **Nunca `places[0]`**: un mismo CP abarca localidades a más de 30 km (el 38628 apuntaba a 34,6 km del lugar real).
- La etiqueta mostrada es siempre el lugar más cercano al centro elegido: nombre y coordenadas coherentes por diseño.
- Zippopotam 404 = código desconocido → error del usuario (se le muestra). Fallo de Nominatim = `null` silencioso, nunca un error visible.

## GPS (`geolocation.service.ts`)
- Una sola lectura con `getCurrentPosition` y `GPS_OPTIONS`; nunca `watchPosition` (no se rastrea en continuo).
- **Exige HTTPS o localhost**: en `http://` el botón debe ocultarse; si falla igual, el problema es el contexto, no el código.
- Permiso denegado / sin señal / timeout tienen mensaje propio (códigos 1/2/3). La etiqueta sale de Nominatim `/reverse` y si falla son strings vacíos, nunca un error.

## Ranking (`buscarMasBaratas`)
- Distancias en línea recta (Haversine), no por carretera. Filtro por radio → orden por precio ascendente → **sin precio al final** → desempate por distancia → top 20 (`MAX_RESULTADOS`). El mismo ranking vale para modo postal y GPS (`PuntoBusqueda.origen`).

## Validación del código postal (`esCodigoPostalValido`)
- 5 dígitos, prefijo de provincia 01–52.

## Checklist antes de dar algo por hecho
- ¿Todo campo crudo pasa por `parseCoordenada` / `parsePrecio`?
- ¿Algún `places[0]` o `Number()` directo sobre el feed?
- ¿Algún `fetch` fuera de `services/` o valor mágico fuera de `config/`?
- ¿Algún fallo de Nominatim mostrado al usuario como error?
- ¿`watchPosition` en algún sitio?
- ¿Probado con `28001` (península) y `38628` (isla), y GPS con DevTools → Sensors?
