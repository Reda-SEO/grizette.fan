// Génère tout le site statique à partir du dossier images/ et des fichiers de contenu.
// Usage : node outils/generer.mjs          (lancé automatiquement par le hook pre-commit)
// Idempotent : si rien n'a changé, aucun fichier n'est réécrit.
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { listerPhotos, attribuerSlugs, fusionnerMeta, comparer } from './lib/photos.mjs';
import { chargerSharp, preparerImages, attacherImages } from './lib/images.mjs';
import { pageAccueil, pageGalerie, pagePhoto, page404, titrePhoto, descriptionPhoto } from './lib/gabarits.mjs';
import { sitemap, robots, llms, manifest } from './lib/robots.mjs';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (...p) => path.join(racine, ...p);
const hash = (s, n = 10) => createHash('sha1').update(s).digest('hex').slice(0, n);
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const lireJson = async (f, defaut) => {
  try {
    return JSON.parse(await readFile(f, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return defaut;
    throw new Error(`${path.basename(f)} n'est pas un JSON valide : ${e.message}`);
  }
};
// Trie les clés récursivement : sortie JSON stable, sans diff parasite.
const trier = (v) => (Array.isArray(v) ? v.map(trier) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort(comparer).map((k) => [k, trier(v[k])])) : v);

const ecrits = [];
async function ecrireSiChange(rel, contenu) {
  const f = R(rel);
  const actuel = await readFile(f, 'utf8').catch(() => null);
  if (actuel === contenu) return;
  await mkdir(path.dirname(f), { recursive: true });
  await writeFile(f, contenu);
  ecrits.push(rel);
}

const minifierCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();

async function main() {
  const avertissements = [];
  const etat = await lireJson(R('outils', 'etat.json'), { images: {}, pages: {} });
  const meta = await lireJson(R('photos-meta.json'), {});
  const contenu = await lireJson(R('contenu.json'), null);
  if (!contenu) throw new Error('contenu.json introuvable');

  // 1. Inventaire des photos
  const photos = attribuerSlugs(await listerPhotos(R('images')), meta);
  if (!photos.length) throw new Error('aucune photo trouvée dans images/');
  const { sansDescription, orphelines } = fusionnerMeta(photos, meta);

  // 2. Images optimisées
  const sharp = await chargerSharp();
  await mkdir(R('img'), { recursive: true });
  const { entrees, bilan } = await preparerImages({ photos, racine, etatImages: etat.images || {}, sharp });
  attacherImages(photos, entrees);

  // 3. Contexte commun
  const trouver = (nom) => photos.find((p) => p.fichier === nom);
  const vedette = trouver(contenu.photo_vedette) || photos[0];
  const photo404 = trouver(contenu.photo_404) || vedette;
  if (!trouver(contenu.photo_vedette)) avertissements.push(`photo_vedette « ${contenu.photo_vedette} » introuvable : ${vedette.fichier} utilisée à la place.`);
  const total = photos.length;
  // Lien « au hasard » sans JS : choix déterministe (stable d'une génération à l'autre).
  const hasardDe = (p) => {
    if (total < 2) return p;
    const i = photos.indexOf(p);
    const saut = 1 + (parseInt(hash(p.slug, 6), 16) % (total - 1));
    return photos[(i + saut) % total];
  };
  const js = await readFile(R('assets', 'site.js'), 'utf8');
  const css = minifierCss(await readFile(R('assets', 'site.css'), 'utf8'));

  // 4. photos.json (liste utilisée par le bouton « Une autre photo »)
  const liste = `${JSON.stringify({
    total,
    photos: photos.map((p) => ({
      slug: p.slug, num: p.label, alt: p.alt, legende: p.legende, l: p.l, h: p.h, page: p.page, fond: p.fond,
      src: Object.fromEntries(p.variantes.map((v) => [String(v.w), v.url])),
    })),
  })}\n`;
  await ecrireSiChange('photos.json', liste);
  const ctx = { css, contenu, photos, total, vedette, photo404, hasardDe, versionJs: hash(js), versionListe: hash(liste) };

  // 5. Pages HTML (+ date de dernière modification réelle pour le sitemap)
  const pages = [];
  const nouvellesPages = {};
  const enregistrer = async (chemin, html, images = []) => {
    const rel = chemin === '/404.html' ? '404.html' : `${chemin.slice(1)}index.html`;
    await ecrireSiChange(rel, html);
    const empreinte = hash(html.replace(/\?v=[0-9a-f]+/g, ''));
    const ancien = (etat.pages || {})[chemin];
    const lastmod = ancien && ancien.hash === empreinte ? ancien.lastmod : aujourdhui();
    nouvellesPages[chemin] = { hash: empreinte, lastmod };
    if (chemin !== '/404.html') pages.push({ chemin, lastmod, images });
  };
  await enregistrer('/', pageAccueil(ctx), [vedette.grande]);
  await enregistrer('/galerie/', pageGalerie(ctx));
  for (let i = 0; i < total; i++) {
    const p = photos[i];
    await enregistrer(p.page, pagePhoto(ctx, p, photos[(i - 1 + total) % total], photos[(i + 1) % total]), [p.grande]);
    const t = titrePhoto(p).length;
    const d = descriptionPhoto(p).length;
    if (t < 25 || t > 65) avertissements.push(`${p.fichier} : titre de ${t} caractères (idéal 50-60).`);
    if (d < 100 || d > 160) avertissements.push(`${p.fichier} : description de ${d} caractères (idéal 140-160).`);
  }
  await enregistrer('/404.html', page404(ctx));

  // Ménage : pages de photos qui n'existent plus.
  const slugs = new Set(photos.map((p) => p.slug));
  for (const d of await readdir(R('photo')).catch(() => [])) {
    if (!slugs.has(d)) { await rm(R('photo', d), { recursive: true, force: true }); ecrits.push(`photo/${d}/ (supprimée)`); }
  }

  // 6. Fichiers pour les robots
  await ecrireSiChange('sitemap.xml', sitemap(pages));
  await ecrireSiChange('robots.txt', robots());
  await ecrireSiChange('llms.txt', llms({ contenu, photos, total }));
  await ecrireSiChange('manifest.webmanifest', manifest());
  await ecrireSiChange('outils/etat.json', `${JSON.stringify(trier({ images: entrees, pages: nouvellesPages }), null, 1)}\n`);

  // 7. Bilan
  const aConfirmer = [...contenu.presentation.paragraphes, ...contenu.faits, ...contenu.faq].filter((x) => x.a_confirmer).length;
  const aCompleter = contenu.faits.filter((f) => !f.valeur).length;
  console.log(`🐾 grizette : ${total} photos, ${pages.length + 1} pages.`);
  if (!sharp) console.log('⚠️  sharp absent (cd outils && npm install) : les originaux sont servis sans optimisation.');
  else console.log(`   Images : ${bilan.traitees.length} optimisée(s), ${bilan.reutilisees} déjà à jour${bilan.supprimees.length ? `, ${bilan.supprimees.length} ancienne(s) version(s) supprimée(s)` : ''}.`);
  bilan.erreurs.forEach((e) => console.log(`⚠️  Image non optimisée : ${e}`));
  if (sansDescription.length) console.log(`✏️  ${sansDescription.length} photo(s) sans description dans photos-meta.json : ${sansDescription.join(', ')}`);
  if (orphelines.length) console.log(`ℹ️  ${orphelines.length} description(s) sans fichier correspondant : ${orphelines.join(', ')}`);
  if (aConfirmer || aCompleter) console.log(`ℹ️  contenu.json : ${aConfirmer} information(s) à confirmer, ${aCompleter} à compléter.`);
  avertissements.forEach((a) => console.log(`ℹ️  ${a}`));
  console.log(ecrits.length ? `   ${ecrits.length} fichier(s) mis à jour.` : '   Rien à changer : le site est déjà à jour.');
}

main().catch((e) => {
  console.error(`❌ grizette : ${e.message}`);
  process.exit(1);
});
