/**
 * NavigationMode.tsx — Turn-by-Turn Navigation Sidebar Panel
 * Lets the user enter an origin + destination and travel mode (driving/walking/cycling).
 * Calls the free OSRM routing API to get a route, stores it in `navigationRoute`,
 * and the RouteLayer in LeafletMap.tsx draws the purple polyline on the map.
 * Shows step-by-step instructions, distance, and ETA.
 */
/// <reference types="vite/client" />
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore, NavigationRoute, NavStep } from '../../store/mapStore';
import { searchPlaces, GeoPlace } from '../../services/geocodingService';

const TRANSPORT_ICONS: Record<string, string> = { driving: '🚗', walking: '🚶', cycling: '🚴' };
const TRANSPORT_LABELS: Record<string, string> = { driving: 'Drive', walking: 'Walk', cycling: 'Cycle' };

// OSRM profile names
const OSRM_PROFILE: Record<string, string> = { driving: 'driving', walking: 'walking', cycling: 'cycling' };

// Build a human-readable instruction from OSRM step data
function osrmInstruction(step: any): string {
    const type: string = step.maneuver?.type ?? '';
    const modifier: string = step.maneuver?.modifier ?? '';
    const name: string = step.name ? `onto ${step.name}` : '';
    if (type === 'depart') return `Depart${name ? ' ' + name : ''}`;
    if (type === 'arrive') return 'Arrive at destination';
    if (type === 'turn') return `Turn ${modifier}${name ? ' ' + name : ''}`;
    if (type === 'new name') return `Continue${name ? ' ' + name : ''}`;
    if (type === 'merge') return `Merge ${modifier}${name ? ' ' + name : ''}`;
    if (type === 'on ramp') return `Take the ramp ${modifier}${name ? ' ' + name : ''}`;
    if (type === 'off ramp') return `Take the exit ${modifier}${name ? ' ' + name : ''}`;
    if (type === 'fork') return `Keep ${modifier} at fork${name ? ' ' + name : ''}`;
    if (type === 'end of road') return `Turn ${modifier} at end of road${name ? ' ' + name : ''}`;
    if (type === 'roundabout' || type === 'rotary') {
        const exit = step.maneuver?.exit ? `, take exit ${step.maneuver.exit}` : '';
        return `Enter roundabout${exit}${name ? ' ' + name : ''}`;
    }
    return `Continue${name ? ' ' + name : ''}`;
}

// Fetch real road route from OSRM (free, no API key, OpenStreetMap road network)
async function fetchOSRMRoute(
    oCoords: [number, number],
    dCoords: [number, number],
    mode: string
): Promise<NavigationRoute | null> {
    try {
        const profile = OSRM_PROFILE[mode] ?? 'driving';
        const url = `https://router.project-osrm.org/route/v1/${profile}/${oCoords[0]},${oCoords[1]};${dCoords[0]},${dCoords[1]}?steps=true&geometries=geojson&overview=full`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes?.[0]) return null;
        const r = data.routes[0];
        const steps = (r.legs[0]?.steps ?? []).map((s: any): NavStep => ({
            instruction: osrmInstruction(s),
            distance: s.distance ?? 0,
            maneuver: s.maneuver?.type ?? 'straight',
        }));
        return {
            origin: '',
            destination: '',
            originCoords: oCoords,
            destinationCoords: dCoords,
            mode: mode as NavigationRoute['mode'],
            duration: r.duration,
            distance: r.distance,
            steps,
            geometry: r.geometry,
        };
    } catch {
        return null;
    }
}

