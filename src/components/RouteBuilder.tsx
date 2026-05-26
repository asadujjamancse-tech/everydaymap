/**
 * RouteBuilder.tsx — Multi-Stop Trip Builder (Floating ✈️ Button)
 * A draggable ✈️ button (bottom-left) that opens a full trip planner panel.
 * Users add multiple destination stops, set total days and budget,
 * then click "AI Plan" to call RouteAIPlanner which generates the full
 * TravelRoute with per-stop budgets and attraction lists.
 * The generated route is saved to the store and shown in RoutePanel.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../store/mapStore';
import { routeAIPlanner, RouteRequest } from '../features/ai-assistant/RouteAIPlanner';
import { DraggableFloatButton } from './DraggableFloatButton';

const ROUTE_TYPES = [
    { value: 'backpacking', label: '🎒 Backpacking', desc: 'Southeast Asia trail' },
    { value: 'luxury',      label: '💎 Luxury',      desc: 'Premium experiences' },
    { value: 'budget',      label: '💰 Budget',      desc: 'Maximum value' },
    { value: 'adventure',   label: '🥾 Adventure',   desc: '5-continent thrills' },
    { value: 'custom',      label: '🗺️ Mediterranean',desc: 'Europe grand tour' },
] as const;

export const RouteBuilder: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [routeType, setRouteType] = useState<RouteRequest['type']>('backpacking');
    const [budget, setBudget] = useState(2000);
    const [duration, setDuration] = useState(21);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const { createRoute, setActiveRoute, openPanel } = useMapStore();

    const selectedType = ROUTE_TYPES.find((t) => t.value === routeType)!;

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const request: RouteRequest = { type: routeType, budget, duration, interests: [], regions: [] };
            const route = await routeAIPlanner.generateRoute(request);
            createRoute(route);
            setActiveRoute(route);
            openPanel('route');
            setIsOpen(false);
        } catch (e) {
            setError('Failed to generate route. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-40">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="mb-4 w-72 bg-slate-900/97 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/25 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-700/80 to-blue-700/80 px-4 py-3 flex items-center gap-2">
                            <span className="text-xl">🗺️</span>
                            <div>
                                <h2 className="text-white font-bold text-sm">Build Your Route</h2>
                                <p className="text-purple-200 text-[10px]">AI-powered worldwide planner</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Route type selector */}
                            <div>
                                <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Route Style</p>
                                <div className="space-y-1.5">
                                    {ROUTE_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => setRouteType(t.value)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all border ${
                                                routeType === t.value
                                                    ? 'bg-purple-600/20 border-purple-500/50 text-white'
                                                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-purple-500/30 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-sm">{t.label.split(' ')[0]}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate">{t.label.slice(t.label.indexOf(' ') + 1)}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{t.desc}</p>
                                            </div>
                                            {routeType === t.value && <span className="text-purple-400 text-xs">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Budget slider */}
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider">Total Budget</p>
                                    <p className="text-purple-300 text-xs font-bold">${budget.toLocaleString()}</p>
                                </div>
                                <input type="range" min="500" max="15000" step="250" value={budget}
                                    onChange={(e) => setBudget(+e.target.value)}
                                    className="w-full accent-purple-500" />
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                    <span>$500</span><span>$15,000</span>
                                </div>
                            </div>

                            {/* Duration slider */}
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider">Duration</p>
                                    <p className="text-blue-300 text-xs font-bold">{duration} days</p>
                                </div>
                                <input type="range" min="5" max="90" step="1" value={duration}
                                    onChange={(e) => setDuration(+e.target.value)}
                                    className="w-full accent-blue-500" />
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                    <span>5 days</span><span>90 days</span>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700/50">
                                <p className="text-slate-400 text-[10px]">~${Math.round(budget / duration)}/day · {selectedType.label} · worldwide</p>
                            </div>

                            {error && <p className="text-red-400 text-xs">{error}</p>}

                            <motion.button
                                whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                                whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                            >
                                {isGenerating
                                    ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⟳</motion.span> Generating…</span>
                                    : '✈️ Generate Route'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DraggableFloatButton
                icon={isOpen ? '✕' : '✈️'}
                label="Build Route"
                onClick={() => setIsOpen(!isOpen)}
                gradient="linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)"
                shadowColor="rgba(124,58,237,0.45)"
                size={56}
            />
        </div>
    );
};
