// New-order alerts in the open dashboard: a short chime, a browser notification while the tab is
// in the background, and the count in the tab title. Turned on per device (browsers only allow
// sound and notifications after the owner taps something), so the choice lives in localStorage.
// There is no push: alerts only come while a dashboard tab is open.

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
