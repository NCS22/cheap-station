# ⛽ CheapStation

Web que, dado un **código postal español**, muestra las gasolineras más cercanas
ordenadas **de más barata a más cara**. Sin base de datos propia: precios oficiales
siempre frescos vía API.

## Stack

- **Vite + React + TypeScript + Tailwind CSS v4**

## APIs (sin BD)

| Dato | Fuente | Notas |
|---|---|---|
| Precios (~11.500 EESS) | `sedeaplicaciones.minetur.gob.es/.../EstacionesTerrestres/` (Ministerio) | Gratuita, sin key, con CORS. Se cachea 30 min en `localStorage`. |
| CP → coordenadas | Nominatim (centroide oficial del polígono del CP, prioritario) + Zippopotam (centroide robusto de reserva) | Gratuitas, sin key, con CORS. Nunca `places[0]` a ciegas. |

## Organización de carpetas (pensada para crecer)

```
src/
  main.tsx            → bootstrap + importa solo ./estilos/*
  App.tsx             → composición mínima (delegada a pages/)
  pages/              → HomePage (futuro: MapaPage, FavoritosPage…)
  components/         → Header, SearchForm, StationCard, StationList, Feedback
  hooks/              → useStationSearch (orquesta validar→geocodificar→precios→ordenar)
  services/           → carburantes.service.ts, geocoding.service.ts (toda la red aquí)
  types/              → Estacion, RawEstacion, PuntoBusqueda…
  utils/              → geo.utils.ts (haversine, parseos), format.utils.ts
  config/             → app.config.ts (combustibles, radios, TTL caché, validación CP)
  estilos/            → base.css, layout.css, componentes.css (TODO el CSS aquí)
```

**Reglas de crecimiento:**
- Nueva fuente de datos → nuevo fichero en `services/`.
- Nueva pantalla → nuevo fichero en `pages/` + ruta.
- Nuevo cálculo/formato → `utils/`.
- Nuevo estilo → `estilos/` (nunca CSS colocada junto a componentes).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Flujo de búsqueda

1. Validar CP (`/^\d{5}$/`, provincia 01–52).
2. Geocodificar CP → lat/lon (`geocoding.service.ts`).
3. Descargar precios oficiales (con caché 30 min) (`carburantes.service.ts`).
4. Filtrar por radio (haversine), ordenar por precio ascendente, top 20.

## Ideas futuras

- Mapa con Leaflet (`components/StationMap.tsx` + `pages/MapaPage.tsx`).
- Favoritos en `localStorage` (`hooks/useFavoritos.ts`).
- Filtro por horario/marca, orden alternativo por distancia.
