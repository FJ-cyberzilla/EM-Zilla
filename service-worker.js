// EM-Zilla - Service Worker
const CACHE_NAME = 'EM-Zilla-v2.1.0';
const API_CACHE_NAME = 'EM-Zilla-api-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/vita-theme.css',
  '/css/responsive.css',
  '/css/mobile.css',
  '/js/app.js',
  '/js/ui-manager.js',
  '/js/code-generator.js',
  '/js/file-manager.js',
  '/js/examples.js',
  '/js/arduino-detector.js',
  '/js/pin-configurator.js',
  '/js/usb-detector.js',
  '/js/termux-bridge.js',
  '/js/mobile-adapter.js',
  '/modules/arduino-templates.js',
  '/modules/syntax-highlighter.js',
  '/modules/ai-service.js',
  '/modules/nlp-processor.js',
  '/modules/code-analyzer.js',
  '/modules/error-checker.js',
  '/modules/troubleshooting.js',
  '/modules/real-time-compiler.js',
  '/modules/code-optimizer.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔄 EM-Zilla Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🎯 VitaCoder Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Chrome extensions
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Handle API requests differently
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('ai-service')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle static asset requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            // Cache new requests
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallback for failed requests
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            return new Response('Offline - VitaCoder Pro', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Special handling for API requests
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first for API calls
    const networkResponse = await fetch(request);
    
    // Cache successful API responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline message for API calls
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'VitaCoder Pro is offline. Please check your connection.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync for code saving
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-save') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // This would save unsaved code when connection is restored
  console.log('💾 Performing background sync...');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'VitaCoder Pro Notification',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/badge-72.png',
    tag: data.tag || 'vita-coder-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open VitaCoder'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'VitaCoder Pro', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === self.location.origin && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});
