import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';
import { layerConfigs } from './layerConfigs';

export const LayerToggle: React.FC = () => {
    const { activeLayers, toggleLayer } = useMapStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-30 bg-slate-900/80 backdrop-blur-xl rounded-xl border border-purple-500/20 p-4 shadow-2xl max-w-sm"
        >
            <h3 className="text-white font-semibold mb-3 text-sm">Map Layers</h3>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                    {Object.entries(layerConfigs).map(([key, config]) => (
                        <motion.button
                            key={key}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleLayer(key as any)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${(activeLayers as Record<string, boolean>)[key]
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            <span className="mr-1">{config.icon}</span>
                            {config.name}
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
