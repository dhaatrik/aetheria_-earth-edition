
import React, { useEffect, useRef } from 'react';
import { PlanetParameters } from '../types';

interface SoundEngineProps {
  enabled: boolean;
  params: PlanetParameters;
}

export const SoundEngine: React.FC<SoundEngineProps> = ({ enabled, params }) => {
  const contextRef = useRef<AudioContext | null>(null);
  const windNodeRef = useRef<GainNode | null>(null);
  const droneNodeRef = useRef<GainNode | null>(null);
  
  // Initialize Audio Context & Lifecycle Management
  useEffect(() => {
    if (enabled) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      contextRef.current = ctx;

      // WIND (Pink Noise)
      const windGain = ctx.createGain();
      windGain.gain.value = 0.0;
      windGain.connect(ctx.destination);
      windNodeRef.current = windGain;

      const setupPinkNoise = async () => {
        try {
          await ctx.audioWorklet.addModule('/pink-noise-processor.js');
          if (ctx.state === 'closed' || contextRef.current !== ctx) return;

          const pinkNoise = new AudioWorkletNode(ctx, 'pink-noise-processor', {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
          });
          pinkNoise.connect(windGain);
        } catch (e) {
          console.error('Failed to load pink noise processor', e);
        }
      };
      setupPinkNoise();

      // DRONE (Low Oscillator)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 60; // 60Hz hum
      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.0;
      osc.connect(droneGain);
      droneGain.connect(ctx.destination);
      osc.start();
      droneNodeRef.current = droneGain;
    }

    // Cleanup function: Closes context when enabled becomes false or component unmounts
    return () => {
      if (contextRef.current) {
        if (contextRef.current.state !== 'closed') {
           try {
             contextRef.current.close();
           } catch (e) {
             console.warn("Error closing AudioContext", e);
           }
        }
        contextRef.current = null;
        windNodeRef.current = null;
        droneNodeRef.current = null;
      }
    };
  }, [enabled]);

  // Update Sounds based on Params
  useEffect(() => {
    // Only update if context is active
    if (!contextRef.current || contextRef.current.state === 'closed') return;

    const ctx = contextRef.current;
    
    // Wind logic: Higher rotation + higher cloud density = louder wind
    if (windNodeRef.current) {
        const windVolume = Math.min(0.3, (params.rotationSpeed * 2) + (params.cloudDensity * 0.1));
        windNodeRef.current.gain.setTargetAtTime(windVolume, ctx.currentTime, 0.5);
    }

    // Drone logic: City intensity = louder hum
    if (droneNodeRef.current) {
        const droneVolume = Math.min(0.15, params.cityLightIntensity * 0.05);
        droneNodeRef.current.gain.setTargetAtTime(droneVolume, ctx.currentTime, 0.5);
    }

  }, [params]); // Intentionally exclude 'enabled' to avoid re-running if params change while disabled

  return null;
};
