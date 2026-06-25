import { describe, it, expect } from 'vitest';
import { ClinicalEngine, PatientState } from './clinicalEngine';

describe('ClinicalEngine physiological simulator', () => {
  
  it('should apply biological inertia on tick', () => {
    const current: PatientState = {
      hr: 50,
      rr: 12,
      bp: '120/80',
      spo2: 90,
      temp: 37.0,
      ecg: 'NSR',
      consciousness: 'conscious'
    };

    const target: PatientState = {
      hr: 80,
      rr: 18,
      bp: '140/90',
      spo2: 98,
      temp: 37.0,
      ecg: 'NSR',
      consciousness: 'conscious'
    };

    const nextState = ClinicalEngine.tick(current, target);

    // Heart rate should increase towards 80
    expect(nextState.hr).toBeGreaterThan(50);
    expect(nextState.hr).toBeLessThan(80);

    // Respiratory rate should increase towards 18
    expect(nextState.rr).toBeGreaterThan(12);
    expect(nextState.rr).toBeLessThan(18);

    // SpO2 should increase towards 98
    expect(nextState.spo2).toBeGreaterThan(90);
    expect(nextState.spo2).toBeLessThan(98);

    // BP should increase towards 140/90
    const nextBPParts = nextState.bp.split('/');
    expect(parseInt(nextBPParts[0])).toBeGreaterThan(120);
    expect(parseInt(nextBPParts[1])).toBeGreaterThan(80);
  });

  describe('applyIntervention', () => {
    
    it('should improve SpO2 when oxygen is applied during hypoxia', () => {
      const state: PatientState = {
        hr: 110,
        rr: 24,
        bp: '120/80',
        spo2: 88,
        temp: 37.0,
        ecg: 'NSR',
        consciousness: 'somnolent'
      };

      const result = ClinicalEngine.applyIntervention(state, 'oxygen');

      expect(result.targetState.spo2).toBe(99);
      expect(result.targetState.hr).toBeLessThan(110); // heart rate should drop
      expect(result.targetState.rr).toBeLessThan(24);  // respiratory rate should drop
      expect(result.targetState.consciousness).toBe('conscious');
      expect(result.message).toContain('Oxígeno al 50% colocada');
    });

    it('should increase heart rate when atropine is applied in bradycardia', () => {
      const state: PatientState = {
        hr: 45,
        rr: 12,
        bp: '90/60',
        spo2: 97,
        temp: 37.0,
        ecg: 'NSR',
        consciousness: 'conscious'
      };

      const result = ClinicalEngine.applyIntervention(state, 'atropine');

      expect(result.targetState.hr).toBe(85);
      expect(result.targetState.bp).toBe('125/80');
      expect(result.message).toContain('Atropina 1mg IV administrada');
    });

    it('should cardiovert VTac to NSR with amiodarone', () => {
      const state: PatientState = {
        hr: 160,
        rr: 22,
        bp: '80/50',
        spo2: 91,
        temp: 37.0,
        ecg: 'VTac',
        consciousness: 'somnolent'
      };

      const result = ClinicalEngine.applyIntervention(state, 'amiodarone');

      // Due to math.random, we can mock it or check both outcomes
      if (result.targetState.ecg === 'NSR') {
        expect(result.targetState.hr).toBe(78);
        expect(result.targetState.bp).toBe('115/75');
        expect(result.message).toContain('Cardioversión farmacológica exitosa');
      } else {
        expect(result.targetState.ecg).toBe('VTac');
        expect(result.message).toContain('Paciente persiste en Taquicardia Ventricular');
      }
    });

    it('should cardiovert VTac to NSR with defibrillation', () => {
      const state: PatientState = {
        hr: 170,
        rr: 20,
        bp: '70/40',
        spo2: 89,
        temp: 37.0,
        ecg: 'VTac',
        consciousness: 'unconscious'
      };

      const result = ClinicalEngine.applyIntervention(state, 'defib');

      if (result.targetState.ecg === 'NSR') {
        expect(result.targetState.hr).toBe(82);
        expect(result.targetState.bp).toBe('118/78');
        expect(result.targetState.consciousness).toBe('somnolent');
        expect(result.message).toContain('retorno a Ritmo Sinusal Normal');
      } else {
        expect(result.targetState.ecg).toBe('VTac');
      }
    });

    it('should cause asystole if defib is used inappropriately on normal rhythm', () => {
      const state: PatientState = {
        hr: 72,
        rr: 14,
        bp: '120/80',
        spo2: 99,
        temp: 37.0,
        ecg: 'NSR',
        consciousness: 'conscious'
      };

      const result = ClinicalEngine.applyIntervention(state, 'defib');

      expect(result.targetState.ecg).toBe('Flatline');
      expect(result.targetState.hr).toBe(0);
      expect(result.targetState.rr).toBe(0);
      expect(result.targetState.spo2).toBe(0);
      expect(result.targetState.consciousness).toBe('unconscious');
      expect(result.message).toContain('DESCARGA INAPROPIADA');
    });

    it('should do nothing if defib is used on asystole/flatline', () => {
      const state: PatientState = {
        hr: 0,
        rr: 0,
        bp: '0/0',
        spo2: 0,
        temp: 36.5,
        ecg: 'Flatline',
        consciousness: 'unconscious'
      };

      const result = ClinicalEngine.applyIntervention(state, 'defib');

      expect(result.targetState.ecg).toBe('Flatline');
      expect(result.targetState.hr).toBe(0);
      expect(result.message).toContain('No se desfibrila la asistolia');
    });

  });
});
