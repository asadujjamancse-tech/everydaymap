import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../store/mapStore';
import { routeAIPlanner, RouteRequest } from '../features/ai-assistant/RouteAIPlanner';

export const RouteBuilder: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [routeType, setRouteType] = useState<'backpacking' | 'luxury' | 'budget' | 'adventure' | 'custom'>('backpacking');
    const [budget, setBudget] = useState(1500);
    const [duration, setDuration] = useState(14);
    const [isGenerating, setIsGenerating] = useState(false);

    const { createRoute, setActiveRoute, openPanel } = useMapStore();

    const handleGenerateRoute = async () => {
        setIsGenerating(true);
        try {
            const request: RouteRequest = {
                type: routeType,
                budget,
                duration,
                interests: [],
                regions: [],
            };

            const route = await routeAIPlanner.generateRoute(request);
            createRoute(route);
            setActiveRoute(route);
            openPanel('route');
            setIsOpen(false);
        } catch (error) {
            console.error('Error generating route:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-40">
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="mb-4 w-80 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-purple-500/20 overflow-hidden p-6"
                >
                    <h2 className="text-white font-bold text-lg mb-4">🗺️ Build Your Route</h2>

                    <div className="space-y-4">
                        {/* Route Type */}
                        <div>
                            <label className="text-slate-400 text-sm mb-2 block">Route Type</label>
                            <select
                                value={routeType}
                                onChange={(e) => setRouteType(e.target.value as any)}
                                className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-purple-500/20 focus:border-purple-500 outline-none"
                            >
                                <option value="backpacking">Backpacking</option>
                                <option value="luxury">Luxury</option>
                                <option value="budget">Budget</option>
                                <option value="adventure">Adventure</option>
                            </select>
                        </div>

                        {/* Budget */}
                        <div>
                            <label className="text-slate-400 text-sm mb-2 block">
                                Budget: ${budget}
                            </label>
                            <input
                                type="range"
                                min="500"
                                max="10000"
                                step="100"
                                value={budget}
                                onChange={(e) => setBudget(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-slate-400 text-sm mb-2 block">
                                Duration: {duration} days
                            </label>
                            <input
                                type="range"
                                min="3"
                                max="90"
                                step="1"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        {/* Generate Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGenerateRoute}
                            disabled={isGenerating}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                        >
                            {isGenerating ? '🔄 Generating...' : '✈️ Generate Route'}
                        </motion.button>
                    </div>
                </motion.div>
            )}

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center text-2xl"
            >
                {isOpen ? '✕' : '✈️'}
            </motion.button>
        </div>
    );
};
