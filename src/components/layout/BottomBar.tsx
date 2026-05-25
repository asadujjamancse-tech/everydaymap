import React from 'react';
import { motion } from 'framer-motion';
import { useMapStore, MapStyle } from '../../store/mapStore';

const STYLES: { id: MapStyle; label: string; icon: string }[] = [
    { id: 'dark',       label: 'Dark',     icon: '🌑' },
    { id: 'satellite',  label: 'Satellite',icon: '🛰️' },
    { id: 'standard',   label: 'Streets',  icon: '🗺️' },
    { id: 'terrain',    label: 'Terrain',  icon: '⛰️' },
    { id: 'navigation', label: 'Nav',      icon: '🚗' },
];

export const BottomBar: React.FC = () => {
    const {
        currentCoords, mapZoom, isGlobeMode, toggleGlobeMode,
        mapStyle, setMapStyle, show3DBuildings, toggle3DBuildings,
        activeMode,
    } = useMapStore();

    return (
        <footer className="fixed bottom-0 left-0 right-0 h-10 z-50 bg-slate-950/97 backdrop-blur-2xl border-t border-white/[0.06] flex items-center px-4 gap-4">

            {/* ── Globe / Map toggle ──────────────────────────────── */}
            <div className="flex items-center gap-1 shrink-0">
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                    onClick={() => toggleGlobeMode(true)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                        isGlobeMode ? 'bg-purple-600/40 text-purple-300 border border-purple-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <span>🌍</span>
                    <span>Globe</span>
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                    onClick={() => toggleGlobeMode(false)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                        !isGlobeMode ? 'bg-blue-600/40 text-blue-300 border border-blue-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <span>🗺️</span>
                    <span>Map</span>
                </motion.button>
            </div>

            <div className="w-px h-5 bg-white/10 shrink-0" />

            {/* ── Coordinates ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 text-slate-500 text-xs font-mono shrink-0">
                {currentCoords ? (
                    <>
                        <span className="text-slate-400">
                            <span className="text-slate-600 text-[10px] mr-1">LAT</span>
                            {currentCoords.lat.toFixed(4)}
                        </span>
                        <span className="text-slate-400">
                            <span className="text-slate-600 text-[10px] mr-1">LNG</span>
                            {currentCoords.lng.toFixed(4)}
                        </span>
                        <span className="text-slate-400">
                            <span className="text-slate-600 text-[10px] mr-1">Z</span>
                            {mapZoom}
                        </span>
                    </>
                ) : (
                    <span className="text-slate-600">Coordinates unavailable</span>
                )}
            </div>

            <div className="flex-1" />

            {/* ── Active mode badge ───────────────────────────────── */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-slate-400 text-xs capitalize">{activeMode} mode</span>
            </div>

            <div className="w-px h-5 bg-white/10 shrink-0" />

            {/* ── Map style pills ──────────────────────────────────── */}
            {!isGlobeMode && (
                <div className="flex items-center gap-1 shrink-0">
                    {STYLES.map((s) => (
                        <motion.button
                            key={s.id}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                            onClick={() => setMapStyle(s.id)}
                            title={s.label}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                mapStyle === s.id
                                    ? 'bg-gradient-to-r from-purple-600/40 to-blue-600/30 text-white border border-purple-500/40'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
                            }`}
                        >
                            <span>{s.icon}</span>
                            <span className="hidden lg:inline">{s.label}</span>
                        </motion.button>
                    ))}
                </div>
            )}

            <div className="w-px h-5 bg-white/10 shrink-0" />

            {/* ── 3D Buildings toggle ──────────────────────────────── */}
            {!isGlobeMode && (
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                    onClick={toggle3DBuildings}
                    title="Toggle 3D Buildings"
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        show3DBuildings ? 'text-blue-300 bg-blue-600/20 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <span>🏙️</span>
                    <span className="hidden md:inline">3D</span>
                </motion.button>
            )}
        </footer>
    );
};
