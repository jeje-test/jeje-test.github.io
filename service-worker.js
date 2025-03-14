self.addEventListener("install", event => {
    event.waitUntil(
        caches.open("qr-cache").then(cache => {
            return cache.addAll([
                "index.html",
                "app.js",
                "style.css",
                "manifest.json",
                "libs/html5-qrcode.min.js"
            ]);
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
