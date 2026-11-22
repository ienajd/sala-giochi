/* Il pezzo comune che monta.py aggiunge in fondo a ogni gioco.
   Fa tre cose: segna il gioco tra quelli giocati di recente, mette il tasto per tornare al catalogo,
   tiene acceso il funzionamento senza connessione. I giochi non lo sanno e non vanno modificati.
   Qui dentro andranno anche i servizi futuri uguali per tutti (stanze a più giocatori, spazi pubblicitari). */
(function () {
  'use strict';
  const io = document.currentScript;
  const ID = io.dataset.gioco, TITOLO = io.dataset.titolo || '', NOME = io.dataset.nome || 'i giochi';
  const CASA = new URL('.', io.src).href;            // la cartella del catalogo
  const PAUSA = io.dataset.pausa || '';              // il tasto di pausa del gioco, se ce l'ha
  const POSTO = io.dataset.casa === 'destra' ? 'destra' : 'sinistra';   // da che lato sta la linguetta

  /* ---- giocati di recente (li legge il catalogo) ---- */
  try {
    const k = 'piattaforma.recenti';
    let r = JSON.parse(localStorage.getItem(k)) || [];
    r = [{ id: ID, quando: Date.now() }].concat(r.filter(x => x.id !== ID)).slice(0, 12);
    localStorage.setItem(k, JSON.stringify(r));
  } catch (e) { /* senza memoria si gioca lo stesso */ }

  if ('serviceWorker' in navigator) navigator.serviceWorker.register(CASA + 'sw.js', { scope: CASA }).catch(() => {});

  /* ---- tasto per tornare al catalogo ---- */
  const stile = document.createElement('style');
  stile.textContent =
    /* una linguetta sul bordo, in alto rispetto ai pollici: al centro in alto i giochi hanno punteggio e nome del livello */
    '#pf-casa{position:fixed;z-index:2147483000;top:30%;width:26px;height:46px;border:0;padding:0 5px;background:rgba(11,15,26,.55);' +
    'opacity:.7;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}' +
    '#pf-casa:hover,#pf-casa:focus-visible{opacity:1}#pf-casa svg{display:block;width:100%;height:auto}' +
    '#pf-casa.sinistra{left:env(safe-area-inset-left,0px);border-radius:0 12px 12px 0}' +
    '#pf-casa.destra{right:env(safe-area-inset-right,0px);border-radius:12px 0 0 12px}' +
    '#pf-velo{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(6,9,18,.78);' +
    'font-family:ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;touch-action:manipulation}' +
    '#pf-velo[hidden]{display:none}' +
    '#pf-carta{background:#1c2540;color:#f4f1e6;border-radius:22px;padding:22px;width:100%;max-width:340px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
    '#pf-carta p{margin:0 0 16px;font-size:18px;font-weight:800;line-height:1.3}' +
    '#pf-carta button{display:block;width:100%;min-height:52px;border-radius:14px;border:0;font:inherit;font-size:17px;font-weight:900;cursor:pointer;margin-top:10px}' +
    '#pf-resta{background:#ffd24a;color:#0b0f1a}#pf-esci{background:#27325a;color:#f4f1e6}';
  document.head.appendChild(stile);

  const casa = document.createElement('button');
  casa.id = 'pf-casa'; casa.type = 'button'; casa.className = POSTO;
  casa.setAttribute('aria-label', 'Torna a ' + NOME);
  casa.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="5" y="5" width="25" height="25" rx="8" fill="#ffd24a"/><rect x="34" y="5" width="25" height="25" rx="8" fill="#ff7a59"/><rect x="5" y="34" width="25" height="25" rx="8" fill="#3ed6b5"/><rect x="34" y="34" width="25" height="25" rx="8" fill="#7aa2ff"/></svg>';

  const velo = document.createElement('div');
  velo.id = 'pf-velo'; velo.hidden = true; velo.setAttribute('role', 'dialog'); velo.setAttribute('aria-modal', 'true');
  velo.innerHTML = '<div id="pf-carta"><p></p><button type="button" id="pf-resta">Continua a giocare</button><button type="button" id="pf-esci"></button></div>';
  velo.querySelector('p').textContent = TITOLO ? 'Esci da «' + TITOLO + '»?' : 'Esci dal gioco?';
  velo.querySelector('#pf-esci').textContent = 'Torna a ' + NOME;

  /* quello che si tocca qui non deve arrivare al gioco (un tocco sul tasto non è uno sparo) */
  const ferma = e => e.stopPropagation();
  for (const el of [casa, velo]) for (const t of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'keydown', 'keyup'])
    el.addEventListener(t, ferma);

  function apri() {
    if (PAUSA) { const p = document.querySelector(PAUSA); if (p && p.offsetParent !== null) p.click(); }
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    velo.hidden = false; velo.querySelector('#pf-resta').focus();
  }
  casa.addEventListener('click', apri);
  velo.querySelector('#pf-resta').addEventListener('click', () => { velo.hidden = true; });
  velo.querySelector('#pf-esci').addEventListener('click', () => { location.href = CASA; });
  velo.addEventListener('click', e => { if (e.target === velo) velo.hidden = true; });

  function monta() { document.body.append(casa, velo); }
  if (document.body) monta(); else addEventListener('DOMContentLoaded', monta);

  window.Piattaforma = { gioco: ID, casa: CASA, tornaAlCatalogo: apri };
})();
