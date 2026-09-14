// Gabarits HTML et données structurées (JSON-LD) de toutes les pages.
export const SITE = 'https://grizette.fan';
const abs = (u) => (u.startsWith('http') ? u : SITE + u);

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const srcset = (p) => p.variantes.map((v) => `${v.url} ${v.w}w`).join(', ');
const srcDefaut = (p) => (p.variantes.find((v) => v.w >= 560) || p.variantes[p.variantes.length - 1]).url;
// Largeur réellement affichée : la photo entière tient dans la hauteur disponible.
const taillesScene = (p, reserve) => `min(100vw, calc((100vh - ${reserve}) * ${p.ratio}))`;
const px = (n) => ({ '@type': 'QuantitativeValue', value: n, unitCode: 'E37' });

export function couperDescription(texte, max = 160) {
  if (texte.length <= max) return texte;
  const coupe = texte.slice(0, max - 1);
  return `${coupe.slice(0, coupe.lastIndexOf(' '))}…`;
}

const NEZ = '<svg class="truffe-nez" viewBox="0 0 9 8" aria-hidden="true" focusable="false"><path d="M8.28 4.65C8.14 2.75 6.8 1.44 4.58 1.44C2.35 1.44 1.01 2.83 .88 4.73C.8 5.84 1.22 6.83 2.04 7.39C2.59 7.76 3.35 7.96 4.59 7.96C5.84 7.96 6.56 7.69 7.11 7.33C8.02 6.72 8.36 5.74 8.28 4.65Z" fill="#878787"/><path d="M6.91 5.85C6.82 4.61 5.98 3.76 4.57 3.76C3.17 3.76 2.33 4.66 2.24 5.9C2.19 6.62 2.45 7.26 2.98 7.63C3.32 7.87 3.8 8 4.58 8C5.37 8 5.82 7.82 6.17 7.59C6.74 7.19 6.96 6.56 6.91 5.85Z" fill="#fff"/><path d="M3.83 2.63C3.28 1.23 2.1 .28 1.64 .13C1.47 .08 1.26 .07 1.16 .23C.91 .63 .6 1.91 1.29 3.72L3.83 2.63Z" fill="#878787"/><path d="M2.54 2.02C2.65 1.93 2.71 1.83 2.58 1.64C2.39 1.35 2.05 1 1.91 .9C1.69 .72 1.52 .66 1.46 .94C1.34 1.46 1.35 2.16 1.48 2.55C1.52 2.69 1.66 2.76 1.77 2.67L2.54 2.02Z" fill="#FFD1D1"/><path d="M3.85 2.81C3.94 2.88 4.1 2.87 4.2 2.76C4.32 2.62 4.44 2.16 4.37 1.45C4.02 1.46 3.7 1.51 3.4 1.59C3.64 1.99 3.7 2.68 3.85 2.81Z" fill="#3A3A3A"/><path d="M5.3 2.81C5.22 2.88 5.05 2.87 4.95 2.76C4.83 2.62 4.71 2.16 4.79 1.45C5.13 1.46 5.45 1.51 5.75 1.59C5.51 1.99 5.45 2.68 5.3 2.81Z" fill="#3A3A3A"/><path d="M5.74 1.66C6.33 .75 7.16 .14 7.5 .03C7.67-.02 7.87-.02 7.96 .14C8.2 .54 8.41 1.77 7.93 3.49L6.18 2.64L5.74 1.66Z" fill="#878787"/><path d="M7.03 2.31C7.21 2.49 7.35 2.61 7.46 2.72C7.53 2.8 7.65 2.77 7.67 2.66C7.85 1.8 7.8 1.07 7.67 .87C7.61 .78 7.51 .76 7.41 .79C7.23 .85 6.77 1.19 6.45 1.68C6.42 1.74 6.43 1.82 6.49 1.86C6.6 1.94 6.8 2.09 7.03 2.31Z" fill="#FFD1D1"/><path d="M1.46 5.99C1.52 5.99 1.57 6.03 1.58 6.09C1.58 6.15 1.54 6.21 1.48 6.21C1.12 6.24 .89 6.28 .76 6.32C.69 6.33 .65 6.34 .62 6.35C.61 6.36 .6 6.36 .59 6.36C.59 6.36 .59 6.36 .59 6.36C.54 6.39 .47 6.37 .44 6.32C.42 6.26 .44 6.2 .49 6.17L.52 6.23C.49 6.17 .49 6.17 .49 6.17H.49L.49 6.17C.49 6.17 .49 6.17 .49 6.17C.5 6.17 .5 6.17 .5 6.17C.5 6.16 .5 6.16 .51 6.16C.52 6.16 .53 6.15 .55 6.15C.58 6.13 .63 6.12 .71 6.1C.85 6.07 1.09 6.03 1.46 5.99ZM.59 6.36H.59L.59 6.36C.59 6.37 .59 6.37 .59 6.37V6.37C.59 6.37 .59 6.36 .59 6.36L.59 6.36ZM7.63 5.76C8 5.78 8.27 5.82 8.46 5.85C8.55 5.87 8.62 5.89 8.67 5.9C8.69 5.91 8.71 5.92 8.72 5.92C8.73 5.92 8.73 5.92 8.73 5.92C8.74 5.92 8.74 5.93 8.74 5.93L8.74 5.93H8.74L8.74 5.93C8.8 5.95 8.83 6.01 8.81 6.07C8.79 6.12 8.72 6.15 8.67 6.13H8.67C8.67 6.13 8.67 6.13 8.66 6.13C8.66 6.13 8.66 6.13 8.65 6.13C8.64 6.13 8.63 6.12 8.61 6.12C8.57 6.1 8.5 6.09 8.41 6.07C8.24 6.03 7.98 5.99 7.62 5.97C7.56 5.97 7.51 5.92 7.51 5.86C7.52 5.8 7.57 5.75 7.63 5.76ZM.43 5.4C.66 5.38 .99 5.38 1.41 5.45C1.46 5.46 1.5 5.52 1.49 5.58C1.48 5.64 1.43 5.68 1.37 5.66C.97 5.6 .67 5.6 .46 5.62C.35 5.63 .27 5.65 .22 5.66C.19 5.67 .17 5.67 .16 5.68C.16 5.68 .15 5.68 .15 5.68C.15 5.68 .15 5.68 .15 5.68C.09 5.7 .03 5.67 .01 5.61C-.01 5.56 .02 5.49 .07 5.47L.1 5.55L.07 5.47L.07 5.47C.07 5.47 .07 5.47 .07 5.47C.07 5.47 .08 5.47 .08 5.47C.08 5.47 .08 5.47 .08 5.47C.09 5.47 .09 5.47 .1 5.47C.12 5.46 .14 5.45 .17 5.45C.23 5.43 .32 5.42 .43 5.4ZM8.83 5.15C8.84 5.15 8.84 5.15 8.85 5.15C8.85 5.15 8.85 5.15 8.85 5.15C8.85 5.15 8.85 5.15 8.85 5.15C8.85 5.15 8.85 5.15 8.85 5.15H8.86L8.87 5.15C8.92 5.16 8.96 5.21 8.96 5.27C8.95 5.32 8.91 5.37 8.85 5.37L8.84 5.37H8.84C8.84 5.37 8.84 5.37 8.84 5.37C8.84 5.37 8.83 5.37 8.83 5.37C8.82 5.37 8.8 5.37 8.78 5.37C8.73 5.37 8.66 5.37 8.57 5.38C8.38 5.39 8.09 5.42 7.7 5.51C7.64 5.52 7.58 5.48 7.57 5.42C7.55 5.37 7.59 5.31 7.65 5.29C8.06 5.21 8.35 5.17 8.55 5.16C8.65 5.15 8.73 5.15 8.78 5.15C8.8 5.15 8.82 5.15 8.83 5.15ZM.32 4.63C.35 4.6 .4 4.6 .44 4.62C.45 4.62 .46 4.62 .48 4.63C.53 4.64 .59 4.65 .68 4.67C.85 4.72 1.12 4.81 1.48 4.98C1.54 5.01 1.56 5.08 1.54 5.13C1.51 5.18 1.45 5.21 1.39 5.18C1.03 5.01 .78 4.93 .62 4.89C.54 4.86 .48 4.85 .44 4.84C.42 4.84 .4 4.83 .38 4.83C.37 4.83 .36 4.82 .35 4.82C.34 4.81 .32 4.8 .3 4.78C.26 4.74 .27 4.67 .32 4.63ZM8.72 4.35C8.78 4.34 8.84 4.38 8.84 4.44C8.85 4.5 8.81 4.56 8.74 4.56C8.74 4.56 8.74 4.56 8.74 4.56H8.75C8.74 4.56 8.74 4.56 8.74 4.56C8.74 4.57 8.73 4.57 8.71 4.57C8.68 4.58 8.63 4.6 8.55 4.62C8.4 4.68 8.15 4.8 7.77 5.01C7.72 5.04 7.65 5.03 7.62 4.97C7.59 4.92 7.61 4.85 7.66 4.82C8.05 4.6 8.31 4.48 8.47 4.42C8.56 4.39 8.62 4.37 8.66 4.36C8.68 4.35 8.69 4.35 8.7 4.35C8.71 4.35 8.71 4.35 8.72 4.35C8.72 4.35 8.72 4.35 8.72 4.35C8.72 4.35 8.72 4.35 8.72 4.35C8.72 4.35 8.72 4.35 8.72 4.35H8.72C8.72 4.35 8.72 4.35 8.73 4.43L8.72 4.35ZM.46 4.63C.46 4.63 .46 4.63 .46 4.63C.46 4.63 .46 4.63 .46 4.63Z" fill="#fff"/><path d="M6.92 4.37C6.9 4.77 6.65 5 6.36 5C6.08 5 5.85 4.71 5.85 4.36C5.85 4.01 6.09 3.73 6.41 3.74C6.78 3.76 6.94 4.04 6.92 4.37Z" fill="#000200"/><path d="M3.26 4.33C3.32 4.74 3.14 4.99 2.86 5.05C2.57 5.11 2.33 4.91 2.26 4.56C2.19 4.21 2.32 3.88 2.65 3.83C3.02 3.78 3.21 4 3.26 4.33Z" fill="#000200"/><path d="M3.19 5.75C3 5.87 3.22 6.15 3.35 6.25C3.48 6.34 3.72 6.46 4.06 6.42C4.46 6.38 4.58 6.08 4.58 6.08C4.58 6.08 4.72 6.42 5.22 6.43C5.73 6.45 5.89 6.17 5.96 6.09C6.03 6.01 6.1 5.79 5.98 5.71C5.86 5.63 5.78 5.73 5.66 5.9C5.53 6.08 5.28 6.17 5.03 6.05C4.79 5.94 4.77 5.54 4.77 5.54L4.42 5.56C4.42 5.56 4.37 5.9 4.21 6.01C4.05 6.12 3.67 6.15 3.52 5.91C3.45 5.8 3.34 5.64 3.19 5.75Z" fill="black"/><path d="M3.97 5.2C3.96 4.98 4.29 4.87 4.59 4.87C4.9 4.86 5.23 4.96 5.23 5.19C5.23 5.41 4.85 5.71 4.61 5.71C4.36 5.71 3.97 5.43 3.97 5.2Z" fill="#FFD1D1"/><path d="M3.99 5.11C3.99 4.99 4.29 4.93 4.57 4.93C4.85 4.93 5.16 4.98 5.16 5.1C5.16 5.21 4.81 5.37 4.58 5.37C4.36 5.37 4 5.22 3.99 5.11Z" fill="#6F3000"/></svg>';
const RAYURES = '<svg class="marque-rayures" viewBox="0 0 30 12" aria-hidden="true" focusable="false"><path d="M5 2v8M15 1v10M25 2v8" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/></svg>';

