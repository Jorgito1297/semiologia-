export type SoundMode = 'normal' | 'pathological';
export type LayerType = 'heart' | 'lung';
export type ViewType = 'anterior' | 'posterior';

export interface ClinicalQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Hotspot {
  id: string;
  name: string;
  type: LayerType;
  location: string;
  view: ViewType;
  x: number; // coordinate in SVG viewBox space (0-200)
  y: number; // coordinate in SVG viewBox space (0-250)
  audioUrl?: string; // Real audio file if online
  ve: string;        // Visual inspect findings
  toca: string;      // Palpation findings
  oye: string;       // Auscultation findings
  pearl: string;     // Cátedra pearl
  quiz: ClinicalQuestion;
}

export interface AuscultationSession {
  id?: string;
  user_id?: string | null;
  focus_id: string;
  layer: LayerType;
  diagnosis: string;
  is_correct: boolean;
  score: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  patientName: string;
  age: number;
  gender: 'M' | 'F';
  complaint: string;
  vitalSigns: {
    hr: number; // Heart rate
    rr: number; // Respiratory rate
    bp: string; // Blood pressure
    spo2: number; // Oxygen saturation
  };
  activeHotspotId: string;
  soundModeOverride: SoundMode;
  notes: string;
}
