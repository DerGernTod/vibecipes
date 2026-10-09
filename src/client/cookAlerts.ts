// Timer completion alerts. Browsers only allow audio after a user gesture, so `primeCookAlerts`
// must run from a click (starting a timer or the cook session). Later alerts reuse that context.

let audioContext: AudioContext | null = null;

/** Call from a user gesture: creates and resumes the audio context and asks for notification permission. */
export function primeCookAlerts(): void {
  try {
    if (!audioContext && 'AudioContext' in window) audioContext = new window.AudioContext();
    void audioContext?.resume();
  } catch {
    // Audio is optional; the visible countdown still reports completion.
  }
  if ('Notification' in window && Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

/** Three short two-note bursts, synthesised so no audio asset ships with the app. */
function playChime(): void {
  const ctx = audioContext;
  if (!ctx || ctx.state !== 'running') return;
  const start = ctx.currentTime;
  for (let burst = 0; burst < 3; burst++) {
    [988, 1319].forEach((frequency, note) => {
      const at = start + burst * 0.7 + note * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.55);
    });
  }
}

/** Plays the chime and, when permitted, a system notification. */
export function alertTimersFinished(title: string, body: string): void {
  playChime();
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, tag: 'vibecipes-cook-timer' });
  }
}
