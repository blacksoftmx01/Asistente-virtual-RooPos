import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData } from '../utils/audioUtils';

// CAMBIO AQUÍ: Usamos process.env.API_KEY para cumplir con las guías
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash-preview-tts";
const SAMPLE_RATE = 24000;

let audioContext: AudioContext;
let currentSource: AudioBufferSourceNode | null = null;

function getAudioContext(): AudioContext {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({
            sampleRate: SAMPLE_RATE,
        });
    }
    return audioContext;
}

async function generateAudio(text: string): Promise<AudioBuffer | null> {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: [{ parts: [{ text: `Say: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // Use Algenib for a consistent voice with the live session
                        prebuiltVoiceConfig: { voiceName: 'Algenib' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const decodedAudio = decode(base64Audio);
            const ctx = getAudioContext();
            return await decodeAudioData(decodedAudio, ctx, SAMPLE_RATE, 1);
        }
        return null;
    } catch (error) {
        console.error("Error generating audio:", error);
        return null;
    }
}

export function stopSpeaking() {
    if (currentSource) {
        try {
            currentSource.stop();
        } catch(e) {
            // Ignore errors if the source has already been stopped
        }
        currentSource.disconnect();
        currentSource = null;
    }
}

export async function speak(text: string, onEnded: () => void): Promise<void> {
    stopSpeaking(); // Stop any currently playing audio

    const audioBuffer = await generateAudio(text);
    if (audioBuffer) {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
            onEnded();
            currentSource = null;
        };
        source.start();
        currentSource = source;
    } else {
        // If audio generation fails, immediately call onEnded
        onEnded();
    }
}