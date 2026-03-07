// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { PlanetMesh } from './PlanetScene';
import { PlanetParameters } from '../types';

// Mock THREE to track ShaderMaterial instantiations
const shaderMaterialSpy = vi.fn();

vi.mock('three', async () => {
  const actual = await vi.importActual('three') as any;

  // We need a proper constructor function
  const MockShaderMaterial = function(args: any) {
      shaderMaterialSpy(args);
      return new actual.ShaderMaterial(args);
  };

  // Inherit prototype so instanceof checks work
  MockShaderMaterial.prototype = actual.ShaderMaterial.prototype;

  return {
    ...actual,
    ShaderMaterial: MockShaderMaterial,
    TextureLoader: class {
        load(url: string, onLoad?: (texture: THREE.Texture) => void) {
            const tex = new actual.Texture();
            if(onLoad) onLoad(tex);
            return tex;
        }
    }
  };
});

// Mock useTexture
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

// Mock maath
vi.mock('maath/random/dist/maath-random.esm', () => ({
  inSphere: (array: Float32Array) => array,
}));

describe('PlanetMesh Material Stability', () => {
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

  it('should not re-create ShaderMaterial when sunType changes', async () => {
    // Reset spy
    shaderMaterialSpy.mockClear();

    const renderer = await ReactThreeTestRenderer.create(
      <PlanetMesh params={defaultParams} onClick={() => {}} />
    );

    // Initial render creates materials.
    const initialCount = shaderMaterialSpy.mock.calls.length;

    // Expect at least 1 call (PlanetMesh creates planetMaterial, cloudMaterial, atmosMaterial)
    // Actually 3 calls.
    expect(initialCount).toBeGreaterThan(0);

    // Change sunType which affects sunColorVec
    const newParams = { ...defaultParams, sunType: 'red' as const };

    await renderer.update(<PlanetMesh params={newParams} onClick={() => {}} />);

    const finalCount = shaderMaterialSpy.mock.calls.length;

    // Calculate new calls
    const newCalls = finalCount - initialCount;

    // Currently, planetMaterial (and possibly cloudMaterial?) depend on sunColorVec/sunDir.
    // planetMaterial depends on sunColorVec. So it should re-create.
    // cloudMaterial depends on sunDir (stable).
    // atmosMaterial is stable.

    // So we expect 0 new calls.
    expect(newCalls).toBe(0);

    // Verify that the uSunColor uniform was actually updated
    const group = renderer.scene.children[0];
    // PlanetMesh renders a group. Inside the group:
    // 0: Planet Surface (mesh)
    // 1: Clouds (mesh)
    // 2: Atmosphere (mesh)
    const planetMesh = group.children[0];
    const material = (planetMesh.instance as THREE.Mesh).material as THREE.ShaderMaterial;

    // Check if material is indeed the one we are spying on (it should be)

    // params.sunType = 'red' -> Vector3(1.0, 0.4, 0.3)
    const expectedColor = new THREE.Vector3(1.0, 0.4, 0.3);
    const actualColor = material.uniforms.uSunColor.value;

    expect(actualColor.x).toBeCloseTo(expectedColor.x);
    expect(actualColor.y).toBeCloseTo(expectedColor.y);
    expect(actualColor.z).toBeCloseTo(expectedColor.z);
  });
});
