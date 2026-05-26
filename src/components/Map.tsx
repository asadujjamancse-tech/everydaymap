/**
 * Map.tsx — Main Application Shell
 * ─────────────────────────────────────────────────────────────────────────────
 * The top-level layout component rendered after the loading splash screen.
 * It owns the full-screen canvas and composes every visible piece of UI:
 *
 *   ┌─────────────────────────────────────┐
 *   │  TopBar (fixed, z-50)               │
 *   ├──────────┬──────────────────────────┤
 *   │ Left     │  LeafletMap  OR  Globe3D │
 *   │ Sidebar  │  (fills the viewport)    │
 *   │          │                          │
 *   ├──────────┴──────────────────────────┤
 *   │  BottomBar (fixed, z-40)            │
 *   └─────────────────────────────────────┘
 *   + Floating overlays: AIAssistant, CountryPanel, RoutePanel,
 *     PlaceDetailPanel, LayerManager, DiscoverMode, CommandPalette
 *
 * The Globe3D and LeafletMap are both mounted simultaneously.
 * Globe3D fades in/out via AnimatePresence; the Leaflet div is hidden via
 * opacity+pointer-events when globe mode is active (keeps map state alive).
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LeafletMap } from '../features/leaflet/LeafletMap';
import { Globe3D } from '../features/globe/Globe3D';
import { AIAssistant } from '../features/ai-assistant/AIAssistant';
import { CountryPanel } from '../features/countries/CountryPanel';
import { RoutePanel } from '../features/routes/RoutePanel';
import { RouteAnimator } from '../features/routes/RouteAnimator';
import { DiscoverMode } from '../features/discover/DiscoverMode';
import { LayerManager } from '../layers/LayerManager';
import { PlaceDetailPanel } from '../features/places/PlaceDetailPanel';
import { TopBar } from './layout/TopBar';
import { LeftSidebar } from './layout/LeftSidebar';
import { BottomBar } from './layout/BottomBar';
import { CommandPalette } from './layout/CommandPalette';
import { useMapStore } from '../store/mapStore';

export const Map: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [commandOpen, setCommandOpen] = useState(false);
    const { selectedPlace, setSelectedPlace, isGlobeMode } = useMapStore();

    return (
        <div className="relative w-full h-screen bg-slate-950 overflow-hidden">

            {/* ── 3D Globe (shown when Globe mode active) ─────────── */}
            <AnimatePresence>
                {isGlobeMode && (
                    <motion.div
                        key="globe"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 w-full h-full z-10"
                    >
                        <Globe3D />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Full-screen Leaflet map (always mounted, hidden in globe mode) ── */}
            <div className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${isGlobeMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <LeafletMap />
            </div>

            {/* ── Layout shell ────────────────────────────────────── */}
            <TopBar
                sidebarOpen={sidebarOpen}
                onSidebarToggle={() => setSidebarOpen((p) => !p)}
                onCommandPalette={() => setCommandOpen(true)}
            />

            <LeftSidebar
                open={sidebarOpen}
                onToggle={() => setSidebarOpen((p) => !p)}
            />

            <BottomBar />

            {/* ── Command palette ─────────────────────────────────── */}
            <CommandPalette
                open={commandOpen}
                onClose={() => setCommandOpen(false)}
            />

            {/* ── Map data layers (budget, safety, weather, etc.) ─── */}
            <LayerManager />

            {/* ── AI assistant ────────────────────────────────────── */}
            <AIAssistant />

            {/* ── Place detail panel (from geocoding search) ──────── */}
            <AnimatePresence>
                {selectedPlace && (
                    <PlaceDetailPanel
                        place={selectedPlace}
                        onClose={() => setSelectedPlace(null)}
                    />
                )}
            </AnimatePresence>

            {/* ── Right-side panels (country info, routes) ────────── */}
            <CountryPanel />
            <RoutePanel />
            <RouteAnimator />
            <DiscoverMode />
        </div>
    );
};
