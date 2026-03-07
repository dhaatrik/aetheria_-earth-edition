import React from 'react';
import { PlanetLore } from '../../types';
import { StatBar } from './StatBar';

interface LorePanelProps {
    lore: PlanetLore;
}

export const LorePanel: React.FC<LorePanelProps> = ({ lore }) => (
    <div className="w-full md:max-w-md bg-black/60 backdrop-blur-md border-r-2 border-purple-500/50 p-6 shadow-2xl text-right">
        <h2 className="text-3xl font-sci-fi mb-2 text-white">{lore.name}</h2>
        <div className="flex flex-col items-end">
        <span className="px-2 py-0.5 bg-purple-900/50 border border-purple-500/30 text-[10px] uppercase tracking-widest text-purple-200 mb-2">
            Civilization: {lore.civilizationType}
        </span>
        <p className="font-tech text-md text-gray-300 leading-relaxed mb-4">
            {lore.description}
        </p>
        <div className="w-full">
            <StatBar label="Habitability" value={lore.habitabilityScore} color={lore.habitabilityScore > 80 ? 'bg-green-400' : 'bg-yellow-400'} />
        </div>
        <div className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest">
            Interact with the globe to scan sectors
        </div>
        </div>
    </div>
);
