/**
 * Globe3D.tsx — 3D Globe & Live Earth Viewer
 * ─────────────────────────────────────────────────────────────────────────────
 * Shown when `isGlobeMode` is true (toggled by the Globe mode button).
 * Contains two sub-views switchable by tab buttons at the top:
 *
 *  🌍 3D Globe  — powered by `cobe` (WebGL dot-matrix globe, same as Vercel/Linear)
 *                  • Auto-rotates; drag to spin
 *                  • When `selectedPlace` changes in the store (from search bar),
 *                    smoothly interpolates phi/theta to rotate to that location
 *                  • Shows a yellow pulsing info card with LAT/LNG + "Fly Here on Map"
 *                  • Decorative arcs connecting world cities
 *
 *  🌪️ Live Earth — earth.nullschool.net embedded as a full iframe
 *                  • 6 overlay modes: Wind, Temperature, Ocean Currents,
 *                    Humidity, Pressure, Precipitation
 *                  • URL hash params control the active overlay
 *                  • User can drag/zoom the globe interactively inside the iframe
 *
 * cobe phi/theta math:
 *   phi   = longitude → -lng * (π/180)        (east = negative phi)
 *   theta = latitude  → lat * (π/180) * 0.45  (dampened to avoid overrotation)
 *
 * Note: cobe v2.0.1 has no `onRender` callback — rotation is driven by a manual
 * requestAnimationFrame loop calling `globe.update({ phi, theta })` each frame.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import createGlobe from 'cobe';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

// ── Nullschool Live Earth overlays ───────────────────────────────────────────
const LIVE_OVERLAYS = [
    {
        id: 'wind',
        label: 'Wind',
        icon: '💨',
        desc: 'Surface wind speed & direction',
        color: '#60a5fa',
        url: 'https://earth.nullschool.net/#current/wind/surface/level/orthographic=-212.07,6.88,384',
    },
    {
        id: 'temp',
        label: 'Temperature',
        icon: '🌡️',
        desc: 'Surface air temperature',
        color: '#f97316',
        url: 'https://earth.nullschool.net/#current/wind/surface/level/temp/orthographic=-212.07,6.88,384',
    },
    {
        id: 'ocean',
        label: 'Ocean Currents',
        icon: '🌊',
        desc: 'Ocean surface currents',
        color: '#34d399',
        url: 'https://earth.nullschool.net/#current/ocean/surface/currents/orthographic=-212.07,6.88,384',
    },
    {
        id: 'humidity',
        label: 'Humidity',
        icon: '💧',
        desc: 'Relative humidity',
        color: '#818cf8',
        url: 'https://earth.nullschool.net/#current/wind/surface/level/relative_humidity/orthographic=-212.07,6.88,384',
    },
    {
        id: 'pressure',
        label: 'Pressure',
        icon: '🔵',
        desc: 'Mean sea level pressure',
        color: '#a78bfa',
        url: 'https://earth.nullschool.net/#current/wind/surface/level/misea/orthographic=-212.07,6.88,384',
    },
    {
        id: 'precip',
        label: 'Precipitation',
        icon: '🌧️',
        desc: 'Accumulated precipitation',
        color: '#38bdf8',
        url: 'https://earth.nullschool.net/#current/wind/surface/level/precip_rate/orthographic=-212.07,6.88,384',
    },
] as const;

type OverlayId = typeof LIVE_OVERLAYS[number]['id'];
type GlobeView = 'globe' | 'live';

// ── Flight arcs between major travel cities ───────────────────────────────────
const ARCS = [
    { from: [40.71, -74.01]  as [number,number], to: [51.51, -0.13]    as [number,number], color: [0.67,0.55,0.98] as [number,number,number] },
    { from: [51.51, -0.13]   as [number,number], to: [25.20, 55.27]    as [number,number], color: [0.38,0.65,1.0]  as [number,number,number] },
    { from: [25.20, 55.27]   as [number,number], to: [19.08, 72.88]    as [number,number], color: [0.20,0.83,0.60] as [number,number,number] },
    { from: [19.08, 72.88]   as [number,number], to: [1.35,  103.82]   as [number,number], color: [0.97,0.45,0.71] as [number,number,number] },
    { from: [1.35,  103.82]  as [number,number], to: [35.69, 139.69]   as [number,number], color: [1.0, 0.75,0.27] as [number,number,number] },
    { from: [35.69, 139.69]  as [number,number], to: [34.05,-118.24]   as [number,number], color: [0.67,0.55,0.98] as [number,number,number] },
    { from: [34.05,-118.24]  as [number,number], to: [40.71, -74.01]   as [number,number], color: [0.38,0.65,1.0]  as [number,number,number] },
    { from: [-23.55,-46.63]  as [number,number], to: [51.51, -0.13]    as [number,number], color: [0.97,0.45,0.71] as [number,number,number] },
    { from: [-33.87,151.21]  as [number,number], to: [1.35,  103.82]   as [number,number], color: [0.20,0.83,0.60] as [number,number,number] },
    { from: [48.85,  2.35]   as [number,number], to: [40.71, -74.01]   as [number,number], color: [0.38,0.65,1.0]  as [number,number,number] },
    { from: [55.75, 37.62]   as [number,number], to: [39.91, 116.39]   as [number,number], color: [0.67,0.55,0.98] as [number,number,number] },
    { from: [13.75,100.52]   as [number,number], to: [25.20,  55.27]   as [number,number], color: [0.20,0.83,0.60] as [number,number,number] },
    { from: [6.52,   3.38]   as [number,number], to: [51.51,  -0.13]   as [number,number], color: [0.97,0.45,0.71] as [number,number,number] },
    { from: [30.04, 31.24]   as [number,number], to: [41.02,  28.97]   as [number,number], color: [1.0, 0.75,0.27] as [number,number,number] },
    { from: [-26.20,28.04]   as [number,number], to: [25.20,  55.27]   as [number,number], color: [1.0, 0.75,0.27] as [number,number,number] },
];

const BASE_MARKERS: { location: [number,number]; size: number }[] = [
    { location: [40.71,-74.01],  size: 0.08 },
    { location: [51.51,-0.13],   size: 0.08 },
    { location: [35.69,139.69],  size: 0.08 },
    { location: [48.85,2.35],    size: 0.07 },
    { location: [25.20,55.27],   size: 0.07 },
    { location: [-33.87,151.21], size: 0.07 },
    { location: [19.08,72.88],   size: 0.07 },
    { location: [-23.55,-46.63], size: 0.07 },
    { location: [1.35,103.82],   size: 0.07 },
    { location: [34.05,-118.24], size: 0.07 },
    { location: [39.91,116.39],  size: 0.07 },
    { location: [55.75,37.62],   size: 0.06 },
    { location: [37.57,126.98],  size: 0.07 },
    { location: [13.75,100.52],  size: 0.06 },
    { location: [19.43,-99.13],  size: 0.06 },
];

// Convert lat/lng to cobe phi/theta
// phi   = longitude rotation (cobe auto-rotates around Y)
// theta = tilt from equator
function lngToPhi(lng: number)  { return -lng * (Math.PI / 180); }
function latToTheta(lat: number){ return lat  * (Math.PI / 180) * 0.45; }

export const Globe3D: React.FC = () => {
    const canvasRef   = useRef<HTMLCanvasElement>(null);
    const globeRef    = useRef<ReturnType<typeof createGlobe>>();
    const rafRef      = useRef<number>();
    const phiRef      = useRef(0);
    const thetaRef    = useRef(0.2);
    const isDragging  = useRef(false);
    const lastPos     = useRef({ x: 0, y: 0 });
    const velRef      = useRef({ phi: 0, theta: 0 });
    const flyingRef   = useRef(false);
    const flyTargetRef = useRef({ phi: 0, theta: 0 });
    const [searchedCity, setSearchedCity] = useState<string | null>(null);
    const [globeView, setGlobeView] = useState<GlobeView>('globe');
    const [activeOverlay, setActiveOverlay] = useState<OverlayId>('wind');
    const [liveLoaded, setLiveLoaded] = useState(false);

    const mapStyle       = useMapStore((s) => s.mapStyle);
    const selectedPlace  = useMapStore((s) => s.selectedPlace);
    const setSelectedPlace = useMapStore((s) => s.setSelectedPlace);
    const toggleGlobeMode  = useMapStore((s) => s.toggleGlobeMode);
    const mapInstance      = useMapStore((s) => s.mapInstance);

    // ── Style → cobe colors ───────────────────────────────────────────────────
    const styleConfig = {
        dark:       { dark: 0.6, diffuse: 1.4, base: [0.10,0.18,0.38], marker: [0.67,0.55,0.98], glow: [0.10,0.35,1.0] },
        satellite:  { dark: 0.3, diffuse: 2.2, base: [0.06,0.22,0.45], marker: [0.20,0.83,0.60], glow: [0.05,0.55,1.0] },
        standard:   { dark: 0.2, diffuse: 2.4, base: [0.08,0.26,0.50], marker: [0.38,0.65,1.0],  glow: [0.10,0.45,1.0] },
        terrain:    { dark: 0.4, diffuse: 1.8, base: [0.08,0.22,0.15], marker: [1.0, 0.75,0.27],  glow: [0.15,0.60,0.30] },
        navigation: { dark: 0.6, diffuse: 1.2, base: [0.04,0.10,0.30], marker: [0.97,0.45,0.71],  glow: [0.08,0.28,0.90] },
    } as const;
    const cfg = styleConfig[mapStyle as keyof typeof styleConfig] ?? styleConfig.dark;

    // ── Build or rebuild globe ────────────────────────────────────────────────
    const buildGlobe = useCallback((extraMarkers: { location:[number,number]; size:number; color?:[number,number,number] }[] = []) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        globeRef.current?.destroy();

        const dpr  = Math.min(window.devicePixelRatio, 2);
        const size = Math.min(canvas.parentElement!.clientWidth, canvas.parentElement!.clientHeight);
        canvas.width  = size * dpr;
        canvas.height = size * dpr;

        const s = styleConfig[mapStyle as keyof typeof styleConfig] ?? styleConfig.dark;

        globeRef.current = createGlobe(canvas, {
            devicePixelRatio: dpr,
            width:  size * dpr,
            height: size * dpr,
            phi:   phiRef.current,
            theta: thetaRef.current,
            dark:     s.dark,
            diffuse:  s.diffuse,
            mapSamples:    22000,
            mapBrightness: 8.5,
            baseColor:   s.base   as [number,number,number],
            markerColor: s.marker as [number,number,number],
            glowColor:   s.glow   as [number,number,number],
            markers:     [...BASE_MARKERS, ...extraMarkers],
            arcs: ARCS,
            arcWidth:  0.8,
            arcHeight: 0.22,
        });
    }, [mapStyle]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Animation loop ────────────────────────────────────────────────────────
    const startLoop = useCallback(() => {
        cancelAnimationFrame(rafRef.current ?? 0);

        const tick = () => {
            rafRef.current = requestAnimationFrame(tick);
            const globe = globeRef.current;
            if (!globe) return;

            if (flyingRef.current) {
                // Smooth fly-to interpolation
                const dPhi   = flyTargetRef.current.phi   - phiRef.current;
                const dTheta = flyTargetRef.current.theta - thetaRef.current;
                phiRef.current   += dPhi   * 0.06;
                thetaRef.current += dTheta * 0.06;
                if (Math.abs(dPhi) < 0.002 && Math.abs(dTheta) < 0.002) {
                    phiRef.current   = flyTargetRef.current.phi;
                    thetaRef.current = flyTargetRef.current.theta;
                    flyingRef.current = false;
                }
                globe.update({ phi: phiRef.current, theta: thetaRef.current });
            } else if (!isDragging.current) {
                phiRef.current   += velRef.current.phi   * 0.92 + 0.003;
                thetaRef.current += velRef.current.theta * 0.92;
                velRef.current.phi   *= 0.92;
                velRef.current.theta *= 0.92;
                thetaRef.current = Math.max(-0.52, Math.min(0.52, thetaRef.current));
                globe.update({ phi: phiRef.current, theta: thetaRef.current });
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    // Initial mount
    useEffect(() => {
        buildGlobe();
        startLoop();

        const ro = new ResizeObserver(() => { buildGlobe(); });
        ro.observe(canvasRef.current!.parentElement!);

        return () => {
            cancelAnimationFrame(rafRef.current ?? 0);
            globeRef.current?.destroy();
            ro.disconnect();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Rebuild when style changes
    useEffect(() => { buildGlobe(); }, [buildGlobe]);

    // ── React to searched location ────────────────────────────────────────────
    useEffect(() => {
        if (!selectedPlace) { setSearchedCity(null); return; }

        const [lng, lat] = selectedPlace.coords;
        const targetPhi   = lngToPhi(lng);
        const targetTheta = latToTheta(lat);

        // Align phi so we spin the short way around
        let currentPhi = phiRef.current % (Math.PI * 2);
        let diff = targetPhi - currentPhi;
        if (diff >  Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;

        flyTargetRef.current = { phi: phiRef.current + diff, theta: targetTheta };
        flyingRef.current = true;
        setSearchedCity(selectedPlace.name);

        // Add a bright pulsing marker at the searched location
        buildGlobe([{ location: [lat, lng], size: 0.14, color: [1, 0.85, 0.2] }]);
    }, [selectedPlace, buildGlobe]);

    // ── Drag handlers ─────────────────────────────────────────────────────────
    const onMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        flyingRef.current  = false;
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        velRef.current = { phi: -dx * 0.006, theta: -dy * 0.004 };
        phiRef.current   -= dx * 0.006;
        thetaRef.current  = Math.max(-0.52, Math.min(0.52, thetaRef.current - dy * 0.004));
        globeRef.current?.update({ phi: phiRef.current, theta: thetaRef.current });
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging.current = false; };

    const onTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        flyingRef.current  = false;
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        const dx = e.touches[0].clientX - lastPos.current.x;
        const dy = e.touches[0].clientY - lastPos.current.y;
        phiRef.current   -= dx * 0.006;
        thetaRef.current  = Math.max(-0.52, Math.min(0.52, thetaRef.current - dy * 0.004));
        globeRef.current?.update({ phi: phiRef.current, theta: thetaRef.current });
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const styleName = mapStyle.charAt(0).toUpperCase() + mapStyle.slice(1);
    const currentOverlay = LIVE_OVERLAYS.find((o) => o.id === activeOverlay)!;

    return (
        <div
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at 35% 45%, #06091f 0%, #000308 70%, #000000 100%)' }}
        >
            {/* ── Top view switcher ─────────────────────────────────────────── */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-black/50 backdrop-blur-xl rounded-full p-1 border border-white/10 shadow-2xl">
                <button
                    onClick={() => setGlobeView('globe')}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                        globeView === 'globe'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    🌍 3D Globe
                </button>
                <button
                    onClick={() => { setGlobeView('live'); setLiveLoaded(false); }}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                        globeView === 'live'
                            ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    🌪️ Live Earth
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                LIVE EARTH VIEW — earth.nullschool.net
            ══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
            {globeView === 'live' && (
                <motion.div
                    key="live"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col"
                >
                    {/* Overlay selector */}
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 flex gap-2 flex-wrap justify-center px-4 max-w-2xl">
                        {LIVE_OVERLAYS.map((ov) => (
                            <motion.button
                                key={ov.id}
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => { setActiveOverlay(ov.id); setLiveLoaded(false); }}
                                title={ov.desc}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                    activeOverlay === ov.id
                                        ? 'text-white border-transparent shadow-lg'
                                        : 'bg-black/40 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
                                }`}
                                style={activeOverlay === ov.id
                                    ? { background: `linear-gradient(135deg, ${ov.color}cc, ${ov.color}88)`, boxShadow: `0 0 16px ${ov.color}55` }
                                    : {}}
                            >
                                <span>{ov.icon}</span>
                                <span>{ov.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Loading shimmer */}
                    <AnimatePresence>
                        {!liveLoaded && (
                            <motion.div
                                initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 pointer-events-none"
                            >
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-2 animate-ping absolute inset-0"
                                         style={{ borderColor: currentOverlay.color + '50' }} />
                                    <div className="w-20 h-20 rounded-full border-2 border-transparent animate-spin"
                                         style={{ borderTopColor: currentOverlay.color, borderRightColor: currentOverlay.color + '60' }} />
                                    <div className="absolute inset-0 flex items-center justify-center text-3xl">{currentOverlay.icon}</div>
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-semibold">{currentOverlay.label}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{currentOverlay.desc}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Nullschool iframe */}
                    <iframe
                        key={currentOverlay.url}
                        src={currentOverlay.url}
                        onLoad={() => setLiveLoaded(true)}
                        className="absolute inset-0 w-full h-full border-0"
                        style={{ opacity: liveLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
                        title={`Live Earth — ${currentOverlay.label}`}
                        allow="fullscreen"
                    />

                    {/* Live badge */}
                    <AnimatePresence>
                        {liveLoaded && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                            >
                                <div className="bg-black/60 backdrop-blur-xl rounded-full px-5 py-2 border border-white/10 flex items-center gap-2.5 shadow-xl">
                                    <motion.div
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: currentOverlay.color }}
                                    />
                                    <span className="text-white/80 text-xs font-medium">
                                        {currentOverlay.icon} Live {currentOverlay.label} · earth.nullschool.net
                                    </span>
                                    <span className="text-white/30 text-xs">· drag globe · scroll to zoom · click for data</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════════
                3D GLOBE VIEW — cobe
            ══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
            {globeView === 'globe' && (
                <motion.div
                    key="globe"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {/* Outer glow */}
                    <div className="absolute rounded-full pointer-events-none" style={{
                        width: '66vmin', height: '66vmin',
                        background: `radial-gradient(circle, rgba(${mapStyle === 'terrain' ? '40,180,80' : '60,100,255'},0.10) 0%, transparent 70%)`,
                        filter: 'blur(40px)',
                    }} />

                    {/* Globe canvas */}
                    <div
                        className="relative select-none"
                        style={{ width: '60vmin', height: '60vmin', cursor: isDragging.current ? 'grabbing' : 'grab' }}
                        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
                    >
                        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

                        <AnimatePresence>
                            {searchedCity && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="bg-yellow-400 text-slate-900 font-bold text-xs px-2.5 py-1 rounded-full shadow-lg shadow-yellow-500/40 whitespace-nowrap">
                                            📍 {searchedCity}
                                        </div>
                                        <div className="w-0.5 h-4 bg-yellow-400/60" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/80 animate-ping" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Stats — top left */}
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                        className="absolute top-32 left-6 flex flex-col gap-2 pointer-events-none">
                        {[
                            { label: 'Live Routes', value: ARCS.length,        color: 'text-purple-300' },
                            { label: 'Cities',      value: BASE_MARKERS.length, color: 'text-blue-300'   },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-black/35 backdrop-blur rounded-xl px-4 py-2.5 border border-white/[0.08]">
                                <p className="text-white/40 text-[10px] uppercase tracking-wider">{label}</p>
                                <p className={`${color} font-bold text-xl`}>{value}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Arc legend — top right */}
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                        className="absolute top-32 right-6 flex flex-col gap-1.5 pointer-events-none">
                        {[
                            { label: 'NY → London',    color: '#a78bfa' },
                            { label: 'Dubai → Mumbai', color: '#34d399' },
                            { label: 'Tokyo → LA',     color: '#fbbf24' },
                            { label: 'London → Dubai', color: '#60a5fa' },
                        ].map(({ label, color }) => (
                            <div key={label} className="flex items-center gap-2 text-xs">
                                <div className="w-5 h-0.5 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                                <span className="text-slate-400">{label}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Search result card */}
                    <AnimatePresence>
                        {selectedPlace && (
                            <motion.div
                                key={selectedPlace.name}
                                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 280 }}
                                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 w-[440px] max-w-[90vw]"
                            >
                                <div className="bg-slate-900/96 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 px-5 py-4 flex items-center gap-3">
                                        <motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 1.5, repeat: Infinity }}
                                            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl flex-shrink-0">📍</motion.div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-white font-bold text-lg truncate">{selectedPlace.name}</h2>
                                            <p className="text-blue-200 text-xs mt-0.5">
                                                🌍 {selectedPlace.country ?? selectedPlace.fullName}
                                                {' · '}<span className="text-yellow-300 font-medium">Globe navigated ✓</span>
                                            </p>
                                        </div>
                                        <button onClick={() => { setSelectedPlace(null); setSearchedCity(null); buildGlobe([]); }}
                                            className="text-white/60 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition">✕</button>
                                    </div>
                                    <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
                                        <div className="px-5 py-3 flex items-center gap-2">
                                            <span className="text-slate-500 text-xs uppercase">LAT</span>
                                            <span className="text-blue-300 font-mono font-bold text-sm">{selectedPlace.coords[1].toFixed(4)}°</span>
                                        </div>
                                        <div className="px-5 py-3 flex items-center gap-2">
                                            <span className="text-slate-500 text-xs uppercase">LNG</span>
                                            <span className="text-purple-300 font-mono font-bold text-sm">{selectedPlace.coords[0].toFixed(4)}°</span>
                                        </div>
                                    </div>
                                    <div className="px-5 py-3 flex items-center gap-3 border-b border-white/5">
                                        <motion.div animate={{ opacity: [1,0.4,1] }} transition={{ duration: 1.2, repeat: Infinity }}
                                            className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                                        <p className="text-slate-400 text-xs">
                                            Globe rotating to <span className="text-white font-semibold">{selectedPlace.name}</span> — yellow pin marks the location.
                                        </p>
                                    </div>
                                    <div className="px-5 py-4 flex gap-3">
                                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => {
                                                const [lng, lat] = selectedPlace.coords;
                                                toggleGlobeMode(false);
                                                setTimeout(() => mapInstance?.flyTo([lat, lng], selectedPlace.zoom ?? 10, { duration: 2.5, easeLinearity: 0.2 }), 350);
                                            }}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                            🗺️ Fly Here on Map
                                        </motion.button>
                                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => { setSelectedPlace(null); setSearchedCity(null); buildGlobe([]); }}
                                            className="px-4 py-2.5 border border-white/10 text-slate-400 rounded-xl text-sm hover:border-white/20 hover:text-white transition-all">
                                            Dismiss
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom hint */}
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
                        <div className="bg-black/40 backdrop-blur rounded-full px-4 py-1.5 border border-white/10 flex items-center gap-2 text-xs text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span>🌍 Globe · {styleName}</span>
                            <span className="text-slate-600">|</span>
                            <span>search any city · drag to rotate</span>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};
