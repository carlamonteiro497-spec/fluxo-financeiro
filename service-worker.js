const CACHE_NAME = 'fluxo-financeiro-v1';
const urlsToCache = [
  '/',
  '/fluxo-integrado-final.html',
  '/manifest.json'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Cache addAll error:', err);
        // Continue mesmo se alguns recursos não estiverem disponíveis
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: tenta rede primeiro, depois cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, armazenar em cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Se falhar, tentar pegar do cache
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - conteúdo não disponível', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Lidar com mensagens push do Firebase
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);

  if (event.data) {
    try {
      const data = event.data.json();
      const notificationTitle = data.notification.title || 'Fluxo Financeiro';
      const notificationOptions = {
        body: data.notification.body || 'Nova notificação',
        icon: '💰',
        badge: '💰',
        tag: 'fluxo-notificacao',
        data: data.data || {}
      };

      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    } catch (error) {
      console.log('Erro ao processar push:', error);
    }
  }
});

// Lidar com clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Notificação de update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
