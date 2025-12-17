
import React from 'react';

export const ThinkingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};
