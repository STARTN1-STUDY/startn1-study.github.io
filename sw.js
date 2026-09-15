/* N1 19-09 -- service worker. Rede primeiro, cache como rede de seguranca.
   Cache-first serviria versao velha depois de um conserto; com prova em 11 dias
   isso e pior que uma ida a rede. */
var VERSAO = 'n1-e1e9b5a68b10';
var ESSENCIAIS = ['./', './index.html'].concat(["./imagens__anestesia-geral__mallampati.svg","./imagens__esofago-cirurgico__esofago-tercos-anatomia.svg"]);
var PRAZO = 3500;
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSAO).then(function(c){
    /* Um a um, NAO addAll: addAll e atomico e falta de um arquivo mataria o
       cache inteiro em silencio. */
    return Promise.all(ESSENCIAIS.map(function(u){
      return c.add(u).catch(function(){});
    }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return k === VERSAO ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var u; try { u = new URL(req.url); } catch(err){ return; }
  if (u.origin !== self.location.origin) return;
  var chave = new Request(u.origin + u.pathname, { method: 'GET' });
  e.respondWith(new Promise(function(resolve, reject){
    var pronto = false;
    var t = setTimeout(function(){ if (!pronto) reject(new Error('lenta')); }, PRAZO);
    fetch(req).then(function(r){ pronto = true; clearTimeout(t); resolve(r); },
                    function(err){ pronto = true; clearTimeout(t); reject(err); });
  }).then(function(r){
    if (r && r.ok){ var c = r.clone(); caches.open(VERSAO).then(function(k){ k.put(chave, c); }); }
    return r;
  }).catch(function(){
    return caches.match(chave).then(function(c){
      return c || caches.match('./index.html');
    });
  }));
});
