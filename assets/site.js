/* grizette.fan : amélioration progressive. Sans JavaScript, tout reste lisible et navigable. */
(() => {
  'use strict';
  const corps = document.body;
  const urlListe = corps.dataset.photos;
  let photos = null;
  let chargement = null;
  const parSlug = new Map();

  const chargerListe = () => chargement || (chargement = fetch(urlListe)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => { photos = d.photos; photos.forEach((p) => parSlug.set(p.slug, p)); return photos; })
    .catch((e) => { chargement = null; throw e; }));

  const auRepos = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 800));
  const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const mouvementReduit = matchMedia('(prefers-reduced-motion: reduce)');
  const dansUnChamp = (el) => el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
  const srcset = (p) => Object.entries(p.src).map(([l, u]) => `${u} ${l}w`).join(', ');
  const srcDefaut = (p) => p.src['800'] || Object.values(p.src)[0];

  /* ---------- Accueil : une autre photo sans recharger ---------- */
  const scene = document.getElementById('scene');
  if (scene) {
    const img = document.getElementById('photo');
    const fond = scene.querySelector('.scene-fond');
    const cadre = scene.querySelector('.scene-cadre');
    const legende = document.getElementById('legende');
    const compteur = document.getElementById('compteur');
    const statut = document.getElementById('statut');
    const total = +scene.dataset.total;
    let actuel = scene.dataset.slug;
    const passees = [];        // pour revenir en arrière (flèche gauche, swipe)
    const echecs = new Set();  // photos impossibles à charger
    let sac = [];
    let sacPret = false;
    let prochaine = null;      // promesse de la photo préchargée
    let occupe = false;

    // Le lien de secours (sans JS) devient un vrai bouton.
    const lien = document.getElementById('autre');
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = lien.className;
    bouton.id = 'autre';
    bouton.innerHTML = lien.innerHTML;
    lien.replaceWith(bouton);

    const melanger = (t) => {
      for (let i = t.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [t[i], t[j]] = [t[j], t[i]];
      }
      return t;
    };
    // Sac mélangé : on épuise toutes les photos avant de remélanger ;
    // la photo affichée n'ouvre jamais le cycle suivant.
    const remplir = (premierCycle) => {
      sac = melanger(photos.filter((p) => !echecs.has(p.slug) && !(premierCycle && p.slug === actuel)).map((p) => p.slug));
      const n = sac.length;
      if (n > 1 && sac[n - 1] === actuel) [sac[0], sac[n - 1]] = [sac[n - 1], sac[0]];
      sacPret = true;
    };
    const tirer = () => {
      if (!sacPret) remplir(true);
      for (let essai = 0; essai < 2; essai++) {
        while (sac.length) {
          const s = sac.pop();
          if (!echecs.has(s)) return parSlug.get(s);
        }
        remplir(false);
      }
      return null;
    };
    const precharger = (p) => {
      if (!p) return Promise.resolve({ photo: null, ok: false });
      const im = new Image();
      im.sizes = img.sizes;
      im.srcset = srcset(p);
      im.src = srcDefaut(p);
      return im.decode().then(() => ({ photo: p, ok: true }), () => ({ photo: p, ok: false }));
    };

    const afficher = async (p) => {
      const changer = () => {
        img.srcset = srcset(p);
        img.src = srcDefaut(p);
        img.width = p.l;
        img.height = p.h;
        img.alt = p.alt;
        fond.src = p.fond;
        legende.textContent = p.legende;
        legende.href = p.page;
        compteur.textContent = `${p.num} · ${total} photos`;
        scene.dataset.slug = actuel = p.slug;
        statut.textContent = `Nouvelle photo : ${p.legende}`;
      };
      if (mouvementReduit.matches) { changer(); return; }
      img.classList.add('est-cachee');
      await pause(180);
      changer();
      try { await img.decode(); } catch (e) { /* signalé par l'événement error */ }
      img.classList.remove('est-cachee');
    };

    const erreurTotale = () => {
      statut.textContent = '';
      let msg = document.getElementById('message-erreur');
      if (!msg) {
        msg = document.createElement('p');
        msg.id = 'message-erreur';
        msg.className = 'message-erreur';
        msg.setAttribute('role', 'alert');
        scene.after(msg);
      }
      msg.textContent = 'Oups, Grizette se cache : impossible de charger les photos pour le moment. Réessayez un peu plus tard ou passez par la galerie.';
    };

    const suivante = async () => {
      if (occupe) return;
      occupe = true;
      bouton.setAttribute('aria-busy', 'true');
      try {
        await chargerListe();
        let essai = prochaine || precharger(tirer());
        prochaine = null;
        for (let i = 0; i <= photos.length; i++) {
          const r = await essai;
          if (!r.photo) break;
          if (r.ok) {
            passees.push(actuel);
            await afficher(r.photo);
            prochaine = precharger(tirer());
            return;
          }
          echecs.add(r.photo.slug); // image cassée : on passe à la suivante
          essai = precharger(tirer());
        }
        erreurTotale();
      } catch (e) {
        erreurTotale();
      } finally {
        occupe = false;
        bouton.removeAttribute('aria-busy');
      }
    };

    const precedente = async () => {
      if (occupe || !passees.length || !photos) return;
      occupe = true;
      await afficher(parSlug.get(passees.pop()));
      occupe = false;
    };

    bouton.addEventListener('click', suivante);

    document.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || dansUnChamp(e.target)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); suivante(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); precedente(); }
      else if (e.key === ' ' && !e.target.closest('button, a, summary') && window.scrollY < window.innerHeight / 2) {
        e.preventDefault();
        suivante();
      }
    });

    // Swipe sur la photo : vers la gauche = nouvelle photo, vers la droite = retour.
    let x0 = null;
    let y0 = null;
    cadre.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    cadre.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? suivante : precedente)();
    }, { passive: true });

    // Photo affichée cassée : on en montre une autre.
    img.addEventListener('error', () => { if (!occupe) { echecs.add(actuel); suivante(); } });
    if (img.complete && img.naturalWidth === 0) { echecs.add(actuel); suivante(); }

    // Après le chargement : liste des photos + préchargement de la prochaine.
    const preparer = () => auRepos(() => chargerListe().then(() => { if (!prochaine) prochaine = precharger(tirer()); }).catch(() => {}));
    if (document.readyState === 'complete') preparer(); else addEventListener('load', preparer, { once: true });
  }

  /* ---------- Page photo : « Au hasard » vraiment aléatoire + flèches du clavier ---------- */
  const hasard = document.getElementById('hasard');
  if (hasard) {
    const courant = corps.dataset.slug;
    hasard.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const liste = (await chargerListe()).filter((p) => p.slug !== courant);
        location.href = liste.length ? liste[Math.floor(Math.random() * liste.length)].page : hasard.href;
      } catch (err) {
        location.href = hasard.href;
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || dansUnChamp(e.target)) return;
      const cible = e.key === 'ArrowLeft' ? document.querySelector('a[rel="prev"]')
        : e.key === 'ArrowRight' ? document.querySelector('a[rel="next"]') : null;
      if (cible) location.href = cible.href;
    });
  }
})();
