/* Catalogo: filtri, scheda del gioco, preferiti, «continua a giocare», installazione.
   I giochi arrivano dal blocco «dati» che monta.py scrive nella pagina leggendo le schede. */
(function () {
  'use strict';
  const DATI = JSON.parse(document.getElementById('dati').textContent);
  const GIOCHI = DATI.giochi;
  const perId = Object.fromEntries(GIOCHI.map(g => [g.id, g]));
  const $ = id => document.getElementById(id);

  /* ---- memoria del dispositivo (può mancare: navigazione privata) ---- */
  const mem = {
    leggi(k, pred) { try { const v = JSON.parse(localStorage.getItem('piattaforma.' + k)); return v == null ? pred : v; } catch (e) { return pred; } },
    scrivi(k, v) { try { localStorage.setItem('piattaforma.' + k, JSON.stringify(v)); } catch (e) { /* senza memoria si gioca lo stesso */ } }
  };
  let preferiti = mem.leggi('preferiti', []).filter(id => perId[id]);

  /* ---- avviso breve ---- */
  let tAvviso = 0;
  function avviso(t) {
    const a = $('avviso'); a.textContent = t; a.hidden = false;
    clearTimeout(tAvviso); tAvviso = setTimeout(() => { a.hidden = true; }, 2200);
  }

  /* ---- filtri ---- */
  let filtro = 'tutti';
  function disegnaFiltri() {
    const voci = [{ id: 'tutti', nome: 'Tutti' }];
    for (const c of DATI.categorie) if (GIOCHI.some(g => g.categoria === c.id)) voci.push(c);
    if (GIOCHI.some(g => g.inDue)) voci.push({ id: 'in-due', nome: 'In due' });
    if (preferiti.length) voci.push({ id: 'preferiti', nome: 'Preferiti' });
    if (!voci.some(v => v.id === filtro)) filtro = 'tutti';
    const box = $('filtri'); box.textContent = '';
    for (const v of voci) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = v.nome; b.dataset.f = v.id;
      b.setAttribute('aria-pressed', String(v.id === filtro));
      box.appendChild(b);
    }
  }
  function applicaFiltro() {
    let visti = 0;
    for (const carta of document.querySelectorAll('#griglia .carta')) {
      const g = perId[carta.dataset.id];
      const ok = filtro === 'tutti' || g.categoria === filtro ||
        (filtro === 'in-due' && g.inDue) || (filtro === 'preferiti' && preferiti.includes(g.id));
      carta.hidden = !ok; if (ok) visti++;
      carta.classList.toggle('preferito', preferiti.includes(g.id));
    }
    $('vuoto').hidden = visti > 0;
  }
  $('filtri').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filtro = b.dataset.f; disegnaFiltri(); applicaFiltro();
  });

  /* ---- continua a giocare: lo scrive piattaforma.js quando si apre un gioco ---- */
  function disegnaRecenti() {
    const lista = mem.leggi('recenti', []).filter(r => perId[r.id]).slice(0, 8);
    $('recenti').hidden = lista.length === 0;
    const box = $('recenti-lista'); box.textContent = '';
    for (const r of lista) {
      const g = perId[r.id];
      const a = document.createElement('a'); a.className = 'mini'; a.href = g.pagina;
      const img = document.createElement('img'); img.src = g.copertina; img.alt = ''; img.width = 320; img.height = 180; img.loading = 'lazy';
      const s = document.createElement('span'); s.textContent = g.titolo;
      a.append(img, s); box.appendChild(a);
    }
  }

  /* ---- scheda del gioco ---- */
  const scheda = $('scheda');
  let apertaDaQui = false;
  function riempi(g) {
    scheda.dataset.cat = g.categoria; scheda.dataset.id = g.id;
    $('s-img').src = g.copertina;
    $('s-cat').textContent = g.categoriaNome;
    $('s-tit').textContent = g.titolo;
    $('s-desc').textContent = g.descrizione;
    const segni = $('s-segni'); segni.textContent = '';
    for (const t of g.segni) { const li = document.createElement('li'); li.textContent = t; segni.appendChild(li); }
    const come = $('s-come'); come.textContent = '';
    for (const t of g.come) { const li = document.createElement('li'); li.textContent = t; come.appendChild(li); }
    come.previousElementSibling.hidden = come.hidden = g.come.length === 0;
    $('s-nota').textContent = g.nota || ''; $('s-nota').hidden = !g.nota;
    $('s-gioca').href = g.pagina;
    cuore(g.id);
  }
  function cuore(id) {
    const si = preferiti.includes(id), b = $('s-cuore');
    b.setAttribute('aria-pressed', String(si));
    b.setAttribute('aria-label', si ? 'Togli dai preferiti' : 'Aggiungi ai preferiti');
  }
  function daIndirizzo() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (perId[id]) {
      riempi(perId[id]);
      if (!scheda.open) { scheda.showModal(); scheda.querySelector('.s-corpo').scrollTop = 0; }
    } else if (scheda.open) scheda.close();
  }
  function chiudi() {
    if (apertaDaQui) { apertaDaQui = false; history.back(); }
    else { history.replaceState(null, '', location.pathname + location.search); daIndirizzo(); }
  }
  $('griglia').addEventListener('click', e => {
    const carta = e.target.closest('.carta');
    if (!carta || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); apertaDaQui = true; location.hash = carta.dataset.id;
  });
  $('s-chiudi').addEventListener('click', chiudi);
  scheda.addEventListener('cancel', e => { e.preventDefault(); chiudi(); });
  scheda.addEventListener('click', e => { if (e.target === scheda) chiudi(); });
  addEventListener('hashchange', daIndirizzo);

  $('s-cuore').addEventListener('click', () => {
    const id = scheda.dataset.id;
    preferiti = preferiti.includes(id) ? preferiti.filter(x => x !== id) : [id].concat(preferiti);
    mem.scrivi('preferiti', preferiti);
    cuore(id); disegnaFiltri(); applicaFiltro();
    avviso(preferiti.includes(id) ? 'Aggiunto ai preferiti' : 'Tolto dai preferiti');
  });
  $('s-condividi').addEventListener('click', async () => {
    const g = perId[scheda.dataset.id];
    const dati = { title: g.titolo, text: g.breve, url: new URL('./#' + g.id, location.href).href };
    try {
      if (navigator.share) await navigator.share(dati);
      else { await navigator.clipboard.writeText(dati.url); avviso('Indirizzo copiato'); }
    } catch (e) { if (e.name !== 'AbortError') avviso('Non riesco a condividere da qui'); }
  });

  /* ---- installazione ---- */
  let invito = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); invito = e; $('installa').hidden = false; });
  $('installa').addEventListener('click', async () => {
    if (!invito) return;
    invito.prompt(); await invito.userChoice; invito = null; $('installa').hidden = true;
  });
  addEventListener('appinstalled', () => { $('installa').hidden = true; });
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const giaApp = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  if (ios && !giaApp && !mem.leggi('consiglio-chiuso', false)) $('consiglio-ios').hidden = false;
  $('consiglio-chiudi').addEventListener('click', () => { $('consiglio-ios').hidden = true; mem.scrivi('consiglio-chiuso', true); });

  /* ---- funzionamento senza connessione ---- */
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* si gioca lo stesso, solo con la rete */ });

  /* tornando dal gioco con «indietro» la pagina può riapparire dalla memoria del browser: si rilegge cosa è cambiato */
  addEventListener('pageshow', () => { preferiti = mem.leggi('preferiti', []).filter(id => perId[id]); disegnaRecenti(); disegnaFiltri(); applicaFiltro(); });
  disegnaFiltri(); applicaFiltro(); disegnaRecenti(); daIndirizzo();
})();
