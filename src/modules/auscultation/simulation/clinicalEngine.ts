import { ECGPattern, ConsciousnessState, InterventionType } from '../types';

export interface PatientState {
  hr: number;       // Heart Rate
  rr: number;       // Respiratory Rate
  bp: string;       // Blood Pressure (e.g. "120/80")
  spo2: number;     // Oxygen Saturation
  temp: number;     // Temperature (C)
  ecg: ECGPattern;
  consciousness: ConsciousnessState;
}

export class ClinicalEngine {
  /**
   * Applies biological inertia to smooth the transition of vitals towards target values.
   * Typically called once per second in the simulation loop.
   */
  static tick(current: PatientState, target: PatientState): PatientState {
    const nextHR = Math.round(current.hr + (target.hr - current.hr) * 0.15);
    const nextRR = Math.round(current.rr + (target.rr - current.rr) * 0.15);
    const nextSpO2 = Math.round(current.spo2 + (target.spo2 - current.spo2) * 0.15);
    
    // Parse blood pressure to interpolate systolic/diastolic
    const parseBP = (bpStr: string) => {
      const parts = bpStr.split('/');
      return {
        sys: parseInt(parts[0]) || 120,
        dia: parseInt(parts[1]) || 80
      };
    };

    const currBP = parseBP(current.bp);
    const targBP = parseBP(target.bp);

    const nextSys = Math.round(currBP.sys + (targBP.sys - currBP.sys) * 0.15);
    const nextDia = Math.round(currBP.dia + (targBP.dia - currBP.dia) * 0.15);
    const nextBP = `${nextSys}/${nextDia}`;

    // Temperature changes very slowly
    const nextTemp = Math.round((current.temp + (target.temp - current.temp) * 0.05) * 10) / 10;

    return {
      hr: nextHR,
      rr: nextRR,
      bp: nextBP,
      spo2: Math.min(100, Math.max(0, nextSpO2)),
      temp: nextTemp,
      ecg: target.ecg, // Rhythm changes are instantaneous on monitor
      consciousness: target.consciousness
    };
  }

  /**
   * Executes a medical intervention and determines the new physiological targets.
   */
  static applyIntervention(
    currentState: PatientState,
    intervention: InterventionType
  ): { targetState: PatientState; message: string } {
    // Clone current state as base for target
    const target: PatientState = { ...currentState };
    let message = '';

    switch (intervention) {
      case 'oxygen':
        if (currentState.spo2 < 95) {
          target.spo2 = 99;
          // Relieve compensatory tachycardia/tachypnea
          if (currentState.hr > 100 && currentState.ecg === 'NSR') {
            target.hr = Math.max(70, currentState.hr - 25);
          }
          if (currentState.rr > 20) {
            target.rr = Math.max(12, currentState.rr - 8);
          }
          target.consciousness = 'conscious';
          message = 'Mascarilla de Oxígeno al 50% colocada. Saturación de O2 mejorando progresivamente.';
        } else {
          message = 'Oxígeno administrado, pero el paciente ya presenta saturación adecuada.';
        }
        break;

      case 'atropine':
        if (currentState.ecg === 'Flatline') {
          message = 'La atropina se administró en asistolia. No se observa respuesta eléctrica.';
        } else if (currentState.hr < 55) {
          target.hr = 85;
          target.bp = '125/80';
          message = 'Atropina 1mg IV administrada. Frecuencia cardíaca elevándose de forma efectiva.';
        } else {
          target.hr = Math.min(140, currentState.hr + 30);
          message = 'Atropina administrada. Se observa taquicardia inducida por fármaco.';
        }
        break;

      case 'amiodarone':
        if (currentState.ecg === 'VTac') {
          // 75% chance to restore NSR
          const success = Math.random() < 0.75;
          if (success) {
            target.ecg = 'NSR';
            target.hr = 78;
            target.bp = '115/75';
            message = 'Infusión de Amiodarona 150mg IV completada. Cardioversión farmacológica exitosa a Ritmo Sinusal.';
          } else {
            message = 'Amiodarona administrada. Paciente persiste en Taquicardia Ventricular Sin Pulso.';
          }
        } else if (currentState.ecg === 'NSR') {
          target.hr = Math.max(50, currentState.hr - 15);
          message = 'Amiodarona administrada en ritmo sinusal. Se observa bradicardia reactiva.';
        } else {
          message = 'Amiodarona administrada. Sin cambios en el trazado eléctrico activo.';
        }
        break;

      case 'defib':
        if (currentState.ecg === 'VTac') {
          // 90% chance to restore NSR
          const success = Math.random() < 0.90;
          if (success) {
            target.ecg = 'NSR';
            target.hr = 82;
            target.bp = '118/78';
            target.consciousness = 'somnolent';
            message = '¡Descarga de 200J administrada! El monitor muestra retorno a Ritmo Sinusal Normal.';
          } else {
            message = '¡Descarga administrada! Persiste Taquicardia Ventricular. Cargar desfibrilador de nuevo.';
          }
        } else if (currentState.ecg === 'NSR' || currentState.ecg === 'AFib') {
          // Shocking a perfusing rhythm causes Ventricular Fibrillation/Flatline
          target.ecg = 'Flatline';
          target.hr = 0;
          target.rr = 0;
          target.bp = '0/0';
          target.spo2 = 0;
          target.consciousness = 'unconscious';
          message = '¡DESCARGA INAPROPIADA! Has aplicado desfibrilación sobre un ritmo organizado. El paciente entra en Asistolia.';
        } else if (currentState.ecg === 'Flatline') {
          // Defibrillating Asystole does nothing
          message = 'Descarga administrada en Asistolia. El monitor no registra cambios. Recuerda: ¡No se desfibrila la asistolia!';
        }
        break;

      default:
        message = 'Procedimiento realizado.';
    }

    return { targetState: target, message };
  }
}
