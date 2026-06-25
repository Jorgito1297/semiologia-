'use client';

import React, { useEffect, useRef } from 'react';
import { useSimulationStore } from '../stores/simulation.store';
import { useAudioStore } from '../stores/audio.store';
import { ECGPattern } from '../types';

interface ECGStreamRendererProps {
  className?: string;
}

export const ECGStreamRenderer: React.FC<ECGStreamRendererProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentVitals = useSimulationStore((state) => state.currentVitals);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const animationRef = useRef<number | null>(null);
  
  // Keep track of time and state
  const timeRef = useRef<number>(0);
  const lastHeartbeatTimeRef = useRef<number>(0);
  const nextIntervalRef = useRef<number>(0.8); // Default 75 BPM

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Buffer to hold scrolling waveform data (x-coordinate, y-value)
    const bufferLength = 300;
    const dataPoints: number[] = new Array(bufferLength).fill(0);
    let drawIndex = 0;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      if (!canvas || !ctx) return;

      // Fit drawing buffer to layout size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // 1. Clear with deep clinical green-black color
      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Clinical ECG Grid Lines
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)'; // Minor grid lines
      ctx.lineWidth = 0.5;
      const step = 8;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)'; // Major grid lines
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += step * 5) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step * 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Get clinical parameters
      const hr = currentVitals?.hr ?? 0;
      const ecgPattern: ECGPattern = currentVitals?.ecg ?? 'NSR';
      const playState = isPlaying && hr > 0;

      // 4. Calculate next signal point
      timeRef.current += 0.016; // Increment by ~16ms (60 FPS)
      const t = timeRef.current;
      let signal = 0;

      if (playState) {
        if (ecgPattern === 'NSR') {
          // Regular sinus rhythm (P-Q-R-S-T)
          const interval = 60 / hr;
          const cycleTime = (t - lastHeartbeatTimeRef.current) % interval;
          
          if (t - lastHeartbeatTimeRef.current >= interval) {
            lastHeartbeatTimeRef.current = t;
          }

          signal = getSinusPoint(cycleTime);
        } else if (ecgPattern === 'AFib') {
          // Atrial Fibrillation: Irregular intervals + No P waves + f-waves noise
          const elapsed = t - lastHeartbeatTimeRef.current;
          if (elapsed >= nextIntervalRef.current) {
            lastHeartbeatTimeRef.current = t;
            // Generate next random interval (R-R interval variation of ±25%)
            const baseInterval = 60 / hr;
            nextIntervalRef.current = baseInterval * (0.75 + Math.random() * 0.5);
          }

          // AFib: Small chaotic f-waves on baseline
          const fWave = Math.sin(t * 50) * 0.05 + Math.sin(t * 120) * 0.03;
          signal = getAFibPoint(elapsed) + fWave;
        } else if (ecgPattern === 'VTac') {
          // Ventricular Tachycardia: High speed wide-QRS sinusoidal wave
          // Cycle rate is very fast, wide complexes
          const freq = (hr / 60) * 2 * Math.PI;
          signal = Math.sin(t * freq) * 0.6 + Math.pow(Math.sin(t * freq + 0.5), 3) * 0.2;
        } else if (ecgPattern === 'Flatline') {
          // Asystole: near flat line with very small thermal noise
          signal = (Math.random() - 0.5) * 0.02;
        }
      } else {
        // Monitor in standby / no pulse
        signal = (Math.random() - 0.5) * 0.01;
      }

      // Add a tiny bit of clinical baseline drift/low frequency noise for realism
      if (playState && ecgPattern !== 'Flatline') {
        signal += Math.sin(t * 1.5) * 0.02;
      }

      // 5. Append point to data points buffer
      dataPoints[drawIndex] = signal;
      drawIndex = (drawIndex + 1) % bufferLength;

      // 6. Draw the glowing neon clinical green wave
      ctx.strokeStyle = hr > 0 && ecgPattern !== 'Flatline' ? '#10b981' : '#ef4444'; // Green if pulse, Red if flatline/arrest
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = hr > 0 && ecgPattern !== 'Flatline' ? '#10b981' : '#ef4444';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const pointWidth = width / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        // Index mapping to draw oldest points on the left, newest on the right
        const index = (drawIndex + i) % bufferLength;
        const val = dataPoints[index];
        const x = i * pointWidth;
        const y = centerY - val * (height * 0.4);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    };

    // Helper functions for wave generation
    function getSinusPoint(cycleTime: number): number {
      // P wave: 0.0 - 0.08s
      if (cycleTime < 0.08) {
        return Math.sin((cycleTime / 0.08) * Math.PI) * 0.08;
      }
      // PR segment: 0.08 - 0.12s
      if (cycleTime < 0.12) {
        return 0;
      }
      // Q wave: 0.12 - 0.14s
      if (cycleTime < 0.14) {
        return -0.06 * Math.sin(((cycleTime - 0.12) / 0.02) * Math.PI);
      }
      // R wave: 0.14 - 0.17s (sharp upward deflection)
      if (cycleTime < 0.17) {
        return Math.sin(((cycleTime - 0.14) / 0.03) * Math.PI) * 0.8;
      }
      // S wave: 0.17 - 0.20s (sharp downward deflection)
      if (cycleTime < 0.20) {
        return -0.22 * Math.sin(((cycleTime - 0.17) / 0.03) * Math.PI);
      }
      // ST segment: 0.20 - 0.24s (isoelectric)
      if (cycleTime < 0.24) {
        return 0;
      }
      // T wave: 0.24 - 0.38s (broad repolarisation wave)
      if (cycleTime < 0.38) {
        return Math.sin(((cycleTime - 0.24) / 0.14) * Math.PI) * 0.18;
      }
      // Isoelectric resting phase
      return 0;
    }

    function getAFibPoint(elapsed: number): number {
      // AFib lacks P waves entirely, starts directly at QRS
      if (elapsed < 0.02) {
        return -0.06 * Math.sin((elapsed / 0.02) * Math.PI);
      }
      if (elapsed < 0.05) {
        return Math.sin(((elapsed - 0.02) / 0.03) * Math.PI) * 0.85;
      }
      if (elapsed < 0.08) {
        return -0.25 * Math.sin(((elapsed - 0.05) / 0.03) * Math.PI);
      }
      if (elapsed < 0.12) {
        return 0;
      }
      if (elapsed < 0.26) {
        return Math.sin(((elapsed - 0.12) / 0.14) * Math.PI) * 0.15;
      }
      return 0;
    }

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentVitals, isPlaying]);

  const hr = currentVitals?.hr ?? 0;
  const rr = currentVitals?.rr ?? 0;
  const bp = currentVitals?.bp ?? '--/--';
  const spo2 = currentVitals?.spo2 ?? 0;
  const temp = currentVitals?.temp ?? 37.0;
  const ecgPattern = currentVitals?.ecg ?? 'NSR';

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-800 bg-[#060a0f] w-full flex flex-col md:flex-row shadow-2xl ${className}`}>
      
      {/* Waveform Panel */}
      <div className="flex-1 h-32 relative">
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Left clinical banner */}
        <div className="absolute top-2 left-3 flex items-center gap-2 select-none pointer-events-none">
          <div className={`w-2 h-2 rounded-full ${isPlaying && hr > 0 ? (ecgPattern === 'Flatline' ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-ping') : 'bg-gray-500'}`} />
          <span className="text-[9px] font-mono text-emerald-400 tracking-wider uppercase font-semibold">
            {isPlaying && hr > 0 ? (ecgPattern === 'Flatline' ? 'PARO CARDÍACO / ASISTOLIA' : `ECG: ${ecgPattern}`) : 'STANDBY'}
          </span>
        </div>

        {/* Technical sweep display */}
        <div className="absolute top-2 right-3 text-[8px] font-mono text-emerald-500/50 select-none pointer-events-none">
          <span>II · 25 mm/s · 10 mm/mV</span>
        </div>
      </div>

      {/* Numeric Vital Signs Panel (Hospital Monitor Style) */}
      <div className="w-full md:w-48 bg-[#090f16] border-t md:border-t-0 md:border-l border-gray-800 p-3 grid grid-cols-4 md:grid-cols-2 gap-2 select-none">
        
        {/* Heart Rate */}
        <div className="flex flex-col justify-between p-1.5 rounded bg-gray-950/40 border border-emerald-950/20">
          <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest font-mono">FC (BPM)</div>
          <div className={`text-2xl font-black font-mono leading-none ${hr === 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
            {hr > 0 ? hr : '0'}
          </div>
        </div>

        {/* SpO2 */}
        <div className="flex flex-col justify-between p-1.5 rounded bg-gray-950/40 border border-cyan-950/20">
          <div className="text-[8px] font-bold text-cyan-500 uppercase tracking-widest font-mono">SpO2 (%)</div>
          <div className={`text-2xl font-black font-mono leading-none ${spo2 < 92 && hr > 0 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
            {hr > 0 ? `${spo2}%` : '--'}
          </div>
        </div>

        {/* Respiratory Rate */}
        <div className="flex flex-col justify-between p-1.5 rounded bg-gray-950/40 border border-yellow-950/20">
          <div className="text-[8px] font-bold text-yellow-500 uppercase tracking-widest font-mono">FR (RPM)</div>
          <div className="text-2xl font-black text-yellow-400 font-mono leading-none">
            {hr > 0 ? rr : '--'}
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="flex flex-col justify-between p-1.5 rounded bg-gray-950/40 border border-purple-950/20">
          <div className="text-[8px] font-bold text-purple-500 uppercase tracking-widest font-mono">PA (mmHg)</div>
          <div className="text-sm font-black text-purple-400 font-mono leading-none pt-1">
            {hr > 0 ? bp : '--/--'}
          </div>
        </div>

      </div>
    </div>
  );
};
export default ECGStreamRenderer;
