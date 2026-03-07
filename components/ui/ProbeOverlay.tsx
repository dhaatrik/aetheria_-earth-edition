import React from 'react';

interface ProbeOverlayProps {
    isProbeLanding: boolean;
}

export const ProbeOverlay: React.FC<ProbeOverlayProps> = ({ isProbeLanding }) => {
    if (!isProbeLanding) return null;

    return (
        <div className="absolute inset-0 bg-cyan-900/10 pointer-events-none flex items-center justify-center z-40">
        <div className="w-[80%] h-[80%] border-2 border-cyan-500/30 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODk2ODk0ZDI0NzQxNzY1NjY1YjY5YjY5YjY5YjY5YjY5YjY5/3o7TKs4x94h938637i/giphy.gif')] opacity-10 bg-cover mix-blend-screen"></div>
            <div className="text-center">
                <h2 className="text-4xl font-sci-fi text-white animate-pulse">ESTABLISHING LINK...</h2>
                <p className="text-cyan-400 font-tech mt-2 tracking-widest">DESCENDING TO SURFACE</p>
            </div>
        </div>
        </div>
    );
};
