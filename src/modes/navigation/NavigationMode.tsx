/// <reference types="vite/client" />
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import { useMapStore, NavigationRoute, NavStep } from '../../store/mapStore';
import { searchPlaces, GeoPlace } from '../../services/geocodingService';

const TRANSPORT_ICONS: Record<string, string> = { driving: '🚗', walking: '🚶', cycling: '🚴' };
const TRANSPORT_LABELS: Record<string, string> = { driving: 'Drive', walking: 'Walk', cycling: 'Cycle' };

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

    const { navigationRoute, setNavigationRoute, setIsNavigating, mapInstance, toggleGlobeMode } = useMapStore();

    const canCalculate = !!(originPlace && destPlace) && !isCalculating;

    const handleCalculate = useCallback(async () => {
        if (!originPlace || !destPlace) {
            setError('Please select both origin and destination from the suggestions.');
            return;
        }
        setError('');
        setIsCalculating(true);
        toggleGlobeMode(false);

        const oCoords = originPlace.coords;
        const dCoords = destPlace.coords;
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        let route: NavigationRoute | null = null;

        // Try real Mapbox Directions API
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

        // Fallback: straight-line mock
        if (!route) {
            const dx = dCoords[0] - oCoords[0];
            const dy = dCoords[1] - oCoords[1];
            const distKm = Math.hypot(dx * 111 * Math.cos((oCoords[1] * Math.PI) / 180), dy * 111);
            const speedKph = transportMode === 'driving' ? 60 : transportMode === 'cycling' ? 20 : 5;
            const coords = Array.from({ length: 21 }, (_, i) => [
                oCoords[0] + (dx * i) / 20,
                oCoords[1] + (dy * i) / 20,
            ]);
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
                geometry: { type: 'LineString', coordinates: coords },
            };
        }

        // Draw route on map
        if (mapInstance) {
            const map = mapInstance;
            map.fitBounds(
                [
                    [Math.min(oCoords[0], dCoords[0]) - 0.5, Math.min(oCoords[1], dCoords[1]) - 0.5],
                    [Math.max(oCoords[0], dCoords[0]) + 0.5, Math.max(oCoords[1], dCoords[1]) + 0.5],
                ],
                { padding: { top: 80, bottom: 80, left: 320, right: 60 }, duration: 1800 }
            );

            const geojson = { type: 'Feature', properties: {}, geometry: route.geometry };
            const src = map.getSource('nav-route') as any;
            if (src) {
                src.setData(geojson);
            } else {
                map.addSource('nav-route', { type: 'geojson', data: geojson as any });

                // Glow effect (wide blurred line behind)
                map.addLayer({
                    id: 'nav-route-glow',
                    type: 'line',
                    source: 'nav-route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#a78bfa', 'line-width': 18, 'line-opacity': 0.18, 'line-blur': 8 },
                });

                // Casing (outer stroke)
                map.addLayer({
                    id: 'nav-route-casing',
                    type: 'line',
                    source: 'nav-route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#5b21b6', 'line-width': 8, 'line-opacity': 0.9 },
                });

                // Main route line
                map.addLayer({
                    id: 'nav-route-line',
                    type: 'line',
                    source: 'nav-route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': '#8b5cf6',
                        'line-width': 5,
                        'line-opacity': 1,
                        'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#8b5cf6', 1, '#3b82f6'],
                    } as any,
                });
            }

            // Origin marker
            new mapboxgl.Marker({ color: '#4ade80', scale: 0.9 })
                .setLngLat(oCoords)
                .setPopup(new mapboxgl.Popup({ offset: 25, className: 'dark-popup' }).setText(`🟢 ${route.origin}`))
                .addTo(map);

            // Destination marker
            new mapboxgl.Marker({ color: '#f87171', scale: 0.9 })
                .setLngLat(dCoords)
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(`🔴 ${route.destination}`))
                .addTo(map);
        }

        setNavigationRoute(route);
        setIsNavigating(true);
        setIsCalculating(false);
    }, [originPlace, destPlace, transportMode, mapInstance, toggleGlobeMode, setNavigationRoute, setIsNavigating]);

    const handleClear = () => {
        setNavigationRoute(null);
        setIsNavigating(false);
        setOriginText('');
        setDestText('');
        setOriginPlace(null);
        setDestPlace(null);
        setError('');
        if (mapInstance) {
            ['nav-route-line', 'nav-route-casing', 'nav-route-glow'].forEach((id) => {
                if (mapInstance.getLayer(id)) mapInstance.removeLayer(id);
            });
            if (mapInstance.getSource('nav-route')) mapInstance.removeSource('nav-route');
        }
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
                    <span className="ml-auto text-purple-200 text-xs">Mapbox Directions</span>
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
