import React from 'react';
import { MessageRole } from '../types';
import { SpeakerButton } from './SpeakerButton';
import { AdolfoRomeoAvatar } from './AdolfoRomeoAvatar';

interface ChatMessageProps {
  role: MessageRole;
  text: string;
  isSpeaking: boolean;
  onPlayAudio: () => void;
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
);

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ role, text, isSpeaking, onPlayAudio }) => {
  const isUser = role === MessageRole.USER;

  // Simple markdown to HTML conversion
  const formatText = (inputText: string) => {
    const boldFormatted = inputText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const listFormatted = boldFormatted.replace(/^\s*[\*\-]\s/gm, '</li><li class="mt-1">');
    return `<ul class="list-disc pl-5">${listFormatted}</ul>`.replace(/<ul><\/li>/, '<ul>');
  };

  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

  const formattedText = formatText(text);

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <AdolfoRomeoAvatar />
        </div>
      )}
      <div
        className={`max-w-xl p-4 rounded-xl shadow-md prose prose-invert prose-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
        dangerouslySetInnerHTML={createMarkup(formattedText)}
      >
      </div>
      {!isUser && (
          <div className="self-center">
            <SpeakerButton isSpeaking={isSpeaking} onClick={onPlayAudio} />
          </div>
      )}
       {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
          <UserIcon />
        </div>
      )}
    </div>
  );
};
