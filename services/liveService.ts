import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audioUtils';

// CAMBIO AQUÍ: Usamos process.env.API_KEY para cumplir con las guías
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: LiveSession is not an exported member. Use ReturnType to get the session promise type.
let sessionPromise: Promise<any> | null = null;
let mediaStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;

// Audio playback queue
let outputAudioContext: AudioContext | null = null;
let nextStartTime = 0;
const sources = new Set<AudioBufferSourceNode>();


// Transcription state
let currentInputTranscription = '';
let currentOutputTranscription = '';

// Fix: Refactored to align with Gemini API documentation for Live API.
// This includes initializing audio resources before connecting, simplifying the onopen callback,
// and ensuring audio data is sent correctly within onaudioprocess.
export async function startSession(
    onTranscriptionUpdate: (transcription: { user: string, model: string }) => void
) {
    if (sessionPromise) {
        return;
    }
    
    // Initialize output audio context
    outputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    // Create a simple gain node or connect directly. Here we just init the context.

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

    sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                console.log('Live session opened.');
                if (!audioContext || !mediaStream) return;

                const source = audioContext.createMediaStreamSource(mediaStream);
                scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    sessionPromise!.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(audioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                 if (message.serverContent?.outputTranscription) {
                    currentOutputTranscription += message.serverContent.outputTranscription.text;
                } else if (message.serverContent?.inputTranscription) {
                    currentInputTranscription += message.serverContent.inputTranscription.text;
                }
                
                if (message.serverContent?.turnComplete) {
                    const fullInputTranscription = currentInputTranscription;
                    const fullOutputTranscription = currentOutputTranscription;
                    onTranscriptionUpdate({ user: fullInputTranscription, model: fullOutputTranscription });
                    currentInputTranscription = '';
                    currentOutputTranscription = '';
                }

                const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64EncodedAudioString && outputAudioContext) {
                    nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                    const audioBuffer = await decodeAudioData(
                        decode(base64EncodedAudioString),
                        outputAudioContext,
                        24000,
                        1
                    );
                    const source = outputAudioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputAudioContext.destination);
                    source.addEventListener('ended', () => {
                        sources.delete(source);
                    });
                    source.start(nextStartTime);
                    nextStartTime += audioBuffer.duration;
                    sources.add(source);
                }

                if (message.serverContent?.interrupted) {
                    for (const source of sources.values()) {
                        try {
                            source.stop();
                        } catch (e) {
                            // ignore
                        }
                    }
                    sources.clear();
                    nextStartTime = 0;
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error('Live session error:', e);
                stopSession();
            },
            onclose: (e: CloseEvent) => {
                console.log('Live session closed.');
                stopSession();
            },
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Algenib' },
                },
            },
            systemInstruction: SYSTEM_INSTRUCTION,
        },
    });
}

export function stopSession() {
    if (sessionPromise) {
        sessionPromise.then((session: any) => session.close());
        sessionPromise = null;
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }

    if (scriptProcessor) {
        scriptProcessor.disconnect();
        scriptProcessor = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    if (outputAudioContext) {
        outputAudioContext.close();
        outputAudioContext = null;
    }
    
    // Clear playback queue
    for (const source of sources.values()) {
        try {
            source.stop();
        } catch (e) {
            // Ignore
        }
    }
    sources.clear();
    nextStartTime = 0;
    
    // Reset transcription state
    currentInputTranscription = '';
    currentOutputTranscription = '';
}