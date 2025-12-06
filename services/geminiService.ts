import { GoogleGenAI, Chat } from "@google/genai";
import { SearchParams, DiscoveryResult } from "../types";

// Initialize Gemini Client
// CRITICAL: The API key is injected via process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are "Happening AI", an intelligent real-time location and live-event recommendation engine.

Your task is to recommend nearby places and live events using NLP, Maps data, Search grounding, and an explainable machine-learning style scoring system called "Happening Meter".

────────────────────────────────────────
INTENT UNDERSTANDING (NLP)
────────────────────────────────────────
From every user query, infer:
• Location & Time intent (now, today, tonight, weekend)
• Mood (bored, calm, energetic) & Social context
• Preference for "Live" events vs general places

────────────────────────────────────────
LIVE EVENTS LOGIC (CRITICAL)
────────────────────────────────────────
If query implies "live", "happening", "today", "tonight", or specific event types:
1. Prefer Google Search grounding over Maps places.
2. Look specifically for EVENTS with date = today/tonight.
3. Extract: Event Name, Venue, Start Time.
4. Ensure event has not ended. Prefer events starting within next 6 hours.
5. Verify venue using Maps data.

Fallback: If no specific live events found, recommend highly active/popular places but ALWAYS verify their location.

────────────────────────────────────────
HAPPENING METER (CORE LOGIC)
────────────────────────────────────────
For every recommendation, mentally compute a Happening Meter percentage (0–100%) using these weighted signals:
• Interest Match: 35%
• Popularity / Trend: 25%
• Distance: 20%
• Time Relevance: 10%
• Personalization: 10%

Rank all results by Happening Meter (highest first).

────────────────────────────────────────
OUTPUT RULES
────────────────────────────────────────
• Use function calls for maps and trending info.
• Never hallucinate events.
• Be concise, friendly, and human.
`;

/**
 * Discovery Mode: Uses gemini-2.5-flash with Google Maps and Google Search
 * to find places based on structured input.
 */
export const discoverPlaces = async (params: SearchParams): Promise<DiscoveryResult> => {
  const modelId = "gemini-2.5-flash";

  let locationQuery = params.location;
  let retrievalConfig = {};

  // If we have precise coordinates, pass them to the tool config for better Maps grounding
  if (params.useCurrentLocation && params.latitude && params.longitude) {
    locationQuery = "my current location";
    retrievalConfig = {
      latLng: {
        latitude: params.latitude,
        longitude: params.longitude
      }
    };
  }

  const prompt = `
    Find top 4-5 ${params.interest} recommendations in/near ${locationQuery} relevant for ${params.timeframe}.
    
    CRITICAL: Calculate the "Happening Meter" (0-100%) for each using the weighted formula.
    
    If searching for events/festivals/music:
    1. Search for specific confirmed listings for ${params.timeframe}.
    2. USE THE VENUE NAME as the main "Place Name" header (so it matches Maps data).
    3. Include the specific Event Name in the "Why" description.
    4. Include the Start Time.
    
    REQUIRED: You MUST use the googleMaps tool to find the location for EVERY recommendation. If a place has no map location, do not list it.
    
    Format the output strictly as follows (Markdown):
    
    ### Place Name
    **Category** | **Distance** | **Time (if event)**
    Happening Meter: XX
    
    **Why:** [Short, punchy reason why it's recommended]
    
    [Insert Google Maps Link if available]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [
          { googleMaps: {} },
          { googleSearch: {} }
        ],
        toolConfig: {
          retrievalConfig: retrievalConfig
        }
      }
    });

    const text = response.text || "No recommendations found.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, groundingChunks };
  } catch (error: any) {
    console.error("Discovery Error:", error);
    if (error.message) {
        throw new Error(`AI Service Error: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Chat Mode: Uses gemini-3-pro-preview for a conversational experience.
 * Includes Google Search grounding.
 */
export const createChatSession = () => {
  const modelId = "gemini-3-pro-preview";

  return ai.chats.create({
    model: modelId,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [
        { googleSearch: {} } // Enable search for trending/real-time info
      ]
    }
  });
};