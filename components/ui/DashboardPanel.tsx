import React from 'react';
import { PlanetParameters, SunType } from '../../types';
import { TabButton } from './TabButton';
import { Slider } from './Slider';

interface DashboardPanelProps {
    params: PlanetParameters;
    updateParams: (params: Partial<PlanetParameters>) => void;
    onEvolve: () => void;
    onDisaster: () => void;
    onChallenge: () => void;
    isProbeLanding: boolean;
    toggleProbe: () => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
    params,
    updateParams,
    onEvolve,
    onDisaster,
    onChallenge,
    isProbeLanding,
    toggleProbe
}) => (
    <div className="w-full md:w-80 bg-black/80 backdrop-blur-md border border-gray-800 shadow-2xl flex flex-col">
        {/* Tabs */}
        <div className="flex px-4 pt-4 border-b border-gray-800 gap-1">
            <TabButton active={params.dataLayer === 'visual'} label="Visual" onClick={() => updateParams({ dataLayer: 'visual' })} />
            <TabButton active={params.dataLayer === 'thermal'} label="Thermal" onClick={() => updateParams({ dataLayer: 'thermal' })} />
            <TabButton active={params.dataLayer === 'population'} label="Pop" onClick={() => updateParams({ dataLayer: 'population' })} />
            <TabButton active={params.dataLayer === 'vegetation'} label="Bio" onClick={() => updateParams({ dataLayer: 'vegetation' })} />
        </div>

        <div className="p-4 space-y-4">
            {/* Controls */}
            <div>
                <h4 className="text-[10px] uppercase text-cyan-500 font-bold mb-3 tracking-widest">Atmospheric Composition</h4>
                <Slider label="Cloud Density" value={params.cloudDensity} min={0} max={1} onChange={(v) => updateParams({ cloudDensity: v })} />
                <Slider label="Snow Cover (Ice Age)" value={params.snowLevel} min={0} max={1} onChange={(v) => updateParams({ snowLevel: v })} />
                <Slider label="Toxicity (Murkiness)" value={params.waterMurkiness} min={0} max={1} onChange={(v) => updateParams({ waterMurkiness: v })} />
            </div>

            <div>
                <h4 className="text-[10px] uppercase text-cyan-500 font-bold mb-3 tracking-widest">Star System</h4>
                <div className="flex gap-2">
                    {(['yellow', 'red', 'blue'] as SunType[]).map(type => (
                        <button
                        key={type}
                        onClick={() => updateParams({ sunType: type })}
                        className={`flex-1 py-1 text-[10px] uppercase border ${params.sunType === type ? 'bg-white/20 border-white text-white' : 'border-gray-700 text-gray-500'}`}
                        >
                        {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Advanced Controls */}
            <div className="grid grid-cols-2 gap-2">
                <button onClick={onEvolve} className="py-2 bg-purple-900/40 hover:bg-purple-800 border border-purple-500/30 text-[9px] uppercase tracking-wider text-purple-200">
                    Evolution Step (+1ky)
                </button>
                <button onClick={onDisaster} className="py-2 bg-red-900/40 hover:bg-red-800 border border-red-500/30 text-[9px] uppercase tracking-wider text-red-200">
                    Trigger Event
                </button>
                <button onClick={onChallenge} className="col-span-2 py-2 bg-yellow-900/40 hover:bg-yellow-800 border border-yellow-500/30 text-[9px] uppercase tracking-wider text-yellow-200">
                    Start Terraforming Challenge
                </button>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button
                    onClick={() => updateParams({ showSatellites: !params.showSatellites })}
                    className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-wider ${params.showSatellites ? 'bg-cyan-900 text-cyan-200' : 'bg-gray-800 text-gray-400'}`}
                >
                    Satellites
                </button>
                <button
                    onClick={toggleProbe}
                    className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-wider ${isProbeLanding ? 'bg-red-900 text-red-200' : 'bg-gray-800 text-gray-400'}`}
                >
                    {isProbeLanding ? 'Abort' : 'Land Probe'}
                </button>
            </div>
        </div>
    </div>
);
