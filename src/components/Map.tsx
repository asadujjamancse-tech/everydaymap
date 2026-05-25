import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobe } from '../features/globe/useGlobe';
import { GlobeRenderer } from '../features/globe/GlobeRenderer';
import { AIAssistant } from '../features/ai-assistant/AIAssistant';
import { CountryPanel } from '../features/countries/CountryPanel';
import { RoutePanel } from '../features/routes/RoutePanel';
import { RouteAnimator } from '../features/routes/RouteAnimator';
import { DiscoverMode } from '../features/discover/DiscoverMode';
import { POILayer } from '../layers/poi/POILayer';
import { LayerManager } from '../layers/LayerManager';
import { PlaceDetailPanel } from '../features/places/PlaceDetailPanel';
import { TopBar } from './layout/TopBar';
import { LeftSidebar } from './layout/LeftSidebar';
import { BottomBar } from './layout/BottomBar';
import { CommandPalette } from './layout/CommandPalette';
import { useMapStore } from '../store/mapStore';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox zoom level to enter when coming from the Three.js globe zoom-in gesture
const ZOOM_IN_TARGET = 9;

export const Map: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [commandOpen, setCommandOpen] = useState(false);

    // targetCenter: when switching back to globe, tell GlobeRenderer where to orient
    const [globeTargetCenter, setGlobeTargetCenter] = useState<{ lat: number; lng: number } | null>(null);
    const prevGlobeModeRef = useRef(true); // start in globe mode

    const { isGlobeMode, toggleGlobeMode, mapInstance, showPOI, selectedPlace, setSelectedPlace } = useMapStore();

    // Init Mapbox (always mounted, toggled via opacity)
    useGlobe(mapContainer.current);

    // ── When isGlobeMode flips true (map → globe), capture Mapbox center ──────
    useEffect(() => {
        const wasInGlobe = prevGlobeModeRef.current;
        prevGlobeModeRef.current = isGlobeMode;
        if (isGlobeMode && !wasInGlobe && mapInstance) {
            const c = mapInstance.getCenter();
            setGlobeTargetCenter({ lat: c.lat, lng: c.lng });
        }
    }, [isGlobeMode, mapInstance]);

    // ── Globe scroll zoom → enter Mapbox at that exact location ──────────────
    const handleZoomIn = useCallback((lat: number, lng: number) => {
        toggleGlobeMode(false);
        // Small delay so the opacity transition starts before the flyTo
        setTimeout(() => {
            mapInstance?.flyTo({
                center:   [lng, lat],
                zoom:     ZOOM_IN_TARGET,
                duration: 2000,
                pitch:    45,
                essential: true,
            });
        }, 300);
    }, [toggleGlobeMode, mapInstance]);

    // ── Globe double-click → enter Mapbox at clicked location ────────────────
    const handleLocationSelect = useCallback((lat: number, lng: number) => {
        toggleGlobeMode(false);
        setTimeout(() => {
            mapInstance?.flyTo({ center: [lng, lat], zoom: 6, duration: 2000, pitch: 40, essential: true });
        }, 400);
    }, [toggleGlobeMode, mapInstance]);

    const hasToken = !!import.meta.env.VITE_MAPBOX_TOKEN;

    return (
        <div className="relative w-full h-screen bg-slate-950 overflow-hidden">

            {/* ── Full-screen map layers ──────────────────────────── */}
            <motion.div
                ref={mapContainer}
                className="absolute inset-0 w-full h-full"
                animate={{ opacity: isGlobeMode ? 0 : 1 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                style={{ pointerEvents: isGlobeMode ? 'none' : 'auto' }}
            />
            <motion.div
                className="absolute inset-0 w-full h-full"
                animate={{ opacity: isGlobeMode ? 1 : 0 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                style={{ pointerEvents: isGlobeMode ? 'auto' : 'none' }}
            >
                <GlobeRenderer onLocationSelect={handleLocationSelect} />
            </motion.div>

            {/* ── No-token banner ─────────────────────────────────── */}
            <AnimatePresence>
                {!isGlobeMode && !hasToken && (
                    <motion.div
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-900/80 backdrop-blur border border-amber-500/40 text-amber-200 px-5 py-3 rounded-xl text-sm max-w-md text-center shadow-2xl"
                    >
                        Add <code className="bg-black/30 px-1 rounded">VITE_MAPBOX_TOKEN</code> to <code className="bg-black/30 px-1 rounded">.env</code> for the real-world map.
                    </motion.div>
                )}
            </AnimatePresence>

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

            {/* ── POI overlay ─────────────────────────────────────── */}
            <AnimatePresence>
                {showPOI && <POILayer />}
            </AnimatePresence>

            {/* ── AI assistant (above BottomBar) ──────────────────── */}
            <AIAssistant />

            {/* ── Place detail panel (from geocoding search) ──────── */}
            <AnimatePresence>
                {selectedPlace && !isGlobeMode && (
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
