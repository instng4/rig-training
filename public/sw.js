// Empty service worker to prevent Clerk SSO issues
// This file intentionally does nothing
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Don't intercept any requests
self.addEventListener('fetch', () => {
  // Let all requests pass through to the network
});
