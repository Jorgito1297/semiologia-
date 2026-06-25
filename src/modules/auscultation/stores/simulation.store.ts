import { create } from 'zustand';
import { Scenario, ECGPattern, ConsciousnessState, InterventionType } from '../types';
import { PatientState, ClinicalEngine } from '../simulation/clinicalEngine';

interface SimulationState {
  simulationMode: 'training' | 'exam';
  activeScenarioId: string | null;
  scenarios: Scenario[];
  
  // Advanced Simulation parameters
  currentVitals: PatientState | null;
  targetVitals: PatientState | null;
  appliedInterventions: InterventionType[];
  lastInterventionMessage: string;
  
  setSimulationMode: (mode: 'training' | 'exam') => void;
  setActiveScenarioId: (id: string | null) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  
  // Simulation Actions
  initializeSimulation: (scenario: Scenario) => void;
  tickVitals: () => void;
  applyIntervention: (intervention: InterventionType) => void;
  resetInterventions: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulationMode: 'training',
  activeScenarioId: null,
  scenarios: [],
  
  currentVitals: null,
  targetVitals: null,
  appliedInterventions: [],
  lastInterventionMessage: '',
  
  setSimulationMode: (simulationMode) => set({ simulationMode }),
  setActiveScenarioId: (activeScenarioId) => set({ activeScenarioId }),
  setScenarios: (scenarios) => set({ scenarios }),

  initializeSimulation: (scenario) => {
    const initialECG: ECGPattern = scenario.initialECG || (scenario.soundModeOverride === 'pathological' ? 'AFib' : 'NSR');
    const initialConsciousness: ConsciousnessState = scenario.initialConsciousness || 'conscious';
    
    const baseState: PatientState = {
      hr: scenario.vitalSigns.hr,
      rr: scenario.vitalSigns.rr,
      bp: scenario.vitalSigns.bp,
      spo2: scenario.vitalSigns.spo2,
      temp: 37.0,
      ecg: initialECG,
      consciousness: initialConsciousness,
    };

    set({
      activeScenarioId: scenario.id,
      currentVitals: { ...baseState },
      targetVitals: { ...baseState },
      appliedInterventions: [],
      lastInterventionMessage: 'Paciente ingresado. Monitor de constantes vitales conectado.',
    });
  },

  tickVitals: () => {
    const { currentVitals, targetVitals } = get();
    if (!currentVitals || !targetVitals) return;

    const nextVitals = ClinicalEngine.tick(currentVitals, targetVitals);
    set({ currentVitals: nextVitals });
  },

  applyIntervention: (intervention) => {
    const { currentVitals, appliedInterventions } = get();
    if (!currentVitals) return;

    const { targetState, message } = ClinicalEngine.applyIntervention(currentVitals, intervention);
    
    set({
      targetVitals: targetState,
      appliedInterventions: [...appliedInterventions, intervention],
      lastInterventionMessage: message,
    });
  },

  resetInterventions: () => {
    const { activeScenarioId, scenarios } = get();
    if (!activeScenarioId) return;
    const sc = scenarios.find((s) => s.id === activeScenarioId);
    if (sc) {
      get().initializeSimulation(sc);
    }
  },
}));
