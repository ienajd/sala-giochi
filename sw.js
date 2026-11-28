/* Funzionamento senza connessione. monta.py scrive qui sotto la versione e l'elenco dei file a ogni montaggio:
   quando cambia la versione il telefono scarica tutto di nuovo e butta la copia vecchia. */
const VERSIONE = '7f4cfe0769';
const FILE = ["./", "app.webmanifest", "catalogo.js", "giochi/arenzano-liberi-tutti/copertina.jpg", "giochi/arenzano-liberi-tutti/", "giochi/labirinti-spaziali/copertina.jpg", "giochi/labirinti-spaziali/icon-180.png", "giochi/labirinti-spaziali/icon-192.png", "giochi/labirinti-spaziali/icon-512.png", "giochi/labirinti-spaziali/", "giochi/labirinti-spaziali/manifest.json", "giochi/labirinto-laser/copertina.jpg", "giochi/labirinto-laser/icona.png", "giochi/labirinto-laser/", "giochi/labirinto-laser/manifest.json", "giochi/occhio-alla-lava/copertina.jpg", "giochi/occhio-alla-lava/", "giochi/ottava-taglia/copertina.jpg", "giochi/ottava-taglia/icona.png", "giochi/ottava-taglia/", "giochi/sbuca/copertina.jpg", "giochi/sbuca/icona.png", "giochi/sbuca/", "giochi/sbuca/manifest.json", "giochi/sette-taglie/copertina.jpg", "giochi/sette-taglie/icona.png", "giochi/sette-taglie/", "giochi/tana-del-luppolo/copertina.jpg", "giochi/tana-del-luppolo/dati.js", "giochi/tana-del-luppolo/disegno.js", "giochi/tana-del-luppolo/gioco.js", "giochi/tana-del-luppolo/icona.png", "giochi/tana-del-luppolo/", "giochi/zuffa-in-cortile/copertina.jpg", "giochi/zuffa-in-cortile/", "icone/icona-180.png", "icone/icona-192.png", "icone/icona-512.png", "icone/icona.svg", "piattaforma.js", "stile.css"];
const DEPOSITO = 'piattaforma-' + VERSIONE;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const d = await caches.open(DEPOSITO);
    /* un file che non si scarica non deve bloccare tutto il resto */
    await Promise.all(FILE.map(f => d.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const n of await caches.keys()) if (n.startsWith('piattaforma-') && n !== DEPOSITO) await caches.delete(n);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const nostro = new URL(r.url).origin === location.origin;
  e.respondWith((async () => {
    const d = await caches.open(DEPOSITO);
    /* le pagine si prendono dalla rete, così un aggiornamento si vede subito; senza rete, dalla copia */
    if (r.mode === 'navigate') {
      try { const fresca = await fetch(r); if (fresca.ok) d.put(r, fresca.clone()); return fresca; }
      catch (err) { return (await d.match(r, { ignoreSearch: true })) || (await d.match('./')) || Response.error(); }
    }
    const copia = await d.match(r);
    if (copia) return copia;
    /* il resto (anche caratteri e librerie presi da altri siti) si tiene da parte alla prima richiesta */
    const fresca = await fetch(r);
    if (fresca.ok || (!nostro && fresca.type === 'opaque')) d.put(r, fresca.clone()).catch(() => {});
    return fresca;
  })());
});
