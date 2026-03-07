import React from 'react';
import { POIData } from '../../types';

interface POIModalProps {
    selectedPOI: POIData | null;
    closePOI: () => void;
}

export const POIModal: React.FC<POIModalProps> = ({ selectedPOI, closePOI }) => {
    if (!selectedPOI) return null;

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-black/80 backdrop-blur-xl border border-cyan-500 p-6 pointer-events-auto z-50 shadow-[0_0_50px_rgba(0,255,255,0.2)]">
            <h3 className="text-cyan-400 font-sci-fi text-xl mb-2">{selectedPOI.title}</h3>
            <div className="text-[10px] text-gray-500 mb-4 font-mono">
                LAT: {selectedPOI.coordinates.y.toFixed(4)} | LON: {selectedPOI.coordinates.x.toFixed(4)}
            </div>
            <p className="text-gray-200 font-tech text-sm leading-relaxed mb-4 border-l-2 border-cyan-500/30 pl-3">
                {selectedPOI.description}
            </p>
            <button onClick={closePOI} className="w-full py-2 bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 text-xs uppercase tracking-widest">
                Close Report
            </button>
        </div>
    );
};
