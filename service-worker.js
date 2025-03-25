const CACHE_NAME = "qr-app-cache-v1.3.0";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./libs/html5-qrcode.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// 📦 Installation → cache les fichiers essentiels
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installé");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        FILES_TO_CACHE.map((file) =>
          fetch(file)
            .then((response) => {
              if (!response.ok) throw new Error(`${file} : ${response.status}`);
              return cache.put(file, response);
            })
            .catch((err) => {
              console.warn(`⚠️ ${file} non mis en cache :`, err.message);
            })
        )
      );
    })
  );

  self.skipWaiting(); // Activation immédiate
});

// ♻️ Activation → nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  console.log("♻️ Activation du Service Worker");

  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );

  self.clients.claim(); // Contrôle immédiat des pages
});

// 🔁 Fetch → servir depuis le cache ou recharger et mettre en cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request)
          .then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            if (event.request.destination === "document") {
              return caches.match("./index.html");
            }
          })
      );
    })
  );
});
