import { HeartSynth } from './HeartSynth';
import { LungSynth } from './LungSynth';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mainGain: GainNode | null = null;
  
  private isPlaying = false;
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private stopTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private nextEventTime = 0;
  private activeFocusId: string | null = null;
  private focusType: 'heart' | 'lung' | null = null;
  private soundMode: 'normal' | 'pathological' = 'normal';
  private currentVolume = 0.5;
  private silentHtmlAudio: HTMLAudioElement | null = null;

  private constructor() {
    // Singleton
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes the AudioContext and nodes.
   */
  private init(): void {
    if (this.ctx) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- webkitAudioContext is a Safari vendor extension not in TS types
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
    
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    this.mainGain = this.ctx.createGain();
    this.mainGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

    // Chain: Synth/Oscillator -> MainGain -> Analyser -> Destination
    this.mainGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Setup silent HTML audio track to bypass iOS silent switch / lock screen issues
    try {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        const isIOS = (ua.indexOf('iphone') >= 0 && ua.indexOf('like iphone') < 0) ||
                      (ua.indexOf('ipad') >= 0 && ua.indexOf('like ipad') < 0) ||
                      (ua.indexOf('ipod') >= 0 && ua.indexOf('like ipod') < 0) ||
                      (ua.indexOf('mac os x') >= 0 && navigator.maxTouchPoints > 0);

        if (isIOS) {
          this.silentHtmlAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV');
          this.silentHtmlAudio.loop = true;
        }
      }
    } catch (e) {
      console.warn('[AudioEngine] Failed to initialize silent HTML audio:', e);
    }
  }

  /**
   * Starts playback for a specific anatomical focus.
   */
  start(
    focusId: string,
    focusType: 'heart' | 'lung',
    soundMode: 'normal' | 'pathological'
  ): boolean {
    if (this.stopTimeoutId) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    try {
      this.init();
      if (!this.ctx || !this.mainGain || !this.analyser) {
        return false;
      }

      if (this.isPlaying) {
        this.stop();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      if (this.silentHtmlAudio) {
        this.silentHtmlAudio.play().catch((err) => {
          console.warn('[AudioEngine] Failed to play silent HTML audio:', err);
        });
      }

      this.isPlaying = true;
      this.activeFocusId = focusId;
      this.focusType = focusType;
      this.soundMode = soundMode;
      this.nextEventTime = this.ctx.currentTime + 0.05;

      // Start scheduling loop (lookahead)
      const scheduleAheadTime = 0.2; // schedule 200ms ahead
      const intervalTime = 50; // check every 50ms

      const runScheduler = () => {
        if (!this.isPlaying || !this.ctx || !this.mainGain) return;

        const currentTime = this.ctx.currentTime;
        const interval = this.focusType === 'heart' ? 0.833 : 4.0; // 72 BPM vs 15 breaths/min

        while (this.nextEventTime < currentTime + scheduleAheadTime) {
          const timeToSchedule = this.nextEventTime;
          
          if (this.focusType === 'heart') {
            HeartSynth.scheduleHeartBeat(
              this.ctx,
              timeToSchedule,
              this.soundMode === 'pathological',
              this.activeFocusId!,
              this.mainGain
            );
          } else {
            LungSynth.scheduleRespirationCycle(
              this.ctx,
              timeToSchedule,
              this.soundMode === 'pathological',
              this.activeFocusId!,
              this.mainGain
            );
          }

          this.nextEventTime += interval;
        }
      };

      // Run first batch immediately
      runScheduler();
      this.schedulerInterval = setInterval(runScheduler, intervalTime);
      console.log(`[AudioEngine] Started auscultation for: ${focusId} (${focusType}) in ${soundMode} mode`);
      return true;
    } catch (e) {
      console.error('[AudioEngine] Failed to start audio engine:', e);
      this.isPlaying = false;
      return false;
    }
  }

  /**
   * Stops playback and cleans up active nodes.
   */
  stop(): void {
    this.isPlaying = false;

    if (this.silentHtmlAudio) {
      try {
        this.silentHtmlAudio.pause();
      } catch (err) {
        console.warn('[AudioEngine] Failed to pause silent HTML audio:', err);
      }
    }
    
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    if (this.stopTimeoutId) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    const mainGainToDisconnect = this.mainGain;

    if (mainGainToDisconnect) {
      // Smooth fade-out to prevent clicks
      try {
        const now = this.ctx?.currentTime || 0;
        mainGainToDisconnect.gain.setValueAtTime(mainGainToDisconnect.gain.value, now);
        mainGainToDisconnect.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      } catch (e) {
        console.warn('[AudioEngine] Smooth fadeout failed:', e);
      }
    }

    // Recreate the gain node to ensure silence and reset active sounds
    this.stopTimeoutId = setTimeout(() => {
      if (!this.isPlaying && this.ctx && this.analyser) {
        try {
          mainGainToDisconnect?.disconnect();
        } catch { /* disconnect may fail if already detached */ }
        
        if (this.mainGain === mainGainToDisconnect) {
          this.mainGain = this.ctx.createGain();
          this.mainGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
          this.mainGain.connect(this.analyser);
        }
      }
      this.stopTimeoutId = null;
    }, 60);

    console.log('[AudioEngine] Stopped auscultation.');
  }

  /**
   * Updates the volume in real time.
   */
  setVolume(vol: number): void {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  /**
   * Updates the sound mode in real time.
   */
  setSoundMode(mode: 'normal' | 'pathological'): void {
    this.soundMode = mode;
    // Force scheduler to reschedule with new mode on next tick
    if (this.isPlaying && this.activeFocusId && this.focusType) {
      // Keep next beat time aligned, just update state
      console.log(`[AudioEngine] Switched sound mode to: ${mode}`);
    }
  }

  /**
   * Returns the analyser node for the canvas visualizer.
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Returns whether audio is currently playing.
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Closes the AudioContext.
   */
  async close(): Promise<void> {
    this.stop();
    if (this.silentHtmlAudio) {
      this.silentHtmlAudio = null;
    }
    if (this.ctx) {
      await this.ctx.close();
      this.ctx = null;
      this.analyser = null;
      this.mainGain = null;
    }
  }
}
export default AudioEngine;
