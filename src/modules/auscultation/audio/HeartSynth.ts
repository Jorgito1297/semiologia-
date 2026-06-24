/**
 * HeartSynth: Generates cardiac sounds using Web Audio API synthesis.
 */
export class HeartSynth {
  /**
   * Schedules a single heart beat (S1 + murmur + S2) at a specific AudioContext time.
   */
  static scheduleHeartBeat(
    ctx: AudioContext,
    time: number,
    isPathological: boolean,
    type: string,
    destination: AudioNode
  ): void {
    // 1. S1 (Mitral/Tricuspid closure - low pitch rumble, ~55Hz)
    const oscS1 = ctx.createOscillator();
    const gainS1 = ctx.createGain();
    
    oscS1.frequency.setValueAtTime(55, time);
    
    // Envelope for S1
    gainS1.gain.setValueAtTime(0.001, time);
    gainS1.gain.linearRampToValueAtTime(0.75, time + 0.02);
    gainS1.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    
    oscS1.connect(gainS1);
    gainS1.connect(destination);
    
    oscS1.start(time);
    oscS1.stop(time + 0.15);

    // 2. Systolic Murmur (if pathological and mitral/aortic focus)
    if (isPathological && (type === 'aortico' || type === 'mitral')) {
      const murmurDuration = 0.32; // ~320ms systole
      const murmurStartTime = time + 0.04;

      // Create white noise for the turbulent blood flow sound
      const bufferSize = ctx.sampleRate * murmurDuration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      // Bandpass filter to shape the murmur texture
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, murmurStartTime);

      if (type === 'aortico') {
        // Aortic stenosis: harsh crescendo-decrescendo ejection murmur
        filter.frequency.setValueAtTime(420, murmurStartTime);
        filter.Q.setValueAtTime(2.0, murmurStartTime);
        
        // Crescendo to peak at 150ms, then decrescendo
        noiseGain.gain.linearRampToValueAtTime(0.28, murmurStartTime + 0.15);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, murmurStartTime + murmurDuration);
      } else {
        // Mitral regurgitation: blowing holosistolic murmur
        filter.frequency.setValueAtTime(580, murmurStartTime);
        filter.Q.setValueAtTime(1.2, murmurStartTime);
        
        // Plateaus through systole
        noiseGain.gain.linearRampToValueAtTime(0.18, murmurStartTime + 0.04);
        noiseGain.gain.setValueAtTime(0.18, murmurStartTime + 0.25);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, murmurStartTime + murmurDuration);
      }

      noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);

      noiseNode.start(murmurStartTime);
      noiseNode.stop(murmurStartTime + murmurDuration);
    }

    // 3. S2 (Aortic/Pulmonary closure - slightly higher pitch, ~85Hz)
    const s2Time = time + 0.34;
    const oscS2 = ctx.createOscillator();
    const gainS2 = ctx.createGain();
    
    oscS2.frequency.setValueAtTime(84, s2Time);
    
    // Envelope for S2
    gainS2.gain.setValueAtTime(0.001, s2Time);
    gainS2.gain.linearRampToValueAtTime(0.68, s2Time + 0.02);
    gainS2.gain.exponentialRampToValueAtTime(0.001, s2Time + 0.10);
    
    oscS2.connect(gainS2);
    gainS2.connect(destination);
    
    oscS2.start(s2Time);
    oscS2.stop(s2Time + 0.12);

    // 4. Split S2 (Fijo/Desdoblado if pathological pulmonary focus)
    if (isPathological && type === 'pulmonar') {
      const s2bTime = s2Time + 0.05; // 50ms delay representing pulmonary closing delay
      const oscS2b = ctx.createOscillator();
      const gainS2b = ctx.createGain();
      
      oscS2b.frequency.setValueAtTime(76, s2bTime);
      
      gainS2b.gain.setValueAtTime(0.001, s2bTime);
      gainS2b.gain.linearRampToValueAtTime(0.45, s2bTime + 0.02);
      gainS2b.gain.exponentialRampToValueAtTime(0.001, s2bTime + 0.09);
      
      oscS2b.connect(gainS2b);
      gainS2b.connect(destination);
      
      oscS2b.start(s2bTime);
      oscS2b.stop(s2bTime + 0.12);
    }

    // 5. Diastolic Murmur (if pathological and Botkin-Erb focus - Insuficiencia Aórtica)
    if (isPathological && type === 'erb') {
      const murmurDuration = 0.35; // ~350ms diastole
      const murmurStartTime = s2Time + 0.10; // starts immediately after S2

      const bufferSize = ctx.sampleRate * murmurDuration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      // High-pitched blowing diastolic murmur
      filter.frequency.setValueAtTime(500, murmurStartTime);
      filter.Q.setValueAtTime(1.5, murmurStartTime);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, murmurStartTime);
      
      // Decrescendo profile: starts high right after S2 and fades away
      noiseGain.gain.linearRampToValueAtTime(0.20, murmurStartTime + 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, murmurStartTime + murmurDuration);

      noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);

      noiseNode.start(murmurStartTime);
      noiseNode.stop(murmurStartTime + murmurDuration);
    }
  }
}
