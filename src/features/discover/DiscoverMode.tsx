import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

export const DiscoverMode: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { toggleGlobeRotation, setCameraPosition } = useMapStore();

    const handleDiscoverMode = () => {
        setIsOpen(true);
        toggleGlobeRotation(true);
    };

    const handleSurpriseMe = () => {
        // Random camera position
        const randomLon = Math.random() * 360 - 180;
        const randomLat = Math.random() * 180 - 90;
        setCameraPosition({
            x: Math.sin((randomLon * Math.PI) / 180) * 2,
            y: Math.sin((randomLat * Math.PI) / 180) * 2,
            z: Math.cos((randomLon * Math.PI) / 180) * 2,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-24 right-6 z-40 flex flex-col gap-3"
        >
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSurpriseMe}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center text-2xl"
                title="Surprise me with a random destination"
            >
                🎲
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center text-2xl"
                title="Explore the globe"
            >
                🌍
            </motion.button>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-20 right-0 bg-slate-900/90 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30 shadow-xl w-64"
                >
                    <h3 className="text-white font-semibold mb-3">Explore Mode</h3>
                    <div className="space-y-2">
                        <p className="text-slate-400 text-sm">Discover hidden gems around the world</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition">
                                Hidden Gems
                            </button>
                            <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition">
                                Trending
                            </button>
                            <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition">
                                Budget
                            </button>
                            <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition">
                                Luxury
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
