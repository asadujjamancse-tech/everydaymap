import React from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

export const MapHUD: React.FC = () => {
    const { currentCoords, mapZoom, isGlobeMode, mapStyle, toggleGlobeMode } = useMapStore();

    const lat = currentCoords ? currentCoords.lat.toFixed(4) : '—';
    const lng = currentCoords ? currentCoords.lng.toFixed(4) : '—';

    return (
        <>
            {/* Bottom-left HUD: coordinates + zoom */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 left-4 z-30 flex flex-col gap-2"
            >
                {/* Mode switcher */}
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleGlobeMode(true)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            isGlobeMode
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-slate-800/80 backdrop-blur text-slate-400 border border-slate-700 hover:border-purple-500/50'
                        }`}
                    >
                        🌍 Globe
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleGlobeMode(false)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            !isGlobeMode
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-slate-800/80 backdrop-blur text-slate-400 border border-slate-700 hover:border-blue-500/50'
                        }`}
                    >
                        🗺️ Map
                    </motion.button>
                </div>

                {/* Coordinate / zoom readout */}
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-lg border border-purple-500/20 px-3 py-2 flex items-center gap-4 text-xs font-mono shadow-xl">
                    <span className="text-slate-500">LAT</span>
                    <span className="text-purple-300">{lat}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-500">LNG</span>
                    <span className="text-blue-300">{lng}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-500">Z</span>
                    <span className="text-cyan-300">{mapZoom}</span>
                </div>
            </motion.div>

            {/* Top-right badge: active style */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-20 right-4 z-30"
            >
                <div className="bg-slate-900/70 backdrop-blur rounded-lg px-3 py-1.5 border border-purple-500/20 text-xs text-slate-400 shadow-lg capitalize">
                    {mapStyle} mode
                </div>
            </motion.div>
        </>
    );
};
