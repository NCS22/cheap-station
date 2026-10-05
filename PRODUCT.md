# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Conductores en España que quieren pagar menos por combustible. Hoy el foco son jóvenes que pagan su propia gasolina y comparan precios en cada repostaje; el objetivo confirmado es evolucionar para servir a cualquier conductor.

Situación de uso: consulta rápida desde el móvil antes de repostar — introducir código postal o usar GPS, elegir combustible y radio, y obtener una lista corta y clara de dónde ir.

## Product Purpose

CheapStation convierte el feed oficial de precios (~11.500 estaciones) en una lista accionable: el usuario busca por código postal o GPS y recibe las 20 estaciones más baratas cercanas, ordenadas por precio, con distancia, dirección, horario y enlace "Cómo llegar" (Google Maps).

Existe porque los precios varían mucho en pocos kilómetros y el feed oficial (~12 MB JSON crudo) no es usable directamente por un conductor.

Éxito significa: encontrar la gasolinera más barata cercana en una sola búsqueda, rápido, gratis y sin registro, desde el móvil.

## Positioning

Precios siempre frescos de la fuente oficial (Ministerio), sin base de datos propia, sin registro y gratis. Ranking top-20 ordenado por precio con distancia honesta en línea recta y enlace a navegación real.

## Operating Context

Flujo confirmado: validar CP (5 dígitos, prefijo provincia 01–52) o punto GPS → geocodificar CP a punto central → descargar precios oficiales (caché cliente 30 min) → filtrar por radio (Haversine) → ordenar por precio (sin precio al final) → top 20.

Contextos: móvil primero, consulta en carretera o antes de salir; GPS exige HTTPS o localhost (en `http://` el botón debe ocultarse); en islas (p. ej. 38628) un mismo CP puede abarcar localidades a >30 km, por eso el centro se calcula, no se toma un pueblo al azar.

## Capabilities and Constraints

Capacidades confirmadas: búsqueda por CP y por GPS (pestañas), elección de combustible y radio, lista top-20 con distancia/dirección/horario/enlace Maps, etiqueta de localidad coherente con el centro elegido.

Restricciones técnicas: SPA estática sin backend ni base de datos; red aislada en `services/`; CSS solo en `estilos/`; `localStorage` solo para caché de precios (TTL 30 min); GPS con una sola lectura `getCurrentPosition`, nunca `watchPosition`; distancias en línea recta, no por carretera; feed con decimales con coma y claves con tildes (pasar siempre por `parseCoordenada`/`parsePrecio`).

Terminología: `PuntoBusqueda` con `origen: 'postal' | 'gps'`; ranking compartido `buscarMasBaratas` para ambos modos.

Indeciso: dominio definitivo (provisional `https://cheapstation.es/` con `TODO` en `index.html`); qué hacer con `public/icons.svg` huérfano; orden del roadmap (mapa, favoritos, filtros, búsqueda por ruta, historial/alertas, EV, PWA, i18n).

## Brand Commitments

Nombre CheapStation. Voz e interfaz en español. Activos existentes: logo `src/assets/cheap-station-logo-master.svg` (regenerar PNG/favicon con `npm run assets` tras cambios), `theme-color #0d2221`, tipografía display Archivo 700/800 para títulos y precios. Sin compromisos de tono inventados.

## Evidence on Hand

Código y docs reales: `README.md` (problema, stack, decisiones, roadmap), `MEMORY.md`, `AGENTS.md`, `src/pages/`, `src/hooks/useStationSearch`, `src/services/carburantes.service.ts`, `src/services/geocoding.service.ts`, `src/services/geolocation.service.ts`, `src/utils/geo.utils.ts`, `src/config/app.config.ts`, `index.html` (SEO/OG con URL provisional).

Datos vivos: API Ministerio `EstacionesTerrestres/` + geocodificación Nominatim (principal) y Zippopotam (respaldo). Sin testimonios, clientes, benchmarks ni precios propios que inventar.

## Product Principles

1. Ahorro inmediato sin fricción: una búsqueda, una lista corta ordenada, cero registro.
2. Dato oficial fresco antes que dato propio almacenado: sin backend mientras el directo + caché sirva.
3. Honestidad geográfica: centro calculado y distancia recta declarada; la ruta real se delega a Maps.
4. Móvil primero y ligero: rápido, claro y usable con una mano.
5. Crecer sin reescribir: capas separadas para añadir mapa, favoritos o ruta sin romper lo que funciona.
