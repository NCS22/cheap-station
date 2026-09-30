# MEMORY.md — CheapStation
Memoria del proyecto entre sesiones. Máximo ~80 líneas: resume o elimina lo que ya no
aporte.

## Estado actual
- v1 funcionando: búsqueda por código postal (validación 01–52) o por
  ubicación GPS (pestañas en el formulario), elección de combustible y
  radio, y lista de las 20 estaciones más baratas con distancia, dirección,
  horario y enlace "Cómo llegar" (Google Maps).
- Geocodificación en cascada: centroide del CP en Nominatim → centroide robusto de
  Zippopotam como respaldo. En modo GPS la etiqueta sale de Nominatim `/reverse`.
- Precios oficiales del Ministerio, con caché en localStorage durante 30 min.
- Pendiente antes de publicar: sustituir la URL provisional `https://cheapstation.es/`
  en `index.html` (marcada con `TODO`).

## Decisiones (y por qué)
- Sin backend ni base de datos: los precios cambian a diario y sincronizarlos exigiría
  montar backend y almacenamiento; se piden en vivo y se cachean en el cliente.
- Distancia en línea recta (Haversine): suficiente para ordenar; la ruta real se
  delega en Google Maps.
- Centro del CP calculado, nunca `places[0]`: en el 38628 apuntaba a 34,6 km del
  lugar real y mostraba estaciones fuera del radio.
- Todo el CSS en `estilos/` y todo el acceso a red en `services/`: la arquitectura
  debe poder crecer (mapa, favoritos) sin reescribir.
- GPS con `getCurrentPosition` (una lectura por búsqueda), nunca
  `watchPosition`: no se rastrea al usuario en continuo. El ranking es el
  mismo en ambos modos (`buscarMasBaratas` acepta cualquier punto); solo
  cambia cómo se obtiene (`PuntoBusqueda.origen`).

## Aprendizajes y errores a evitar
- Nunca `places[0]` para geocodificar: en el 38628 apuntaba a 34,6 km del
  lugar real y colaba estaciones fuera del radio (ver cascada en Estado).
- Feed del Ministerio con decimales con coma y claves con tildes: usar
  siempre `parseCoordenada` / `parsePrecio`, nunca `Number()` directo.
- SVG no vale para `og:image` (WhatsApp/X/Facebook) ni `apple-touch-icon`
  (iOS): generar PNG con `npm run assets` tras cambiar el logo.
- PowerShell: usar `curl.exe` (no `curl`), `python` (no `python3`); no
  existen `head` ni `&` suelto.
- Geolocalización exige HTTPS o localhost: en `http://` falla siempre y el
  botón debe ocultarse; no es un bug del código.

## Próximos pasos
- Sustituir la URL provisional `https://cheapstation.es/` antes de publicar.
- Decidir qué hacer con `public/icons.svg` (huérfano de la plantilla Vite,
  sin referencias en el código).
- Roadmap (detalle en README): mapa interactivo, favoritos, filtros
  avanzados, búsqueda por ruta, historial de precios y alertas.