import { expectTypeOf, describe, it, expect } from 'vitest';
import type {
  PlanetLore,
  DataLayer,
  SunType,
  PlanetParameters,
  POIData,
  ChallengeTarget,
  SimulationState
} from './types';

describe('Types Configuration', () => {
  it('validates PlanetLore structure', () => {
    const lore: PlanetLore = {
      name: 'Earth',
      description: 'A blue marble.',
      age: '4.5 billion years',
      civilizationType: 'Type 0',
      atmosphereComposition: ['Nitrogen', 'Oxygen'],
      population: '8 Billion',
      habitabilityScore: 0.99
    };

    expectTypeOf(lore).toEqualTypeOf<PlanetLore>();
    expectTypeOf(lore.habitabilityScore).toBeNumber();
    expectTypeOf(lore.atmosphereComposition).toBeArray();
    expectTypeOf(lore.atmosphereComposition[0]).toBeString();

    // Just to have a runtime check to keep Vitest happy if expectTypeOf is purely static
    expect(lore.name).toBe('Earth');
  });

  it('validates DataLayer union type', () => {
    type ExpectedDataLayer = 'visual' | 'thermal' | 'population' | 'vegetation';
    expectTypeOf<DataLayer>().toEqualTypeOf<ExpectedDataLayer>();

    const layer: DataLayer = 'visual';
    expect(layer).toBe('visual');
  });

  it('validates SunType union type', () => {
    type ExpectedSunType = 'yellow' | 'red' | 'blue';
    expectTypeOf<SunType>().toEqualTypeOf<ExpectedSunType>();

    const sun: SunType = 'yellow';
    expect(sun).toBe('yellow');
  });

  it('validates PlanetParameters structure', () => {
    const params: PlanetParameters = {
      seed: 12345,
      rotationSpeed: 0.01,
      tilt: 23.5,
      waterColor: '#0000ff',
      landColor: '#00ff00',
      atmosphereColor: '#ffffff',
      cloudDensity: 0.5,
      snowLevel: 0.2,
      waterMurkiness: 0.1,
      sunType: 'yellow',
      cityLightColor: '#ffff00',
      cityLightIntensity: 1.0,
      dataLayer: 'visual',
      showSatellites: true,
      textureMapUrl: 'blob:http://localhost/texture',
      cloudMapUrl: 'blob:http://localhost/cloud'
    };

    expectTypeOf(params).toEqualTypeOf<PlanetParameters>();
    expectTypeOf(params.seed).toBeNumber();
    expectTypeOf(params.sunType).toEqualTypeOf<SunType>();
    expectTypeOf(params.textureMapUrl).toEqualTypeOf<string | undefined>();

    expect(params.seed).toBe(12345);
  });

  it('validates POIData structure', () => {
    const poi: POIData = {
      title: 'Mount Everest',
      description: 'Highest mountain',
      coordinates: { x: 88.3, y: 27.9 }
    };

    expectTypeOf(poi).toEqualTypeOf<POIData>();
    expectTypeOf(poi.coordinates).toBeObject();
    expectTypeOf(poi.coordinates.x).toBeNumber();

    expect(poi.title).toBe('Mount Everest');
  });

  it('validates ChallengeTarget structure', () => {
    const challenge: ChallengeTarget = {
      active: true,
      description: 'Terraform Mars',
      targetStats: {
        habitabilityScore: 0.8,
        temperature: 'temperate'
      },
      success: false
    };

    expectTypeOf(challenge).toEqualTypeOf<ChallengeTarget>();
    expectTypeOf(challenge.targetStats.temperature).toEqualTypeOf<'frozen' | 'temperate' | 'hot' | undefined>();

    expect(challenge.active).toBe(true);
  });

  it('validates SimulationState structure', () => {
    const state: SimulationState = {
      lore: {
        name: 'Earth',
        description: '',
        age: '',
        civilizationType: '',
        atmosphereComposition: [],
        population: '',
        habitabilityScore: 1
      },
      params: {
        seed: 0,
        rotationSpeed: 0,
        tilt: 0,
        waterColor: '',
        landColor: '',
        atmosphereColor: '',
        cloudDensity: 0,
        snowLevel: 0,
        waterMurkiness: 0,
        sunType: 'yellow',
        cityLightColor: '',
        cityLightIntensity: 0,
        dataLayer: 'visual',
        showSatellites: false
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

    expectTypeOf(state).toEqualTypeOf<SimulationState>();
    expectTypeOf(state.selectedPOI).toEqualTypeOf<POIData | null>();

    expect(state.isLoading).toBe(false);
  });
});
