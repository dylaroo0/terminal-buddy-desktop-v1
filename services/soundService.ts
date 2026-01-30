class SoundService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;

  constructor() {}

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled && !this.ctx) {
        // Initialize context on enable if not already done
        this.getCtx(); 
    }
  }

  private getCtx() {
    if (!this.ctx && (typeof window !== 'undefined')) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctor) {
          this.ctx = new Ctor();
      }
    }
    return this.ctx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gainVal: number = 0.1) {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    
    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error(e));
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  playSend() {
    // A quick high-tech blip
    this.playTone(600, 'sine', 0.1, 0.05);
  }

  playSuccess() {
    // A pleasant ascending major 3rd
    if (!this.enabled) return;
    this.playTone(440, 'sine', 0.2, 0.05); // A4
    setTimeout(() => this.playTone(554.37, 'sine', 0.3, 0.05), 100); // C#5
  }

  playError() {
    // A discordant low buzz
    if (!this.enabled) return;
    this.playTone(150, 'sawtooth', 0.3, 0.05);
    setTimeout(() => this.playTone(140, 'sawtooth', 0.3, 0.05), 100);
  }

  playType() {
      // Very subtle click for typing (optional, can be annoying if too loud)
      // Keeping it disabled by default in logic for now, or very quiet
      // this.playTone(800, 'triangle', 0.03, 0.01);
  }
}

export const soundService = new SoundService();
