
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatMessageComponent } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ThinkingSpinner } from './components/ThinkingSpinner';
import { VoiceButton } from './components/VoiceButton';
import { ChatMessage, MessageRole } from './types';
import * as geminiService from './services/geminiService';
import * as liveService from './services/liveService';
import * as ttsService from './services/ttsService';

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInitialMessage = async () => {
            setIsLoading(true);
            try {
                // The system instruction asks for a warm welcome.
                const initialMessageText = await geminiService.sendMessage("Hola");
                const initialMessage: ChatMessage = { role: MessageRole.MODEL, text: initialMessageText };
                setMessages([initialMessage]);
                handlePlayAudio(initialMessageText, 0);
            } catch(error) {
                console.error("Error al obtener el mensaje inicial:", error);
                setMessages([{ role: MessageRole.MODEL, text: "¡Bienvenido! Estoy teniendo un pequeño problema para conectarme en este momento. Por favor, inténtalo de nuevo en un momento." }]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialMessage();
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading, speakingMessageIndex]);

    const handlePlayAudio = async (text: string, index: number) => {
        if (speakingMessageIndex === index) {
            ttsService.stopSpeaking();
            setSpeakingMessageIndex(null);
        } else {
            setSpeakingMessageIndex(index);
            await ttsService.speak(text, () => {
                setSpeakingMessageIndex(null);
            });
        }
    };

    const handleSendMessage = async (text: string) => {
        setMessages(prev => [...prev, { role: MessageRole.USER, text }]);
        setIsLoading(true);
        try {
            const responseText = await geminiService.sendMessage(text);
            const modelMessage: ChatMessage = { role: MessageRole.MODEL, text: responseText };
            
            setMessages(prev => {
                const updatedMessages = [...prev, modelMessage];
                const newIndex = updatedMessages.length - 1;
                handlePlayAudio(responseText, newIndex);
                return updatedMessages;
            });

        } catch (error) {
            console.error("Error al enviar el mensaje:", error);
            setMessages(prev => [...prev, { role: MessageRole.MODEL, text: "Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo más tarde." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleTranscription = (transcription: { user: string, model: string }) => {
        const newMessages: ChatMessage[] = [];
        if (transcription.user) {
            newMessages.push({ role: MessageRole.USER, text: transcription.user });
        }
        if (transcription.model) {
            newMessages.push({ role: MessageRole.MODEL, text: transcription.model });
        }
        if (newMessages.length > 0) {
            setMessages(prev => [...prev, ...newMessages]);
        }
    };

    const handleStartVoice = async () => {
        try {
            ttsService.stopSpeaking();
            setSpeakingMessageIndex(null);
            await liveService.startSession(handleTranscription);
            setIsSessionActive(true);
        } catch (error) {
            console.error("Error al iniciar la sesión de voz:", error);
            setMessages(prev => [...prev, { role: MessageRole.MODEL, text: "Lo siento, no pude iniciar la sesión de voz. Por favor, revisa los permisos de tu micrófono." }]);
        }
    };

    const handleStopVoice = () => {
        liveService.stopSession();
        setIsSessionActive(false);
    };


    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
            <Header />
            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-3xl mx-auto">
                    {messages.map((msg, index) => (
                        <ChatMessageComponent 
                            key={index} 
                            role={msg.role} 
                            text={msg.text} 
                            isSpeaking={speakingMessageIndex === index}
                            onPlayAudio={() => handlePlayAudio(msg.text, index)}
                        />
                    ))}
                    {isLoading && <ThinkingSpinner />}
                </div>
            </main>
            <footer className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="max-w-3xl mx-auto flex items-center gap-2">
                    <ChatInput onSendMessage={handleSendMessage} isSending={isLoading || isSessionActive} />
                    <VoiceButton 
                        isSessionActive={isSessionActive} 
                        onStart={handleStartVoice} 
                        onStop={handleStopVoice} 
                    />
                </div>
            </footer>
        </div>
    );
};

export default App;
