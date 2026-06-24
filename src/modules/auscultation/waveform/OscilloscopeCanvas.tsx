'use client';

import React, { useEffect, useRef } from 'react';
import { useAudioStore } from '../stores/audio.store';
import { AudioEngine } from '../audio/AudioEngine';

interface OscilloscopeCanvasProps {
  className?: string;
}

export const OscilloscopeCanvas: React.FC<OscilloscopeCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioEngine = AudioEngine.getInstance();

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      if (!ctx || !canvas) return;

      // Adjust drawing buffer size to layout size dynamically to prevent blurriness
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Dark ICU hospital monitor background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw ECG grid lines
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 16;
      
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw central baseline
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Read time-domain wave data from AudioEngine's analyser
      const analyser = audioEngine.getAnalyser();
      const bufferLength = analyser ? analyser.frequencyBinCount : 128;
      const dataArray = new Uint8Array(bufferLength);

      if (isPlaying && analyser) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        // Draw flat line when idle (128 is center in 8-bit signal)
        dataArray.fill(128);
      }

      // Draw the glowing neon ECG green line
      ctx.strokeStyle = '#10b981'; // Emerald clinical green
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#10b981';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // Normalised 0.0 to 2.0
        let y = (v * height) / 2;

        // Subtle dynamic hospital monitor noise/jitter when playing
        if (isPlaying) {
          y += (Math.random() - 0.5) * 1.5;
        }

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      // Reset shadow blur to avoid canvas degradation on subsequent frames
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-800 bg-[#090d16] h-28 w-full flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width="600"
        height="112"
        className="w-full h-full block"
      />
      
      {/* UI Overlays */}
      <div className="absolute top-2.5 left-3 flex items-center gap-2 select-none pointer-events-none">
        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-gray-500'}`} />
        <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase font-semibold">
          {isPlaying ? 'Auscultando...' : 'Monitor en Espera'}
        </span>
      </div>
      
      <div className="absolute top-2.5 right-3 flex gap-3 text-[9px] font-mono text-emerald-500/50 pointer-events-none select-none">
        <span>SWEEP: 25mm/s</span>
        <span>GAIN: x1.0</span>
      </div>
    </div>
  );
};
export default OscilloscopeCanvas;
