// Inventaire des photos : scan du dossier, slugs, numéros, métadonnées.
// Règle d'or : une fois attribués, le numéro et le slug d'une photo sont figés dans
// photos-meta.json et ne changent plus jamais, pour que les URL restent stables.
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
    photos.push({ fichier: e.name, base, ext, mime: MIME[ext] });
  }
  return photos.sort((a, b) => comparer(a.fichier, b.fichier));
}

// Slug et numéro « naturels », déduits du nom de fichier (règle historique).
// Ne sert plus qu'à proposer un numéro et un slug à une photo encore jamais vue.
function proposerDepuisNoms(photos, meta) {
  const groupes = new Map();
  for (const p of photos) {
    const force = meta[p.fichier]?.slug ? slugifier(meta[p.fichier].slug) : '';
    let s = force || slugifier(p.base) || 'photo';
    if (!force && !s.startsWith('grizette')) s = `grizette-${s}`;
    if (!groupes.has(s)) groupes.set(s, []);
    groupes.get(s).push(p);
  }
  const pris = new Set();
  const propositions = new Map();
  for (const [s, groupe] of [...groupes].sort((a, b) => comparer(a[0], b[0]))) {
    groupe.sort((a, b) => (PRIORITE.indexOf(a.ext) - PRIORITE.indexOf(b.ext)) || comparer(a.fichier, b.fichier));
    groupe.forEach((p, i) => {
      let slug = i === 0 ? s : `${s}-${p.ext}`;
      for (let n = 2; pris.has(slug); n++) slug = `${s}-${p.ext}-${n}`;
      pris.add(slug);
      propositions.set(p.fichier, { slug, rang: i });
    });
  }
  return propositions;
}

const estNumero = (n) => Number.isInteger(n) && n > 0;

