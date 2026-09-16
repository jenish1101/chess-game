type SoundName = 'select' | 'move' | 'capture' | 'check' | 'start' | 'win' | 'end';

class ChessSound {
  private context: AudioContext | null = null;

  play(name: SoundName, enabled: boolean) {
    if (!enabled) return;
    try {
      if (!this.context) this.context = new AudioContext();
      const context = this.context;
      if (context.state === 'suspended') void context.resume().catch(() => undefined);
      const now = context.currentTime;
      const tone = (frequency: number, delay: number, duration: number, gain: number, type: OscillatorType = 'sine') => {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now + delay);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.7, now + delay + duration);
        envelope.gain.setValueAtTime(0.001, now + delay);
        envelope.gain.exponentialRampToValueAtTime(gain, now + delay + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
        oscillator.connect(envelope);
        envelope.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
        oscillator.start(now + delay);
        oscillator.stop(now + delay + duration + 0.01);
      };
      if (name === 'select') tone(650, 0, 0.055, 0.035);
      if (name === 'move') { tone(360, 0, 0.075, 0.14, 'triangle'); tone(155, 0.012, 0.09, 0.12); }
      if (name === 'capture') { tone(170, 0, 0.13, 0.22, 'triangle'); tone(710, 0.035, 0.14, 0.07); tone(1065, 0.09, 0.2, 0.055); }
      if (name === 'check') { tone(440, 0, 0.17, 0.09, 'triangle'); tone(554, 0.11, 0.24, 0.08); }
      if (name === 'start') [330, 440, 660].forEach((note, i) => tone(note, i * 0.065, 0.24, 0.065));
      if (name === 'win') [392, 494, 587, 784, 988].forEach((note, i) => tone(note, i * 0.1, 0.45, 0.065));
      if (name === 'end') [440, 349, 294].forEach((note, i) => tone(note, i * 0.11, 0.3, 0.055));
    } catch { /* Audio is optional when a browser blocks or does not support it. */ }
  }
}

export const chessSound = new ChessSound();