import React from 'react';

export const StatBar: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = "bg-blue-500" }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs uppercase tracking-widest text-gray-400 mb-1">
      <span>{label}</span>
      <span className="text-white font-tech">{value}</span>
    </div>
    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.5)]`} style={{ width: '100%' }}></div>
    </div>
  </div>
);
