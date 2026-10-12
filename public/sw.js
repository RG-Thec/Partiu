// ==============================================================================
// 🔔 PARTIU SERVICE WORKER — WEB PUSH NOTIFICATIONS & OFFLINE CACHE
// ==============================================================================

const CACHE_NAME = "partiu-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/favicon.ico",
        "/icon-192.png",
        "/icon-512.png",
        "/apple-touch-icon.png",
        "/manifest.json",
      ]);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Manipulador de Push Notifications recebidas em segundo plano
self.addEventListener("push", (event) => {
  let data = {
    title: "PARTIU • Viagem & Entregas",
    body: "Seu motorista parceiro está a caminho do ponto de embarque!",
    url: "/app/bilhetes",
    icon: "/icon-192.png",
    tag: "partiu-ride-alert",
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || "/app/bilhetes",
    },
    tag: data.tag || "partiu-alert",
    renotify: true,
    actions: [
      { action: "ver_corrida", title: "Ver Corrida / Entrega" },
      { action: "fechar", title: "Entendido" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Clique na notificação abre o app no bilhete / tela correta
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "fechar") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/app/bilhetes";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }),
  );
});

// Interceptador Fetch para contingência offline de navegação PWA
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Ignora chamadas diretas ao Supabase, Mapbox ou rotas de API/Webhook
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("mapbox.com") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Estratégia Network-First com Fallback de Cache para navegação
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        return cached || (await cache.match("/manifest.json"));
      }),
    );
    return;
  }

  // Estratégia Stale-While-Revalidate para recursos estáticos do próprio domínio
  if (
    url.origin === self.location.origin &&
    (url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".ico") ||
      url.pathname.endsWith(".woff2"))
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      }),
    );
  }
});
