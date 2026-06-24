import { create } from 'zustand';
import { ViewType, LayerType } from '../types';

interface AnatomyState {
  view: ViewType;
  selectedLayer: LayerType;
  selectedHotspotId: string | null;
  setView: (view: ViewType) => void;
  setSelectedLayer: (layer: LayerType) => void;
  setSelectedHotspotId: (id: string | null) => void;
  resetAnatomy: () => void;
}

export const useAnatomyStore = create<AnatomyState>((set) => ({
  view: 'anterior',
  selectedLayer: 'heart',
  selectedHotspotId: null,
  setView: (view) => set({ view }),
  setSelectedLayer: (selectedLayer) => set({ selectedLayer }),
  setSelectedHotspotId: (selectedHotspotId) => set({ selectedHotspotId }),
  resetAnatomy: () => set({ view: 'anterior', selectedLayer: 'heart', selectedHotspotId: null }),
}));