function entete({ accueil, actif }) {
  const contenuMarque = `<span class="marque-nom">${RAYURES}Grizette</span> <span class="marque-devise">fan club officiel</span>`;
  const marque = accueil ? `<h1 class="marque">${contenuMarque}</h1>` : `<a class="marque" href="/">${contenuMarque}</a>`;
  const courant = (c) => (actif === c ? ' aria-current="page"' : '');
  return `<header class="entete">${marque}<nav class="nav" aria-label="Navigation principale"><a href="/galerie/"${courant('galerie')}>Galerie</a><a class="nav-secondaire" href="/#qui-est-grizette">Qui est Grizette ?</a></nav></header>`;
}

const pied = (ctx) => `<footer class="pied"><p>Grizette, fan club officiel (et affectueux) · ${ctx.total} photos · <a href="/galerie/">Galerie</a></p></footer>`;

export function miseEnPage(ctx, o) {
  const og = o.og;
  const precharges = [
    '<link rel="preload" href="/assets/polices/fraunces-titre.woff2" as="font" type="font/woff2" crossorigin>',
    o.photoLcp ? `<link rel="preload" as="image" href="${esc(srcDefaut(o.photoLcp))}" imagesrcset="${esc(srcset(o.photoLcp))}" imagesizes="${esc(o.taillesLcp)}" fetchpriority="high">` : '',
  ].join('');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.titre)}</title>
