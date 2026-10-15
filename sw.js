/* Service Worker — Levantamento técnico ThM
   Faz o app ABRIR sem internet (cacheia a casca do app). */
var CACHE = "levantamento-thm-v1";
var ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ARQUIVOS); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(chaves){
      return Promise.all(chaves.map(function(k){
        if(k!==CACHE) return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e){
  var url = e.request.url;
  // Nunca cacheia chamadas à API do Google (precisam de rede).
  if(url.indexOf("script.google.com")>=0 || url.indexOf("googleusercontent.com")>=0){
    return; // deixa ir direto à rede
  }
  // Estratégia: cache primeiro, rede como reserva (app abre offline).
  e.respondWith(
    caches.match(e.request).then(function(resp){
      return resp || fetch(e.request).then(function(r){
        return caches.open(CACHE).then(function(c){
          try{ c.put(e.request, r.clone()); }catch(err){}
          return r;
        });
      }).catch(function(){ return resp; });
    })
  );
});
