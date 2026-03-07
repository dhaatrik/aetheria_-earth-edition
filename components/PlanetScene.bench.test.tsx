// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { PlanetMesh } from './PlanetScene';
import { PlanetParameters } from '../types';

// Mock THREE.TextureLoader to avoid network requests and errors
vi.mock('three', async () => {
  const actual = await vi.importActual('three') as any;
  return {
    ...actual,
    TextureLoader: class {
      load(url: string, onLoad: (tex: any) => void) {
        const tex = new actual.Texture();
        if (onLoad) onLoad(tex); // Synchronous callback
        return tex;
      }
    }
  };
});

// Mock useTexture to avoid TextureLoader issues entirely
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

// Mock maath random to avoid issues
vi.mock('maath/random/dist/maath-random.esm', () => ({
  inSphere: (array: Float32Array) => array,
}));

describe('PlanetMesh Performance', () => {
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

  it('updates uniforms redundantly in useFrame', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <PlanetMesh params={defaultParams} onClick={() => {}} />
    );

    // The structure is <group><mesh (planet)><mesh (clouds)><mesh (atmos)>...</group>
    const group = renderer.scene.children[0];
    const planetMesh = group.children[0];

    // Check if we got the right mesh
    if (!planetMesh || !planetMesh.instance) {
        throw new Error('Planet mesh not found');
    }

    const mesh = planetMesh.instance as THREE.Mesh;
    const material = mesh.material as THREE.ShaderMaterial;

    // Ensure uniforms exist
    if (!material.uniforms || !material.uniforms.uSnowLevel) {
        throw new Error('Uniforms not initialized correctly');
    }

    // Spy on uSnowLevel.value setter
    let setCounts = 0;
    let currentValue = material.uniforms.uSnowLevel.value;
    const uniformObj = material.uniforms.uSnowLevel;

    Object.defineProperty(uniformObj, 'value', {
        configurable: true,
        get: () => currentValue,
        set: (v) => {
            currentValue = v;
            setCounts++;
        }
    });

    // Advance frames
    const framesToAdvance = 10;
    await renderer.advanceFrames(framesToAdvance, 0.1);

    console.log(`uSnowLevel setter called ${setCounts} times over ${framesToAdvance} frames`);

    // Optimized: Updates moved to useEffect, so no updates during frame loop for static params.
    expect(setCounts).toBe(0);
  });
});
