// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { SoundEngine } from './SoundEngine';
import { PlanetParameters } from '../types';

// Mock Web Audio API
class MockAudioContext {
  state = 'running';
  destination = {};
  currentTime = 0;

  createGain() {
    return {
      gain: {
        value: 1,
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440 },
      connect: vi.fn(),
      start: vi.fn(),
    };
  }

  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

class MockAudioWorkletNode {
  connect = vi.fn();
  constructor(context: any, name: string, options: any) {}
}

describe('SoundEngine', () => {
  let container: HTMLDivElement | null = null;
  let root: any = null;

  const defaultParams: PlanetParameters = {
    seed: 123,
    rotationSpeed: 1,
    tilt: 0.4,
    waterColor: '#0000ff',
    landColor: '#00ff00',
    atmosphereColor: '#88ccff',
    cloudDensity: 0.5,
    snowLevel: 0.1,
    waterMurkiness: 0.2,
    sunType: 'yellow',
    cityLightColor: '#ffaa00',
    cityLightIntensity: 1.0,
    dataLayer: 'visual',
    showSatellites: false
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Setup window mocks
    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = MockAudioContext;
    (window as any).AudioWorkletNode = MockAudioWorkletNode;

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (container) {
      container.remove();
      container = null;
    }
    vi.restoreAllMocks();
  });

  it('does not initialize AudioContext when disabled', () => {
    act(() => {
      root.render(<SoundEngine enabled={false} params={defaultParams} />);
    });

    // Since we mock window.AudioContext, we can check if it was instantiated
    // A simpler way: since SoundEngine doesn't expose refs, we can spy on MockAudioContext constructor if needed,
    // but checking that console.log("Audio Engine Started") is not called is a good proxy.
    expect(console.log).not.toHaveBeenCalledWith("Audio Engine Started");
  });

  it('initializes AudioContext and nodes when enabled', async () => {
    await act(async () => {
      root.render(<SoundEngine enabled={true} params={defaultParams} />);
    });

    expect(console.log).toHaveBeenCalledWith("Audio Engine Started");
  });

  it('updates gain nodes based on params when enabled', async () => {
    // We need to spy on the createGain method of our MockAudioContext
    // to get references to the created gain nodes' setTargetAtTime functions.

    const setTargetAtTimeMock = vi.fn();
    const mockCreateGain = vi.fn().mockImplementation(() => ({
      gain: {
        value: 0,
        setTargetAtTime: setTargetAtTimeMock,
      },
      connect: vi.fn(),
    }));

    (window as any).AudioContext = class extends MockAudioContext {
      createGain = mockCreateGain;
    };

    await act(async () => {
      root.render(<SoundEngine enabled={true} params={defaultParams} />);
    });

    // It should have created two gain nodes (wind and drone)
    expect(mockCreateGain).toHaveBeenCalledTimes(2);

    // Initial render params effect
    expect(setTargetAtTimeMock).toHaveBeenCalled();

    setTargetAtTimeMock.mockClear();

    // Update params
    const updatedParams = {
        ...defaultParams,
        rotationSpeed: 2.0, // increased
        cloudDensity: 1.0,  // increased
        cityLightIntensity: 2.0 // increased
    };

    await act(async () => {
        root.render(<SoundEngine enabled={true} params={updatedParams} />);
    });

    // Expect setTargetAtTime to be called again with updated values
    expect(setTargetAtTimeMock).toHaveBeenCalledTimes(2); // once for wind, once for drone

    // windVolume = Math.min(0.3, (2.0 * 2) + (1.0 * 0.1)) = Math.min(0.3, 4.1) = 0.3
    // droneVolume = Math.min(0.15, 2.0 * 0.05) = Math.min(0.15, 0.1) = 0.1
    // We can check if it was called with the correct args
    const calls = setTargetAtTimeMock.mock.calls;
    const windCall = calls.find(call => call[0] === 0.3);
    const droneCall = calls.find(call => call[0] === 0.1);

    expect(windCall).toBeTruthy();
    expect(droneCall).toBeTruthy();
  });

  it('cleans up AudioContext on unmount', async () => {
    let mockContextInstance: any = null;

    (window as any).AudioContext = class extends MockAudioContext {
      constructor() {
        super();
        mockContextInstance = this;
        vi.spyOn(this, 'close');
      }
    };

    await act(async () => {
      root.render(<SoundEngine enabled={true} params={defaultParams} />);
    });

    expect(mockContextInstance).not.toBeNull();

    await act(async () => {
      root.render(<SoundEngine enabled={false} params={defaultParams} />);
    });

    expect(mockContextInstance.close).toHaveBeenCalled();
    expect(mockContextInstance.state).toBe('closed');
  });
});
