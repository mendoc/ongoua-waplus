const version = "1.00.00";
const cacheName = "ongoua-waplus-" + version;
const assets = [
    "https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js",
    "https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js",
];

// install event
self.addEventListener("install", evt => {
    evt.waitUntil(
        caches.open(cacheName).then((cache) => {
            console.log("Enregistrement des assets dans le cache");
            cache.addAll(assets);
        })
    );
});

// activate event
self.addEventListener("activate", evt => {
    evt.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== cacheName)
                .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener("fetch", evt => {
    const url = new URL(evt.request.url);
    if (url.origin == location.origin) {
        switch (url.pathname) {
            case "/version":
                evt.respondWith(new Response(version));
                break;
        }
    } else {
        //console.log("Retour par défaut");
        evt.respondWith(fetch(evt.request));
    }
});