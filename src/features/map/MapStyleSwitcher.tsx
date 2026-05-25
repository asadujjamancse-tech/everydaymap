import React from 'react';
import { motion } from 'framer-motion';
import { useMapStore, MapStyle } from '../../store/mapStore';

const STYLES: { id: MapStyle; label: string; icon: string; desc: string }[] = [
    { id: 'dark',       label: 'Dark',       icon: '🌑', desc: 'Futuristic dark map' },
    { id: 'satellite',  label: 'Satellite',  icon: '🛰️', desc: 'Real aerial imagery' },
    { id: 'standard',   label: 'Streets',    icon: '🗺️', desc: 'Standard street map' },
    { id: 'terrain',    label: 'Terrain',    icon: '⛰️', desc: 'Topographic & outdoor' },
    { id: 'navigation', label: 'Night Nav',  icon: '🚗', desc: 'Navigation night mode' },
];

export const MapStyleSwitcher: React.FC = () => {
    const { mapStyle, setMapStyle, show3DBuildings, toggle3DBuildings } = useMapStore();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2"
        >
            {/* Style buttons */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-purple-500/20 p-2 shadow-2xl flex flex-col gap-1">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest px-1 pb-1">Map Style</p>
                {STYLES.map((s) => (
                    <motion.button
                        key={s.id}
                        whileHover={{ scale: 1.04, x: 2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setMapStyle(s.id)}
                        title={s.desc}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            mapStyle === s.id
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                        }`}
                    >
                        <span className="text-base leading-none">{s.icon}</span>
                        <span>{s.label}</span>
                        {mapStyle === s.id && (
                            <motion.div
                                layoutId="style-active"
                                className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                            />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Toggles */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-purple-500/20 p-2 shadow-2xl flex flex-col gap-1">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest px-1 pb-1">Visuals</p>
                <motion.button
                    whileHover={{ scale: 1.04, x: 2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={toggle3DBuildings}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        show3DBuildings
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`}
                >
                    <span className="text-base leading-none">🏙️</span>
                    <span>3D Buildings</span>
                </motion.button>
            </div>
        </motion.div>
    );
};
