// Minimal service worker: only exists to receive push events for reminders (see ../src/push.ts).
self.addEventListener("push", (event) => {
  let data = { title: "Meglio", body: "" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // Ignore a malformed payload rather than crashing the worker.
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Meglio", {
      body: data.body || "",
      tag: "meglio-reminder",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((all) => {
      for (const client of all) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    }),
  );
});