<meta name="description" content="${esc(o.description)}">
${o.indexable === false ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="${abs(o.chemin)}">`}
${precharges}
<meta property="og:site_name" content="Grizette, le fan club officiel">
<meta property="og:locale" content="fr_FR">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:title" content="${esc(o.titreOg || o.titre)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${abs(o.chemin)}">
<meta property="og:image" content="${abs(og.url)}">
<meta property="og:image:type" content="${og.mime}">
<meta property="og:image:width" content="${og.l}">
<meta property="og:image:height" content="${og.h}">
<meta property="og:image:alt" content="${esc(og.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.titreOg || o.titre)}">
<meta name="twitter:description" content="${esc(o.description)}">
<meta name="twitter:image" content="${abs(og.url)}">
<meta name="twitter:image:alt" content="${esc(og.alt)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#FAF8F5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1E1B19" media="(prefers-color-scheme: dark)">
<style>${ctx.css}</style>
${o.jsonld ? jsonld(o.jsonld) : ''}
${o.script ? `<script src="/assets/site.js?v=${ctx.versionJs}" defer></script>` : ''}
</head>
<body class="${o.classe}" data-photos="/photos.json?v=${ctx.versionListe}"${o.slug ? ` data-slug="${o.slug}"` : ''}>
<a class="evitement" href="#contenu">Aller au contenu</a>
${entete({ accueil: o.accueil, actif: o.actif })}
${o.contenu}
${pied(ctx)}
</body>
</html>
`;
}

