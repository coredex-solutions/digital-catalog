// New-order alerts, turned on per device (browsers only allow sound and notifications after the
// owner taps something), so the choice lives in localStorage:
// - in the open dashboard: a short chime and the count in the tab title;
// - push notifications (public/sw.js, lib/push) when the server has VAPID keys: they arrive even
//   when the dashboard is closed. On iPhone only once the dashboard is added to the Home Screen.
// Without push, a browser notification is shown from the open dashboard while it's in the background.

const key = (slug: string) => `order_alerts_${slug}`;

export function readAlertsSetting(slug: string): boolean {
  try {
    return localStorage.getItem(key(slug)) === "on";
  } catch {
    return false;
  }
}

export function saveAlertsSetting(slug: string, on: boolean) {
  try {
    if (on) localStorage.setItem(key(slug), "on");
    else localStorage.removeItem(key(slug));
  } catch {
    // Private mode or blocked storage: alerts stay on for this visit only
  }
}

let audio: AudioContext | null = null;

/** Create or wake the audio context. Works only during a tap, or after the page has had one. */
export function unlockSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio = audio ?? new Ctx();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    // No sound on this browser
  }
}

/**
 * Two short rising tones (no sound file to load). A new or sleeping audio context starts a moment
 * later, so wait for it; if the browser keeps it off (no tap yet), skip this chime rather than
 * playing it late on the next tap.
 */
export function playChime() {
  unlockSound();
  const ctx = audio;
  if (!ctx) return;
  const asked = Date.now();
  const play = () => {
    if (ctx.state === "running" && Date.now() - asked < 1500) tones(ctx);
  };
  if (ctx.state === "running") play();
  else ctx.resume().then(play, () => {});
}

function tones(ctx: AudioContext) {
  const start = ctx.currentTime + 0.02;
  [880, 1320].forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const at = start + index * 0.18;
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.35);
  });
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Ask once, during the tap that turns alerts on. Resolves to whether notifications may be shown. */
export async function askNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/** A system notification, only while the dashboard tab is in the background */
export function showOrderNotification(title: string, body: string, onOpen: () => void) {
  if (!notificationsSupported() || Notification.permission !== "granted" || document.visibilityState === "visible") return;
  try {
    const notification = new Notification(title, { body, tag: "coredex-new-order", icon: "/icon.svg" });
    notification.onclick = () => {
      window.focus();
      onOpen();
      notification.close();
    };
  } catch {
    // Some mobile browsers only allow notifications from a service worker
  }
}

/** "(3) Orders | Coredex" while there are new orders; the plain title otherwise */
export function titleWithCount(title: string, count: number): string {
  const plain = title.replace(/^\(\d+\+?\)\s*/, "");
  return count > 0 ? `(${count > 99 ? "99+" : count}) ${plain}` : plain;
}

// ---- Push (works when the dashboard is closed) ----

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
export type PushState = "on" | "off" | "unsupported" | "not_set_up" | "blocked" | "needs_home_screen" | "failed";

/** iPhone or iPad Safari not opened from the Home Screen: push isn't offered there */
export function needsHomeScreen(): boolean {
  if (typeof navigator === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && notificationsSupported();
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = (base64url + "===".slice((base64url.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

/** Is this device following this catalog's orders by push? (no prompts) */
export async function pushStatus(slug: string, fetcher: Fetcher): Promise<PushState> {
  if (!pushSupported()) return needsHomeScreen() ? "needs_home_screen" : "unsupported";
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    const res = await fetcher(`/api/c/${slug}/admin/push/?endpoint=${encodeURIComponent(sub?.endpoint ?? "")}`);
    if (!res.ok) return "failed";
    const data = await res.json();
    if (!data.enabled) return "not_set_up";
    return data.subscribed && Notification.permission === "granted" ? "on" : "off";
  } catch {
    return "failed";
  }
}

/** Call from a tap, after notification permission was asked: subscribe this device to new orders */
export async function enablePush(slug: string, fetcher: Fetcher, lang: "en" | "ar"): Promise<PushState> {
  if (!pushSupported()) return needsHomeScreen() ? "needs_home_screen" : "unsupported";
  if (Notification.permission !== "granted") return "blocked";
  try {
    const res = await fetcher(`/api/c/${slug}/admin/push/`);
    if (!res.ok) return "failed";
    const { enabled, publicKey } = await res.json();
    if (!enabled || !publicKey) return "not_set_up";
    const reg = await registration();
    let sub = await reg.pushManager.getSubscription();
    // A subscription made with another server key can't receive our messages: replace it
    const current = sub?.options.applicationServerKey;
    if (sub && current && btoa(String.fromCharCode(...new Uint8Array(current))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") !== publicKey.replace(/=+$/, "")) {
      await sub.unsubscribe();
      sub = null;
    }
    // The push service usually answers in a second or two; give up rather than wait forever
    sub =
      sub ??
      (await Promise.race([
        reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("push subscribe timed out")), 45000)),
      ]));
    const saved = await fetcher(`/api/c/${slug}/admin/push/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), lang }),
    });
    return saved.ok ? "on" : "failed";
  } catch {
    return "failed";
  }
}

/** Stop push for this catalog on this device (the browser subscription may serve other catalogs) */
export async function disablePush(slug: string, fetcher: Fetcher): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await fetcher(`/api/c/${slug}/admin/push/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {
    // Offline: the server drops the device later if it stops answering
  }
}
