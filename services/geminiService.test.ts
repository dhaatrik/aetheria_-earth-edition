import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generatePlanetData,
  generatePlanetTexture,
  triggerDisaster,
  evolveCivilization,
  generateChallenge,
  generatePOIReport,
} from './geminiService';
import { PlanetLore, PlanetParameters } from '../types';

describe('geminiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePlanetData', () => {
    it('should successfully generate planet data', async () => {
      const mockData = {
        name: 'Earth 2.0',
        description: 'A beautiful new world.',
        age: '4 Billion Years',
        civilizationType: 'Type I',
        atmosphereComposition: ['Nitrogen', 'Oxygen'],
        population: '10 Billion',
        habitabilityScore: 95,
        rotationSpeed: 0.1,
        atmosphereColor: '#00ff00',
        cityLightColor: '#ffff00',
        waterMurkiness: 0.1,
        snowLevel: 0.2,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await generatePlanetData();

      expect(fetch).toHaveBeenCalledWith('/api/generatePlanetData', {
        method: 'POST',
      });
      expect(result.lore).toEqual({
        name: 'Earth 2.0',
        description: 'A beautiful new world.',
        age: '4 Billion Years',
        civilizationType: 'Type I',
        atmosphereComposition: ['Nitrogen', 'Oxygen'],
        population: '10 Billion',
        habitabilityScore: 95,
      });
      expect(result.params).toEqual({
        rotationSpeed: 0.1,
        atmosphereColor: '#00ff00',
        cityLightColor: '#ffff00',
        cityLightIntensity: 1.0,
        waterMurkiness: 0.1,
        snowLevel: 0.2,
      });
    });

    it('should use default params when optional fields are missing', async () => {
      const mockData = {
        name: 'Mars 2.0',
        description: 'A dusty red world.',
        age: '4.5 Billion Years',
        civilizationType: 'None',
        atmosphereComposition: ['Carbon Dioxide'],
        population: '0',
        habitabilityScore: 10,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await generatePlanetData();

      expect(result.params).toEqual({
        rotationSpeed: 0.05,
        atmosphereColor: '#3b82f6',
        cityLightColor: '#ffaa33',
        cityLightIntensity: 1.0,
        waterMurkiness: 0.0,
        snowLevel: 0.0,
      });
    });

    it('should throw an error if the fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      await expect(generatePlanetData()).rejects.toThrow('Failed to generate planet data');
    });
  });

  describe('generatePlanetTexture', () => {
    it('should return a base64 image URL on success', async () => {
      const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ base64: mockBase64 }),
      });

      const result = await generatePlanetTexture('A blue planet');

      expect(fetch).toHaveBeenCalledWith('/api/generatePlanetTexture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'A blue planet' }),
      });
      expect(result).toBe(`data:image/png;base64,${mockBase64}`);
    });

    it('should return null if base64 is missing in response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await generatePlanetTexture('A blue planet');
      expect(result).toBeNull();
    });

    it('should return null on fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      const result = await generatePlanetTexture('A blue planet');
      expect(result).toBeNull();
    });

    it('should return null on fetch throw', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await generatePlanetTexture('A blue planet');
      expect(result).toBeNull();
    });
  });

  describe('triggerDisaster', () => {
    const mockLore: PlanetLore = {
      name: 'Earth',
      description: 'A peaceful world.',
      age: 'Old',
      civilizationType: 'Type I',
      atmosphereComposition: ['O2'],
      population: '10B',
      habitabilityScore: 80,
    };

    it('should update lore and params on disaster', async () => {
      const mockData = {
        eventTitle: 'Meteor Strike',
        newDescription: 'A meteor has struck.',
        habitabilityScore: 40,
        atmosphereColor: '#ff0000',
        waterMurkiness: 0.8,
        snowLevel: 0.5,
        cityLightIntensity: 0.2,
        cityLightColor: '#ff5500',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await triggerDisaster(mockLore);

      expect(fetch).toHaveBeenCalledWith('/api/triggerDisaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentLore: mockLore }),
      });

      expect(result.loreUpdate).toEqual({
        description: '[EVENT: Meteor Strike] A meteor has struck.',
        habitabilityScore: 40,
      });

      expect(result.paramsUpdate).toEqual({
        atmosphereColor: '#ff0000',
        waterMurkiness: 0.8,
        snowLevel: 0.5,
        cityLightIntensity: 0.2,
        cityLightColor: '#ff5500',
      });
    });

    it('should use default values for missing light params', async () => {
      const mockData = {
        eventTitle: 'Solar Flare',
        newDescription: 'A solar flare hit.',
        habitabilityScore: 60,
        atmosphereColor: '#ffff00',
        waterMurkiness: 0.2,
        snowLevel: 0.1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await triggerDisaster(mockLore);

      expect(result.paramsUpdate.cityLightIntensity).toBe(0.0);
      expect(result.paramsUpdate.cityLightColor).toBe('#ff0000');
    });

    it('should throw an error if fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });
      await expect(triggerDisaster(mockLore)).rejects.toThrow('Failed to trigger disaster');
    });
  });

  describe('evolveCivilization', () => {
    const mockLore: PlanetLore = {
      name: 'Earth',
      description: 'A developing world.',
      age: 'Middle Aged',
      civilizationType: 'Type 0',
      atmosphereComposition: ['O2', 'N2'],
      population: '7B',
      habitabilityScore: 70,
    };

    it('should update lore and params on evolve', async () => {
      const mockData = {
        newDescription: 'Technology has advanced significantly.',
        habitabilityScore: 85,
        cityLightColor: '#00ffff',
        cityLightIntensity: 1.5,
        atmosphereColor: '#0000ff',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await evolveCivilization(mockLore, 1000);

      expect(fetch).toHaveBeenCalledWith('/api/evolveCivilization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentLore: mockLore, years: 1000 }),
      });

      expect(result.loreUpdate).toEqual({
        description: '[YEAR +1000] Technology has advanced significantly.',
        civilizationType: 'Evolved State',
        population: 'Unknown',
        habitabilityScore: 85,
      });

      expect(result.paramsUpdate).toEqual({
        cityLightColor: '#00ffff',
        cityLightIntensity: 1.5,
        atmosphereColor: '#0000ff',
      });
    });

    it('should throw an error if fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });
      await expect(evolveCivilization(mockLore, 100)).rejects.toThrow('Failed to evolve civilization');
    });
  });

  describe('generateChallenge', () => {
    it('should generate a challenge', async () => {
      const mockData = {
        description: 'Terraform the planet to be a frozen wasteland.',
        targetHabitability: 20,
        targetCloudDensity: 0.8,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await generateChallenge();

      expect(fetch).toHaveBeenCalledWith('/api/generateChallenge', {
        method: 'POST',
      });

      expect(result).toEqual({
        active: true,
        success: false,
        description: 'Terraform the planet to be a frozen wasteland.',
        targetStats: {
          habitabilityScore: 20,
          cloudDensity: 0.8,
        },
      });
    });

    it('should throw an error if fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });
      await expect(generateChallenge()).rejects.toThrow('Failed to generate challenge');
    });
  });

  describe('generatePOIReport', () => {
    it('should generate a POI report and cache it', async () => {
      const mockData = {
        title: 'Ancient Ruins',
        description: 'Ruins of a long lost civilization.',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // x: 0.5 -> lon: 0.5 * 360 - 180 = 0
      // y: 0.5 -> lat: 0.5 * 180 - 90 = 0
      const coordinates = { x: 0.5, y: 0.5 };
      const loreContext = 'A desert planet.';

      const result1 = await generatePOIReport(loreContext, coordinates);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('/api/generatePOIReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loreContext, lat: 0, lon: 0 }),
      });

      expect(result1).toEqual({
        title: 'Ancient Ruins',
        description: 'Ruins of a long lost civilization.',
        coordinates,
      });

      // Call again to verify cache
      const result2 = await generatePOIReport(loreContext, coordinates);
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1
      expect(result2).toEqual(result1);
    });

    it('should return a fallback report on fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });
      const coordinates = { x: 0.1, y: 0.9 };

      const result = await generatePOIReport('Some lore', coordinates);

      expect(result).toEqual({
        title: 'Signal Lost',
        description: 'Unable to retrieve telemetry from this sector.',
        coordinates,
      });
    });
  });
});
