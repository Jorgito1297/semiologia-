import React from 'react';
import { Hotspot } from '../types';
import { useSimulationStore } from '../stores/simulation.store';
import { CLINICAL_SCENARIOS } from '../simulation/scenarios';

interface AnatomyHotspotProps {
  hotspot: Hotspot;
  isActive: boolean;
  onClick: () => void;
}

export const AnatomyHotspot: React.FC<AnatomyHotspotProps> = ({ hotspot, isActive, onClick }) => {
  const isHeart = hotspot.type === 'heart';
  
  const activeScenarioId = useSimulationStore((state) => state.activeScenarioId);
  const activeScenario = CLINICAL_SCENARIOS.find((s) => s.id === activeScenarioId);
  
  const hr = activeScenario?.vitalSigns.hr || 72;
  const rr = activeScenario?.vitalSigns.rr || 15;
  
  const heartDuration = 60 / hr;
  const lungDuration = 60 / rr;

  const getLabel = (id: string): string => {
    switch (id) {
      case 'aortico': return '1';
      case 'pulmonar': return '2';
      case 'erb': return '3';
      case 'trico': return '4';
      case 'mitral': return '5';
      case 'pulmon_ant_sup_der':
      case 'pulmon_post_sup_izq':
        return 'L1';
      case 'pulmon_ant_sup_izq':
      case 'pulmon_post_sup_der':
        return 'L2';
      case 'pulmon_ant_inf_der':
      case 'pulmon_post_inf_izq':
        return 'L3';
      case 'pulmon_ant_inf_izq':
      case 'pulmon_post_inf_der':
        return 'L4';
      default:
        return '•';
    }
  };

  return (
    <g
      transform={`translate(${hotspot.x}, ${hotspot.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer group select-none"
    >
      {/* Pulsing glow ring when active */}
      {isActive && (
        <circle
          r="14"
          className={`opacity-60 ${isHeart ? 'fill-red-500' : 'fill-cyan-500'}`}
          style={{
            transformOrigin: '0px 0px',
            animation: isHeart
              ? `customHeartPing ${heartDuration}s cubic-bezier(0.1, 0.8, 0.2, 1) infinite`
              : `customLungPulse ${lungDuration}s ease-in-out infinite`,
          }}
        />
      )}

      {/* Larger hover target area */}
      <circle
        r="16"
        fill="transparent"
        className="stroke-none"
      />

      {/* Dynamic outline ring */}
      <circle
        r="11"
        strokeWidth="1.5"
        className={`transition-all duration-300 fill-transparent ${
          isActive
            ? isHeart ? 'stroke-red-300 scale-110' : 'stroke-cyan-300 scale-110'
            : isHeart 
              ? 'stroke-red-500/20 group-hover:stroke-red-400' 
              : 'stroke-cyan-500/20 group-hover:stroke-cyan-400'
        }`}
      />

      {/* Main physical dot */}
      <circle
        r="8"
        strokeWidth="1"
        className={`transition-all duration-300 ${
          isActive
            ? isHeart
              ? 'fill-red-500 stroke-red-400'
              : 'fill-cyan-500 stroke-cyan-400'
            : isHeart
              ? 'fill-red-950/60 stroke-red-500/50 group-hover:fill-red-500 group-hover:stroke-red-400'
              : 'fill-cyan-950/60 stroke-cyan-500/50 group-hover:fill-cyan-500 group-hover:stroke-cyan-400'
        }`}
      />

      {/* Inner label (1-5 for heart, L1-L4 for lung) */}
      <text
        y="3"
        textAnchor="middle"
        className={`font-mono text-[8px] font-bold pointer-events-none select-none transition-colors duration-300 ${
          isActive
            ? 'fill-white'
            : isHeart
              ? 'fill-red-400 group-hover:fill-white'
              : 'fill-cyan-400 group-hover:fill-white'
        }`}
      >
        {getLabel(hotspot.id)}
      </text>
    </g>
  );
};
export default AnatomyHotspot;