// Numéro et slug STABLES : enregistrés une fois pour toutes dans photos-meta.json
// (champs « num », « rang » et « slug »), puis jamais recalculés.
// - Photo déjà numérotée : on reprend tel quel ce qui est enregistré.
// - Toute nouvelle photo : numéro pris dans le compteur « _numero_suivant », stocké dans
//   photos-meta.json et indépendant des photos présentes. Il ne redescend jamais, même si on
//   supprime la photo au plus grand numéro : un numéro (donc une URL) n'est jamais réattribué.
// - Exception : « Grizette (N) » garde N, mais seulement si N n'a encore jamais été attribué
//   (N ≥ compteur). Un nom comme « Grizette (9) » ne peut donc pas ressusciter une ancienne URL.
// Modifie `meta` en place ; renvoie la liste des photos nouvellement numérotées.
export function attribuerSlugs(photos, meta) {
  const propositions = proposerDepuisNoms(photos, meta);
  const numerosPris = new Set();
  const slugsPris = new Set();
  const dejaNumerotees = Object.entries(meta).some(([cle, m]) => !cle.startsWith('_') && estNumero(m?.num));
  if (!estNumero(meta._numero_suivant) && dejaNumerotees) {
    // Sans compteur, on ne sait plus quels numéros ont déjà servi : on refuse plutôt que risquer
    // de réattribuer l'URL d'une photo supprimée.
    throw new Error('photos-meta.json : « _numero_suivant » a disparu. Remettez-le (sa dernière valeur est dans l\'historique git du fichier).');
  }
  let suivant = estNumero(meta._numero_suivant) ? meta._numero_suivant : 1;
  for (const [cle, m] of Object.entries(meta)) {
    if (cle.startsWith('_') || !m || !estNumero(m.num)) continue;
    suivant = Math.max(suivant, m.num + 1); // garde-fou si le compteur a été baissé à la main
  }

  // 1. Photos déjà figées : elles passent en premier, rien ne change pour elles.
  const nouvelles = [];
  for (const p of photos) {
    const m = meta[p.fichier];
    if (m && estNumero(m.num) && m.slug) {
      p.num = m.num;
      p.rang = Number.isInteger(m.rang) && m.rang > 0 ? m.rang : 0;
      let slug = slugifier(m.slug);
      // Doublon saisi à la main : on dépanne sans réécrire le fichier.
      for (let n = 2; slugsPris.has(slug); n++) slug = `${slugifier(m.slug)}-${n}`;
      p.slug = slug;
      numerosPris.add(`${p.num}/${p.rang}`);
      slugsPris.add(slug);
    } else {
      nouvelles.push(p);
    }
  }

  // 2. Nouvelles photos, dans l'ordre d'envoi (date d'ajout, puis nom de fichier).
  nouvelles.sort((a, b) => comparer(meta[a.fichier]?.ajoute_le || '', meta[b.fichier]?.ajoute_le || '')
    || comparer(a.fichier, b.fichier));
  const libreSlug = (s) => !slugsPris.has(s);
  for (const p of nouvelles) {
    const prop = propositions.get(p.fichier);
    const numNom = numeroDepuisNom(p.base);
    // Migration initiale (aucune photo encore numérotée) : on reprend les numéros des noms tels quels.
    const migration = !dejaNumerotees;
    const nomAccepte = numNom !== null && (migration || numNom >= suivant)
      && !numerosPris.has(`${numNom}/${migration ? prop.rang : 0}`) && libreSlug(prop.slug);
    if (nomAccepte) {
      p.num = numNom;
      p.rang = migration ? prop.rang : 0;
      p.slug = prop.slug;
    } else {
      while (numerosPris.has(`${suivant}/0`)) suivant++;
      p.num = suivant;
      p.rang = 0;
      const voulu = meta[p.fichier]?.slug ? slugifier(meta[p.fichier].slug) : `grizette-${p.num}`;
      let slug = voulu;
      for (let n = 2; !libreSlug(slug); n++) slug = `${voulu}-${n}`;
      p.slug = slug;
    }
    suivant = Math.max(suivant, p.num + 1);
    numerosPris.add(`${p.num}/${p.rang}`);
    slugsPris.add(p.slug);
    const m = (meta[p.fichier] = meta[p.fichier] || {});
    m.num = p.num;
    if (p.rang) m.rang = p.rang; else delete m.rang;
    m.slug = p.slug;
  }
  meta._numero_suivant = suivant;

  for (const p of photos) p.label = `n°${p.num}${RANGS[p.rang] ?? ` (${p.rang + 1})`}`;
  photos.sort((a, b) => (a.num - b.num) || (a.rang - b.rang) || comparer(a.fichier, b.fichier));
  return nouvelles.map((p) => p.fichier);
}

// Sérialise photos-meta.json : une ligne par photo (lisible et facile à éditer à la main),
// clés techniques en tête, photos rangées par numéro. Sortie stable : pas de diff parasite.
const ORDRE_CHAMPS = ['alt', 'legende', 'date', 'num', 'rang', 'slug', 'ajoute_par', 'ajoute_le'];
export function serialiserMeta(meta) {
  const ordreChamps = (a, b) => {
    const ia = ORDRE_CHAMPS.indexOf(a); const ib = ORDRE_CHAMPS.indexOf(b);
    return ((ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)) || comparer(a, b);
  };
  const ligne = (v) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return JSON.stringify(v);
    const champs = Object.keys(v).sort(ordreChamps).map((k) => `${JSON.stringify(k)}: ${JSON.stringify(v[k])}`);
    return champs.length ? `{ ${champs.join(', ')} }` : '{}';
  };
  const cles = Object.keys(meta).sort((a, b) => {
    const ta = a.startsWith('_'); const tb = b.startsWith('_');
    if (ta !== tb) return ta ? -1 : 1;
    const na = meta[a]?.num ?? Infinity; const nb = meta[b]?.num ?? Infinity;
    return (na - nb) || ((meta[a]?.rang || 0) - (meta[b]?.rang || 0)) || comparer(a, b);
  });
  return `{\n${cles.map((k) => `  ${JSON.stringify(k)}: ${ligne(meta[k])}`).join(',\n')}\n}\n`;
}

// Fusionne les métadonnées saisies à la main ; complète les manques par des valeurs par défaut.
export function fusionnerMeta(photos, meta) {
  const sansDescription = [];
  for (const p of photos) {
    const m = meta[p.fichier] || {};
    const suffixe = `photo ${p.label}`;
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
