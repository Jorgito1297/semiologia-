'use client';

import React from 'react';
import { useAnatomyStore } from '../stores/anatomy.store';
import { useSimulationStore } from '../stores/simulation.store';
import { CLINICAL_SCENARIOS } from '../simulation/scenarios';
import { HOTSPOTS } from '../constants';
import { AnatomyHotspot } from './AnatomyHotspot';

export const TorsoPosterior: React.FC = () => {
  const selectedHotspotId = useAnatomyStore((state) => state.selectedHotspotId);
  const setSelectedHotspotId = useAnatomyStore((state) => state.setSelectedHotspotId);

  const activeScenarioId = useSimulationStore((state) => state.activeScenarioId);
  const activeScenario = CLINICAL_SCENARIOS.find((s) => s.id === activeScenarioId);
  
  const rr = activeScenario?.vitalSigns.rr || 15;
  const breatheDuration = 60 / rr;

  // Filter hotspots for posterior view (only lung fields are on the back)
  const activeHotspots = Object.values(HOTSPOTS).filter(
    (hs) => hs.view === 'posterior' && hs.type === 'lung'
  );

  return (
    <svg
      viewBox="0 0 200 250"
      className="w-full h-full max-w-[340px] select-none transition-all duration-300"
    >
      <style>{`
        @keyframes breathe {
          0% { transform: scale(1); }
          45% { transform: scale(1.03); }
          55% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `}</style>
      <defs>
        <radialGradient id="lung-glow-post" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
        </radialGradient>

        <filter id="glow-light-lung-post" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. OUTLINE DE HOMBROS Y CUELLO */}
      <path
        d="M 85 45 C 85 30, 115 30, 115 45 L 112 60 L 88 60 Z"
        fill="rgba(15, 23, 42, 0.6)"
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth="1.5"
      />
      <path
        d="M 40 90 C 50 75, 85 60, 88 60 L 112 60 C 115 60, 150 75, 160 90 L 175 140 L 165 145 L 155 105 L 155 240 L 45 240 L 45 105 L 35 145 L 25 140 Z"
        fill="rgba(15, 23, 42, 0.35)"
        stroke="rgba(255, 255, 255, 0.09)"
        strokeWidth="1.5"
      />

      {/* 2. VERTEBRAL COLUMN (ESPINAZO) */}
      <line
        x1="100"
        y1="60"
        x2="100"
        y2="240"
        stroke="rgba(255, 255, 255, 0.06)"
        strokeWidth="4"
        strokeDasharray="4,6"
      />

      {/* 3. SCAPULAS (OMÓPLATOS) */}
      <path
        d="M 52 88 C 58 88, 75 92, 72 115 C 68 126, 48 122, 48 108 Z"
        fill="rgba(255, 255, 255, 0.01)"
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth="1.8"
      />
      <path
        d="M 148 88 C 142 88, 125 92, 128 115 C 132 126, 152 122, 152 108 Z"
        fill="rgba(255, 255, 255, 0.01)"
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth="1.8"
      />

      {/* Grupo con animación de respiración */}
      <g
        style={{
          transformOrigin: '100px 140px',
          animation: `breathe ${breatheDuration}s ease-in-out infinite`,
        }}
      >

      {/* 4. COSTILLAS POSTERIORES (Posterior ribs lines) */}
      <g stroke="rgba(255, 255, 255, 0.03)" fill="none" strokeLinecap="round" strokeWidth="1.5">
        <path d="M 100 80 C 80 80, 56 84, 48 90" />
        <path d="M 100 80 C 120 80, 144 84, 152 90" />

        <path d="M 100 95 C 75 95, 52 100, 46 108" />
        <path d="M 100 95 C 125 95, 148 100, 154 108" />

        <path d="M 100 110 C 75 110, 52 116, 45 126" />
        <path d="M 100 110 C 125 110, 148 116, 155 126" />

        <path d="M 100 126 C 75 126, 52 134, 45 146" />
        <path d="M 100 126 C 125 126, 148 134, 155 146" />

        <path d="M 100 142 C 75 142, 52 152, 46 166" />
        <path d="M 100 142 C 125 142, 148 152, 154 166" />

        <path d="M 100 158 C 75 158, 54 172, 48 186" />
        <path d="M 100 158 C 125 158, 146 172, 152 186" />
      </g>

      {/* 5. POSTERIOR LUNG SHAPES */}
      <g className="transition-all duration-300">
        <path
          d="M 92 80 C 72 70, 45 105, 58 175 C 70 180, 85 178, 92 165 Z"
          fill="url(#lung-glow-post)"
        />
        <path
          d="M 108 80 C 128 70, 155 105, 142 175 C 130 180, 115 178, 108 165 Z"
          fill="url(#lung-glow-post)"
        />

        {/* Anatomical Left Lung (Viewer Left from behind) */}
        <g>
          <path
            d="M 92 80 C 92 80, 75 72, 58 85 C 48 105, 45 155, 58 175 C 70 180, 85 178, 92 165 C 96 150, 96 95, 92 80 Z"
            fill="rgba(6, 182, 212, 0.04)"
            stroke="rgba(6, 182, 212, 0.28)"
            strokeWidth="1.5"
            filter="url(#glow-light-lung-post)"
          />
          {/* Oblique fissure line */}
          <path
            d="M 84 115 C 68 125, 52 140, 49 150"
            fill="none"
            stroke="rgba(6, 182, 212, 0.15)"
            strokeWidth="1.2"
            strokeDasharray="2,2"
          />
        </g>

        {/* Anatomical Right Lung (Viewer Right from behind) */}
        <g>
          <path
            d="M 108 80 C 108 80, 125 72, 142 85 C 152 105, 155 155, 142 175 C 130 180, 115 178, 108 165 C 104 150, 104 95, 108 80 Z"
            fill="rgba(6, 182, 212, 0.04)"
            stroke="rgba(6, 182, 212, 0.28)"
            strokeWidth="1.5"
            filter="url(#glow-light-lung-post)"
          />
          {/* Oblique fissure line */}
          <path
            d="M 116 115 C 132 125, 148 140, 151 150"
            fill="none"
            stroke="rgba(6, 182, 212, 0.15)"
            strokeWidth="1.2"
            strokeDasharray="2,2"
          />
        </g>
      </g>

      </g>

      {/* 6. DYNAMIC POSTERIOR HOTSPOTS */}
      {activeHotspots.map((hs) => (
        <AnatomyHotspot
          key={hs.id}
          hotspot={hs}
          isActive={selectedHotspotId === hs.id}
          onClick={() => setSelectedHotspotId(hs.id)}
        />
      ))}
    </svg>
  );
};
export default TorsoPosterior;
