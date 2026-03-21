
import http from 'http';
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const planetSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    age: { type: Type.STRING },
    civilizationType: { type: Type.STRING },
    atmosphereComposition: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    population: { type: Type.STRING },
    habitabilityScore: { type: Type.NUMBER },
    atmosphereColor: { type: Type.STRING },
    rotationSpeed: { type: Type.NUMBER },
    cityLightColor: { type: Type.STRING },
    waterMurkiness: { type: Type.NUMBER },
    snowLevel: { type: Type.NUMBER }
  },
  required: ["name", "description", "age", "civilizationType", "atmosphereComposition", "population", "habitabilityScore", "atmosphereColor", "rotationSpeed"]
};

const eventSchema = {
  type: Type.OBJECT,
  properties: {
    eventTitle: { type: Type.STRING },
    newDescription: { type: Type.STRING },
    atmosphereColor: { type: Type.STRING },
    waterMurkiness: { type: Type.NUMBER },
    snowLevel: { type: Type.NUMBER },
    cityLightIntensity: { type: Type.NUMBER },
    cityLightColor: { type: Type.STRING },
    habitabilityScore: { type: Type.NUMBER }
  },
  required: ["eventTitle", "newDescription", "atmosphereColor", "waterMurkiness", "snowLevel"]
};

const challengeSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    targetCloudDensity: { type: Type.NUMBER },
    targetAtmosphereType: { type: Type.STRING },
    targetHabitability: { type: Type.NUMBER }
  },
  required: ["description", "targetHabitability"]
};

const poiSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING }
  },
  required: ["title", "description"]
};

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let body = '';
  let tooLarge = false;

  req.on('data', chunk => {
    if (tooLarge) return;
    body += chunk.toString();
    if (body.length > MAX_BODY_SIZE) {
      tooLarge = true;
      res.statusCode = 413;
      res.end(JSON.stringify({ error: 'Payload Too Large' }));
      req.destroy();
    }
  });

  req.on('end', async () => {
    if (tooLarge) return;
    try {
      const payload = body ? JSON.parse(body) : {};
      const url = req.url;

      if (url === '/api/generatePlanetData') {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Generate a scenario for an exoplanet or future Earth. Be creative with the biome and civilization status.",
          config: {
            responseMimeType: "application/json",
            responseSchema: planetSchema,
            thinkingConfig: { thinkingBudget: 0 }
          }
        });
        res.end(response.text);

      } else if (url === '/api/generatePlanetTexture') {
        const { description } = payload;
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: `A high quality, seamless, equirectangular projection texture map of a planet surface: ${description}. Flat lighting, no shadows, 4k resolution style. The map should show continents and oceans.`,
          config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
            outputMimeType: 'image/png'
          }
        });
        const base64 = response.generatedImages?.[0]?.image?.imageBytes;
        res.end(JSON.stringify({ base64 }));

      } else if (url === '/api/triggerDisaster') {
        const { currentLore } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Current Planet: ${currentLore.name} (${currentLore.description}). Trigger a catastrophic global event (e.g. Gamma Ray Burst, Supervolcano, Artificial AI Takeover). Return the new visual and lore states.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: eventSchema
          }
        });
        res.end(response.text);

      } else if (url === '/api/evolveCivilization') {
        const { currentLore, years } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Advance (or regress) the civilization of ${currentLore.name} by ${years} years. Describe the technological changes or collapse.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: eventSchema
          }
        });
        res.end(response.text);

      } else if (url === '/api/generateChallenge') {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Create a terraforming challenge for a dead planet. Describe what needs to be fixed (e.g. 'Melting the ice caps', 'Clearing the smog').",
          config: {
            responseMimeType: "application/json",
            responseSchema: challengeSchema
          }
        });
        res.end(response.text);

      } else if (url === '/api/generatePOIReport') {
        const { loreContext, lat, lon } = payload;
        const prompt = `
          Context: ${loreContext}
          Location: Latitude ${lat}, Longitude ${lon}.
          Generate a short sci-fi status report for this specific location.
        `;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: poiSchema,
            thinkingConfig: { thinkingBudget: 0 }
          }
        });
        res.end(response.text);

      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });
});

const PORT = 3001;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
