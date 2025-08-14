/**
 * Service Worker pour SkillForge AI
 * Fonctionnalités: Cache intelligent, mode offline, sync background, notifications push
 */

const CACHE_NAME = 'skillforge-v1.2';
const STATIC_CACHE = 'skillforge-static-v1.2';
const DYNAMIC_CACHE = 'skillforge-dynamic-v1.2';
const API_CACHE = 'skillforge-api-v1.2';

// Assets critiques à mettre en cache
const CRITICAL_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/_next/static/css/app/globals.css',
  '/fonts/inter.woff2',
  '/fonts/space-grotesk.woff2'
];

// Pages à pré-cacher
const PAGES_TO_CACHE = [
  '/',
  '/daily-challenge',
  '/skills',
  '/profile',
  '/offline'
];

// APIs à mettre en cache avec stratégies spécifiques
const API_CACHE_STRATEGIES = {
  '/api/quiz': { strategy: 'networkFirst', maxAge: 300000 }, // 5 min
  '/api/user': { strategy: 'staleWhileRevalidate', maxAge: 600000 }, // 10 min
  '/api/progress': { strategy: 'networkFirst', maxAge: 60000 }, // 1 min
  '/api/leaderboard': { strategy: 'staleWhileRevalidate', maxAge: 900000 } // 15 min
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        // Cache des assets critiques
        const staticCache = await caches.open(STATIC_CACHE);
        await staticCache.addAll(CRITICAL_ASSETS);
        
        // Cache des pages importantes
        const dynamicCache = await caches.open(DYNAMIC_CACHE);
        await Promise.allSettled(
          PAGES_TO_CACHE.map(page => 
            dynamicCache.add(page).catch(err => 
              console.warn(`Failed to cache ${page}:`, err)
            )
          )
        );
        
        console.log('✅ Service Worker: Installation completed');
        
        // Force l'activation immédiate
        await self.skipWaiting();
      } catch (error) {
        console.error('❌ Service Worker: Installation failed', error);
      }
    })()
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Nettoyage des anciens caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.includes('skillforge') && 
          !name.includes('v1.2')
        );
        
        await Promise.all(
          oldCaches.map(cacheName => {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        // Prendre contrôle immédiatement
        await self.clients.claim();
        
        console.log('✅ Service Worker: Activation completed');
      } catch (error) {
        console.error('❌ Service Worker: Activation failed', error);
      }
    })()
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP
  if (!url.protocol.startsWith('http')) return;
  
  // Stratégie de cache basée sur le type de requête
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (request.destination === 'document') {
    event.respondWith(handlePageRequest(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

/**
 * Gestion des requêtes API avec stratégies de cache intelligentes
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const strategy = getAPIStrategy(url.pathname);
  
  try {
    switch (strategy.strategy) {
      case 'networkFirst':
        return await networkFirstStrategy(request, API_CACHE, strategy.maxAge);
      case 'cacheFirst':
        return await cacheFirstStrategy(request, API_CACHE, strategy.maxAge);
      case 'staleWhileRevalidate':
        return await staleWhileRevalidateStrategy(request, API_CACHE, strategy.maxAge);
      default:
        return await networkFirstStrategy(request, API_CACHE, strategy.maxAge);
    }
  } catch (error) {
    console.warn('API request failed:', error);
    return new Response(JSON.stringify({ 
      error: 'Service temporairement indisponible',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Gestion des requêtes de pages
 */
async function handlePageRequest(request) {
  try {
    // Essayer le réseau en premier
    const networkResponse = await fetch(request);
    
    // Mettre en cache la réponse si elle est valide
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback vers le cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Page offline par défaut
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Réponse d'urgence
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SkillForge - Hors Ligne</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui; 
              text-align: center; 
              padding: 2rem; 
              background: #0F172A; 
              color: white; 
            }
            .container { 
              max-width: 400px; 
              margin: 0 auto; 
            }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
            .title { font-size: 1.5rem; margin-bottom: 1rem; }
            .message { opacity: 0.8; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1 class="title">SkillForge AI</h1>
            <p class="message">
              Vous êtes actuellement hors ligne. 
              Reconnectez-vous à Internet pour continuer votre apprentissage.
            </p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

/**
 * Gestion des requêtes d'images avec cache optimisé
 */
async function handleImageRequest(request) {
  return await cacheFirstStrategy(request, STATIC_CACHE, 86400000); // 24h
}

/**
 * Gestion des assets statiques
 */
async function handleStaticRequest(request) {
  return await cacheFirstStrategy(request, STATIC_CACHE, 604800000); // 7 jours
}

/**
 * Stratégies de mise en cache
 */

// Network First: Réseau en priorité, cache en fallback
async function networkFirstStrategy(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      
      // Ajouter timestamp pour expiration
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await getCachedResponse(request, cacheName, maxAge);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

// Cache First: Cache en priorité, réseau en fallback
async function cacheFirstStrategy(request, cacheName, maxAge) {
  const cachedResponse = await getCachedResponse(request, cacheName, maxAge);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw new Error(`Network and cache both failed for ${request.url}`);
  }
}

// Stale While Revalidate: Cache immédiat + mise à jour en arrière-plan
async function staleWhileRevalidateStrategy(request, cacheName, maxAge) {
  const cachedResponse = await getCachedResponse(request, cacheName, maxAge);
  
  // Mise à jour en arrière-plan
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => {});
  
  return cachedResponse || await networkPromise;
}

/**
 * Récupérer une réponse cachée avec vérification d'expiration
 */
async function getCachedResponse(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) return null;
  
  // Vérifier l'expiration si maxAge est défini
  if (maxAge) {
    const cachedAt = cachedResponse.headers.get('sw-cached-at');
    if (cachedAt && Date.now() - parseInt(cachedAt) > maxAge) {
      cache.delete(request);
      return null;
    }
  }
  
  return cachedResponse;
}

/**
 * Obtenir la stratégie de cache pour une API
 */
function getAPIStrategy(pathname) {
  for (const [pattern, strategy] of Object.entries(API_CACHE_STRATEGIES)) {
    if (pathname.includes(pattern)) {
      return strategy;
    }
  }
  
  return { strategy: 'networkFirst', maxAge: 300000 }; // Défaut: 5 min
}

// Background Sync pour les actions différées
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'background-sync-progress') {
    event.waitUntil(syncUserProgress());
  } else if (event.tag === 'background-sync-quiz-results') {
    event.waitUntil(syncQuizResults());
  }
});

