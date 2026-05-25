import React from 'react';
import { motion } from 'framer-motion';
import { useMapStore, MapMode, MapStyle } from '../store/mapStore';

interface ModeConfig {
    id: MapMode;
    label: string;
    icon: string;
    style: MapStyle;
    globe: boolean;
    description: string;
}

const MODES: ModeConfig[] = [
    { id: 'globe',        label: 'Globe',        icon: '🌍', style: 'dark',       globe: true,  description: 'Cinematic 3D Earth' },
    { id: 'navigation',   label: 'Navigate',     icon: '🚗', style: 'navigation', globe: false, description: 'Driving & walking routes' },
    { id: 'adventure',    label: 'Adventure',    icon: '🥾', style: 'terrain',    globe: false, description: 'Hiking & exploration' },
    { id: 'analytics',    label: 'Analytics',    icon: '📊', style: 'dark',       globe: false, description: 'Travel data & heatmaps' },
    { id: 'immersive',    label: 'Explore',      icon: '🎮', style: 'satellite',  globe: false, description: 'Cinematic discovery' },
    { id: 'intelligence', label: 'Intelligence', icon: '✈️', style: 'dark',       globe: false, description: 'AI travel intelligence' },
    { id: 'satellite',    label: 'Satellite',    icon: '🛰️', style: 'satellite',  globe: false, description: 'Aerial imagery' },
    { id: 'crowd',        label: 'Crowd',        icon: '🚨', style: 'navigation', globe: false, description: 'Live traffic & alerts' },
    { id: 'offline',      label: 'Offline',      icon: '🧭', style: 'standard',   globe: false, description: 'Offline navigation' },
];

export const ModeController: React.FC = () => {
    const { activeMode, setActiveMode, setMapStyle, toggleGlobeMode } = useMapStore();

    const handleMode = (cfg: ModeConfig) => {
        setActiveMode(cfg.id);
        setMapStyle(cfg.style);
        toggleGlobeMode(cfg.globe);
    };

    return (
        <div className="absolute top-[72px] left-1/2 -translate-x-1/2 z-30 px-4 w-full max-w-3xl">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1">
                {MODES.map((m) => {
                    const active = activeMode === m.id;
                    return (
                        <motion.button
                            key={m.id}
                            whileHover={{ scale: 1.06, y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleMode(m)}
                            title={m.description}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${
                                active
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-900/80 backdrop-blur text-slate-400 border-slate-700/60 hover:text-white hover:border-purple-500/40'
                            }`}
                        >
                            <span className="text-sm leading-none">{m.icon}</span>
                            <span>{m.label}</span>
                            {active && (
                                <motion.span
                                    layoutId="mode-dot"
                                    className="w-1.5 h-1.5 rounded-full bg-white/80"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
