const CACHE_NAME = "qr-app-cache-v1.0.1";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/libs/html5-qrcode.min.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];



// 🟢 Installation → mettre les fichiers en cache
self.addEventListener("install", event => {
  console.log("📦 Service Worker installé");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
  return cache.addAll(FILES_TO_CACHE);
}).catch(err => {
  console.error("Erreur lors de l'ajout au cache :", err);
});

  );
  self.skipWaiting();
});

// 🟢 Activation → suppression des anciens caches si besoin
self.addEventListener("activate", event => {
  console.log("♻️ Service Worker activé");
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 🔁 Intercepter les requêtes → servir le cache d’abord
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
        .then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        })
        .catch(() => {
          // ⚠️ Optionnel : fallback si hors ligne
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
        });
    })
  );
});
