/**
 * LeftSidebar.tsx — Collapsible Left Navigation Panel
 * ─────────────────────────────────────────────────────────────────────────────
 * A spring-animated panel (288px open, 56px collapsed icon rail) anchored to
 * the left edge, below the TopBar and above the BottomBar.
 *
 * Two states:
 *  • Collapsed (56px) — shows a vertical icon rail with a button per mode.
 *    Clicking any mode button expands the sidebar and switches mode.
 *  • Expanded (288px) — shows a header with the current mode name,
 *    a scrollable content area (renderModeContent), and a fixed footer with
 *    the Map Layers toggle grid + Points of Interest toggle.
 *
 * Mode panels are lazy-rendered via renderModeContent():
 *   globe → GlobePanel (world reset + map style picker)
 *   navigation → NavigationMode
 *   adventure → AdventureMode
 *   analytics → AnalyticsMode
 *   immersive → ImmersiveMode
 *   intelligence → TravelIntelligenceMode
 *   crowd → CrowdMode
 *   satellite / offline → simple inline info panels
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore, MapMode, MapStyle } from '../../store/mapStore';
import { layerConfigs } from '../../features/layers/layerConfigs';
import { NavigationMode } from '../../modes/navigation/NavigationMode';
import { AdventureMode } from '../../modes/adventure/AdventureMode';
import { AnalyticsMode } from '../../modes/analytics/AnalyticsMode';
import { ImmersiveMode } from '../../modes/immersive/ImmersiveMode';
import { TravelIntelligenceMode } from '../../modes/intelligence/TravelIntelligenceMode';
import { CrowdMode } from '../../modes/crowd/CrowdMode';

interface ModeCfg { id: MapMode; icon: string; label: string; style: MapStyle; globe: boolean; color: string; }

const MODES: ModeCfg[] = [
    { id: 'globe',        icon: '🌍', label: 'Globe',        style: 'dark',       globe: true,  color: '#8b5cf6' },
    { id: 'navigation',   icon: '🚗', label: 'Navigate',     style: 'navigation', globe: false, color: '#3b82f6' },
    { id: 'adventure',    icon: '🥾', label: 'Adventure',    style: 'terrain',    globe: false, color: '#f97316' },
    { id: 'analytics',    icon: '📊', label: 'Analytics',    style: 'dark',       globe: false, color: '#06b6d4' },
    { id: 'immersive',    icon: '🎮', label: 'Explore',      style: 'satellite',  globe: false, color: '#ec4899' },
    { id: 'intelligence', icon: '✈️', label: 'Intelligence', style: 'dark',       globe: false, color: '#6366f1' },
    { id: 'satellite',    icon: '🛰️', label: 'Satellite',    style: 'satellite',  globe: false, color: '#0ea5e9' },
    { id: 'crowd',        icon: '🚨', label: 'Crowd',        style: 'navigation', globe: false, color: '#ef4444' },
    { id: 'offline',      icon: '🧭', label: 'Offline',      style: 'standard',   globe: false, color: '#10b981' },
];

interface LeftSidebarProps {
    open: boolean;
    onToggle: () => void;
}

const SECTION_LABELS: Record<MapMode, string> = {
    globe: 'Globe Explorer',
    navigation: 'Navigation',
    adventure: 'Adventure Trails',
    analytics: 'Travel Analytics',
    immersive: 'Immersive Explorer',
    intelligence: 'Travel Intelligence',
    satellite: 'Satellite View',
    crowd: 'Crowd Alerts',
    offline: 'Offline Navigation',
};

// Satellite & Offline are simple info panels, rendered inline
const SatellitePanel: React.FC = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
        <div className="bg-slate-800/60 rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700/60 to-blue-900/40 px-4 py-3">
                <p className="text-white font-bold text-sm">🛰️ Satellite View</p>
                <p className="text-blue-300 text-xs mt-0.5">Apple Maps-style aerial</p>
            </div>
            <div className="p-3 space-y-2">
                {['High-res aerial imagery', 'Sub-meter resolution in major cities', '3D terrain at high zoom', 'Real-time cloud layer'].map((t) => (
                    <div key={t} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-slate-400 text-xs">{t}</p>
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
);

const OfflinePanel: React.FC = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
        <div className="bg-slate-800/60 rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700/60 to-green-900/40 px-4 py-3">
                <p className="text-white font-bold text-sm">🧭 Offline Maps</p>
                <p className="text-green-300 text-xs mt-0.5">Organic Maps-style</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
                {['Bangkok', 'Tokyo', 'Paris', 'New York', 'Dubai', 'Bali'].map((city) => (
                    <div key={city} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-white text-sm">{city}</span>
                        <span className="text-green-400 text-xs font-semibold">✓ Saved</span>
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
);

const GlobePanel: React.FC = () => {
    const { mapInstance, setMapStyle, mapStyle } = useMapStore();

    const flyToWorld = () => mapInstance?.flyTo([20, 0], 3, { duration: 1.5 });

    const styles: { id: any; label: string; emoji: string }[] = [
        { id: 'dark',       label: 'Dark',       emoji: '🌑' },
        { id: 'standard',   label: 'Streets',    emoji: '🗺️' },
        { id: 'satellite',  label: 'Satellite',  emoji: '🛰️' },
        { id: 'terrain',    label: 'Terrain',    emoji: '⛰️' },
        { id: 'navigation', label: 'Navigation', emoji: '🚗' },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
            <div className="bg-slate-800/60 rounded-2xl border border-white/[0.06] p-4 space-y-3">
                <p className="text-white font-semibold text-sm">🌍 World Explorer</p>
                <p className="text-slate-400 text-xs leading-relaxed">Interactive world map. Toggle layers below to explore travel data globally.</p>
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={flyToWorld}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-sm"
                >
                    🌍 Reset to World View
                </motion.button>
            </div>
            <div className="bg-slate-800/60 rounded-2xl border border-white/[0.06] p-3 space-y-2">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Map Style</p>
                <div className="grid grid-cols-1 gap-1.5">
                    {styles.map((s) => (
                        <motion.button
                            key={s.id}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setMapStyle(s.id)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                                mapStyle === s.id
                                    ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/20 text-white border-purple-500/40'
                                    : 'bg-slate-800/50 text-slate-400 border-white/[0.06] hover:text-white hover:border-purple-500/20'
                            }`}
                        >
                            <span className="text-base">{s.emoji}</span>
                            <span>{s.label}</span>
                            {mapStyle === s.id && <span className="ml-auto text-purple-400 text-[10px]">Active</span>}
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ open, onToggle }) => {
    const { activeMode, setActiveMode, setMapStyle, toggleGlobeMode, activeLayers, toggleLayer, showPOI, setShowPOI, mapStyle } = useMapStore();
    const [layersExpanded, setLayersExpanded] = useState(false);

    const handleModeFromRail = (m: ModeCfg) => {
        setActiveMode(m.id);
        setMapStyle(m.style);
        toggleGlobeMode(m.globe);
        if (!open) onToggle(); // expand when clicking from icon rail
    };

    const activeCount = Object.values(activeLayers).filter(Boolean).length;

    const renderModeContent = () => {
        switch (activeMode) {
            case 'navigation':   return <NavigationMode />;
            case 'adventure':    return <AdventureMode />;
            case 'analytics':    return <AnalyticsMode />;
            case 'immersive':    return <ImmersiveMode />;
            case 'intelligence': return <TravelIntelligenceMode />;
            case 'crowd':        return <CrowdMode />;
            case 'satellite':    return <SatellitePanel />;
            case 'offline':      return <OfflinePanel />;
            default:             return <GlobePanel />;
        }
    };

    return (
        <motion.aside
            animate={{ width: open ? 288 : 56 }}
            initial={false}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="fixed left-0 top-14 bottom-10 z-40 bg-slate-950/97 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col overflow-hidden"
        >
            {/* ── Collapsed icon rail ──────────────────────────────── */}
            <AnimatePresence>
                {!open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col items-center py-3 gap-1 flex-1 overflow-y-auto scrollbar-none"
                    >
                        {MODES.map((m) => {
                            const active = activeMode === m.id;
                            return (
                                <motion.button
                                    key={m.id}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.93 }}
                                    onClick={() => handleModeFromRail(m)}
                                    title={m.label}
                                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                        active ? 'bg-gradient-to-br from-purple-600/60 to-blue-600/40 shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'hover:bg-white/10'
                                    }`}
                                >
                                    {m.icon}
                                    {active && (
                                        <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-purple-400" />
                                    )}
                                </motion.button>
                            );
                        })}

                        <div className="w-8 h-px bg-white/10 my-2" />

                        {/* Layers icon */}
                        <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                            onClick={onToggle}
                            title="Layers"
                            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-lg hover:bg-white/10 transition-all"
                        >
                            🗂️
                            {activeCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center">
                                    {activeCount}
                                </span>
                            )}
                        </motion.button>

                        {/* POI icon */}
                        <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                            onClick={() => setShowPOI(!showPOI)}
                            title="Points of Interest"
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${showPOI ? 'bg-purple-600/40' : 'hover:bg-white/10'}`}
                        >
                            📍
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Expanded sidebar ─────────────────────────────────── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col flex-1 overflow-hidden"
                    >
                        {/* Sidebar header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">{MODES.find((m) => m.id === activeMode)?.icon}</span>
                                <p className="text-white font-semibold text-sm truncate">{SECTION_LABELS[activeMode]}</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                                onClick={onToggle}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all shrink-0 text-sm"
                                title="Collapse sidebar"
                            >
                                ‹
                            </motion.button>
                        </div>

                        {/* Mode content */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent p-3">
                            <AnimatePresence mode="wait">
                                <React.Fragment key={activeMode}>
                                    {renderModeContent()}
                                </React.Fragment>
                            </AnimatePresence>
                        </div>

                        {/* ── Layers section ─────────────────────────────── */}
                        <div className="border-t border-white/[0.05] shrink-0">
                            <button
                                onClick={() => setLayersExpanded((p) => !p)}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/[0.03] transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">🗂️</span>
                                    <span className="text-slate-300 text-xs font-semibold">Map Layers</span>
                                    {activeCount > 0 && (
                                        <span className="px-1.5 py-0.5 bg-purple-600/40 border border-purple-500/30 text-purple-300 rounded-full text-[10px] font-bold">{activeCount}</span>
                                    )}
                                </div>
                                <motion.span
                                    animate={{ rotate: layersExpanded ? 90 : 0 }}
                                    className="text-slate-500 text-xs"
                                >›</motion.span>
                            </button>

                            <AnimatePresence>
                                {layersExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                                            {Object.entries(layerConfigs).map(([key, cfg]) => {
                                                const active = (activeLayers as Record<string, boolean>)[key];
                                                return (
                                                    <motion.button
                                                        key={key}
                                                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => toggleLayer(key as any)}
                                                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border ${
                                                            active
                                                                ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/20 text-white border-purple-500/40'
                                                                : 'bg-slate-800/50 text-slate-400 border-white/[0.06] hover:border-purple-500/20'
                                                        }`}
                                                    >
                                                        <span>{cfg.icon}</span>
                                                        <span className="truncate">{cfg.name}</span>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── POI toggle ───────────────────────────────── */}
                        <div className="px-3 pb-3 pt-2 shrink-0">
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => setShowPOI(!showPOI)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                    showPOI
                                        ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/20 text-white border-purple-500/40'
                                        : 'bg-slate-800/50 text-slate-400 border-white/[0.06] hover:border-purple-500/20'
                                }`}
                            >
                                <span>📍 Points of Interest</span>
                                <span className={`w-4 h-4 rounded-full border ${showPOI ? 'bg-purple-500 border-purple-400' : 'border-slate-600'} transition-all`} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.aside>
    );
};
