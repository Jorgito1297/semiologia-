import { create } from 'zustand';
import { SoundMode } from '../types';

interface AudioState {
  isPlaying: boolean;
  soundMode: SoundMode;
  volume: number; // 0.0 to 1.0
  setIsPlaying: (isPlaying: boolean) => void;
  setSoundMode: (mode: SoundMode) => void;
  setVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isPlaying: false,
  soundMode: 'normal',
  volume: 0.8,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSoundMode: (soundMode) => set({ soundMode }),
  setVolume: (volume) => set({ volume }),
}));
