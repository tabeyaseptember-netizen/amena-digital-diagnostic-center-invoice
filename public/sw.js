// ⚠️ ULTRA-STRICT SERVICE WORKER - NEVER DELETE DATA ⚠️
// This service worker is designed to NEVER delete any data under ANY circumstances
// Data persistence is the #1 priority

const CACHE_NAME = 'amena-diagnostic-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ⚠️ CRITICAL: DO NOT delete IndexedDB during install, activate, or update
// ⚠️ CRITICAL: DO NOT call caches.delete() automatically
// ⚠️ CRITICAL: DO NOT call skipWaiting() or clients.claim() automatically

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker - DATA WILL BE PRESERVED');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell - OLD CACHE PRESERVED');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
  
  // DO NOT call self.skipWaiting() - let user control when to update
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker - DATA REMAINS UNTOUCHED');
  
  // ⚠️ DO NOT DELETE OLD CACHES AUTOMATICALLY
  // ⚠️ DO NOT DELETE INDEXEDDB
  // ⚠️ DO NOT CLEAR ANY STORAGE
  
  event.waitUntil(
    Promise.resolve().then(() => {
      console.log('[SW] Service worker activated - All data preserved');
    })
  );
  
  // DO NOT call clients.claim() - let user control when to take over
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy for API calls, cache-first for assets
  const url = new URL(event.request.url);
  
  if (event.request.method !== 'GET') {
    // Don't cache non-GET requests
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Cache hit - return cached response
          return response;
        }
        
        // Not in cache - fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Network failed - return cached response if available
            return caches.match(event.request);
          });
      })
  );
});

// Message handler for manual cache clearing (user-initiated only)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] User requested immediate update');
    self.skipWait();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] User manually requested cache clear');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// Periodic background sync for auto-backup (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'auto-backup') {
    console.log('[SW] Performing background backup sync');
    // The app will handle the actual backup logic
  }
});

console.log('[SW] Service Worker loaded - Data persistence mode active');
