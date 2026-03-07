import React from 'react';
import { SimulationState, PlanetParameters } from '../types';
import { Header } from './ui/Header';
import { LoadingOverlay } from './ui/LoadingOverlay';
import { ChallengeHUD } from './ui/ChallengeHUD';
import { POIModal } from './ui/POIModal';
import { ProbeOverlay } from './ui/ProbeOverlay';
import { DashboardPanel } from './ui/DashboardPanel';
import { LorePanel } from './ui/LorePanel';

interface UIProps {
  state: SimulationState;
  onGenerate: () => void;
  updateParams: (params: Partial<PlanetParameters>) => void;
  toggleProbe: () => void;
  togglePhoto: () => void;
  closePOI: () => void;
  onEvolve: () => void;
  onDisaster: () => void;
  onChallenge: () => void;
  toggleAudio: () => void;
}

export const UI: React.FC<UIProps> = ({ state, onGenerate, updateParams, toggleProbe, togglePhoto, closePOI, onEvolve, onDisaster, onChallenge, toggleAudio }) => {
  const { lore, isLoading, params, photoMode, isProbeLanding, selectedPOI, challenge, loadingMessage, audioEnabled } = state;

  if (photoMode) {
     return (
        <div className="absolute inset-0 pointer-events-auto flex items-end justify-center p-10 z-50">
            <button onClick={togglePhoto} className="px-6 py-2 bg-black/50 backdrop-blur text-white border border-white/20 hover:bg-white/10 uppercase tracking-widest text-sm">
                Exit Photo Mode
            </button>
        </div>
     );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header */}
      <Header
        audioEnabled={audioEnabled}
        toggleAudio={toggleAudio}
        togglePhoto={togglePhoto}
        onGenerate={onGenerate}
        isLoading={isLoading}
      />
      
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay loadingMessage={loadingMessage} />}

      {/* Challenge HUD */}
      <ChallengeHUD challenge={challenge} params={params} lore={lore} />

      {/* POI Modal */}
      <POIModal selectedPOI={selectedPOI} closePOI={closePOI} />

      {/* Surface Probe Overlay */}
      <ProbeOverlay isProbeLanding={isProbeLanding} />

      {/* Main Info Panel */}
      <main className="flex flex-col md:flex-row justify-between items-end gap-6 pointer-events-auto">
        
        {/* LEFT: Dashboard */}
        <DashboardPanel
            params={params}
            updateParams={updateParams}
            onEvolve={onEvolve}
            onDisaster={onDisaster}
            onChallenge={onChallenge}
            isProbeLanding={isProbeLanding}
            toggleProbe={toggleProbe}
        />

        {/* RIGHT: Lore */}
        <LorePanel lore={lore} />

      </main>
    </div>
  );
};
