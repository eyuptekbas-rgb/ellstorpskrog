import { loadTerminalSettings } from "@/lib/rms/settings";

export type SoundProfile = "default" | "kitchen" | "pos" | "silent";

function canPlay(profile: SoundProfile) {
  const settings = loadTerminalSettings();
  if (!settings.soundEnabled || profile === "silent") return false;
  if (profile === "kitchen") return settings.kitchenSoundEnabled;
  if (profile === "pos") return settings.posSoundEnabled;
  return true;
}

function playTone(frequency: number, durationMs: number, volume = 0.15) {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + durationMs / 1000);
  window.setTimeout(() => void ctx.close(), durationMs + 100);
}

export function playKitchenAlertSound(profile: SoundProfile = "kitchen") {
  if (!canPlay(profile)) return;
  playTone(880, 120);
  window.setTimeout(() => playTone(660, 120), 140);
}

export function playOrderReadySound(profile: SoundProfile = "kitchen") {
  if (!canPlay(profile)) return;
  playTone(523, 100);
  window.setTimeout(() => playTone(784, 140), 120);
}

export function playPosAlertSound(profile: SoundProfile = "pos") {
  if (!canPlay(profile)) return;
  playTone(740, 90);
}
