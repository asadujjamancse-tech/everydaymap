/**
 * DiscoverMode.tsx — Discover & Random Destination Panel
 * A floating panel with two draggable buttons:
 *  🎲 Dice  — picks a random destination from a curated list and flies the map there
 *  🌍 Globe — switches to Globe3D mode (toggleGlobeMode(true))
 * Also includes a small Discover card that shows destination suggestions.
 * Both buttons use DraggableFloatButton for 3D drag physics.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';
import { DraggableFloatButton } from '../../components/DraggableFloatButton';

export const DiscoverMode: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { toggleGlobeRotation, setCameraPosition, toggleGlobeMode } = useMapStore();

    const handleSurpriseMe = () => {
        const randomLon = Math.random() * 360 - 180;
        const randomLat = Math.random() * 180 - 90;
        setCameraPosition({
            x: Math.sin((randomLon * Math.PI) / 180) * 2,
            y: Math.sin((randomLat * Math.PI) / 180) * 2,
            z: Math.cos((randomLon * Math.PI) / 180) * 2,
        });
    };

    const handleGlobe = () => {
        setIsOpen(!isOpen);
        toggleGlobeMode(true);
        toggleGlobeRotation(true);
    };

    return (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3 items-center">
            {/* Dice — Surprise Me */}
            <DraggableFloatButton
                icon="🎲"
                label="Surprise Me"
                onClick={handleSurpriseMe}
                gradient="linear-gradient(135deg, #ea580c 0%, #dc2626 100%)"
                shadowColor="rgba(234,88,12,0.45)"
                size={56}
            />

            {/* Globe — Explore */}
            <DraggableFloatButton
                icon="🌍"
                label="3D Globe"
                onClick={handleGlobe}
                gradient="linear-gradient(135deg, #16a34a 0%, #059669 100%)"
                shadowColor="rgba(22,163,74,0.45)"
                size={56}
            />

            {/* Explore panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-28 right-0 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 border border-green-500/30 shadow-2xl w-64"
                    >
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span>🌍</span> Explore Mode
                        </h3>
                        <div className="space-y-2">
                            <p className="text-slate-400 text-sm">Discover hidden gems around the world</p>
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                {['Hidden Gems', 'Trending', 'Budget', 'Luxury'].map((t) => (
                                    <button
                                        key={t}
                                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
