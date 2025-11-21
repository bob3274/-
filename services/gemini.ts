
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TravelSpot } from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Japanese Word Explanation Service
export const explainJapaneseWord = async (word: string) => {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Explain the Japanese word "${word}". 
    1. Provide the reading (furigana/hiragana).
    2. Meaning in Traditional Chinese (Taiwan).
    3. Meaning in Japanese (Definition).
    4. A Japanese example sentence using the word.
    5. The Traditional Chinese translation of that sentence.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          reading: { type: Type.STRING },
          meaning: { type: Type.STRING, description: "Traditional Chinese meaning" },
          meaningJP: { type: Type.STRING, description: "Japanese definition" },
          exampleSentence: { type: Type.STRING },
          exampleTranslation: { type: Type.STRING, description: "Chinese translation of example" },
        },
        required: ["word", "reading", "meaning", "meaningJP", "exampleSentence", "exampleTranslation"],
      },
    },
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  throw new Error("Failed to generate definition");
};

// 2. Text to Speech Service

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Use specific view to avoid accessing the whole underlying buffer if offset exists
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert PCM Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playJapaneseText = async (text: string) => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    // 24kHz is standard for Gemini 2.5 Flash TTS
    const sampleRate = 24000;
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const audioContext = new AudioContextClass({ sampleRate });
    
    // Ensure context is running (sometimes browsers suspend it)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const pcmBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(pcmBytes, audioContext, sampleRate, 1);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

    // Return a promise that resolves when playback finishes
    return new Promise<void>((resolve) => {
        source.onended = () => {
            resolve();
            // We generally don't close the context immediately to allow rapid replay, 
            // but garbage collection handles it eventually.
        };
        // Fallback for safety if onended doesn't fire (e.g. very short audio or browser quirk)
        // Add 500ms buffer
        setTimeout(resolve, (audioBuffer.duration * 1000) + 500);
    });

  } catch (error) {
    console.error("TTS Error", error);
    throw error; 
  }
};

// 3. Travel Spot Search Service
export interface TravelSearchResult {
  name: string;
  address: string;
  uri: string;
  rating?: number;
  summary?: string;
}

export const searchTravelSpot = async (query: string): Promise<TravelSearchResult> => {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find specific details for the place: "${query}". Return the exact name and address.`,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  let mapData: TravelSearchResult = {
    name: query,
    address: "Address not found",
    uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
  };

  if (chunks && chunks.length > 0) {
    const mapChunk = chunks.find(c => (c as any).maps || (c.web?.uri && c.web.uri.includes('google.com/maps')));
    
    if (mapChunk) {
       const m = (mapChunk as any).maps || mapChunk.web;
       if (m) {
          if (m.title) mapData.name = m.title;
          if (m.uri) mapData.uri = m.uri;
       }
    }
  }
  
  return {
    ...mapData,
    summary: response.text,
  };
};

// 4. Travel Itinerary Planning
export const planTravelItinerary = async (spots: TravelSpot[], language: string) => {
  const ai = getClient();
  
  const spotsList = spots.map(s => `- ${s.name} (${s.address})`).join('\n');
  const prompt = `
    You are a professional travel guide.
    Please create an optimized travel itinerary based on the following list of locations that I want to visit.
    
    Locations:
    ${spotsList}
    
    Requirements:
    1. Group nearby locations together.
    2. Suggest a logical order of visit.
    3. Provide a brief tip for each location.
    4. Reply in ${language === 'ja-JP' ? 'Japanese' : 'Traditional Chinese (Taiwan)'}.
    5. Use Markdown format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
};
