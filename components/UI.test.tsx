import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { UI } from './UI';

expect.extend(matchers);
import { SimulationState } from '../types';

// @vitest-environment jsdom
describe('UI Component', () => {
  const mockUpdateParams = vi.fn();
  const mockOnGenerate = vi.fn();
  const mockToggleProbe = vi.fn();
  const mockTogglePhoto = vi.fn();
  const mockClosePOI = vi.fn();
  const mockOnEvolve = vi.fn();
  const mockOnDisaster = vi.fn();
  const mockOnChallenge = vi.fn();
  const mockToggleAudio = vi.fn();

  const baseState: SimulationState = {
    lore: {
      name: 'Test Planet',
      civilizationType: 'Type I',
      description: 'A beautiful test planet.',
      habitabilityScore: 85,
      age: '1B years',
      atmosphereComposition: ['Nitrogen', 'Oxygen'],
      population: '10B'
    },
    params: {
      seed: 123,
      rotationSpeed: 1,
      tilt: 23.5,
      waterColor: '#0000ff',
      landColor: '#00ff00',
      atmosphereColor: '#ffffff',
      cloudDensity: 0.5,
      snowLevel: 0.2,
      waterMurkiness: 0.1,
      sunType: 'yellow',
      cityLightColor: '#ffff00',
      cityLightIntensity: 1,
      dataLayer: 'visual',
      showSatellites: true
    },
    isLoading: false,
    loadingMessage: '',
    photoMode: false,
    isProbeLanding: false,
    selectedPOI: null,
    challenge: {
      active: false,
      description: '',
      targetStats: {},
      success: false
    },
    audioEnabled: true
  };

  const defaultProps = {
    state: baseState,
    onGenerate: mockOnGenerate,
    updateParams: mockUpdateParams,
    toggleProbe: mockToggleProbe,
    togglePhoto: mockTogglePhoto,
    closePOI: mockClosePOI,
    onEvolve: mockOnEvolve,
    onDisaster: mockOnDisaster,
    onChallenge: mockOnChallenge,
    toggleAudio: mockToggleAudio,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders base UI elements correctly', () => {
    render(<UI {...defaultProps} />);

    // Check Top Bar
    const titles = screen.getAllByText('AETHERIA');
    expect(titles.length).toBeGreaterThan(0);

    // Check Generate buttons (might be multiple like mobile/desktop)
    const generateButtons = screen.getAllByText('⟳ Generate World');
    expect(generateButtons.length).toBeGreaterThan(0);

    const photoModeButtons = screen.getAllByText('Photo Mode');
    expect(photoModeButtons.length).toBeGreaterThan(0);

    // Check Dashboard Tabs
    expect(screen.getByText('Visual')).toBeInTheDocument();
    expect(screen.getByText('Thermal')).toBeInTheDocument();
    expect(screen.getByText('Pop')).toBeInTheDocument();
    expect(screen.getByText('Bio')).toBeInTheDocument();

    // Check Lore Panel
    expect(screen.getByText('Test Planet')).toBeInTheDocument();
    expect(screen.getByText('Civilization: Type I')).toBeInTheDocument();
    expect(screen.getByText('A beautiful test planet.')).toBeInTheDocument();
    expect(screen.getByText('Habitability')).toBeInTheDocument();
  });

  it('handles button clicks correctly', () => {
    render(<UI {...defaultProps} />);

    const generateButtons = screen.getAllByText('⟳ Generate World');
    fireEvent.click(generateButtons[0]);
    expect(mockOnGenerate).toHaveBeenCalledTimes(1);

    const photoModeButtons = screen.getAllByText('Photo Mode');
    fireEvent.click(photoModeButtons[0]);
    expect(mockTogglePhoto).toHaveBeenCalledTimes(1);

    const thermalTabs = screen.getAllByText('Thermal');
    fireEvent.click(thermalTabs[0]);
    expect(mockUpdateParams).toHaveBeenCalledWith({ dataLayer: 'thermal' });

    const evolveButtons = screen.getAllByText('Evolution Step (+1ky)');
    fireEvent.click(evolveButtons[0]);
    expect(mockOnEvolve).toHaveBeenCalledTimes(1);

    const eventButtons = screen.getAllByText('Trigger Event');
    fireEvent.click(eventButtons[0]);
    expect(mockOnDisaster).toHaveBeenCalledTimes(1);

    const challengeButtons = screen.getAllByText('Start Terraforming Challenge');
    fireEvent.click(challengeButtons[0]);
    expect(mockOnChallenge).toHaveBeenCalledTimes(1);
  });

  it('displays loading state correctly', () => {
    render(<UI {...defaultProps} state={{ ...baseState, isLoading: true, loadingMessage: 'Generating terrain...' }} />);

    expect(screen.getByText('Generating terrain...')).toBeInTheDocument();
    const generateButton = screen.getByText('Simulating...');
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
  });

  it('hides UI when in photo mode', () => {
    const { container } = render(<UI {...defaultProps} state={{ ...baseState, photoMode: true }} />);

    // UI should show "Exit Photo Mode"
    expect(screen.getByText('Exit Photo Mode')).toBeInTheDocument();

    // Check that header is NOT present by querying for the header element
    const header = container.querySelector('header');
    expect(header).not.toBeInTheDocument();
  });

  it('renders challenge HUD when active', () => {
    const challengeState: SimulationState = {
      ...baseState,
      challenge: {
        active: true,
        description: 'Increase cloud density.',
        targetStats: { cloudDensity: 0.8 },
        success: false
      }
    };
    render(<UI {...defaultProps} state={challengeState} />);

    expect(screen.getByText('Terraforming Goal')).toBeInTheDocument();
    expect(screen.getByText('Increase cloud density.')).toBeInTheDocument();
    expect(screen.getByText('Target Clouds: 0.8')).toBeInTheDocument();
  });

  it('renders POI modal when selected', () => {
    const poiState: SimulationState = {
      ...baseState,
      selectedPOI: {
        title: 'Ancient Ruins',
        description: 'Remnants of a forgotten era.',
        coordinates: { x: 45.5, y: -12.3 }
      }
    };
    render(<UI {...defaultProps} state={poiState} />);

    expect(screen.getByText('Ancient Ruins')).toBeInTheDocument();
    expect(screen.getByText('Remnants of a forgotten era.')).toBeInTheDocument();
    expect(screen.getByText(/LAT: -12.3000 \| LON: 45.5000/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Report'));
    expect(mockClosePOI).toHaveBeenCalledTimes(1);
  });

  it('renders probe landing overlay', () => {
    render(<UI {...defaultProps} state={{ ...baseState, isProbeLanding: true }} />);
    expect(screen.getByText('ESTABLISHING LINK...')).toBeInTheDocument();
    expect(screen.getByText('DESCENDING TO SURFACE')).toBeInTheDocument();
  });

  it('handles slider changes', () => {
    render(<UI {...defaultProps} />);

    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThan(0);

    // Cloud Density Slider
    fireEvent.change(sliders[0], { target: { value: '0.8' } });
    expect(mockUpdateParams).toHaveBeenCalledWith({ cloudDensity: 0.8 });
  });

  it('handles sun type changes', () => {
    render(<UI {...defaultProps} />);

    // There are multiple "red" texts on the screen, get the one that's a button
    const buttons = screen.getAllByText('red');
    const redButton = buttons.find(b => b.tagName === 'BUTTON');
    if (redButton) {
      fireEvent.click(redButton);
      expect(mockUpdateParams).toHaveBeenCalledWith({ sunType: 'red' });
    }
  });

  it('toggles audio', () => {
    render(<UI {...defaultProps} />);

    const audioButtons = screen.getAllByRole('button');
    // The audio button is the second one in the header, typically has "🔊" or "🔇"
    const audioButton = audioButtons.find(btn => btn.textContent?.includes('🔊') || btn.textContent?.includes('🔇'));
    if (audioButton) {
      fireEvent.click(audioButton);
      expect(mockToggleAudio).toHaveBeenCalledTimes(1);
    }
  });
});
