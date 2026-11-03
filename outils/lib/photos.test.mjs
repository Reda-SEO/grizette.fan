// Tests de la numérotation stable. Lancer : cd outils && npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attribuerSlugs, serialiserMeta } from './photos.mjs';

const photo = (fichier) => {
  const ext = fichier.split('.').pop();
  return { fichier, base: fichier.slice(0, -(ext.length + 1)), ext: ext.toLowerCase() };
};
const numeroter = (noms, meta) => {
  const photos = noms.map(photo);
  attribuerSlugs(photos, meta);
  return Object.fromEntries(photos.map((p) => [p.fichier, `${p.label} ${p.slug}`]));
};

test('suppression de la photo au plus grand numéro : ce numéro n\'est jamais réattribué', () => {
  const meta = {};
  numeroter(['Grizette (1).jpg', 'Grizette (2).jpg', 'grizette-20261103-aaaaaa.jpg'], meta);
  assert.equal(meta['grizette-20261103-aaaaaa.jpg'].num, 3);
  assert.equal(meta._numero_suivant, 4);

  // On supprime la n°3 (la plus grande) : fichier ET entrée de photos-meta.json, comme l'admin.
  delete meta['grizette-20261103-aaaaaa.jpg'];
  const r = numeroter(['Grizette (1).jpg', 'Grizette (2).jpg', 'grizette-20261104-bbbbbb.jpg'], meta);
  assert.equal(r['grizette-20261104-bbbbbb.jpg'], 'n°4 grizette-4', 'n°3 (et /photo/grizette-3/) n\'est pas réutilisé');
  assert.equal(meta._numero_suivant, 5);

  // Le compteur survit à l'aller-retour par le fichier JSON.
  const relu = JSON.parse(serialiserMeta(meta));
  delete relu['grizette-20261104-bbbbbb.jpg'];
  const r2 = numeroter(['Grizette (1).jpg', 'Grizette (2).jpg', 'grizette-20261105-cccccc.jpg'], relu);
  assert.equal(r2['grizette-20261105-cccccc.jpg'], 'n°5 grizette-5');
});

test('suppression de toutes les photos récentes : le compteur ne redescend pas', () => {
  const meta = { _numero_suivant: 60, 'Grizette (1).jpg': { num: 1, slug: 'grizette-1' } };
  const r = numeroter(['Grizette (1).jpg', 'x.jpg'], meta);
  assert.equal(r['x.jpg'], 'n°60 grizette-60');
});

test('un nom « Grizette (N) » ne peut pas reprendre un numéro déjà attribué puis supprimé', () => {
  const meta = { _numero_suivant: 50, 'Grizette (1).jpg': { num: 1, slug: 'grizette-1' } };
  const r = numeroter(['Grizette (1).jpg', 'Grizette (9).jpg', 'Grizette (49).jpeg', 'Grizette (70).jpg'], meta);
  // Ordre de traitement (pas de date d'envoi) : ordre des noms → (49), (70), (9).
  assert.equal(r['Grizette (49).jpeg'], 'n°50 grizette-50', 'n°49 déjà attribué : numéro suivant');
  assert.equal(r['Grizette (70).jpg'], 'n°70 grizette-70', 'un numéro jamais attribué peut être choisi par le nom');
  assert.equal(r['Grizette (9).jpg'], 'n°71 grizette-71', 'n°9 (retirée, 410) n\'est pas ressuscitée');
  assert.equal(meta._numero_suivant, 72);
});

test('photos déjà numérotées : numéro et adresse inchangés, quoi qu\'il arrive autour', () => {
  const meta = {
    _numero_suivant: 50,
    'Grizette (1).jpeg': { num: 1, rang: 1, slug: 'grizette-1-jpeg' },
    'Grizette (49).jpeg': { num: 49, slug: 'grizette-49' },
  };
  const r = numeroter(['Grizette (1).jpeg', 'Grizette (49).jpeg', 'a.jpg', 'b.jpg'], meta);
  assert.equal(r['Grizette (1).jpeg'], 'n°1 bis grizette-1-jpeg');
  assert.equal(r['Grizette (49).jpeg'], 'n°49 grizette-49');
});

test('photos envoyées ensemble : numérotées dans l\'ordre d\'envoi', () => {
  const meta = { _numero_suivant: 50 };
  const r = numeroter(['grizette-x-ffffff.jpg', 'grizette-x-000000.jpg'], Object.assign(meta, {
    'grizette-x-ffffff.jpg': { ajoute_le: '2026-11-03T10:00:00.000Z' },
    'grizette-x-000000.jpg': { ajoute_le: '2026-11-03T10:00:00.001Z' },
  }));
  assert.equal(r['grizette-x-ffffff.jpg'], 'n°50 grizette-50');
  assert.equal(r['grizette-x-000000.jpg'], 'n°51 grizette-51');
});

test('compteur effacé à la main : le générateur refuse au lieu de risquer une réattribution', () => {
  const meta = { 'Grizette (1).jpg': { num: 1, slug: 'grizette-1' } };
  assert.throws(() => numeroter(['Grizette (1).jpg', 'x.jpg'], meta), /_numero_suivant/);
});

test('migration initiale (aucun numéro encore figé) : numéros repris des noms, bis compris', () => {
  const meta = {};
  const r = numeroter(['Grizette (10).jpg', 'Grizette (2).jpg', 'Grizette (1).jpg', 'Grizette (1).jpeg'], meta);
  assert.deepEqual(r, {
    'Grizette (10).jpg': 'n°10 grizette-10',
    'Grizette (2).jpg': 'n°2 grizette-2',
    'Grizette (1).jpg': 'n°1 grizette-1',
    'Grizette (1).jpeg': 'n°1 bis grizette-1-jpeg',
  });
  assert.equal(meta._numero_suivant, 11);
});
