# ⛽ CheapStation

Find the cheapest gas stations near any Spanish postal code — ranked from lowest to highest price, in a single search.

Enter your postal code, pick a fuel type and a search radius, and CheapStation shows the top 20 nearby stations ordered by price, with distance, address, opening hours and a "How to get there" link. No sign-up, no database of our own: prices always come fresh from the official source.

## The problem it solves

Fuel prices in Spain change frequently and vary significantly between stations just a few kilometres apart, so drivers routinely overpay out of habit or lack of information. The Spanish government already publishes official daily prices for every station in the country (~11,500), but the raw feed is a ~12 MB JSON blob that no driver can reasonably use. CheapStation bridges that gap: it turns a postal code into a clear, ranked shortlist of where to refuel cheapest nearby — fast, mobile-friendly and free.

## Stack

| Layer | Choice |
|---|---|
| Build | Vite 8 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Lint | oxlint |
| Data | Spanish Ministry fuel-price API + Nominatim / Zippopotam geocoding |
| Storage | Browser `localStorage` only (price cache) — no backend, no database |

Requirements: Node.js 20.19+ (developed with Node 24) and npm.

## How it works

1. **Validate** the postal code (5 digits, province prefix 01–52).
2. **Geocode** the postal code to a central point (see key decisions below).
3. **Download** the official station list, cached in `localStorage` for 30 minutes to avoid re-downloading ~12 MB on every search.
4. **Filter** stations within the chosen radius using the Haversine formula, **sort** by price ascending (stations without a price for that fuel go last) and return the **top 20**.

## Key decisions

### 1. No database — live official data with a short client cache
Storing 11,500+ prices that change daily would mean building a sync pipeline, a backend and storage just to serve potentially stale data. Instead the app fetches the Ministry feed (`sedeaplicaciones.minetur.gob.es/.../EstacionesTerrestres/`) directly and caches it client-side for 30 minutes (`carburantes.service.ts`). Result: always-fresh prices with zero backend to operate. The trade-off is a one-time ~12 MB download per session, amortised by the cache.

### 2. A real "centre point" for the postal code — never a random town
A postal code covers an area, not a point, and rural codes can span towns tens of kilometres apart. The first implementation blindly used the first place returned by Zippopotam (`places[0]`), which for postal code 38628 (Aldea Blanca, Tenerife) resolved to a point near Güímar — **34.6 km** from the real location — so stations 38 km away showed up as "within 10 km". The fix is a cascade in `geocoding.service.ts`:
- **Primary:** the official postcode polygon centroid from Nominatim/OpenStreetMap — the geometric centre of the whole postal-code area (2.8 km from real Aldea Blanca in the 38628 case; all 7 Arafo/Güímar stations correctly fall outside the 10 km radius).
- **Fallback** (if Nominatim is unreachable): a robust centroid of *all* Zippopotam places via `centroideRobusto` (`geo.utils.ts`) — deduplicated, median-based, with outliers beyond 15 km rejected — instead of picking one arbitrarily.
- **Coherent label:** the displayed town name is always the place nearest to the chosen centre, so the name and the coordinates can never contradict each other.

### 3. Straight-line distance, stated honestly
Distances are great-circle (Haversine) distances, not road distances — accurate enough for ranking nearby stations, but in mountainous areas or islands the driving distance will be longer. The UI presents them as guidance, and each card links out to Google Maps for real routing.

### 4. Architecture ready to grow
```
src/
  main.tsx       → bootstrap; imports only ./estilos/*
  App.tsx        → minimal composition (delegates to pages/)
  pages/         → HomePage (future: MapPage, FavoritesPage…)
  components/    → Header, SearchForm, StationCard, StationList, Feedback
  hooks/         → useStationSearch (validate → geocode → prices → rank)
  services/      → carburantes.service.ts, geocoding.service.ts (all network I/O here)
  types/         → Estacion, RawEstacion, PuntoBusqueda…
  utils/         → geo.utils.ts (haversine, parsing, robust centroid), format.utils.ts
  config/        → app.config.ts (fuels, radii, cache TTL, CP validation)
  estilos/       → base.css, layout.css, componentes.css (ALL CSS lives here)
```
Growth rules: new data source → new file in `services/`; new screen → new file in `pages/`; new computation/format → `utils/`; new styles → `estilos/` (never CSS next to components). All network code is isolated in `services/` so the UI never touches `fetch` directly, and fuel types map to the Ministry's exact price-field names in one config table, so adding a fuel is a one-line change.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint     # oxlint
npm run build    # type-check + production bundle into dist/
npm run preview  # serve the production build locally
```

No environment variables or API keys are needed — every API used is free, keyless and CORS-enabled.

## Deployment

The project is a pure static SPA: `npm run build` emits self-contained HTML/CSS/JS into `dist/`. There is no server component, so any static host works and **no redeploy is ever needed for fresh prices** (they are fetched live from the Ministry API in the browser).

1. Build: `npm install && npm run build` (output in `dist/`).
2. Deploy `dist/` to your host of choice:
   - **Netlify / Vercel / Cloudflare Pages:** point the project at this repo with build command `npm run build` and publish directory `dist`.
   - **GitHub Pages:** if serving from a subpath (e.g. `user.github.io/cheap-station/`), set Vite's `base` option in `vite.config.ts` to `'/cheap-station/'` before building; for a custom domain or user site, the default `/` is fine.
3. Use HTTPS (all data APIs require it from secure contexts) and keep default caching; optionally set long-lived cache headers on `dist/assets/*` (filenames are content-hashed) and never cache `dist/index.html` for long.
4. Smoke-test after deploy: search a mainland code (e.g. `28001`) and an island code (e.g. `38628`), confirm the result count, ordering and distances look sane, and check the browser console for API errors (a Ministry outage surfaces as a friendly retry message, not a blank page).

Operational notes: the app depends at runtime on two third-party services (Ministry prices, Nominatim/Zippopotam). Both are free with fair-use expectations — the 30-minute client cache exists partly to stay a polite consumer. If traffic grows substantially, the natural next step is a thin caching proxy (see roadmap), which also shrinks the client's ~12 MB first download.

## Roadmap

- **Interactive map** (`components/StationMap.tsx` + `pages/MapPage.tsx`, Leaflet + OpenStreetMap): price-coloured markers, tap-to-navigate, and optional browser geolocation as an alternative to typing the postal code. Needs a decision on marker clustering for dense urban areas.
- **Favourites** (`hooks/useFavoritos.ts`): save home/work stations in `localStorage` first; user accounts only if cross-device sync proves worth the backend cost.
- **Richer filters and sorting:** operator/brand, open-now from the `Horario` field, on-site services, and an "order by distance" toggle — plus a combined score (e.g. cheapest within X km) since the absolute cheapest is not always worth the detour.
- **Route-aware search:** cheapest stations along an origin–destination route with a savings calculator (€ per tank, € per year). Requires a routing API (e.g. OSRM/Valhalla) and is the biggest UX leap after the map.
- **Price history, trends and alerts:** "is today a good day to refuel?", weekly charts, drop alerts. This is the one feature that forces a backend (scheduled snapshots + storage), deliberately breaking the current no-DB design — worth it only once the core search has users.
- **EV charging points:** a parallel search over a different dataset (chargers have per-kWh pricing and connector filters), sharing the geocoding and ranking plumbing.
- **PWA support:** installable app with offline-cached prices and search, valuable in low-coverage rural areas.
- **Internationalisation and accessibility:** Spanish/English toggle, full keyboard flow, ARIA live-region polish on results, and contrast audit of price badges.
