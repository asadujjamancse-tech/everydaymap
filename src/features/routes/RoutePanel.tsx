import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

export const RoutePanel: React.FC = () => {
    const {
        isPanelOpen,
        panelContent,
        activeRoute,
        travelRoutes,
        closePanel,
        startRouteAnimation,
        stopRouteAnimation,
        isRouteAnimating,
    } = useMapStore();

    if (!isPanelOpen || panelContent !== 'route' || !activeRoute) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed right-0 top-14 bottom-10 w-96 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl z-45 overflow-y-auto border-l border-purple-500/20"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 relative">
                <button
                    onClick={closePanel}
                    className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                    ✕
                </button>
                <h1 className="text-2xl font-bold text-white">✈️ {activeRoute.name}</h1>
                <p className="text-purple-100 text-xs mt-1 uppercase tracking-wider">{activeRoute.type} Route</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Route Stats */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 gap-3"
                >
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20 text-center">
                        <p className="text-slate-400 text-xs mb-1">Total Cost</p>
                        <p className="text-green-400 text-lg font-bold">${activeRoute.totalBudget}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20 text-center">
                        <p className="text-slate-400 text-xs mb-1">Days</p>
                        <p className="text-blue-400 text-lg font-bold">{activeRoute.totalDays}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20 text-center">
                        <p className="text-slate-400 text-xs mb-1">Countries</p>
                        <p className="text-purple-400 text-lg font-bold">{activeRoute.points.length}</p>
                    </div>
                </motion.div>

                {/* Route Animation Controls */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20"
                >
                    <h3 className="text-white font-semibold mb-4">🎬 Route Animation</h3>
                    <div className="space-y-3">
                        {!isRouteAnimating ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startRouteAnimation}
                                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition"
                            >
                                ▶️ Play Route Animation
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={stopRouteAnimation}
                                className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition"
                            >
                                ⏸️ Stop Animation
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* Route Stops */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20"
                >
                    <h3 className="text-white font-semibold mb-4">📍 Route Stops</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {activeRoute.points.map((point, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ x: 5 }}
                                className="bg-slate-900/50 rounded-lg p-3 border border-purple-500/10 hover:border-purple-500/30 transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded font-bold">
                                                {index + 1}
                                            </span>
                                            <h4 className="text-white font-semibold">{point.country}</h4>
                                        </div>
                                        <p className="text-slate-400 text-xs">{point.days} days • ${point.budget}</p>
                                        {point.attractions.length > 0 && (
                                            <p className="text-slate-500 text-xs mt-1">
                                                {point.attractions.slice(0, 2).join(', ')}
                                                {point.attractions.length > 2 && ` +${point.attractions.length - 2}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Route Cost Breakdown */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20"
                >
                    <h3 className="text-white font-semibold mb-4">💰 Budget Breakdown</h3>
                    <div className="space-y-2">
                        {activeRoute.points.map((point, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">{point.country}</span>
                                <div className="flex-1 mx-3 bg-slate-700 rounded h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-full"
                                        style={{
                                            width: `${(point.budget / activeRoute.totalBudget) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-purple-400 font-bold">${point.budget}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-purple-500/20 flex justify-between items-center">
                        <span className="text-white font-semibold">Total Budget</span>
                        <span className="text-green-400 text-xl font-bold">${activeRoute.totalBudget}</span>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-2 gap-3 pt-4"
                >
                    <button className="px-4 py-2 border border-purple-500 text-purple-300 rounded-lg font-medium hover:bg-purple-500/10 transition">
                        Edit Route
                    </button>
                    <button className="px-4 py-2 border border-red-500 text-red-300 rounded-lg font-medium hover:bg-red-500/10 transition">
                        Delete
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
};
