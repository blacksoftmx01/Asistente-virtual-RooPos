import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);


export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-grow flex items-center gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Pregunta sobre RoosPOS..."
        className="flex-grow p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        disabled={isSending}
      />
      <button
        type="submit"
        disabled={isSending || !input.trim()}
        className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        aria-label="Enviar mensaje"
      >
        <SendIcon />
      </button>
    </form>
  );
};