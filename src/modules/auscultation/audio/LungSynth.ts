/**
 * LungSynth: Generates respiratory sounds using Web Audio API synthesis.
 */
export class LungSynth {
  /**
   * Schedules a single 4-second respiration cycle (Inspiration + Expiration) at a specific time.
   */
  static scheduleRespirationCycle(
    ctx: AudioContext,
    time: number,
    isPathological: boolean,
    type: string,
    destination: AudioNode
  ): void {
    const cycleDuration = 4.0;

    // Create noise source for normal breath airflow
    const bufferSize = ctx.sampleRate * cycleDuration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink-ish noise (softer than white noise)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // normalise
      b6 = white * 0.115926;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Airflow lowpass filter (normal vesicular murmur is low pitched and rustling, ~240Hz)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(240, time);

    // Respiration envelope gain
    const respGain = ctx.createGain();
    respGain.gain.setValueAtTime(0.001, time);

    // 1. Inspiration (Crescendo up to 1.8s)
    respGain.gain.linearRampToValueAtTime(0.70, time + 1.8);
    // Transition/Brief pause
    respGain.gain.linearRampToValueAtTime(0.04, time + 2.0);
    // 2. Expiration (Decrescendo from 2.0s to 3.6s, quieter)
    lowpass.frequency.setValueAtTime(180, time + 2.0); // lower frequency in expiration
    respGain.gain.linearRampToValueAtTime(0.28, time + 2.4);
    respGain.gain.exponentialRampToValueAtTime(0.001, time + 3.7);

    noiseNode.connect(lowpass);
    lowpass.connect(respGain);
    respGain.connect(destination);

    noiseNode.start(time);
    noiseNode.stop(time + cycleDuration);

    // 3. Pathological Sounds Integration
    if (isPathological) {
      // Crackles (Crepitantes) -> Late inspiration clicks (liquid in alveoli)
      if (type.includes('inf_izq') || type.includes('sup_izq')) {
        const crackleStart = 1.1;
        const crackleEnd = 1.8;
        const count = 10;

        for (let i = 0; i < count; i++) {
          const delay = crackleStart + ((crackleEnd - crackleStart) / count) * i + Math.random() * 0.04;
          const crackleTime = time + delay;

          const clickOsc = ctx.createOscillator();
          const clickGain = ctx.createGain();
          const highpassFilter = ctx.createBiquadFilter();

          // High-pitched click base frequency
          clickOsc.frequency.setValueAtTime(1400 + Math.random() * 400, crackleTime);
          // Rapid pitch decay sweep to mimic sudden alveolar opening pop
          clickOsc.frequency.exponentialRampToValueAtTime(300, crackleTime + 0.012);

          highpassFilter.type = 'highpass';
          highpassFilter.frequency.setValueAtTime(700, crackleTime);
          highpassFilter.Q.setValueAtTime(1.5, crackleTime);

          clickGain.gain.setValueAtTime(0.001, crackleTime);
          clickGain.gain.linearRampToValueAtTime(0.22, crackleTime + 0.002);
          clickGain.gain.exponentialRampToValueAtTime(0.001, crackleTime + 0.012);

          clickOsc.connect(highpassFilter);
          highpassFilter.connect(clickGain);
          clickGain.connect(destination);

          clickOsc.start(crackleTime);
          clickOsc.stop(crackleTime + 0.02);
        }
      }
      // Sibilancias (Wheezes) -> Espiratory musical whistle (bronchospasm)
      else if (type.includes('sup_der')) {
        const wheezeStart = time + 2.2;
        const oscW1 = ctx.createOscillator();
        const oscW2 = ctx.createOscillator();
        const wheezeGain = ctx.createGain();
        const bandpassFilter = ctx.createBiquadFilter();

        // Dynamic LFO to create realistic airway flutter / vibrato
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        lfo.frequency.setValueAtTime(6.5, wheezeStart); // 6.5 Hz vibrato flutter
        lfoGain.gain.setValueAtTime(18, wheezeStart); // 18 Hz pitch modulation depth

        lfo.connect(lfoGain);
        lfoGain.connect(oscW1.frequency);
        lfoGain.connect(oscW2.frequency);

        // Musical frequencies (narrowed airways whistling)
        oscW1.frequency.setValueAtTime(560, wheezeStart);
        oscW2.frequency.setValueAtTime(680, wheezeStart);

        bandpassFilter.type = 'bandpass';
        bandpassFilter.frequency.setValueAtTime(620, wheezeStart);
        bandpassFilter.Q.setValueAtTime(2.2, wheezeStart);

        wheezeGain.gain.setValueAtTime(0.001, wheezeStart);
        // Exponential volume envelope matching airflow speed during expiration
        wheezeGain.gain.linearRampToValueAtTime(0.12, wheezeStart + 0.3);
        wheezeGain.gain.setValueAtTime(0.12, wheezeStart + 0.8);
        wheezeGain.gain.exponentialRampToValueAtTime(0.001, wheezeStart + 1.4);

        oscW1.connect(bandpassFilter);
        oscW2.connect(bandpassFilter);
        bandpassFilter.connect(wheezeGain);
        wheezeGain.connect(destination);

        lfo.start(wheezeStart);
        oscW1.start(wheezeStart);
        oscW2.start(wheezeStart);

        lfo.stop(wheezeStart + 1.5);
        oscW1.stop(wheezeStart + 1.5);
        oscW2.stop(wheezeStart + 1.5);
      }
      // Roncus (Rhonchi) -> Snoring low-frequency rumble (secretions in large airways)
      else if (type.includes('inf_der')) {
        const oscR = ctx.createOscillator();
        oscR.type = 'sawtooth';
        oscR.frequency.setValueAtTime(115, time);

        const filterR = ctx.createBiquadFilter();
        filterR.type = 'lowpass';
        filterR.frequency.setValueAtTime(180, time);

        const rGain = ctx.createGain();
        rGain.gain.setValueAtTime(0.001, time);

        // Modulated throughout the breath cycle
        rGain.gain.linearRampToValueAtTime(0.07, time + 1.2);
        rGain.gain.linearRampToValueAtTime(0.02, time + 2.0);
        rGain.gain.linearRampToValueAtTime(0.06, time + 2.8);
        rGain.gain.exponentialRampToValueAtTime(0.001, time + 3.8);

        oscR.connect(filterR);
        filterR.connect(rGain);
        rGain.connect(destination);

        oscR.start(time);
        oscR.stop(time + 3.9);
      }
    }
  }
}
