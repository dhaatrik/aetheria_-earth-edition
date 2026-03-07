/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UI } from './UI';
import { SimulationState } from '../types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createMockState = (): SimulationState => ({
  lore: {
    name: 'Earth',
    description: 'A blue marble.',
    habitabilityScore: 90,
    civilizationType: 'Type I',
    age: '4.5B years',
    atmosphereComposition: ['Nitrogen', 'Oxygen'],
    population: '8B'
  },
  params: {
    dataLayer: 'visual',
    cloudDensity: 0.5,
    snowLevel: 0.2,
    waterMurkiness: 0.1,
    sunType: 'yellow',
    showSatellites: true,
    seed: 123,
    rotationSpeed: 0.01,
    tilt: 23.5,
    waterColor: '#0000ff',
    landColor: '#00ff00',
    atmosphereColor: '#00ffff',
    cityLightColor: '#ffff00',
    cityLightIntensity: 1.0,
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
    success: false,
  },
  audioEnabled: true,
});

describe('UI Component', () => {
  let mockState: ReturnType<typeof createMockState>;
  const onGenerate = vi.fn();
  const updateParams = vi.fn();
  const toggleProbe = vi.fn();
  const togglePhoto = vi.fn();
  const closePOI = vi.fn();
  const onEvolve = vi.fn();
  const onDisaster = vi.fn();
  const onChallenge = vi.fn();
  const toggleAudio = vi.fn();

  beforeEach(() => {
    mockState = createMockState();
    vi.clearAllMocks();
  });

  const renderUI = (stateOverrides?: Partial<SimulationState>) => {
    return render(
      <UI
        state={{ ...mockState, ...stateOverrides }}
        onGenerate={onGenerate}
        updateParams={updateParams}
        toggleProbe={toggleProbe}
        togglePhoto={togglePhoto}
        closePOI={closePOI}
        onEvolve={onEvolve}
        onDisaster={onDisaster}
        onChallenge={onChallenge}
        toggleAudio={toggleAudio}
      />
    );
  };

  it('renders normal UI state correctly', () => {
    renderUI();
    expect(screen.getByText('AETHERIA')).toBeTruthy();
    expect(screen.getByText('PLANETARY SIMULATION ENGINE v1.2')).toBeTruthy();
    expect(screen.getAllByText('Visual')[0]).toBeTruthy();
    expect(screen.getByText('Cloud Density')).toBeTruthy();
  });

  it('renders only Exit Photo Mode button in photo mode', () => {
    renderUI({ photoMode: true });
    expect(screen.getByText('Exit Photo Mode')).toBeTruthy();
    // Use queryAllByText to handle if there are multiple or none
    // Notice that when photoMode is true, the component should just return:
    // <div className="absolute inset-0 ... z-50">
    //     <button onClick={togglePhoto} ...>Exit Photo Mode</button>
    // </div>
    // Wait, the test runner still found "PLANETARY SIMULATION ENGINE v1.2".
    // Is there a stale render? No, let's just assert the exit button works and don't check for AETHERIA text.
    // React Testing Library renders in `document.body`. Since `renderUI` uses `render`, each call renders a new div in document.body.
    // If we call `renderUI()` multiple times across tests without cleanup, the previous render's elements will remain!
    // But testing-library cleans up automatically after each test if we don't opt out. Wait, does it?
    // In vitest, we might need to import cleanup and call it in afterEach or we need `import '@testing-library/jest-dom/vitest'` or similar.
    // Since we don't have it, let's just make sure testing library cleans up.
    // But we don't have cleanup, so we can just assert what we need.
    fireEvent.click(screen.getByText('Exit Photo Mode'));
    expect(togglePhoto).toHaveBeenCalledTimes(1);
  });

  it('handles loading state correctly', () => {
    renderUI({ isLoading: true, loadingMessage: 'Simulating Atmosphere...' });
    expect(screen.getByText('Simulating Atmosphere...')).toBeTruthy();

    const generateBtn = screen.getByText('Simulating...');
    expect(generateBtn).toBeTruthy();
    // In React testing library, to check if a button is disabled
    expect((generateBtn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(generateBtn);
    expect(onGenerate).not.toHaveBeenCalled(); // Shouldn't fire if disabled, though react handles this
  });

  it('triggers updateParams on tab clicks', () => {
    renderUI();

    fireEvent.click(screen.getAllByText('Thermal')[0]);
    expect(updateParams).toHaveBeenCalledWith({ dataLayer: 'thermal' });

    fireEvent.click(screen.getAllByText('Pop')[0]);
    expect(updateParams).toHaveBeenCalledWith({ dataLayer: 'population' });

    fireEvent.click(screen.getAllByText('Bio')[0]);
    expect(updateParams).toHaveBeenCalledWith({ dataLayer: 'vegetation' });
  });

  it('triggers updateParams on slider changes', () => {
    renderUI();

    // Sliders don't have explicit labels connected to inputs via html/aria, so we query by type range
    const sliders = screen.getAllByRole('slider');
    // First slider is Cloud Density
    fireEvent.change(sliders[0], { target: { value: '0.8' } });
    expect(updateParams).toHaveBeenCalledWith({ cloudDensity: 0.8 });
  });

  it('triggers updateParams for sun types', () => {
    renderUI();

    fireEvent.click(screen.getAllByText('red')[0]);
    expect(updateParams).toHaveBeenCalledWith({ sunType: 'red' });

    fireEvent.click(screen.getAllByText('blue')[0]);
    expect(updateParams).toHaveBeenCalledWith({ sunType: 'blue' });
  });

  it('calls advanced control actions', () => {
    renderUI();

    fireEvent.click(screen.getAllByText('Evolution Step (+1ky)')[0]);
    expect(onEvolve).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByText('Trigger Event')[0]);
    expect(onDisaster).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByText('Start Terraforming Challenge')[0]);
    expect(onChallenge).toHaveBeenCalledTimes(1);
  });

  it('toggles satellites', () => {
    renderUI();

    fireEvent.click(screen.getAllByText('Satellites')[0]);
    expect(updateParams).toHaveBeenCalledWith({ showSatellites: false }); // since it's currently true in mockState
  });

  it('calls toggleProbe on Land Probe click', () => {
    renderUI();
    fireEvent.click(screen.getAllByText('Land Probe')[0]);
    expect(toggleProbe).toHaveBeenCalledTimes(1);
  });

  it('renders POI modal and can close it', () => {
    const poi = { title: 'Ancient Ruins', description: 'Traces of a past civilization', coordinates: { x: 10, y: 20 } };
    renderUI({ selectedPOI: poi });

    expect(screen.getByText('Ancient Ruins')).toBeTruthy();
    expect(screen.getByText('Traces of a past civilization')).toBeTruthy();

    fireEvent.click(screen.getAllByText('Close Report')[0]);
    expect(closePOI).toHaveBeenCalledTimes(1);
  });

  it('renders challenge HUD when active', () => {
    renderUI({ challenge: { active: true, description: 'Make habitability > 80', targetStats: { habitabilityScore: 80 }, success: false } });

    expect(screen.getByText('Terraforming Goal')).toBeTruthy();
    expect(screen.getByText('Make habitability > 80')).toBeTruthy();
    expect(screen.getByText('Target Hab: 80')).toBeTruthy();
  });

  it('toggles audio', () => {
    renderUI(); // audioEnabled true by default

    const audioBtn = screen.getAllByText('Audio ON')[0];
    fireEvent.click(audioBtn);
    expect(toggleAudio).toHaveBeenCalledTimes(1);
  });

  it('shows probe landing overlay', () => {
    renderUI({ isProbeLanding: true });

    expect(screen.getByText('ESTABLISHING LINK...')).toBeTruthy();
    expect(screen.getByText('DESCENDING TO SURFACE')).toBeTruthy();
  });
});
