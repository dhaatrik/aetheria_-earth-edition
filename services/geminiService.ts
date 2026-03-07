
import { PlanetLore, PlanetParameters, POIData, ChallengeTarget } from "../types";

// --- VALIDATION HELPERS ---

const sanitizeString = (val: any, fallback: string = ""): string => {
  return typeof val === 'string' ? val : fallback;
};

const sanitizeNumber = (val: any, fallback: number = 0): number => {
  return typeof val === 'number' && !isNaN(val) ? val : fallback;
};

const sanitizeArray = (val: any, fallback: string[] = []): string[] => {
  return Array.isArray(val) ? val.map(v => typeof v === 'string' ? v : String(v)) : fallback;
};

// --- CORE GENERATION ---

export const generatePlanetData = async (): Promise<{ lore: PlanetLore, params: Partial<PlanetParameters> }> => {
  try {
    const response = await fetch('/api/generatePlanetData', {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to generate planet data');
    const data = await response.json();
    
    const lore: PlanetLore = {
      name: sanitizeString(data.name, "Unknown Planet"),
      description: sanitizeString(data.description, "A mysterious world."),
      age: sanitizeString(data.age, "Unknown"),
      civilizationType: sanitizeString(data.civilizationType, "None"),
      atmosphereComposition: sanitizeArray(data.atmosphereComposition),
      population: sanitizeString(data.population, "0"),
      habitabilityScore: sanitizeNumber(data.habitabilityScore, 0)
    };

    const params: Partial<PlanetParameters> = {
      rotationSpeed: sanitizeNumber(data.rotationSpeed, 0.05),
      atmosphereColor: sanitizeString(data.atmosphereColor, "#3b82f6"),
      cityLightColor: sanitizeString(data.cityLightColor, "#ffaa33"),
      cityLightIntensity: 1.0,
      waterMurkiness: sanitizeNumber(data.waterMurkiness, 0.0),
      snowLevel: sanitizeNumber(data.snowLevel, 0.0),
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
      description: `[EVENT: ${sanitizeString(data.eventTitle, "Unknown Event")}] ${sanitizeString(data.newDescription, "Something happened.")}`,
      habitabilityScore: sanitizeNumber(data.habitabilityScore, 0)
    },
    paramsUpdate: {
      atmosphereColor: sanitizeString(data.atmosphereColor, "#ffffff"),
      waterMurkiness: sanitizeNumber(data.waterMurkiness, 0),
      snowLevel: sanitizeNumber(data.snowLevel, 0),
      cityLightIntensity: sanitizeNumber(data.cityLightIntensity, 0.0),
      cityLightColor: sanitizeString(data.cityLightColor, "#ff0000")
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
      description: `[YEAR +${years}] ${sanitizeString(data.newDescription, "Time passed.")}`,
      civilizationType: "Evolved State",
      population: "Unknown",
      habitabilityScore: sanitizeNumber(data.habitabilityScore, 0)
    },
    paramsUpdate: {
      cityLightColor: sanitizeString(data.cityLightColor, "#ffaa33"),
      cityLightIntensity: sanitizeNumber(data.cityLightIntensity, 1.0),
      atmosphereColor: sanitizeString(data.atmosphereColor, "#3b82f6")
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
    description: sanitizeString(data.description, "Unknown challenge"),
    targetStats: {
      habitabilityScore: sanitizeNumber(data.targetHabitability, 0.5),
      cloudDensity: sanitizeNumber(data.targetCloudDensity, 0.5),
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
      title: sanitizeString(data.title, "Unknown Location"),
      description: sanitizeString(data.description, "No data available."),
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
