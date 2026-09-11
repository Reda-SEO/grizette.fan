// Génère les icônes PNG/ICO à partir de favicon.svg (à relancer seulement si le SVG change).
// Usage : node outils/icones.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(path.join(racine, 'favicon.svg'));
const png = (taille, source = svg) => sharp(source, { density: 600 }).resize(taille, taille).png({ compressionLevel: 9 }).toBuffer();

// Version « maskable » : fond plein, motif réduit dans la zone de sécurité (80 %).
const maskable = Buffer.from(svg.toString()
  .replace('rx="14"', 'rx="0"')
  .replace(/<g stroke/, '<g transform="translate(6.4 6.4) scale(.8)"><g stroke')
  .replace('</svg>', '</g></svg>'));

const sorties = {
  'apple-touch-icon.png': await png(180, maskable),
  'icone-192.png': await png(192),
  'icone-512.png': await png(512),
  'icone-maskable-512.png': await png(512, maskable),
  'favicon-32.png': await png(32),
};
for (const [nom, buf] of Object.entries(sorties)) await writeFile(path.join(racine, nom), buf);

// favicon.ico contenant une image PNG 32×32 (format ICO moderne).
const ico32 = sorties['favicon-32.png'];
const entete = Buffer.alloc(22);
entete.writeUInt16LE(0, 0); entete.writeUInt16LE(1, 2); entete.writeUInt16LE(1, 4);
entete.writeUInt8(32, 6); entete.writeUInt8(32, 7); entete.writeUInt16LE(1, 10); entete.writeUInt16LE(32, 12);
entete.writeUInt32LE(ico32.length, 14); entete.writeUInt32LE(22, 18);
await writeFile(path.join(racine, 'favicon.ico'), Buffer.concat([entete, ico32]));
console.log('Icônes générées :', [...Object.keys(sorties), 'favicon.ico'].join(', '));
