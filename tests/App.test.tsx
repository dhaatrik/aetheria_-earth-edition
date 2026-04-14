/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import App from '../App';
import * as geminiService from '../services/geminiService';

// Mock the components
vi.mock('../components/PlanetScene', () => ({
  PlanetScene: (props: any) => (
    <div data-testid="planet-scene" onClick={() => props.onPlanetClick({ x: 0.5, y: 0.5 })}>
      PlanetScene
    </div>
  )
}));

vi.mock('../components/UI', () => ({
  UI: (props: any) => (
    <div data-testid="ui">
      <button data-testid="ui-generate" onClick={props.onGenerate}>Generate</button>
      <button data-testid="ui-evolve" onClick={props.onEvolve}>Evolve</button>
      <button data-testid="ui-disaster" onClick={props.onDisaster}>Disaster</button>
      <button data-testid="ui-challenge" onClick={props.onChallenge}>Challenge</button>
      <button data-testid="ui-toggle-probe" onClick={props.toggleProbe}>Toggle Probe</button>
      <button data-testid="ui-toggle-photo" onClick={props.togglePhoto}>Toggle Photo</button>
      <button data-testid="ui-close-poi" onClick={props.closePOI}>Close POI</button>
      <button data-testid="ui-toggle-audio" onClick={props.toggleAudio}>Toggle Audio</button>
      <span data-testid="ui-is-loading">{props.state.isLoading ? 'loading' : 'idle'}</span>
    </div>
  )
}));

vi.mock('../components/SoundEngine', () => ({
  SoundEngine: () => <div data-testid="sound-engine">SoundEngine</div>
}));

// Mock the service
vi.mock('../services/geminiService', () => ({
  generatePlanetData: vi.fn(),
  generatePOIReport: vi.fn(),
  generatePlanetTexture: vi.fn(),
  evolveCivilization: vi.fn(),
  triggerDisaster: vi.fn(),
  generateChallenge: vi.fn()
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Need to cleanup testing DOM since we call render multiple times
    vi.clearAllMocks();
    cleanup();
  });

  it('renders application container', () => {
    render(<App />);
    expect(screen.getByTestId('planet-scene')).toBeDefined();
    expect(screen.getByTestId('ui')).toBeDefined();
    expect(screen.getByTestId('sound-engine')).toBeDefined();
  });

  it('handleGenerate updates state', async () => {
    const mockData = {
      lore: {
        description: "Test description",
        atmosphereComposition: ["Nitrogen"]
      },
      params: {
        rotationSpeed: 0.1
      }
    };
    (geminiService.generatePlanetData as any).mockResolvedValue(mockData);
    (geminiService.generatePlanetTexture as any).mockResolvedValue("data:image/png;base64,test");

    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('ui-generate'));
    });

    expect(geminiService.generatePlanetData).toHaveBeenCalledTimes(1);
    expect(geminiService.generatePlanetTexture).toHaveBeenCalledTimes(1);
    expect(geminiService.generatePlanetTexture).toHaveBeenCalledWith("Test description Nitrogen");
  });

  it('handleEvolve updates state', async () => {
    const mockEvolveData = {
      loreUpdate: { description: "Evolved" },
      paramsUpdate: { cityLightIntensity: 2.0 }
    };
    (geminiService.evolveCivilization as any).mockResolvedValue(mockEvolveData);

    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('ui-evolve'));
    });

    expect(geminiService.evolveCivilization).toHaveBeenCalledTimes(1);
  });

  it('handleDisaster updates state', async () => {
    const mockDisasterData = {
      loreUpdate: { description: "Disaster struck" },
      paramsUpdate: { cityLightColor: "#ff0000" }
    };
    (geminiService.triggerDisaster as any).mockResolvedValue(mockDisasterData);

    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('ui-disaster'));
    });

    expect(geminiService.triggerDisaster).toHaveBeenCalledTimes(1);
  });

  it('handleChallenge updates state', async () => {
    const mockChallengeData = {
      active: true,
      success: false,
      description: "Test Challenge",
      targetStats: { cloudDensity: 0.8 }
    };
    (geminiService.generateChallenge as any).mockResolvedValue(mockChallengeData);

    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('ui-challenge'));
    });

    expect(geminiService.generateChallenge).toHaveBeenCalledTimes(1);
  });

  it('handlePlanetClick fetches POI report', async () => {
    const mockPOI = {
      title: "Test POI",
      description: "POI Description",
      coordinates: { x: 0.5, y: 0.5 }
    };
    (geminiService.generatePOIReport as any).mockResolvedValue(mockPOI);

    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('planet-scene'));
    });

    expect(geminiService.generatePOIReport).toHaveBeenCalledTimes(1);
    expect(geminiService.generatePOIReport).toHaveBeenCalledWith(
      expect.any(String),
      { x: 0.5, y: 0.5 }
    );
  });
});
