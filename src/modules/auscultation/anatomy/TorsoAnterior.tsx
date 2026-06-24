'use client';

import React from 'react';
import { useAnatomyStore } from '../stores/anatomy.store';
import { useSimulationStore } from '../stores/simulation.store';
import { CLINICAL_SCENARIOS } from '../simulation/scenarios';
import { HOTSPOTS } from '../constants';
import { AnatomyHotspot } from './AnatomyHotspot';

export const TorsoAnterior: React.FC = () => {
  const selectedLayer = useAnatomyStore((state) => state.selectedLayer);
  const selectedHotspotId = useAnatomyStore((state) => state.selectedHotspotId);
  const setSelectedHotspotId = useAnatomyStore((state) => state.setSelectedHotspotId);

  const activeScenarioId = useSimulationStore((state) => state.activeScenarioId);
  const activeScenario = CLINICAL_SCENARIOS.find((s) => s.id === activeScenarioId);
  
  const rr = activeScenario?.vitalSigns.rr || 15;
  const hr = activeScenario?.vitalSigns.hr || 72;

  const breatheDuration = 60 / rr;
  const pulseDuration = 60 / hr;

  // Filter hotspots for anterior view and current layer
  const activeHotspots = Object.values(HOTSPOTS).filter(
    (hs) => hs.view === 'anterior' && hs.type === selectedLayer
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
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.06); }
          28% { transform: scale(1); }
          42% { transform: scale(1.04); }
          56% { transform: scale(1); }
          100% { transform: scale(1); }
        }
      `}</style>
      <defs>
        {/* Gradients for Organs */}
        <radialGradient id="heart-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
        </radialGradient>
        <radialGradient id="lung-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
        </radialGradient>

        {/* ICU Glow Filters */}
        <filter id="glow-light-heart" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-light-lung" x="-20%" y="-20%" width="140%" height="140%">
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

      {/* Grupo con animación de respiración */}
      <g
        style={{
          transformOrigin: '100px 140px',
          animation: `breathe ${breatheDuration}s ease-in-out infinite`,
        }}
      >

      {/* 2. CAJA TORÁCICA PREMIUM (RIB CAGE) */}
      <g stroke="rgba(255, 255, 255, 0.04)" fill="none" strokeLinecap="round">
        {/* Esternón (Sternum) */}
        <path d="M 100 70 L 100 160" strokeWidth="6" stroke="rgba(255, 255, 255, 0.06)" />
        <circle cx="100" cy="70" r="5" fill="rgba(255, 255, 255, 0.08)" />

        {/* Clavículas (Clavicles) */}
        <path d="M 100 68 C 80 68, 55 74, 42 78" strokeWidth="2.5" stroke="rgba(255, 255, 255, 0.07)" />
        <path d="M 100 68 C 120 68, 145 74, 158 78" strokeWidth="2.5" stroke="rgba(255, 255, 255, 0.07)" />

        {/* Costillas Izquierdas y Derechas (Ribs 1 to 7) */}
        {/* Rib 1 */}
        <path d="M 100 80 C 85 80, 60 84, 48 88" strokeWidth="2" />
        <path d="M 100 80 C 115 80, 140 84, 152 88" strokeWidth="2" />
        {/* Rib 2 */}
        <path d="M 100 94 C 80 94, 55 98, 46 104" strokeWidth="2" />
        <path d="M 100 94 C 120 94, 145 98, 154 104" strokeWidth="2" />
        {/* Rib 3 */}
        <path d="M 100 108 C 80 108, 55 114, 45 122" strokeWidth="2" />
        <path d="M 100 108 C 120 108, 145 114, 155 122" strokeWidth="2" />
        {/* Rib 4 */}
        <path d="M 100 124 C 80 124, 55 132, 45 142" strokeWidth="2" />
        <path d="M 100 124 C 120 124, 145 132, 155 142" strokeWidth="2" />
        {/* Rib 5 */}
        <path d="M 100 140 C 80 140, 55 150, 46 162" strokeWidth="2" />
        <path d="M 100 140 C 120 140, 145 150, 154 162" strokeWidth="2" />
        {/* Rib 6 */}
        <path d="M 100 156 C 80 156, 58 170, 48 184" strokeWidth="2" />
        <path d="M 100 156 C 120 156, 142 170, 152 184" strokeWidth="2" />
        {/* Rib 7 */}
        <path d="M 100 172 C 85 172, 60 190, 52 205" strokeWidth="2" />
        <path d="M 100 172 C 115 172, 140 190, 148 205" strokeWidth="2" />
      </g>

      {/* 3. HEART SHAPE WITH MAJORS VESSELS */}
      {selectedLayer === 'heart' && (
        <g
          className="transition-all duration-300"
          style={{
            transformOrigin: '103px 122px',
            animation: `heartbeat ${pulseDuration}s ease-in-out infinite`,
          }}
        >
          {/* Radial Glow Overlay */}
          <circle cx="103" cy="122" r="35" fill="url(#heart-glow)" />

          {/* Grandes Vasos: Aorta y Arteria Pulmonar */}
          <path
            d="M 96 100 C 96 85, 110 75, 115 85 C 118 90, 108 95, 105 105 Z"
            fill="none"
            stroke="rgba(239, 68, 68, 0.2)"
            strokeWidth="4"
          />
          <path
            d="M 104 100 C 104 88, 116 85, 120 95"
            fill="none"
            stroke="rgba(6, 182, 212, 0.2)"
            strokeWidth="3.5"
          />

          {/* Heart Silhouette Boundary */}
          <path
            d="M 85 100 C 65 110, 65 145, 95 160 C 125 145, 120 110, 105 100 C 98 95, 92 95, 85 100 Z"
            fill="rgba(239, 68, 68, 0.05)"
            stroke="rgba(239, 68, 68, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            filter="url(#glow-light-heart)"
          />
          
          {/* Ventricles division line */}
          <path
            d="M 98 103 C 92 115, 88 135, 95 159"
            fill="none"
            stroke="rgba(239, 68, 68, 0.15)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        </g>
      )}

      {/* 4. LUNG LOBES SHAPES */}
      {selectedLayer === 'lung' && (
        <g className="transition-all duration-300">
          {/* Lungs Glow Overlay */}
          <path
            d="M 92 80 C 72 70, 45 105, 58 175 C 70 180, 85 178, 92 165 Z"
            fill="url(#lung-glow)"
          />
          <path
            d="M 108 80 C 128 70, 155 105, 142 175 C 130 180, 115 178, 108 165 Z"
            fill="url(#lung-glow)"
          />

          {/* Anatomical Left Lung (Viewer Right) */}
          <g>
            <path
              d="M 108 80 C 108 80, 125 72, 142 85 C 152 105, 155 155, 142 175 C 130 180, 115 178, 108 165 C 104 150, 104 95, 108 80 Z"
              fill="rgba(6, 182, 212, 0.04)"
              stroke="rgba(6, 182, 212, 0.28)"
              strokeWidth="1.5"
              filter="url(#glow-light-lung)"
            />
            {/* Lobe division line: Fissure */}
            <path
              d="M 116 115 C 132 125, 148 140, 151 150"
              fill="none"
              stroke="rgba(6, 182, 212, 0.15)"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />
          </g>

          {/* Anatomical Right Lung (Viewer Left) */}
          <g>
            <path
              d="M 92 80 C 92 80, 75 72, 58 85 C 48 105, 45 155, 58 175 C 70 180, 85 178, 92 165 C 96 150, 96 95, 92 80 Z"
              fill="rgba(6, 182, 212, 0.04)"
              stroke="rgba(6, 182, 212, 0.28)"
              strokeWidth="1.5"
              filter="url(#glow-light-lung)"
            />
            {/* Lobe division lines: Fissures (Horizontal and Oblique) */}
            <path
              d="M 84 115 C 68 125, 52 140, 49 150"
              fill="none"
              stroke="rgba(6, 182, 212, 0.15)"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />
            <path
              d="M 64 128 L 88 128"
              fill="none"
              stroke="rgba(6, 182, 212, 0.15)"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />
          </g>
        </g>
      )}
      </g>

      {/* 5. DYNAMIC HOTSPOTS */}
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
export default TorsoAnterior;