/**
 * Synchronisation de la progression utilisateur
 */
async function syncUserProgress() {
  try {
    const progressData = await getStoredProgressData();
    
    if (progressData.length === 0) return;
    
    for (const progress of progressData) {
      const response = await fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });
      
      if (response.ok) {
        await removeStoredProgressData(progress.id);
        console.log('✅ Progress synced:', progress.id);
      }
    }
  } catch (error) {
    console.error('❌ Progress sync failed:', error);
  }
}

/**
 * Synchronisation des résultats de quiz
 */
async function syncQuizResults() {
  try {
    const quizData = await getStoredQuizData();
    
    if (quizData.length === 0) return;
    
    for (const quiz of quizData) {
      const response = await fetch('/api/quiz/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz)
      });
      
      if (response.ok) {
        await removeStoredQuizData(quiz.id);
        console.log('✅ Quiz result synced:', quiz.id);
      }
    }
  } catch (error) {
    console.error('❌ Quiz sync failed:', error);
  }
}

// Notifications Push
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nouveau contenu disponible !',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: data.image,
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Ouvrir',
          icon: '/icons/open-24x24.png'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/icons/close-24x24.png'
        }
      ],
      requireInteraction: data.requireInteraction || false,
      silent: false,
      timestamp: Date.now()
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'SkillForge AI', options)
    );
    
    // Analytics de notification
    trackNotificationEvent('received', data);
    
  } catch (error) {
    console.error('❌ Push notification error:', error);
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, data } = event;
  const url = data?.url || '/';
  
  event.waitUntil(
    (async () => {
      try {
        // Trouver ou ouvrir une fenêtre
        const windowClients = await clients.matchAll({ type: 'window' });
        const existingClient = windowClients.find(client => 
          client.url.includes(self.location.origin)
        );
        
        if (action === 'open' || !action) {
          if (existingClient && existingClient.focus) {
            await existingClient.focus();
            existingClient.postMessage({ type: 'NAVIGATE', url });
          } else {
            await clients.openWindow(url);
          }
        }
        
        // Analytics de clic
        trackNotificationEvent('clicked', { action, url });
        
      } catch (error) {
        console.error('❌ Notification click error:', error);
      }
    })()
  );
});

/**
 * Fonctions utilitaires pour le stockage local
 */
async function getStoredProgressData() {
  // Implémentation avec IndexedDB
  return []; // Placeholder
}

async function removeStoredProgressData(id) {
  // Implémentation avec IndexedDB
}

async function getStoredQuizData() {
  // Implémentation avec IndexedDB
  return []; // Placeholder
}

async function removeStoredQuizData(id) {
  // Implémentation avec IndexedDB
}

/**
 * Analytics pour les notifications
 */
function trackNotificationEvent(event, data) {
  // Envoyer à votre service d'analytics
  fetch('/api/analytics/notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      data,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    })
  }).catch(() => {}); // Ignorer les erreurs d'analytics
}

console.log('✅ Service Worker: Loaded and ready');