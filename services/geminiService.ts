import { GoogleGenAI, Type } from "@google/genai";
import { MemoryCard, LanguageConfig } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Gemini 3 Flash for fast text interactions (Standard)
const MODEL_FAST = 'gemini-3-flash-preview';

// Gemini 3 Pro with Thinking for deep teaching/instruction
const MODEL_TEACH = 'gemini-3-pro-preview';

// Gemini Native Audio for superior voice understanding
const MODEL_AUDIO = 'gemini-2.5-flash-native-audio-preview-12-2025';

interface TerminalResponse {
  output: string;
  note?: string;
}

export const runTerminalCommand = async (
  language: string,
  command: string,
  history: string[],
  teachingMode: boolean = false
): Promise<TerminalResponse> => {
  if (!apiKey) return { output: "Error: API Key missing." };

  // Increase context window to 15 lines to ensure the AI remembers previous context/code.
  // This supports the "Add as you go" / "Keep it all" philosophy.
  const contextHistory = history.slice(-15).join('\n');

  const prompt = `
    You are a simulated ${language} terminal.
    
    Context History:
    ${contextHistory}

    User Command:
    ${command}

    Instructions:
    1. Act as a REPL. Execute the code.
    2. Return the raw text output.
    ${teachingMode ? '3. ALSO provide a short, helpful educational note (max 2 sentences) explaining the concept for a dyslexic learner. Focus on WHY it works. Be encouraging.' : ''}
  `;

  try {
    if (teachingMode) {
      // High Intelligence Teaching Mode
      const response = await ai.models.generateContent({
        model: MODEL_TEACH,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }, // Max thinking for deep analysis
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              output: { type: Type.STRING, description: "The raw terminal output of the command" },
              note: { type: Type.STRING, description: "A helpful, simple educational note about the concept" }
            },
            required: ["output", "note"]
          }
        }
      });

      const text = response.text;
      if (!text) return { output: "" };
      return JSON.parse(text) as TerminalResponse;

    } else {
      // Fast Execution Mode
      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt + "\nReturn ONLY the raw terminal output string. No markdown.",
      });
      return { output: response.text || "" };
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    return { output: "Error connecting to AI terminal simulation." };
  }
};

export const generateColorMemory = async (concept: string): Promise<MemoryCard | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Explain the programming concept "${concept}" simply for a neurodivergent learner. Assign a distinct color to this concept to help with memory (e.g., Red for danger/errors, Green for success/execution, Blue for storage/variables). Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concept: { type: Type.STRING },
            description: { type: Type.STRING },
            color: { type: Type.STRING, description: "A valid CSS hex color code" },
            tag: { type: Type.STRING, description: "A short 1-word category tag" },
          },
          required: ["concept", "description", "color", "tag"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as MemoryCard;
  } catch (error) {
    console.error("Gemini Memory Error:", error);
    return null;
  }
};

export const generateLanguageConfig = async (languageName: string): Promise<LanguageConfig | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Generate a UI configuration for the programming language "${languageName}".
            Select a distinct Tailwind CSS background color class (like 'bg-purple-500', 'bg-indigo-600', 'bg-pink-500', 'bg-teal-500', etc) that fits the language brand.
            Provide 5 very popular, short code snippets or commands for this language as "blocks".
            `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            color: { type: Type.STRING, description: "Tailwind CSS background class e.g. bg-red-500" },
            text: { type: Type.STRING, description: "Tailwind CSS text class, usually text-white or text-black" },
            blocks: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "color", "text", "blocks"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    const data = JSON.parse(text);
    return {
      id: languageName.toLowerCase().replace(/\s+/g, '-'),
      ...data
    };
  } catch (e) {
    console.error("Language generation error", e);
    return null;
  }
}

export const analyzeCode = async (code: string, language: string): Promise<string> => {
  if (!apiKey) return "API Key missing";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Analyze this ${language} code for a dyslexic learner. Break it down step-by-step. Use bullet points. 
            
            Code:
            ${code}
            `
    });
    return response.text || "Could not analyze code.";
  } catch (e) {
    return "Analysis failed.";
  }
}

export const transcribeAudio = async (
  audioBase64: string,
  mimeType: string,
  context: string
): Promise<string> => {
  if (!apiKey) return "";

  const isCodeContext = context !== 'Natural Language';

  try {
    const promptText = isCodeContext
      ? `You are an expert transcriber for a coding terminal assistant.
           The user is a dyslexic learner who may have specific speech patterns, accents, or background noise.

           Task:
           Transcribe the audio into a valid, syntactically correct ${context} command or code snippet.

           Guidelines:
           1. **Accent & Noise Robustness**: Filter out background noise. If pronunciation is imperfect, infer the most likely programming term.
           2. **Intent Translation**: If the user speaks natural language (e.g., "make a new function called test"), translate it to code: \`def test():\`.
           3. **Direct Dictation**: If the user dictates syntax, output the exact code.
           
           Output:
           Return ONLY the code string. Do not include markdown formatting.`
      : `You are a helpful assistant transcribing search queries for a learning app.
           Task: Transcribe the audio clearly into text.
           Context: The user is looking for programming concepts (e.g., "Variables", "For Loops", "Functions").
           Output: Return ONLY the transcribed text.`;

    const response = await ai.models.generateContent({
      model: MODEL_AUDIO,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          { text: promptText }
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (e) {
    console.error("Transcription error:", e);
    return "";
  }
};

export const generateEducationalNote = async (command: string, output: string, language: string): Promise<string> => {
  if (!apiKey) return "";
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEACH,
      contents: `
                The user ran this ${language} command: "${command}"
                And got this output: "${output.substring(0, 500)}..."
                
                Generate a SHORT (1-2 sentence) educational note explaining what happened, for a dyslexic learner.
                Be clear, simple, and encouraging. Focus on the 'WHY'.
             `
    });
    return response.text ? response.text.trim() : "";
  } catch (e) {
    console.error("Note generation error", e);
    return "";
  }
};