let audioContext: AudioContext | null = null;
let persistentInterval: number | null = null;
let persistentActive = false;

/** Pause between alert bursts while waiting for acceptance. */
const ALERT_INTERVAL_MS = 900;

export function unlockOrderAudio() {
  if (typeof window === "undefined") return;
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume();
  } catch {
    // Ignore — unlock is best-effort.
  }
}

function playOrderAlertBurst(vibrate = false) {
  if (typeof window === "undefined") return;
  audioContext ??= new AudioContext();
  const ctx = audioContext;
  void ctx.resume();

  const playTone = (
    frequency: number,
    start: number,
    duration: number,
    volume = 0.42
  ) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + start);
    oscillator.stop(ctx.currentTime + start + duration + 0.05);
  };

  playTone(880, 0, 0.16);
  playTone(1174.66, 0.18, 0.18);
  playTone(880, 0.38, 0.2);

  if (vibrate && typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([180, 90, 180, 90, 220]);
  }
}

/** POS: repeat alert until stopPersistentNewOrderAlert() is called. */
export function startPersistentNewOrderAlert() {
  if (typeof window === "undefined") return;
  if (persistentActive) return;

  try {
    persistentActive = true;
    playOrderAlertBurst(true);
    persistentInterval = window.setInterval(() => {
      try {
        playOrderAlertBurst(false);
      } catch {
        // Ignore repeat failures.
      }
    }, ALERT_INTERVAL_MS);
  } catch {
    persistentActive = false;
  }
}

export function stopPersistentNewOrderAlert() {
  persistentActive = false;
  if (persistentInterval !== null) {
    clearInterval(persistentInterval);
    persistentInterval = null;
  }
}

/** Admin: single alert burst (non-looping). */
export function playNewOrderSound() {
  try {
    unlockOrderAudio();
    playOrderAlertBurst(true);
  } catch {
    // Audio may be blocked until user gesture — fail silently.
  }
}
