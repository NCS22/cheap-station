// Genera los derivados PNG de la marca a partir del SVG maestro.
// Uso: npm run assets (re-ejecutar cada vez que cambie el logo).
// Requiere: sharp (devDependency).
//
// Por qué PNG además del SVG:
// - apple-touch-icon (iOS) ignora los SVG: exige PNG 180x180.
// - og:image (WhatsApp/X/Facebook/Telegram) no acepta SVG de forma fiable:
//   exige PNG/JPG, idealmente 1200x630.
// - favicon.svg cubre los navegadores modernos directamente.

import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(root, '..', 'src', 'assets');
const pub = path.join(root, '..', 'public');

const MASTER = path.join(assets, 'cheap-station-logo-master.svg');
const FAVICON_SVG = path.join(assets, 'cheap-station-favicon-32.svg');

await mkdir(pub, { recursive: true });

// Favicon vectorial (navegadores modernos). En public/ se sirve tal cual.
await copyFile(FAVICON_SVG, path.join(pub, 'favicon.svg'));

// Icono iOS / accesos directos: PNG 180x180.
await sharp(MASTER).resize(180, 180).png().toFile(path.join(pub, 'apple-touch-icon.png'));

// Icono genérico de alta resolución (manifest futuro, PWA).
await sharp(MASTER).resize(512, 512).png().toFile(path.join(pub, 'icon-512.png'));

// Tarjeta social 1200x630: logo centrado sobre el azul corporativo del header.
const LOGO_SIZE = 420;
const logo = await sharp(MASTER).resize(LOGO_SIZE, LOGO_SIZE).png().toBuffer();
await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#0f172a',
  },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(path.join(pub, 'og-image.png'));

console.log('Assets generados en public/: favicon.svg, apple-touch-icon.png, icon-512.png, og-image.png');
