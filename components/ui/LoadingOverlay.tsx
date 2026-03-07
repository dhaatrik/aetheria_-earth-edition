import React from 'react';

interface LoadingOverlayProps {
    loadingMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loadingMessage }) => (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-cyan-500/50 px-8 py-4 rounded-full">
         <span className="text-cyan-400 animate-pulse font-tech tracking-widest uppercase">{loadingMessage || "Processing..."}</span>
    </div>
);