const imageObject = (p, { complet = true } = {}) => ({
  '@type': 'ImageObject',
  '@id': `${abs(p.page)}#photo`,
  contentUrl: abs(p.grande),
  url: abs(p.page),
  name: p.legende,
  caption: p.legende,
  description: p.alt,
  ...(complet ? { thumbnailUrl: abs(p.vignette), encodingFormat: p.mimeAffiche } : {}),
  width: px(p.variantes[p.variantes.length - 1].w),
  height: px(Math.round(p.variantes[p.variantes.length - 1].w / p.ratio)),
  ...(p.date ? { dateCreated: p.date } : {}),
  about: { '@id': `${SITE}/#grizette` },
});

const ariane = (chemin, elements) => ({
  '@type': 'BreadcrumbList',
  '@id': `${abs(chemin)}#ariane`,
  itemListElement: elements.map(([nom, url], i) => ({ '@type': 'ListItem', position: i + 1, name: nom, ...(url ? { item: abs(url) } : {}) })),
});

function imgScene(p, { reserve, lcp }) {
  const fond = `<img class="scene-fond" src="${esc(p.fond)}" alt="" aria-hidden="true" width="${p.l}" height="${p.h}" decoding="async">`;
  const photo = `<img class="scene-photo" id="${lcp ? 'photo' : 'photo-page'}" src="${esc(srcDefaut(p))}" srcset="${esc(srcset(p))}" sizes="${taillesScene(p, reserve)}" width="${p.l}" height="${p.h}" alt="${esc(p.alt)}" fetchpriority="high" decoding="async">`;
  return `<div class="scene-cadre">${fond}${photo}</div>`;
}

