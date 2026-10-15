/* Service Worker — Levantamento técnico ThM
   v2 — "rede primeiro" para abrir o app sempre atualizado quando há internet,
   e usar a cópia guardada quando está offline. */
var CACHE = "levantamento-thm-v2";
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
        if(k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  var url = req.url;

  // Nunca intercepta as chamadas à API do Google (precisam sempre de rede).
  if(url.indexOf("script.google.com") >= 0 || url.indexOf("googleusercontent.com") >= 0){
    return;
  }

  // Abrir o app (navegação): REDE PRIMEIRO, cache como reserva (offline).
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(function(r){
        return caches.open(CACHE).then(function(c){
          try{ c.put("./index.html", r.clone()); }catch(err){}
          return r;
        });
      }).catch(function(){
        return caches.match("./index.html").then(function(m){ return m || caches.match("./"); });
      })
    );
    return;
  }

  // Demais arquivos (ícones, manifest): cache primeiro, rede como reserva.
  e.respondWith(
    caches.match(req).then(function(resp){
      return resp || fetch(req).then(function(r){
        return caches.open(CACHE).then(function(c){
          try{ c.put(req, r.clone()); }catch(err){}
          return r;
        });
      }).catch(function(){ return resp; });
    })
  );
});
