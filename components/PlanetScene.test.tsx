// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { PlanetMesh } from './PlanetScene';
import { PlanetParameters } from '../types';

// Mock THREE to track ShaderMaterial instantiations
vi.mock('three', async () => {
  const actual = await vi.importActual('three') as any;

  return {
    ...actual,
    TextureLoader: class {
        load(url: any, onLoad: any) {
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
  inSphere: (array: any) => array,
}));

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

describe('PlanetMesh', () => {
  it('should render the planet, clouds, and atmosphere meshes', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <PlanetMesh params={defaultParams} onClick={() => {}} />
    );

    // PlanetMesh renders a group -> meshes
    const group = renderer.scene.children[0];

    // Check that we have 3 children (Planet, Clouds, Atmosphere)
    expect(group.children.length).toBe(3);

    // Find the planet mesh
    const planetMesh = group.children[0];
    expect(planetMesh.type).toBe('Mesh');
    expect(planetMesh.props.material.type).toBe('ShaderMaterial');

    // Find the cloud mesh
    const cloudMesh = group.children[1];
    expect(cloudMesh.type).toBe('Mesh');
    expect(cloudMesh.props.material.type).toBe('ShaderMaterial');

    // Find the atmosphere mesh
    const atmosMesh = group.children[2];
    expect(atmosMesh.type).toBe('Mesh');
    expect(atmosMesh.props.material.type).toBe('ShaderMaterial');
  });

  it('should call onClick when the planet surface is clicked', async () => {
    const onClickSpy = vi.fn();
    const renderer = await ReactThreeTestRenderer.create(
      <PlanetMesh params={defaultParams} onClick={onClickSpy} />
    );

    const group = renderer.scene.children[0];
    const planetMesh = group.children[0];

    // Simulate pointer down with a mock event
    const mockEvent = {
      stopPropagation: vi.fn(),
      uv: new THREE.Vector2(0.5, 0.5)
    };

    // React Three Fiber test renderer uses onPointerDown directly as a prop
    planetMesh.props.onPointerDown(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(onClickSpy).toHaveBeenCalledTimes(1);
    expect(onClickSpy).toHaveBeenCalledWith(mockEvent.uv);
  });
});
