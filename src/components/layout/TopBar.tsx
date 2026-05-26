/**
 * TopBar.tsx — Fixed Header / Navigation Bar
 * ─────────────────────────────────────────────────────────────────────────────
 * The persistent bar at the top of the screen. Contains:
 *
 *   [☰ Logo] [🔍 Search input ▾ dropdown] [mode pills…] [⌘K] [⚙️]
 *
 * Key responsibilities:
 *  1. Smart search box — debounces input (250ms), calls Mapbox Geocoding API
 *     (or falls back to Nominatim/OSM). Shows a dropdown with live results
 *     or popular destination suggestions. Supports keyboard navigation
 *     (↑↓ arrows, Enter, Escape).
 *
 *  2. Globe/Map aware — when `isGlobeMode` is true, selecting a result calls
 *     `setSelectedPlace` so Globe3D can animate to the location. When false,
 *     the Leaflet map calls `flyTo()` directly.
 *
 *  3. Mode pills — clicking a mode pill switches `activeMode` in the store,
 *     which activates the corresponding sidebar panel and map style.
 *
 *  4. Command palette shortcut — ⌘K opens the CommandPalette overlay.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore, MapMode, MapStyle } from '../../store/mapStore';
import { searchPlaces, GeoPlace, TYPE_ICONS, getPOIIcon } from '../../services/geocodingService';

interface ModeCfg { id: MapMode; label: string; icon: string; style: MapStyle; globe: boolean; }

const MODES: ModeCfg[] = [
    { id: 'globe',        label: 'Globe',        icon: '🌍', style: 'dark',       globe: true  },
    { id: 'navigation',   label: 'Navigate',     icon: '🚗', style: 'navigation', globe: false },
    { id: 'adventure',    label: 'Adventure',    icon: '🥾', style: 'terrain',    globe: false },
    { id: 'analytics',    label: 'Analytics',    icon: '📊', style: 'dark',       globe: false },
    { id: 'immersive',    label: 'Explore',      icon: '🎮', style: 'satellite',  globe: false },
    { id: 'intelligence', label: 'Intelligence', icon: '✈️', style: 'dark',       globe: false },
    { id: 'satellite',    label: 'Satellite',    icon: '🛰️', style: 'satellite',  globe: false },
    { id: 'crowd',        label: 'Crowd',        icon: '🚨', style: 'navigation', globe: false },
    { id: 'offline',      label: 'Offline',      icon: '🧭', style: 'standard',   globe: false },
];

// Static fallback suggestions shown when no query or API unavailable
const FALLBACK: { name: string; country: string; coords: [number, number]; zoom: number; flag: string; type: string }[] = [
    { name: 'Tokyo',        country: 'Japan',     coords: [139.6917, 35.6895], zoom: 11, flag: '🇯🇵', type: 'City' },
    { name: 'Paris',        country: 'France',    coords: [2.3522, 48.8566],   zoom: 11, flag: '🇫🇷', type: 'City' },
    { name: 'Dubai',        country: 'UAE',       coords: [55.2708, 25.2048],  zoom: 11, flag: '🇦🇪', type: 'City' },
    { name: 'Bali',         country: 'Indonesia', coords: [115.0920, -8.3405], zoom: 10, flag: '🇮🇩', type: 'Island' },
    { name: 'New York',     country: 'USA',       coords: [-74.0060, 40.7128], zoom: 11, flag: '🇺🇸', type: 'City' },
    { name: 'London',       country: 'UK',        coords: [-0.1278, 51.5074],  zoom: 11, flag: '🇬🇧', type: 'City' },
    { name: 'Santorini',    country: 'Greece',    coords: [25.4319, 36.3932],  zoom: 12, flag: '🇬🇷', type: 'Island' },
    { name: 'Singapore',    country: 'Singapore', coords: [103.8198, 1.3521],  zoom: 12, flag: '🇸🇬', type: 'City' },
    { name: 'Bangkok',      country: 'Thailand',  coords: [100.5018, 13.7563], zoom: 11, flag: '🇹🇭', type: 'City' },
    { name: 'Sydney',       country: 'Australia', coords: [151.2093, -33.8688],zoom: 11, flag: '🇦🇺', type: 'City' },
    { name: 'Barcelona',    country: 'Spain',     coords: [2.1734, 41.3851],   zoom: 12, flag: '🇪🇸', type: 'City' },
    { name: 'Kyoto',        country: 'Japan',     coords: [135.7681, 35.0116], zoom: 12, flag: '🇯🇵', type: 'City' },
];

function typeLabel(type: string): string {
    const map: Record<string, string> = {
        country: 'Country', region: 'Region', place: 'City', locality: 'Locality',
        neighborhood: 'Neighborhood', address: 'Address', poi: 'Place',
    };
    return map[type] || type;
}

interface TopBarProps {
    sidebarOpen: boolean;
    onSidebarToggle: () => void;
    onCommandPalette: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ sidebarOpen, onSidebarToggle, onCommandPalette }) => {
    const [query, setQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [focused, setFocused] = useState(false);
    const [results, setResults] = useState<GeoPlace[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selected, setSelected] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasToken = !!import.meta.env.VITE_MAPBOX_TOKEN;

    const { activeMode, setActiveMode, setMapStyle, mapInstance, setSelectedCountry, openPanel, setSelectedPlace, isGlobeMode } = useMapStore();

    // ── Geocoding debounce ───────────────────────────────────────────────────
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim() || query.length < 2) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            const places = await searchPlaces(query, { limit: 8 });
            setResults(places);
            setIsSearching(false);
            setSelected(0);
        }, 250);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    // Filter fallback suggestions when no query
    const fallbackFiltered = query.length > 0
        ? FALLBACK.filter((s) =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.country.toLowerCase().includes(query.toLowerCase())
        )
        : FALLBACK.slice(0, 6);

    // Decide which list to show
    const showGeoResults = hasToken && results.length > 0;
    const listItems = showGeoResults ? results : (hasToken && isSearching ? [] : fallbackFiltered);

    const handleGeoSelect = useCallback((place: GeoPlace) => {
        setQuery(place.name);
        setShowDropdown(false);
        setFocused(false);
        inputRef.current?.blur();
        setSelectedPlace(place);
        if (!isGlobeMode) {
            // Only flyTo on Leaflet map when not in globe mode
            const [lng, lat] = place.coords;
            mapInstance?.flyTo([lat, lng], place.zoom, { duration: 2, easeLinearity: 0.25 });
            if (place.type === 'country' || place.type === 'place' || place.type === 'region' || place.type === 'city') {
                setSelectedCountry(place.name);
                openPanel('country');
            }
        }
        // In globe mode: Globe3D picks up selectedPlace and shows the overlay card
    }, [isGlobeMode, mapInstance, setSelectedCountry, openPanel, setSelectedPlace]);

    const handleFallbackSelect = useCallback((s: typeof FALLBACK[0]) => {
        setQuery(s.name);
        setShowDropdown(false);
        setFocused(false);
        inputRef.current?.blur();
        if (!isGlobeMode) {
            mapInstance?.flyTo([s.coords[1], s.coords[0]], s.zoom, { duration: 2, easeLinearity: 0.25 });
            setSelectedCountry(s.name);
            openPanel('country');
        } else {
            // In globe mode: create a minimal GeoPlace and show overlay
            setSelectedPlace({
                id: s.name,
                name: s.name,
                fullName: `${s.name}, ${s.country}`,
                country: s.country,
                type: 'place',
                coords: s.coords,
                zoom: s.zoom,
            } as GeoPlace);
        }
    }, [isGlobeMode, mapInstance, setSelectedCountry, openPanel, setSelectedPlace]);

    const handleMode = (cfg: ModeCfg) => {
        setActiveMode(cfg.id);
        setMapStyle(cfg.style);
    };

    // Keyboard navigation
    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((p) => Math.min(p + 1, listItems.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((p) => Math.max(p - 1, 0)); }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (showGeoResults && results[selected]) handleGeoSelect(results[selected]);
            else if (!showGeoResults && fallbackFiltered[selected]) handleFallbackSelect(fallbackFiltered[selected]);
        }
        if (e.key === 'Escape') { setShowDropdown(false); inputRef.current?.blur(); }
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)
            ) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ⌘K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onCommandPalette(); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onCommandPalette]);

    const showList = showDropdown && (focused || query.length > 0);

    return (
        <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-slate-950/97 backdrop-blur-2xl border-b border-white/[0.06] flex items-center px-3 gap-3">

            {/* ── Sidebar toggle + Logo ──────────────────────────── */}
            <div className="flex items-center gap-2 shrink-0">
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                    onClick={onSidebarToggle}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Toggle sidebar"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        {sidebarOpen ? (
                            <><rect x="2" y="3.5" width="12" height="1.2" rx="0.6" fill="currentColor"/><rect x="2" y="7.4" width="12" height="1.2" rx="0.6" fill="currentColor"/><rect x="2" y="11.3" width="12" height="1.2" rx="0.6" fill="currentColor"/></>
                        ) : (
                            <><rect x="2" y="3.5" width="12" height="1.2" rx="0.6" fill="currentColor"/><rect x="2" y="7.4" width="8" height="1.2" rx="0.6" fill="currentColor"/><rect x="2" y="11.3" width="10" height="1.2" rx="0.6" fill="currentColor"/></>
                        )}
                    </svg>
                </motion.button>
                <div className="flex items-center gap-1.5">
                    <span className="text-lg">🌐</span>
                    <span className="text-white font-bold text-sm tracking-tight hidden sm:block">TravelOS</span>
                </div>
            </div>

            {/* ── Search ─────────────────────────────────────────── */}
            <div className="relative flex-1 max-w-sm" ref={dropdownRef}>
                <div className={`flex items-center gap-2 bg-slate-800/70 border rounded-xl px-3 py-2 transition-all ${focused ? 'border-purple-500/60 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]' : 'border-white/[0.08]'}`}>
                    {isSearching ? (
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="text-purple-400 text-sm shrink-0"
                        >⟳</motion.span>
                    ) : (
                        <span className="text-slate-400 text-sm shrink-0">🔍</span>
                    )}
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                        onFocus={() => { setFocused(true); setShowDropdown(true); }}
                        onBlur={() => setFocused(false)}
                        onKeyDown={handleKey}
                        placeholder="Search anywhere — cities, streets, landmarks…"
                        className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none min-w-0"
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }}
                            className="text-slate-500 hover:text-white text-xs shrink-0"
                        >✕</button>
                    )}
                </div>

                {/* ── Dropdown ───────────────────────────────────── */}
                <AnimatePresence>
                    {showList && (
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full mt-2 left-0 right-0 bg-slate-900/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                            {/* Header label */}
                            <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
                                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                                    {isSearching ? 'Searching…' : results.length > 0 ? `${results.length} results` : 'Popular Destinations'}
                                </p>
                                <p className="text-slate-700 text-[9px]">
                                    {hasToken ? 'Mapbox' : 'OpenStreetMap'}
                                </p>
                            </div>

                            {/* Loading shimmer */}
                            {isSearching && !showGeoResults && (
                                <div className="px-4 py-3 space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 animate-pulse">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 bg-slate-800 rounded w-2/3" />
                                                <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Geocoding results */}
                            {showGeoResults && results.map((place, i) => (
                                <motion.button
                                    key={place.id}
                                    whileHover={{ backgroundColor: 'rgba(139,92,246,0.1)' }}
                                    onMouseDown={() => handleGeoSelect(place)}
                                    onMouseEnter={() => setSelected(i)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selected === i ? 'bg-purple-600/10' : ''}`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center text-base shrink-0">
                                        {place.type === 'poi'
                                            ? getPOIIcon(place.category, place.maki)
                                            : (TYPE_ICONS[place.type] || '📍')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{place.name}</p>
                                        <p className="text-slate-500 text-xs truncate">
                                            {place.country ? `${place.country} · ` : ''}{typeLabel(place.type)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-slate-700 text-xs font-mono">
                                            {place.coords[1].toFixed(1)}°, {place.coords[0].toFixed(1)}°
                                        </span>
                                        <span className="text-slate-600 text-sm">→</span>
                                    </div>
                                </motion.button>
                            ))}

                            {/* Fallback static list */}
                            {!showGeoResults && !isSearching && fallbackFiltered.map((s, i) => (
                                <motion.button
                                    key={s.name}
                                    whileHover={{ backgroundColor: 'rgba(139,92,246,0.1)' }}
                                    onMouseDown={() => handleFallbackSelect(s)}
                                    onMouseEnter={() => setSelected(i)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selected === i ? 'bg-purple-600/10' : ''}`}
                                >
                                    <span className="text-xl w-8 text-center shrink-0">{s.flag}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium">{s.name}</p>
                                        <p className="text-slate-500 text-xs">{s.country} · {s.type}</p>
                                    </div>
                                    <span className="text-slate-600 text-sm">→</span>
                                </motion.button>
                            ))}

                            {/* No results */}
                            {!isSearching && showGeoResults === false && query.length > 1 && fallbackFiltered.length === 0 && (
                                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                                    <p className="text-2xl mb-2">🗺️</p>
                                    <p>No results for "<span className="text-slate-400">{query}</span>"</p>
                                    <p className="text-xs mt-1 text-slate-600">Try a city, country, landmark, or street address</p>
                                </div>
                            )}

                            {/* Search powered by Nominatim when no Mapbox token */}
                            {!hasToken && results.length > 0 && (
                                <div className="px-4 py-1.5 border-t border-white/[0.04]">
                                    <p className="text-slate-700 text-[9px]">
                                        © OpenStreetMap contributors — Nominatim
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Mode pills ──────────────────────────────────────── */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
                {MODES.map((m) => {
                    const active = activeMode === m.id;
                    return (
                        <motion.button
                            key={m.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => handleMode(m)}
                            title={m.label}
                            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${
                                active
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                                    : 'bg-white/[0.04] text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/10 hover:border-purple-500/30'
                            }`}
                        >
                            <span className="text-sm leading-none">{m.icon}</span>
                            <span className="hidden lg:inline">{m.label}</span>
                            {active && (
                                <motion.span layoutId="top-mode-dot" className="w-1.5 h-1.5 rounded-full bg-white/80 hidden lg:block" />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Right actions ────────────────────────────────────── */}
            <div className="flex items-center gap-1 shrink-0">
                <button
                    onClick={onCommandPalette}
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-purple-500/30 transition-all text-xs"
                    title="Command palette (⌘K)"
                >
                    <span className="text-[10px] font-mono">⌘K</span>
                </button>
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all text-base"
                    title="Settings"
                >⚙️</motion.button>
            </div>
        </header>
    );
};
