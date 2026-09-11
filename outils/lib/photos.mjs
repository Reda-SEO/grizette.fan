// Inventaire des photos : scan du dossier, slugs, numéros, métadonnées.
// Règle d'or : le slug et le numéro dépendent UNIQUEMENT du nom de fichier,
// jamais de l'ordre ni du nombre de photos, pour que les URL restent stables.
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
// En cas de noms identiques à l'extension près, la première de cette liste garde le slug court.
const PRIORITE = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
const IGNORES = new Set(['thumbs.db', 'desktop.ini', '.ds_store']);
const RANGS = ['', ' bis', ' ter', ' quater'];
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };

// Comparaison déterministe, indépendante de la langue du système.
export const comparer = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function slugifier(texte) {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' et ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// « Grizette (12) », « grizette-12 », « Grizette 12 », « grizette_12 » → 12. Tout autre nom → pas de numéro.
export function numeroDepuisNom(base) {
  const m = base.match(/^\s*grizette[\s_-]*\(?\s*(\d+)\s*\)?\s*$/i);
  return m ? Number(m[1]) : null;
}

export async function listerPhotos(dossier) {
  const entrees = await readdir(dossier, { withFileTypes: true });
  const photos = [];
  for (const e of entrees) {
    if (!e.isFile() || e.name.startsWith('.') || IGNORES.has(e.name.toLowerCase())) continue;
    const ext = path.extname(e.name).slice(1).toLowerCase();
    if (!EXTENSIONS.includes(ext)) continue;
    const { size } = await stat(path.join(dossier, e.name));
    if (size === 0) continue;
    const base = e.name.slice(0, -(ext.length + 1));
    photos.push({ fichier: e.name, base, ext, mime: MIME[ext], num: numeroDepuisNom(base) });
  }
  return photos.sort((a, b) => comparer(a.fichier, b.fichier));
}

// Attribue slug, rang (bis, ter…) et libellé à chaque photo, puis trie pour l'affichage.
export function attribuerSlugs(photos, meta) {
  const groupes = new Map();
  for (const p of photos) {
    const force = meta[p.fichier]?.slug ? slugifier(meta[p.fichier].slug) : '';
    let s = force || slugifier(p.base) || 'photo';
    if (!force && !s.startsWith('grizette')) s = `grizette-${s}`;
    p.slugDeBase = s;
    if (!groupes.has(s)) groupes.set(s, []);
    groupes.get(s).push(p);
  }
  const pris = new Set();
  for (const [s, groupe] of [...groupes].sort((a, b) => comparer(a[0], b[0]))) {
    groupe.sort((a, b) => (PRIORITE.indexOf(a.ext) - PRIORITE.indexOf(b.ext)) || comparer(a.fichier, b.fichier));
    groupe.forEach((p, i) => {
      let slug = i === 0 ? s : `${s}-${p.ext}`;
      for (let n = 2; pris.has(slug); n++) slug = `${s}-${p.ext}-${n}`;
      pris.add(slug);
      p.slug = slug;
      p.rang = i;
    });
  }
  for (const p of photos) {
    p.label = p.num !== null ? `n°${p.num}${RANGS[p.rang] ?? ` (${p.rang + 1})`}` : 'hors-série';
  }
  return photos.sort((a, b) => {
    if (a.num === null && b.num !== null) return 1;
    if (b.num === null && a.num !== null) return -1;
    return (a.num - b.num) || (a.rang - b.rang) || comparer(a.fichier, b.fichier);
  });
}

// Fusionne les métadonnées saisies à la main ; complète les manques par des valeurs par défaut.
export function fusionnerMeta(photos, meta) {
  const sansDescription = [];
  for (const p of photos) {
    const m = meta[p.fichier] || {};
    const suffixe = p.num !== null ? `photo ${p.label}` : `photo « ${p.base} »`;
    p.decrite = Boolean(m.alt && m.legende);
    if (!p.decrite) sansDescription.push(p.fichier);
    p.alt = (m.alt || `Grizette, la chatte de Fanny, ${suffixe}`).trim();
    p.legende = (m.legende || `Grizette, ${suffixe}`).trim();
    p.date = /^\d{4}(-\d{2}(-\d{2})?)?$/.test(m.date || '') ? m.date : null;
  }
  const noms = new Set(photos.map((p) => p.fichier));
  const orphelines = Object.keys(meta).filter((k) => !k.startsWith('_') && !noms.has(k)).sort(comparer);
  return { sansDescription, orphelines };
}

// Lecture des dimensions sans sharp (secours) : JPEG (avec orientation EXIF), PNG, GIF, WebP.
export function lireDimensions(buf) {
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return { l: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf.toString('ascii', 0, 3) === 'GIF') return { l: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const type = buf.toString('ascii', 12, 16);
    if (type === 'VP8X') return { l: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    if (type === 'VP8L') { const b = buf.readUInt32LE(21); return { l: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) }; }
    return { l: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2; let orientation = 1;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marqueur = buf[i + 1];
      const longueur = buf.readUInt16BE(i + 2);
      if (marqueur === 0xe1 && buf.toString('ascii', i + 4, i + 8) === 'Exif') {
        const t = i + 10; const le = buf.toString('ascii', t, t + 2) === 'II';
        const r16 = (p) => (le ? buf.readUInt16LE(p) : buf.readUInt16BE(p));
        const r32 = (p) => (le ? buf.readUInt32LE(p) : buf.readUInt32BE(p));
        const ifd = t + r32(t + 4);
        for (let k = 0, n = r16(ifd); k < n; k++) if (r16(ifd + 2 + k * 12) === 0x0112) orientation = r16(ifd + 10 + k * 12);
      }
      if (marqueur >= 0xc0 && marqueur <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marqueur)) {
        const h = buf.readUInt16BE(i + 5); const l = buf.readUInt16BE(i + 7);
        return orientation >= 5 ? { l: h, h: l } : { l, h };
      }
      i += 2 + longueur;
    }
  }
  return null;
}
