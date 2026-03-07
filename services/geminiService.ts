
import { PlanetLore, PlanetParameters, POIData, ChallengeTarget } from "../types";

const safeNumber = (val: any, fallback: number): number => {
  const num = Number(val);
  return Number.isNaN(num) ? fallback : num;
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
      name: String(data.name || "Unknown World"),
      description: String(data.description || "A mysterious planet."),
      age: String(data.age || "Unknown"),
      civilizationType: String(data.civilizationType || "None"),
      atmosphereComposition: Array.isArray(data.atmosphereComposition)
        ? data.atmosphereComposition.map(String)
        : ["Unknown"],
      population: String(data.population || "0"),
      habitabilityScore: safeNumber(data.habitabilityScore, 0)
    };

    const params: Partial<PlanetParameters> = {
      rotationSpeed: safeNumber(data.rotationSpeed, 0.05),
      atmosphereColor: String(data.atmosphereColor || "#3b82f6"),
      cityLightColor: String(data.cityLightColor || "#ffaa33"),
      cityLightIntensity: 1.0,
      waterMurkiness: safeNumber(data.waterMurkiness, 0.0),
      snowLevel: safeNumber(data.snowLevel, 0.0),
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
      description: `[EVENT: ${String(data.eventTitle || "Unknown Event")}] ${String(data.newDescription || "Something happened.")}`,
      habitabilityScore: safeNumber(data.habitabilityScore, 0)
    },
    paramsUpdate: {
      atmosphereColor: String(data.atmosphereColor || "#ff0000"),
      waterMurkiness: safeNumber(data.waterMurkiness, 0.0),
      snowLevel: safeNumber(data.snowLevel, 0.0),
      cityLightIntensity: safeNumber(data.cityLightIntensity, 0.0),
      cityLightColor: String(data.cityLightColor || "#ff0000")
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
      description: `[YEAR +${years}] ${String(data.newDescription || "Civilization changed.")}`,
      civilizationType: "Evolved State",
      population: "Unknown",
      habitabilityScore: safeNumber(data.habitabilityScore, 0)
    },
    paramsUpdate: {
      cityLightColor: String(data.cityLightColor || "#ffffff"),
      cityLightIntensity: safeNumber(data.cityLightIntensity, 1.0),
      atmosphereColor: String(data.atmosphereColor || "#3b82f6")
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
    description: String(data.description || "Restore the planet."),
    targetStats: {
      habitabilityScore: safeNumber(data.targetHabitability, 50),
      cloudDensity: safeNumber(data.targetCloudDensity, 0.5),
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
      title: String(data.title || "Unknown Location"),
      description: String(data.description || "No data available."),
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
