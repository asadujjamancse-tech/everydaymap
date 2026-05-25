import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../store/mapStore';

interface Suggestion {
    name: string;
    coords: [number, number];
    zoom: number;
    type: 'city' | 'country' | 'region';
    flag: string;
}

const SUGGESTIONS: Suggestion[] = [
    { name: 'Tokyo, Japan', coords: [139.69, 35.69], zoom: 11, type: 'city', flag: '🇯🇵' },
    { name: 'Bangkok, Thailand', coords: [100.50, 13.75], zoom: 11, type: 'city', flag: '🇹🇭' },
    { name: 'Paris, France', coords: [2.35, 48.86], zoom: 12, type: 'city', flag: '🇫🇷' },
    { name: 'Dubai, UAE', coords: [55.30, 25.20], zoom: 11, type: 'city', flag: '🇦🇪' },
    { name: 'New York, USA', coords: [-74.00, 40.71], zoom: 12, type: 'city', flag: '🇺🇸' },
    { name: 'Singapore', coords: [103.82, 1.35], zoom: 11, type: 'country', flag: '🇸🇬' },
    { name: 'Barcelona, Spain', coords: [2.17, 41.39], zoom: 12, type: 'city', flag: '🇪🇸' },
    { name: 'Bali, Indonesia', coords: [115.09, -8.34], zoom: 10, type: 'city', flag: '🇮🇩' },
    { name: 'Santorini, Greece', coords: [25.43, 36.43], zoom: 13, type: 'city', flag: '🇬🇷' },
    { name: 'Machu Picchu, Peru', coords: [-72.54, -13.16], zoom: 14, type: 'region', flag: '🇵🇪' },
    { name: 'Kyoto, Japan', coords: [135.77, 35.01], zoom: 12, type: 'city', flag: '🇯🇵' },
    { name: 'Istanbul, Turkey', coords: [28.97, 41.01], zoom: 12, type: 'city', flag: '🇹🇷' },
    { name: 'Cape Town, South Africa', coords: [18.42, -33.93], zoom: 11, type: 'city', flag: '🇿🇦' },
    { name: 'Reykjavik, Iceland', coords: [-21.89, 64.13], zoom: 11, type: 'city', flag: '🇮🇸' },
    { name: 'Ha Long Bay, Vietnam', coords: [107.05, 20.91], zoom: 10, type: 'region', flag: '🇻🇳' },
    { name: 'Angkor Wat, Cambodia', coords: [103.87, 13.41], zoom: 13, type: 'region', flag: '🇰🇭' },
    { name: 'Maldives', coords: [73.22, 3.20], zoom: 7, type: 'country', flag: '🇲🇻' },
    { name: 'Morocco', coords: [-7.09, 31.79], zoom: 6, type: 'country', flag: '🇲🇦' },
    { name: 'Kenya Safari', coords: [36.82, 1.29], zoom: 7, type: 'region', flag: '🇰🇪' },
    { name: 'Amalfi Coast, Italy', coords: [14.60, 40.63], zoom: 13, type: 'region', flag: '🇮🇹' },
];

const TYPE_ICON: Record<string, string> = { city: '🏙️', country: '🌍', region: '📍' };

export const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const [results, setResults] = useState<Suggestion[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { mapInstance, toggleGlobeMode, setSelectedCountry, openPanel } = useMapStore();

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const q = query.toLowerCase();
        setResults(SUGGESTIONS.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6));
    }, [query]);

    const handleSelect = (s: Suggestion) => {
        setQuery(s.name);
        setResults([]);
        setFocused(false);
        inputRef.current?.blur();

        // Fly the Mapbox map to the destination
        toggleGlobeMode(false);
        setTimeout(() => {
            mapInstance?.flyTo({
                center: s.coords,
                zoom: s.zoom,
                duration: 2500,
                pitch: s.zoom > 10 ? 55 : 30,
                essential: true,
            });
        }, 350);

        // Open country panel if it's a country/city
        const country = s.name.split(',')[0].trim();
        setSelectedCountry(country);
        openPanel('country');
    };

    const showDropdown = focused && (results.length > 0 || query.length === 0);
    const popularList = query.length === 0 ? SUGGESTIONS.slice(0, 5) : [];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
            <motion.div
                animate={{ scale: focused ? 1.01 : 1 }}
                className="relative"
            >
                {/* Search input */}
                <div className={`flex items-center bg-slate-900/85 backdrop-blur-xl rounded-2xl border transition-all shadow-2xl ${
                    focused ? 'border-purple-500 shadow-purple-500/20' : 'border-purple-500/25'
                }`}>
                    <span className="pl-4 text-slate-400 text-lg">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setTimeout(() => setFocused(false), 150)}
                        placeholder="Search destinations, cities, landmarks…"
                        className="flex-1 px-3 py-3.5 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500"
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setResults([]); }} className="pr-4 text-slate-500 hover:text-white transition text-lg">
                            ×
                        </button>
                    )}
                </div>

                {/* Dropdown */}
                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full mt-2 w-full bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden"
                        >
                            {popularList.length > 0 && (
                                <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-slate-500">Popular Destinations</p>
                            )}
                            {(results.length > 0 ? results : popularList).map((s) => (
                                <motion.button
                                    key={s.name}
                                    whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', x: 4 }}
                                    onClick={() => handleSelect(s)}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors"
                                >
                                    <span className="text-xl leading-none">{s.flag}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{s.name}</p>
                                    </div>
                                    <span className="text-slate-500 text-xs shrink-0">{TYPE_ICON[s.type]} {s.type}</span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