/* ---------- Accueil ---------- */
export function pageAccueil(ctx) {
  const { contenu: c, vedette: p, total } = ctx;
  const t = (s) => s.replaceAll('{nb_photos}', total);
  const marque = (x) => (x.a_confirmer ? '<!-- À CONFIRMER -->\n' : '');
  const paragraphes = c.presentation.paragraphes.map((x, i) => `${marque(x)}<p${i === 0 ? ' class="intro"' : ''}>${esc(t(x.texte))}</p>`).join('\n');
  const faits = c.faits.map((f) => (f.valeur
    ? `${marque(f)}<dt>${esc(f.libelle)}</dt><dd>${esc(t(f.valeur))}</dd>`
    : `<!-- À COMPLÉTER : ${esc(f.libelle)} -->`)).join('\n');
  const faq = c.faq.map((q) => `${marque(q)}<h3>${esc(q.question)}</h3><p>${esc(t(q.reponse))}</p>`).join('\n');
  const reserve = '9.5rem';
  const suivante = ctx.hasardDe(p);
  const contenu = `<main id="contenu">
<section class="scene-bloc" aria-label="Photo de Grizette">
<figure class="scene" id="scene" data-slug="${p.slug}" data-total="${total}">
${imgScene(p, { reserve, lcp: true })}
<figcaption class="scene-legende"><a id="legende" href="${p.page}">${esc(p.legende)}</a> <span class="compteur" id="compteur">${p.label} · ${total} photos</span></figcaption>
</figure>
<div class="commandes"><a class="truffe" id="autre" href="${suivante.page}">${NEZ}<span>Une autre photo de Grizette</span></a></div>
<p class="visuellement-cache" id="statut" aria-live="polite"></p>
</section>
<section class="texte" id="qui-est-grizette" aria-labelledby="titre-qui">
<div class="rayures" aria-hidden="true"></div>
<h2 id="titre-qui">${esc(c.presentation.titre)}</h2>
${paragraphes}
<dl class="faits">
${faits}
</dl>
<section class="faq" aria-labelledby="titre-faq">
<h2 id="titre-faq">Questions fréquentes</h2>
${faq}
</section>
<p class="suite"><a class="truffe" href="/galerie/">${NEZ}<span>Voir les ${total} photos</span></a></p>
</section>
</main>`;
  const description = t(c.accueil.description);
  const faitsTexte = c.faits.filter((f) => f.valeur && f.libelle !== 'Nom').map((f) => `${f.libelle} : ${t(f.valeur)}`).join('. ');
  const graphe = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: 'Grizette, le fan club officiel', alternateName: 'grizette.fan', inLanguage: 'fr-FR', description, about: { '@id': `${SITE}/#grizette` } },
      { '@type': 'Thing', '@id': `${SITE}/#grizette`, name: 'Grizette', additionalType: 'https://www.wikidata.org/wiki/Q146', description: `${t(c.presentation.paragraphes[0].texte)} ${faitsTexte}.`, image: abs(p.grande), url: `${SITE}/` },
      { '@type': 'CollectionPage', '@id': `${SITE}/#page`, url: `${SITE}/`, name: c.accueil.titre, description, inLanguage: 'fr-FR', isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': `${SITE}/#grizette` }, primaryImageOfPage: imageObject(p), hasPart: { '@id': `${SITE}/galerie/#galerie` } },
      { '@type': 'FAQPage', '@id': `${SITE}/#faq`, url: `${SITE}/`, isPartOf: { '@id': `${SITE}/#page` }, mainEntity: c.faq.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: t(q.reponse) } })) },
    ],
  };
  return miseEnPage(ctx, {
    chemin: '/', titre: c.accueil.titre, description, accueil: true, classe: 'page-accueil', script: true,
    og: { ...p.og, alt: p.alt }, photoLcp: p, taillesLcp: taillesScene(p, reserve), jsonld: graphe, contenu,
  });
}

/* ---------- Galerie ---------- */
export function pageGalerie(ctx) {
  const { photos, total } = ctx;
  const items = photos.map((p, i) => {
    const r = p.ratio;
    const tailles = `(min-width: 48em) ${Math.ceil(13 * r * 1.35)}rem, ${Math.ceil(9 * r * 1.2)}rem`;
    return `<li style="--r:${r}"><a href="${p.page}"><img src="${esc(p.vignette)}" srcset="${esc(p.variantes.slice(0, 2).map((v) => `${v.url} ${v.w}w`).join(', '))}" sizes="${tailles}" width="${p.l}" height="${p.h}" alt="${esc(p.alt)}"${i < 3 ? ' fetchpriority="high"' : i < 8 ? '' : ' loading="lazy"'} decoding="async"><span class="mosaique-legende"><span class="mosaique-num">${p.label}</span> · ${esc(p.legende)}</span></a></li>`;
  }).join('\n');
  const titre = `Galerie : les ${total} photos de Grizette, chatte tigrée`;
  const description = couperDescription(`Toutes les photos de Grizette, la chatte tigrée grise et blanche de Fanny : ${total} portraits, siestes, cachettes et montages rigolos, à parcourir un par un.`);
  const contenu = `<main id="contenu" class="page page-galerie">
<nav class="ariane" aria-label="Fil d'Ariane"><ol><li><a href="/">Accueil</a></li><li aria-current="page">Galerie</li></ol></nav>
<h1 class="page-titre">La galerie de Grizette</h1>
<p class="chapo">${total} photos de Grizette, rangées par numéro. Touchez une photo pour la voir en grand.</p>
<ul class="mosaique">
${items}
</ul>
</main>`;
  const graphe = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'ImageGallery', '@id': `${SITE}/galerie/#galerie`, url: `${SITE}/galerie/`, name: titre, description, inLanguage: 'fr-FR', isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': `${SITE}/#grizette` }, breadcrumb: { '@id': `${SITE}/galerie/#ariane` }, associatedMedia: photos.map((p) => imageObject(p, { complet: false })) },
      ariane('/galerie/', [['Accueil', '/'], ['Galerie', null]]),
    ],
  };
  return miseEnPage(ctx, {
    chemin: '/galerie/', titre, description, classe: 'page-galerie-corps', actif: 'galerie',
    og: { ...ctx.vedette.og, alt: ctx.vedette.alt }, jsonld: graphe, contenu,
  });
}

