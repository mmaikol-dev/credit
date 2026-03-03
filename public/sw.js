const STATIC_CACHE = 'buzzpay-static-v1';
const RUNTIME_CACHE = 'buzzpay-runtime-v1';

const CORE_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.webmanifest',
    '/favicon.ico',
    '/favicon.svg',
    '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS)),
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter(
                            (key) =>
                                key !== STATIC_CACHE && key !== RUNTIME_CACHE,
                        )
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches
                        .open(RUNTIME_CACHE)
                        .then((cache) => cache.put(request, responseClone));
                    return response;
                })
                .catch(async () => {
                    const runtimeCache = await caches.open(RUNTIME_CACHE);
                    const cachedPage = await runtimeCache.match(request);
                    if (cachedPage) {
                        return cachedPage;
                    }

                    const staticCache = await caches.open(STATIC_CACHE);
                    return (
                        (await staticCache.match('/offline.html')) ||
                        Response.error()
                    );
                }),
        );
        return;
    }

    const isStaticAsset = ['style', 'script', 'font', 'image'].includes(
        request.destination,
    );

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    fetch(request)
                        .then((response) =>
                            caches
                                .open(RUNTIME_CACHE)
                                .then((cache) => cache.put(request, response)),
                        )
                        .catch(() => {});
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    const responseClone = response.clone();
                    caches
                        .open(RUNTIME_CACHE)
                        .then((cache) => cache.put(request, responseClone));
                    return response;
                });
            }),
        );
    }
});
