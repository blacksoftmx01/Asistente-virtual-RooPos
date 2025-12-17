import React from 'react';

// Referencia a la imagen local. 
// Asegúrate de guardar la imagen adjunta como 'adolfo_romeo.png' en la raíz del proyecto.
const imageData = "/adolfo_romeo.png";

export const AdolfoRomeoAvatar: React.FC = () => (
    <img
        src={imageData}
        alt="Adolfo Romeo"
        className="w-10 h-10 rounded-full object-cover border border-gray-600 bg-gray-800"
    />
);