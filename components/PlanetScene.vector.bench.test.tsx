// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { PlanetParameters } from '../types';

vi.mock('three', async () => {
  const actual = await vi.importActual('three') as any;

  const MockVector3 = function(x?: number, y?: number, z?: number) {
    if (typeof globalThis.vectorInstantiationCount !== 'undefined') {
        globalThis.vectorInstantiationCount++;
    }
    return new actual.Vector3(x, y, z);
  };
  MockVector3.prototype = actual.Vector3.prototype;

  return {
    ...actual,
    Vector3: MockVector3,
    TextureLoader: class {
      load(url: string, onLoad: (tex: any) => void) {
        const tex = new actual.Texture();
        if (onLoad) onLoad(tex);
        return tex;
      }
    }
  };
});

vi.mock('@react-three/drei', async () => {
    const actual = await vi.importActual('@react-three/drei');
    return {
        ...actual,
        useTexture: () => ({
            day: new THREE.Texture(),
            spec: new THREE.Texture(),
            norm: new THREE.Texture(),
            cloud: new THREE.Texture(),
        })
    };
});

vi.mock('maath/random/dist/maath-random.esm', () => ({
  inSphere: (array: Float32Array) => array,
}));

// Import PlanetMesh AFTER mocking
import { PlanetMesh } from './PlanetScene';

declare global {
  var vectorInstantiationCount: number;
}

describe('PlanetMesh Vector3 Performance', () => {
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

  it('measures Vector3 instantiations during render', async () => {
    globalThis.vectorInstantiationCount = 0;

    // Initial Render
    const renderer = await ReactThreeTestRenderer.create(
      <PlanetMesh params={defaultParams} onClick={() => {}} />
    );

    const initialInstantiations = globalThis.vectorInstantiationCount;
    console.log(`Initial Vector3 instantiations: ${initialInstantiations}`);

    // Change props to trigger re-renders and measure churn
    const newParams = { ...defaultParams, sunType: 'red' as const, textureMapUrl: 'test' };
    await renderer.update(<PlanetMesh params={newParams} onClick={() => {}} />);

    const finalInstantiations = globalThis.vectorInstantiationCount;
    console.log(`Final Vector3 instantiations: ${finalInstantiations}`);

    expect(initialInstantiations).toBe(0);
    expect(finalInstantiations).toBe(0);
  });
});
