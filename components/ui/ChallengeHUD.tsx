import React from 'react';
import { PlanetParameters, SimulationState } from '../../types';

interface ChallengeHUDProps {
    challenge: SimulationState['challenge'];
    params: PlanetParameters;
    lore: SimulationState['lore'];
}

export const ChallengeHUD: React.FC<ChallengeHUDProps> = ({ challenge, params, lore }) => {
    if (!challenge.active) return null;

    return (
        <div className="absolute top-20 right-6 w-64 bg-yellow-900/20 backdrop-blur-md border border-yellow-500/50 p-4 pointer-events-auto">
            <h4 className="text-yellow-400 font-bold uppercase text-xs tracking-widest mb-2 flex justify-between">
                <span>Terraforming Goal</span>
                {challenge.success && <span className="text-green-400">SUCCESS</span>}
            </h4>
            <p className="text-xs text-yellow-100 mb-3 leading-relaxed">{challenge.description}</p>
            <div className="space-y-2">
                {challenge.targetStats.cloudDensity !== undefined && (
                    <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Target Clouds: {challenge.targetStats.cloudDensity}</span>
                        <span className={Math.abs(params.cloudDensity - challenge.targetStats.cloudDensity) < 0.1 ? "text-green-400" : "text-red-400"}>
                        Curr: {params.cloudDensity.toFixed(1)}
                        </span>
                    </div>
                )}
                {challenge.targetStats.habitabilityScore !== undefined && (
                    <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Target Hab: {challenge.targetStats.habitabilityScore}</span>
                        <span className={lore.habitabilityScore >= challenge.targetStats.habitabilityScore ? "text-green-400" : "text-red-400"}>
                        Curr: {lore.habitabilityScore}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
