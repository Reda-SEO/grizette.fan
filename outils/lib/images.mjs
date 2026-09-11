// Versions optimisées des photos (WebP redimensionnés, JPEG Open Graph, fond flouté).
// Traitées seulement si la photo est nouvelle ou modifiée (empreinte du fichier original).
// Les originaux dans images/ ne sont jamais modifiés.
import { readFile, writeFile, readdir, unlink, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { lireDimensions } from './photos.mjs';

export const BOITES = [400, 800, 1200, 1600]; // plus grand côté, en pixels
const OG = { l: 1200, h: 630 };

export async function chargerSharp() {
  try {
    const mod = await import('sharp');
    return mod.default;
  } catch {
    return null;
  }
}

const existe = (f) => access(f).then(() => true, () => false);
const empreinte = (buf) => createHash('sha1').update(buf).digest('hex').slice(0, 10);
export const urlOriginal = (fichier) => `/images/${encodeURIComponent(fichier)}`;

async function produire(sharp, buf, slug, h, dossierImg) {
  const sortie = (nom) => path.join(dossierImg, nom);
  const base = () => sharp(buf, { failOn: 'none', animated: false }).rotate(); // rotate() = orientation EXIF
  const { width, height } = await base().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  const variantes = [];
  for (const boite of BOITES) {
    if (variantes.length && Math.max(width, height) < boite * 0.9) break; // pas d'agrandissement inutile
    const nom = `${slug}-${h}-${boite}.webp`;
    const info = await base()
      .resize({ width: boite, height: boite, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: boite <= 400 ? 70 : 78, effort: 5 })
      .toFile(sortie(nom));
    variantes.push({ w: info.width, fichier: nom });
  }
  const fondBuf = await base().resize(24, 24, { fit: 'inside' }).webp({ quality: 40 }).toBuffer();
  // Image de partage 1200×630 : photo entière (jamais recadrée) sur fond flouté.
  const derriere = await base().resize(OG.l, OG.h, { fit: 'cover' }).blur(40).modulate({ brightness: 0.75 }).toBuffer();
  const devant = await base().resize(OG.l, OG.h, { fit: 'inside' }).toBuffer();
  const og = `${slug}-${h}-og.jpg`;
  await sharp(derriere).composite([{ input: devant, gravity: 'center' }]).jpeg({ quality: 82, mozjpeg: true }).toFile(sortie(og));
  return {
    l: width, h: height, optimise: true, variantes, og, ogL: OG.l, ogH: OG.h,
    fond: `data:image/webp;base64,${fondBuf.toString('base64')}`,
  };
}

// Retourne { entrees: {fichier: entrée}, traitees, reutilisees, erreurs }
export async function preparerImages({ photos, racine, etatImages, sharp }) {
  const dossierImg = path.join(racine, 'img');
  const entrees = {};
  const bilan = { traitees: [], reutilisees: 0, erreurs: [] };
  for (const p of photos) {
    const buf = await readFile(path.join(racine, 'images', p.fichier));
    const h = empreinte(buf);
    const ancien = etatImages[p.fichier];
    const fichiersAnciens = ancien?.optimise ? [...ancien.variantes.map((v) => v.fichier), ancien.og] : [];
    const reutilisable = ancien && ancien.hash === h && ancien.slug === p.slug
      && (!ancien.optimise || (await Promise.all(fichiersAnciens.map((f) => existe(path.join(dossierImg, f))))).every(Boolean))
      && (ancien.optimise || !sharp);
    if (reutilisable) {
      entrees[p.fichier] = ancien;
      bilan.reutilisees++;
      continue;
    }
    if (sharp) {
      try {
        entrees[p.fichier] = { hash: h, slug: p.slug, ...(await produire(sharp, buf, p.slug, h, dossierImg)) };
        bilan.traitees.push(p.fichier);
        continue;
      } catch (e) {
        bilan.erreurs.push(`${p.fichier} : ${e.message}`);
      }
    }
    // Secours sans sharp (ou en cas d'erreur) : on sert l'original tel quel.
    const dim = lireDimensions(buf) || { l: 1200, h: 1600 };
    entrees[p.fichier] = { hash: h, slug: p.slug, optimise: false, l: dim.l, h: dim.h, variantes: [], og: null, ogL: dim.l, ogH: dim.h, fond: null };
  }
  // Ménage : supprime de img/ les versions qui ne correspondent plus à aucune photo.
  const gardes = new Set(Object.values(entrees).filter((e) => e.optimise).flatMap((e) => [...e.variantes.map((v) => v.fichier), e.og]));
  const supprimees = [];
  for (const f of await readdir(dossierImg).catch(() => [])) {
    if (!gardes.has(f)) { await unlink(path.join(dossierImg, f)); supprimees.push(f); }
  }
  bilan.supprimees = supprimees;
  return { entrees, bilan };
}

// Complète chaque photo avec ses URL publiques.
export function attacherImages(photos, entrees) {
  for (const p of photos) {
    const e = entrees[p.fichier];
    p.l = e.l;
    p.h = e.h;
    p.ratio = Math.round((e.l / e.h) * 1000) / 1000;
    p.original = urlOriginal(p.fichier);
    p.optimise = e.optimise;
    p.variantes = e.optimise ? e.variantes.map((v) => ({ w: v.w, url: `/img/${v.fichier}` })) : [{ w: e.l, url: p.original }];
    p.grande = p.variantes[p.variantes.length - 1].url;
    p.vignette = p.variantes[0].url;
    p.og = { url: e.optimise ? `/img/${e.og}` : p.original, l: e.ogL, h: e.ogH, mime: e.optimise ? 'image/jpeg' : p.mime };
    p.fond = e.fond || p.vignette;
    p.mimeAffiche = e.optimise ? 'image/webp' : p.mime;
    p.page = `/photo/${p.slug}/`;
  }
}

export { writeFile };
