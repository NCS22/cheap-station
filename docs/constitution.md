# Constitución — CheapStation

Principios innegociables. Toda spec, plan y tarea debe cumplirlos.

1. **Arquitectura por capas**: `pages/` → `hooks/` → `services/` → `utils/` + `config/`. Toda la red vive en `services/`, todo el CSS en `estilos/`. Los componentes nunca hacen `fetch` ni llevan CSS junto a ellos.
2. **La spec manda**: nada se implementa si no está en la spec activa. Si falta una decisión, se para y se pregunta. No añadir archivos, dependencias, componentes ni cambios de formato/estructura fuera de lo pedido sin confirmación.
3. **TypeScript estricto como puerta**: `noUnusedLocals`, `noUnusedParameters`, `import type` para tipos, sin `enum` ni `namespace`. Nada se da por terminado sin `npm run build` y `npm run lint` limpios.
4. **Datos del Ministerio con respeto**: el feed usa decimales con coma y claves con tildes → siempre `parseCoordenada` / `parsePrecio` de `utils/geo.utils.ts`, nunca `Number()` directo. Precios sin valor van al final del ranking. Distancias Haversine en línea recta, dicho con honestidad (la ruta real es Google Maps).
5. **Geocodificación calculada, nunca el primer resultado**: centroide del CP en Nominatim (principal) → centroide robusto de todos los lugares de Zippopotam (respaldo), nunca `places[0]`. Fallo de Nominatim = respaldo silencioso, nunca error visible. Zippopotam 404 = código desconocido (error del usuario).
6. **Privacidad y ligereza primero**: SPA estática sin backend ni base de datos. Caché del feed en `localStorage` durante 30 min por diseño, no como fallo. GPS con una sola `getCurrentPosition`, nunca `watchPosition`; exige HTTPS o localhost y cada fallo (denegado/sin señal/timeout) tiene su mensaje propio. Sin claves ni variables de entorno.
7. **Idioma y móvil primero**: interfaz, comentarios y errores al usuario en español; README en inglés. Mantener la mezcla español/inglés existente en nombres sin renombrar sin preguntar. Rápida, clara y usable desde el móvil.
