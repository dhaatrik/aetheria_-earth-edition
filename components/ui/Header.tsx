import React from 'react';

interface HeaderProps {
    audioEnabled: boolean;
    toggleAudio: () => void;
    togglePhoto: () => void;
    onGenerate: () => void;
    isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    audioEnabled,
    toggleAudio,
    togglePhoto,
    onGenerate,
    isLoading
}) => (
    <header className="flex justify-between items-start pointer-events-auto">
        <div>
        <h1 className="text-4xl md:text-6xl font-sci-fi font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
            AETHERIA
        </h1>
        <p className="text-cyan-200/60 font-tech text-sm tracking-[0.2em] mt-1">PLANETARY SIMULATION ENGINE v1.2</p>
        </div>

        <div className="flex gap-2">
            <button onClick={toggleAudio} className={`px-4 py-3 border backdrop-blur-md text-xs uppercase tracking-widest transition-colors ${audioEnabled ? 'bg-green-900/30 border-green-500/50 text-green-200' : 'bg-gray-900/30 border-gray-600/50 text-gray-400'}`}>
                {audioEnabled ? 'Audio ON' : 'Audio OFF'}
            </button>
            <button onClick={togglePhoto} className="px-4 py-3 bg-gray-900/30 border border-gray-600/50 backdrop-blur-md text-gray-300 hover:text-white hover:bg-white/10 text-xs uppercase tracking-widest">
                Photo Mode
            </button>
            <button
            onClick={onGenerate}
            disabled={isLoading}
            className={`px-6 py-3 bg-cyan-900/30 border border-cyan-500/50 backdrop-blur-md text-cyan-100 font-tech uppercase tracking-widest text-sm hover:bg-cyan-500/20 transition-all flex items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            >
            {isLoading ? "Simulating..." : "⟳ Generate World"}
            </button>
        </div>
    </header>
);
