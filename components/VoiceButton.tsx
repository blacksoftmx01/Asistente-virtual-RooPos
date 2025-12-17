import React from 'react';

interface VoiceButtonProps {
  isSessionActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.75 6.75 0 11-13.5 0v-1.5a.75.75 0 01.75-.75z" />
    </svg>
);

const StopIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
    </svg>
);


export const VoiceButton: React.FC<VoiceButtonProps> = ({ isSessionActive, onStart, onStop }) => {
    const handleClick = () => {
        if (isSessionActive) {
            onStop();
        } else {
            onStart();
        }
    };

    const buttonClasses = `p-3 rounded-lg transition-colors self-end ${
        isSessionActive 
            ? 'bg-yellow-600 text-white hover:bg-yellow-700 animate-pulse' 
            : 'bg-green-600 text-white hover:bg-green-700'
    }`;
    
    return (
        <button
            type="button"
            onClick={handleClick}
            className={buttonClasses}
            aria-label={isSessionActive ? "Detener sesión de voz" : "Iniciar sesión de voz"}
        >
            {isSessionActive ? <StopIcon /> : <MicrophoneIcon />}
        </button>
    );
};