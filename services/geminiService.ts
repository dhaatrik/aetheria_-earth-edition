
import { PlanetLore, PlanetParameters, POIData, ChallengeTarget } from "../types";

// --- CORE GENERATION ---

export const generatePlanetData = async (): Promise<{ lore: PlanetLore, params: Partial<PlanetParameters> }> => {
  try {
    const response = await fetch('/api/generatePlanetData', {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to generate planet data');
    const data = await response.json();
    
    const lore: PlanetLore = {
      name: data.name,
      description: data.description,
      age: data.age,
      civilizationType: data.civilizationType,
      atmosphereComposition: data.atmosphereComposition,
      population: data.population,
      habitabilityScore: data.habitabilityScore
    };

    const params: Partial<PlanetParameters> = {
      rotationSpeed: data.rotationSpeed || 0.05,
      atmosphereColor: data.atmosphereColor || "#3b82f6",
      cityLightColor: data.cityLightColor || "#ffaa33",
      cityLightIntensity: 1.0,
      waterMurkiness: data.waterMurkiness || 0.0,
      snowLevel: data.snowLevel || 0.0,
    };

    return { lore, params };

  } catch (error) {
    console.error("Failed to generate planet data:", error);
    throw error;
  }
};

// --- TEXTURE GENERATION (IMAGEN) ---

export const generatePlanetTexture = async (description: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/generatePlanetTexture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) throw new Error('Texture generation failed');
    const { base64 } = await response.json();

    if (base64) {
      return `data:image/png;base64,${base64}`;
    }
    return null;
  } catch (e) {
    console.error("Texture generation failed", e);
    return null; // Fallback to default
  }
};

// --- EVENTS & TIME TRAVEL ---

export const triggerDisaster = async (currentLore: PlanetLore): Promise<{ loreUpdate: Partial<PlanetLore>, paramsUpdate: Partial<PlanetParameters> }> => {
  const response = await fetch('/api/triggerDisaster', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentLore }),
  });

  if (!response.ok) throw new Error('Failed to trigger disaster');
  const data = await response.json();

  return {
    loreUpdate: {
      description: `[EVENT: ${data.eventTitle}] ${data.newDescription}`,
      habitabilityScore: data.habitabilityScore
    },
    paramsUpdate: {
      atmosphereColor: data.atmosphereColor,
      waterMurkiness: data.waterMurkiness,
      snowLevel: data.snowLevel,
      cityLightIntensity: data.cityLightIntensity ?? 0.0,
      cityLightColor: data.cityLightColor ?? "#ff0000"
    }
  };
};

export const evolveCivilization = async (currentLore: PlanetLore, years: number): Promise<{ loreUpdate: Partial<PlanetLore>, paramsUpdate: Partial<PlanetParameters> }> => {
  const response = await fetch('/api/evolveCivilization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentLore, years }),
  });

  if (!response.ok) throw new Error('Failed to evolve civilization');
  const data = await response.json();
  
  return {
    loreUpdate: {
      description: `[YEAR +${years}] ${data.newDescription}`,
      civilizationType: "Evolved State",
      population: "Unknown",
      habitabilityScore: data.habitabilityScore
    },
    paramsUpdate: {
      cityLightColor: data.cityLightColor,
      cityLightIntensity: data.cityLightIntensity,
      atmosphereColor: data.atmosphereColor
    }
  };
};

// --- CHALLENGE MODE ---

export const generateChallenge = async (): Promise<ChallengeTarget> => {
  const response = await fetch('/api/generateChallenge', {
    method: 'POST',
  });

  if (!response.ok) throw new Error('Failed to generate challenge');
  const data = await response.json();
  
  return {
    active: true,
    success: false,
    description: data.description,
    targetStats: {
      habitabilityScore: data.targetHabitability,
      cloudDensity: data.targetCloudDensity,
    }
  };
};

// --- POI ---

const poiCache = new Map<string, POIData>();

export const generatePOIReport = async (loreContext: string, coordinates: { x: number, y: number }): Promise<POIData> => {
  try {
    const lat = Math.round(coordinates.y * 180 - 90);
    const lon = Math.round(coordinates.x * 360 - 180);
    
    const cacheKey = `${lat}:${lon}:${loreContext}`;
    if (poiCache.has(cacheKey)) {
      return poiCache.get(cacheKey)!;
    }

    const response = await fetch('/api/generatePOIReport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loreContext, lat, lon }),
    });

    if (!response.ok) throw new Error('Failed to generate POI report');
    const data = await response.json();
    
    const result: POIData = {
      title: data.title,
      description: data.description,
      coordinates
    };

    poiCache.set(cacheKey, result);
    return result;
  } catch (e) {
    return {
      title: "Signal Lost",
      description: "Unable to retrieve telemetry from this sector.",
      coordinates
    };
  }
};
