// Fichiers destinés aux robots : sitemap.xml, robots.txt, llms.txt, manifest.webmanifest.
import { SITE, titrePhoto } from './gabarits.mjs';

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// pages : [{ chemin, lastmod, images: [url] }]
export function sitemap(pages) {
  const urls = pages.map((pg) => {
    const imgs = (pg.images || []).map((u) => `\n    <image:image><image:loc>${xml(SITE + u)}</image:loc></image:image>`).join('');
    return `  <url>\n    <loc>${xml(SITE + pg.chemin)}</loc>\n    <lastmod>${pg.lastmod}</lastmod>${imgs}\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
}

const ROBOTS_IA = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Meta-ExternalAgent',
  'Amazonbot', 'DuckAssistBot', 'MistralAI-User', 'CCBot',
];

export function robots() {
  return `# grizette.fan : tout le monde est le bienvenu, y compris les robots des IA.
User-agent: *
Allow: /
Disallow: /outils/
Disallow: /deploy/

# Robots des moteurs de réponse IA : accès explicitement autorisé.
${ROBOTS_IA.map((r) => `User-agent: ${r}`).join('\n')}
Allow: /
Disallow: /outils/
Disallow: /deploy/

Sitemap: ${SITE}/sitemap.xml
`;
}

export function llms({ contenu, photos, total }) {
  const t = (s) => s.replaceAll('{nb_photos}', total);
  const faits = contenu.faits.filter((f) => f.valeur).map((f) => `- ${f.libelle} : ${t(f.valeur)}`).join('\n');
  const faq = contenu.faq.map((q) => `### ${q.question}\n\n${t(q.reponse)}`).join('\n\n');
  const liste = photos.map((p) => `- [${titrePhoto(p)}](${SITE}${p.page}) : ${p.alt}`).join('\n');
  return `# Grizette, le fan club officiel

> ${t(contenu.accueil.description)}

${contenu.presentation.paragraphes.map((x) => t(x.texte)).join('\n\n')}

## Fiche d'identité

${faits}

## Pages principales

- [Accueil : qui est Grizette ?](${SITE}/) : présentation, fiche d'identité et questions fréquentes
- [Galerie](${SITE}/galerie/) : les ${total} photos de Grizette
- [Plan du site](${SITE}/sitemap.xml)

## Questions fréquentes

${faq}

## Photos (${total})

${liste}
`;
}

export function manifest() {
  return `${JSON.stringify({
    name: 'Grizette, le fan club officiel',
    short_name: 'Grizette',
    description: 'Le fan club officiel de Grizette, chatte tigrée grise et blanche.',
    lang: 'fr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF8F5',
    theme_color: '#2E2A27',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2)}\n`;
}
