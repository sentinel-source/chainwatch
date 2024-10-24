importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'chainwatcher-cache-v58';
const urlsToCache = [
    '/',
    '/styles.css',
    '/app.js',
    '/background.png'
];

// Handle cache operations
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Optional: Handle messages from the client (like taking control of the SW)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'TAKE_CONTROL') {
        self.clients.claim();
    }
});
