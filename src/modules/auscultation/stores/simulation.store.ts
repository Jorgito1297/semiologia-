import { create } from 'zustand';
import { Scenario } from '../types';

interface SimulationState {
  simulationMode: 'training' | 'exam';
  activeScenarioId: string | null;
  scenarios: Scenario[];
  setSimulationMode: (mode: 'training' | 'exam') => void;
  setActiveScenarioId: (id: string | null) => void;
  setScenarios: (scenarios: Scenario[]) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  simulationMode: 'training',
  activeScenarioId: null,
  scenarios: [],
  setSimulationMode: (simulationMode) => set({ simulationMode }),
  setActiveScenarioId: (activeScenarioId) => set({ activeScenarioId }),
  setScenarios: (scenarios) => set({ scenarios }),
}));
