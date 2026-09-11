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

const NEZ = '<svg class="truffe-nez" viewBox="0 0 42 32" aria-hidden="true" focusable="false"><path d="M3 9c0-5 7-7 18-7s18 2 18 7c0 3-2 5-5 8l-9 10c-2.2 2.4-5.8 2.4-8 0L8 17C5 14 3 12 3 9z" fill="#F7CBC8" stroke="#2E2A27" stroke-width="2.2"/><ellipse cx="13" cy="9" rx="4.5" ry="2.6" fill="#6E4B3B"/></svg>';
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
