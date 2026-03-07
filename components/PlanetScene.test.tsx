// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { PlanetScene, PlanetMesh } from './PlanetScene';
import { PlanetParameters } from '../types';

// Mock useTexture and other drei components as needed
vi.mock('@react-three/drei', async () => {
    const actual = await vi.importActual('@react-three/drei');
    return {
        ...actual,
        useTexture: () => ({
            day: new THREE.Texture(),
            spec: new THREE.Texture(),
            norm: new THREE.Texture(),
            cloud: new THREE.Texture(),
        }),
        Stars: () => <mesh name="mock-stars" />,
        OrbitControls: React.forwardRef((props: any, ref: any) => <group name="mock-orbit-controls" ref={ref} />)
    };
});

// Mock maath
vi.mock('maath/random/dist/maath-random.esm', () => ({
  inSphere: (array: any) => array,
}));

describe('PlanetMesh Component', () => {
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

  it('should render PlanetMesh without crashing', async () => {
    const onClickMock = vi.fn();

    const renderer = await ReactThreeTestRenderer.create(
      <PlanetMesh params={defaultParams} onClick={onClickMock} />
    );

    // Verify it renders
    expect(renderer.scene).toBeDefined();

    // PlanetMesh renders a Group
    const group = renderer.scene.children[0];
    expect(group.type).toBe('Group');

    // It should have 3 children: Earth Surface, Clouds, Atmosphere
    expect(group.children.length).toBeGreaterThanOrEqual(3);

    const surfaceMesh = group.children[0];
    const cloudMesh = group.children[1];
    const atmosMesh = group.children[2];

    expect(surfaceMesh.type).toBe('Mesh');
    expect(cloudMesh.type).toBe('Mesh');
    expect(atmosMesh.type).toBe('Mesh');
  });

  it('should trigger onClick when the planet surface is clicked', async () => {
    const onClickMock = vi.fn();
    const renderer = await ReactThreeTestRenderer.create(
      <PlanetMesh params={defaultParams} onClick={onClickMock} />
    );

    const group = renderer.scene.children[0];
    const surfaceMesh = group.children[0];

    // Simulate pointer down event
    const uvMock = new THREE.Vector2(0.5, 0.5);
    const stopPropagationMock = vi.fn();

    // Test renderer allows firing events
    await renderer.fireEvent(surfaceMesh, 'onPointerDown', {
      stopPropagation: stopPropagationMock,
      uv: uvMock
    });

    // Verify onClick was called with the UV coordinates
    expect(onClickMock).toHaveBeenCalledTimes(1);
    expect(onClickMock).toHaveBeenCalledWith(uvMock);
    expect(stopPropagationMock).toHaveBeenCalledTimes(1);
  });

  it('should not trigger onClick when the clouds are clicked', async () => {
    const onClickMock = vi.fn();
    const renderer = await ReactThreeTestRenderer.create(
      <PlanetMesh params={defaultParams} onClick={onClickMock} />
    );

    const group = renderer.scene.children[0];
    const cloudsMesh = group.children[1];

    // Simulate pointer down event on clouds
    const stopPropagationMock = vi.fn();

    await renderer.fireEvent(cloudsMesh, 'onPointerDown', {
      stopPropagation: stopPropagationMock,
      uv: new THREE.Vector2(0.5, 0.5)
    });

    // Verify stopPropagation was called and onClick was NOT called
    expect(stopPropagationMock).toHaveBeenCalledTimes(1);
    expect(onClickMock).not.toHaveBeenCalled();
  });
});
