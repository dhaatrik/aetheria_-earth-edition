import React from 'react';

export const TabButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[10px] uppercase tracking-wider border border-b-0 rounded-t-lg transition-all ${active ? 'bg-cyan-900/50 border-cyan-500 text-cyan-100' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'}`}
    >
      {label}
    </button>
);
