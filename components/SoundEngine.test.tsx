import React from 'react';
import { render } from '@testing-library/react';
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { SoundEngine } from './SoundEngine';
import { PlanetParameters } from '../types';

// Mock Web Audio API
class MockAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockGainNode extends MockAudioNode {
  gain = {
    value: 1,
    setTargetAtTime: vi.fn(),
  };
}

class MockOscillatorNode extends MockAudioNode {
  type = 'sine';
  frequency = { value: 440 };
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioWorkletNode extends MockAudioNode {
  constructor(context: any, name: string, options: any) {
    super();
  }
}

const mockSetTargetAtTime = vi.fn();
const mockClose = vi.fn().mockResolvedValue(undefined);

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = new MockAudioNode();
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };
  createGain = vi.fn(() => {
    const node = new MockGainNode();
    node.gain.setTargetAtTime = mockSetTargetAtTime;
    return node;
  });
  createOscillator = vi.fn(() => new MockOscillatorNode());
  close = mockClose;
}

const defaultParams: PlanetParameters = {
  seed: 123,
  rotationSpeed: 0.05,
  tilt: 23.5,
  waterColor: '#0000ff',
  landColor: '#00ff00',
  atmosphereColor: '#00ffff',
  cloudDensity: 0.5,
  snowLevel: 0.1,
  waterMurkiness: 0.0,
  sunType: 'yellow',
  cityLightColor: '#ffff00',
  cityLightIntensity: 1.0,
  dataLayer: 'visual',
  showSatellites: false,
};

describe('SoundEngine', () => {
  let container: HTMLDivElement | null = null;
  let originalAudioContext: any;
  let originalWebkitAudioContext: any;
  let originalAudioWorkletNode: any;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Setup globals
    originalAudioContext = window.AudioContext;
    originalWebkitAudioContext = (window as any).webkitAudioContext;
    originalAudioWorkletNode = window.AudioWorkletNode;

    window.AudioContext = MockAudioContext as any;
    (window as any).webkitAudioContext = undefined;
    window.AudioWorkletNode = MockAudioWorkletNode as any;
  });

  afterEach(() => {
    if (container) {
      container.remove();
      container = null;
    }

    // Restore globals
    window.AudioContext = originalAudioContext;
    (window as any).webkitAudioContext = originalWebkitAudioContext;
    window.AudioWorkletNode = originalAudioWorkletNode;

    vi.clearAllMocks();
  });

  it('renders nothing when disabled', () => {
    const { container } = render(<SoundEngine enabled={false} params={defaultParams} />);
    expect(container.firstChild).toBeNull();
  });

  it('initializes AudioContext and nodes when enabled', async () => {
    render(<SoundEngine enabled={true} params={defaultParams} />);

    // Using setTimeout to wait for the async setupPinkNoise to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockClose).not.toHaveBeenCalled();
  });

  it('closes AudioContext when unmounted', () => {
    const { unmount } = render(<SoundEngine enabled={true} params={defaultParams} />);

    unmount();

    expect(mockClose).toHaveBeenCalled();
  });

  it('updates gain node values when params change', () => {

    const { rerender } = render(<SoundEngine enabled={true} params={defaultParams} />);

    // Clear initial calls from setup
    mockSetTargetAtTime.mockClear();

    const newParams = { ...defaultParams, rotationSpeed: 0.1, cloudDensity: 0.8, cityLightIntensity: 2.0 };
    rerender(<SoundEngine enabled={true} params={newParams} />);

    // Wind logic: Math.min(0.3, (params.rotationSpeed * 2) + (params.cloudDensity * 0.1))
    // newParams: (0.1 * 2) + (0.8 * 0.1) = 0.2 + 0.08 = 0.28
    expect(mockSetTargetAtTime).toHaveBeenCalledWith(0.28, expect.any(Number), 0.5);

    // Drone logic: Math.min(0.15, params.cityLightIntensity * 0.05)
    // newParams: 2.0 * 0.05 = 0.1
    expect(mockSetTargetAtTime).toHaveBeenCalledWith(0.1, expect.any(Number), 0.5);
  });
});
