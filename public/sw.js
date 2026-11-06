// Core Commerce service worker: shows new-order notifications sent by the server (lib/push), and opens
// the Orders page when one is tapped. It does not cache or intercept pages.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Core Commerce";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag || "coredex-order",
      renotify: true,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url: data.url || "/login/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/login/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // An open tab of the same dashboard: bring it forward on the Orders page
      const dashboard = url.replace(/orders\/$/, "");
      const open = windows.find((client) => client.url.startsWith(dashboard));
      if (open) {
        await open.focus();
        if ("navigate" in open && !open.url.startsWith(url)) await open.navigate(url).catch(() => {});
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