/* ---------- Page photo ---------- */
export function titrePhoto(p) {
  return /grizette/i.test(p.legende) ? `${p.legende}, photo ${p.label}` : `${p.legende} · Grizette, photo ${p.label}`;
}
export function descriptionPhoto(p) {
  const longue = `${p.alt}. Photo ${p.label} du fan club officiel de Grizette, la chatte de Fanny.`;
  return longue.length <= 160 ? longue : couperDescription(`${p.alt}. Fan club de Grizette.`);
}

export function pagePhoto(ctx, p, prec, suiv) {
  const reserve = '19rem';
  const hasard = ctx.hasardDe(p);
  const titre = titrePhoto(p);
  const description = descriptionPhoto(p);
  const contenu = `<main id="contenu" class="page page-photo">
<nav class="ariane" aria-label="Fil d'Ariane"><ol><li><a href="/">Accueil</a></li><li><a href="/galerie/">Galerie</a></li><li aria-current="page">Photo ${p.label}</li></ol></nav>
<h1 class="page-titre">${esc(p.legende)}</h1>
<figure class="scene">
${imgScene(p, { reserve, lcp: false })}
<figcaption class="scene-legende"><span>${esc(p.alt)}.</span><span class="compteur">Photo ${p.label} · <a href="${esc(p.original)}">voir le fichier original</a></span></figcaption>
</figure>
<nav class="photo-nav" aria-label="Autres photos">
<a rel="prev" href="${prec.page}">‹ Précédente</a>
<a class="truffe" id="hasard" href="${hasard.page}">${NEZ}<span>Au hasard</span></a>
<a rel="next" href="${suiv.page}">Suivante ›</a>
</nav>
<p class="retour"><a href="/galerie/">Retour à la galerie</a></p>
</main>`;
  const graphe = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'ItemPage', '@id': abs(p.page), url: abs(p.page), name: titre, description, inLanguage: 'fr-FR', isPartOf: { '@id': `${SITE}/#site` }, primaryImageOfPage: { '@id': `${abs(p.page)}#photo` }, breadcrumb: { '@id': `${abs(p.page)}#ariane` } },
      imageObject(p),
      ariane(p.page, [['Accueil', '/'], ['Galerie', '/galerie/'], [`Photo ${p.label}`, null]]),
    ],
  };
  return miseEnPage(ctx, {
    chemin: p.page, titre, description, classe: 'page-photo-corps', slug: p.slug, script: true, ogType: 'article',
    og: { ...p.og, alt: p.alt }, photoLcp: p, taillesLcp: taillesScene(p, reserve), jsonld: graphe, contenu,
  });
}

/* ---------- 404 ---------- */
export function page404(ctx) {
  const p = ctx.photo404;
  const contenu = `<main id="contenu" class="page page-404">
<img src="${esc(srcDefaut(p))}" srcset="${esc(srcset(p))}" sizes="18rem" width="${p.l}" height="${p.h}" alt="${esc(p.alt)}">
<h1 class="page-titre">Cette page s'est cachée sous la couette</h1>
<p>Grizette a cherché partout (même dans le panier à linge) : la page demandée n'existe pas ou a déménagé.</p>
<p class="liens-404"><a class="truffe" href="/">${NEZ}<span>Retour à l'accueil</span></a> <a href="/galerie/">Voir la galerie</a></p>
</main>`;
  return miseEnPage(ctx, {
    chemin: '/404.html', titre: 'Page introuvable · Grizette, le fan club officiel', indexable: false,
    description: 'Cette page est introuvable. Retrouvez Grizette sur la page d’accueil ou dans la galerie photo du fan club.',
    classe: 'page-404-corps', og: { ...ctx.vedette.og, alt: ctx.vedette.alt }, contenu,
  });
}
