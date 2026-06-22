let audioContext: AudioContext | null = null;

export function playNewReservationSound() {
  try {
    if (typeof window === "undefined") return;
    audioContext ??= new AudioContext();
    const ctx = audioContext;

    const playTone = (frequency: number, start: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + start);
      oscillator.stop(ctx.currentTime + start + duration + 0.05);
    };

    void ctx.resume();
    playTone(659.25, 0, 0.16);
    playTone(783.99, 0.18, 0.2);
    playTone(987.77, 0.4, 0.24);
  } catch {
    // Audio may be blocked until user gesture — fail silently.
  }
}