function fmtDuration(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
}
function fmtDist(m: number) {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

// ── Geocoding location input ──────────────────────────────────────────────────
interface LocationInputProps {
    label: string;
    color: string;
    value: string;
    onChange: (val: string) => void;
    onSelect: (place: GeoPlace) => void;
    placeholder: string;
}

const LocationInput: React.FC<LocationInputProps> = ({ label, color, value, onChange, onSelect, placeholder }) => {
    const [results, setResults] = useState<GeoPlace[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDrop, setShowDrop] = useState(false);
    const [focused, setFocused] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const hasToken = !!import.meta.env.VITE_MAPBOX_TOKEN;

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim() || value.length < 2) { setResults([]); setIsSearching(false); return; }
        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            const places = await searchPlaces(value, { types: 'place,address,poi,locality,region,country', limit: 6 });
            setResults(places);
            setIsSearching(false);
            if (places.length > 0) setShowDrop(true);
        }, 250);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setShowDrop(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (place: GeoPlace) => {
        onChange(place.name);
        onSelect(place);
        setShowDrop(false);
        setResults([]);
    };

    return (
        <div className="relative" ref={dropRef}>
            <div className={`flex items-center gap-2 bg-slate-800 rounded-xl border transition-all ${focused ? 'border-purple-500/60' : 'border-slate-700'}`}>
                <span className={`ml-3 text-xs font-bold shrink-0 ${color}`}>{label}</span>
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setShowDrop(true); }}
                    onFocus={() => { setFocused(true); if (results.length > 0) setShowDrop(true); }}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-white text-sm py-2.5 pr-3 focus:outline-none placeholder:text-slate-500"
                />
                {isSearching && (
                    <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mr-3 text-purple-400 text-sm"
                    >⟳</motion.span>
                )}
            </div>

            <AnimatePresence>
                {showDrop && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-900/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        {results.map((place) => (
                            <button
                                key={place.id}
                                onMouseDown={() => handleSelect(place)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-purple-600/10 transition-colors"
                            >
                                <span className="text-base shrink-0">
                                    {place.type === 'country' ? '🌍' : place.type === 'place' ? '🏙️' : place.type === 'poi' ? '📍' : '📌'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-medium truncate">{place.name}</p>
                                    <p className="text-slate-500 text-[10px] truncate">{place.fullName}</p>
                                </div>
                            </button>
                        ))}

                        {!hasToken && (
                            <div className="px-3 py-2 border-t border-white/[0.05]">
                                <p className="text-slate-600 text-[9px]">Add VITE_MAPBOX_TOKEN for live search</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Main NavigationMode component ────────────────────────────────────────────
export const NavigationMode: React.FC = () => {
    const [originText, setOriginText] = useState('');
    const [destText, setDestText] = useState('');
    const [originPlace, setOriginPlace] = useState<GeoPlace | null>(null);
    const [destPlace, setDestPlace] = useState<GeoPlace | null>(null);
    const [transportMode, setTransportMode] = useState<NavigationRoute['mode']>('driving');
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState('');

    const { navigationRoute, setNavigationRoute, setIsNavigating } = useMapStore();

    const canCalculate = !!(originPlace && destPlace) && !isCalculating;

    const handleCalculate = useCallback(async () => {
        if (!originPlace || !destPlace) {
            setError('Please select both origin and destination from the suggestions.');
            return;
        }
        setError('');
        setIsCalculating(true);

        const oCoords = originPlace.coords;
        const dCoords = destPlace.coords;
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        let route: NavigationRoute | null = null;

        // 1. Try Mapbox Directions API (if token available — highest quality)
        if (token) {
            try {
                const profile = transportMode === 'driving' ? 'driving' : transportMode === 'cycling' ? 'cycling' : 'walking';
                const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${oCoords[0]},${oCoords[1]};${dCoords[0]},${dCoords[1]}?steps=true&geometries=geojson&overview=full&access_token=${token}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.routes?.[0]) {
                    const r = data.routes[0];
                    route = {
                        origin: originPlace.name,
                        destination: destPlace.name,
                        originCoords: oCoords,
                        destinationCoords: dCoords,
                        mode: transportMode,
                        duration: r.duration,
                        distance: r.distance,
                        steps: (r.legs[0]?.steps || []).map((s: any): NavStep => ({
                            instruction: s.maneuver.instruction,
                            distance: s.distance,
                            maneuver: s.maneuver.type,
                        })),
                        geometry: r.geometry,
                    };
                }
            } catch (_) {}
        }

        // 2. OSRM — free real-road routing via OpenStreetMap (no API key needed)
        if (!route) {
            const osrm = await fetchOSRMRoute(oCoords, dCoords, transportMode);
            if (osrm) {
                route = { ...osrm, origin: originPlace.name, destination: destPlace.name };
            }
        }

        // 3. Last resort: straight-line approximation (no road data available)
        if (!route) {
            const dx = dCoords[0] - oCoords[0];
            const dy = dCoords[1] - oCoords[1];
            const distKm = Math.hypot(dx * 111 * Math.cos((oCoords[1] * Math.PI) / 180), dy * 111);
            const speedKph = transportMode === 'driving' ? 60 : transportMode === 'cycling' ? 20 : 5;
            route = {
                origin: originPlace.name,
                destination: destPlace.name,
                originCoords: oCoords,
                destinationCoords: dCoords,
                mode: transportMode,
                duration: Math.round((distKm / speedKph) * 3600),
                distance: Math.round(distKm * 1000),
                steps: [
                    { instruction: `Head from ${originPlace.name}`, distance: distKm * 300, maneuver: 'depart' },
                    { instruction: 'Continue along the main route', distance: distKm * 400, maneuver: 'straight' },
                    { instruction: `Arrive at ${destPlace.name}`, distance: 0, maneuver: 'arrive' },
                ],
                geometry: {
                    type: 'LineString',
                    coordinates: Array.from({ length: 21 }, (_, i) => [
                        oCoords[0] + (dx * i) / 20,
                        oCoords[1] + (dy * i) / 20,
                    ]),
                },
            };
        }

        // Route geometry is drawn on the map by LeafletMap's RouteLayer
        setNavigationRoute(route);
        setIsNavigating(true);
        setIsCalculating(false);
    }, [originPlace, destPlace, transportMode, setNavigationRoute, setIsNavigating]);

    const handleClear = () => {
        setNavigationRoute(null);
        setIsNavigating(false);
        setOriginText('');
        setDestText('');
        setOriginPlace(null);
        setDestPlace(null);
        setError('');
    };

    const handleSwap = () => {
        setOriginText(destText);
        setDestText(originText);
        setOriginPlace(destPlace);
        setDestPlace(originPlace);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-3">

            {/* ── Input card ─────────────────────────────────────────── */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-700/80 to-blue-700/80 px-4 py-3 flex items-center gap-2">
                    <span className="text-xl">🚗</span>
                    <h2 className="text-white font-bold text-sm">Real Navigation</h2>
                    <span className="ml-auto text-purple-200 text-xs">OSRM · Real Roads</span>
                </div>

                <div className="p-4 space-y-3">
                    {/* Transport mode */}
                    <div className="flex gap-1.5">
                        {(['driving', 'walking', 'cycling'] as const).map((m) => (
                            <motion.button
                                key={m}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setTransportMode(m)}
                                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-0.5 ${
                                    transportMode === m
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                            >
                                <span className="text-base">{TRANSPORT_ICONS[m]}</span>
                                <span className="text-[10px]">{TRANSPORT_LABELS[m]}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Origin */}
                    <LocationInput
                        label="A"
                        color="text-green-400"
                        value={originText}
                        onChange={(v) => { setOriginText(v); if (!v) setOriginPlace(null); }}
                        onSelect={setOriginPlace}
                        placeholder="Origin — city, address, landmark…"
                    />

                    {/* Swap button */}
                    <div className="flex justify-center">
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSwap}
                            transition={{ duration: 0.25 }}
                            className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm flex items-center justify-center transition-colors"
                            title="Swap origin and destination"
                        >⇅</motion.button>
                    </div>

                    {/* Destination */}
                    <LocationInput
                        label="B"
                        color="text-red-400"
                        value={destText}
                        onChange={(v) => { setDestText(v); if (!v) setDestPlace(null); }}
                        onSelect={setDestPlace}
                        placeholder="Destination — anywhere in the world…"
                    />

                    {/* Status indicators */}
                    <div className="flex gap-2">
                        {[{ place: originPlace, label: 'Origin', color: 'text-green-400' }, { place: destPlace, label: 'Dest', color: 'text-red-400' }].map(({ place, label, color }) => (
                            <div key={label} className={`flex-1 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/60 text-[10px] ${color}`}>
                                <span>{place ? '✓' : '○'}</span>
                                <span className="text-slate-500">{place ? place.name : label + ' not set'}</span>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs bg-red-900/20 rounded-xl px-3 py-2 border border-red-500/20">{error}</p>
                    )}

                    <motion.button
                        whileHover={{ scale: canCalculate ? 1.02 : 1 }}
                        whileTap={{ scale: canCalculate ? 0.98 : 1 }}
                        onClick={handleCalculate}
                        disabled={!canCalculate}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    >
                        {isCalculating ? (
                            <span className="flex items-center justify-center gap-2">
                                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⟳</motion.span>
                                Calculating route…
                            </span>
                        ) : '🗺️ Get Directions'}
                    </motion.button>
                </div>
            </div>

            {/* ── Route results ──────────────────────────────────────── */}
            <AnimatePresence>
                {navigationRoute && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden max-h-80 flex flex-col"
                    >
                        {/* Route summary */}
                        <div className="px-4 py-3 bg-gradient-to-r from-slate-800/80 to-slate-800/50 flex items-center gap-3 shrink-0">
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm truncate">
                                    {navigationRoute.origin} → {navigationRoute.destination}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-slate-400 text-xs capitalize">{TRANSPORT_ICONS[navigationRoute.mode]} {navigationRoute.mode}</span>
                                    <span className="text-slate-600 text-xs">·</span>
                                    <span className="text-slate-400 text-xs">{fmtDist(navigationRoute.distance)}</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-purple-300 font-bold text-lg leading-none">{fmtDuration(navigationRoute.duration)}</p>
                                <p className="text-slate-500 text-[10px] mt-0.5">estimated</p>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
                            {navigationRoute.steps.map((step, i) => (
                                <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-xs">
                                            {i === 0 ? '🟢' : i === navigationRoute.steps.length - 1 ? '🏁' : '→'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-200 text-xs leading-relaxed">{step.instruction}</p>
                                        {step.distance > 0 && (
                                            <p className="text-slate-500 text-[10px] mt-0.5">{fmtDist(step.distance)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-4 py-3 shrink-0 border-t border-slate-800">
                            <button
                                onClick={handleClear}
                                className="w-full py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                            >✕ Clear Route</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
