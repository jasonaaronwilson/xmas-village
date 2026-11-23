  // =========================================================================
  // 4. WEB AUDIO COZY AMBIANCE
  // =========================================================================
  const audio = {
    ctx: null, master: null, windGain: null, fireGain: null, chimeTimer: 0,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.0;
      this.master.connect(this.ctx.destination);

      const bufSize = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029;
        b1 = 0.985 * b1 + w * 0.032;
        b2 = 0.950 * b2 + w * 0.048;
        data[i] = (b0 + b1 + b2 + w * 0.05) * 0.4;
      }

      const windSrc = this.ctx.createBufferSource();
      windSrc.buffer = buf; windSrc.loop = true;
      const wf = this.ctx.createBiquadFilter();
      wf.type = 'lowpass'; wf.frequency.value = 340;
      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.12;
      windSrc.connect(wf); wf.connect(this.windGain); this.windGain.connect(this.master);
      windSrc.start();

      const fireSrc = this.ctx.createBufferSource();
      fireSrc.buffer = buf; fireSrc.loop = true;
      const ff = this.ctx.createBiquadFilter();
      ff.type = 'bandpass'; ff.frequency.value = 1400; ff.Q.value = 1.8;
      this.fireGain = this.ctx.createGain();
      this.fireGain.gain.value = 0.0;
      fireSrc.connect(ff); ff.connect(this.fireGain); this.fireGain.connect(this.master);
      fireSrc.start();
    },
    setEnabled(on) {
      if (on) this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.master.gain.setTargetAtTime(on ? 0.55 : 0.0, this.ctx.currentTime, 0.2);
    },
    playClick(freq = 520) {
      if (!state.audioEnabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, this.ctx.currentTime + 0.06);
      g.gain.setValueAtTime(0.08, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
      osc.connect(g); g.connect(this.master);
      osc.start(); osc.stop(this.ctx.currentTime + 0.08);
    },
    playChime() {
      if (!state.audioEnabled || !this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 880.0, 987.77, 1174.66];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], this.ctx.currentTime);
      g.gain.setValueAtTime(0.001, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0005, this.ctx.currentTime + 1.6);
      osc.connect(g); g.connect(this.master);
      osc.start(); osc.stop(this.ctx.currentTime + 1.7);
    },
    updateAmbiance(dt) {
      if (!state.audioEnabled || !this.ctx) return;
      this.windGain.gain.setTargetAtTime(state.snowMode ? (0.1 + state.snowLevel * 0.12) : 0.08, this.ctx.currentTime, 0.5);
      const fireCount = state.objects.filter(o => o.fireplace || o.type === 'bonfire').length;
      this.fireGain.gain.setTargetAtTime(Math.min(0.28, fireCount * 0.035), this.ctx.currentTime, 0.5);
      this.chimeTimer -= dt;
      if (this.chimeTimer <= 0) { this.playChime(); this.chimeTimer = 3.5 + Math.random() * 5.0; }
    }
  };

