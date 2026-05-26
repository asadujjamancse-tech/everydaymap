/**
 * CrowdMode.tsx — Crowd Safety & Incident Monitoring Panel
 * Simulates (and optionally fetches live) crowd incident data from cities worldwide.
 * Incidents are written to `crowdIncidents` in the store so CrowdIncidentsLayer
 * can display matching markers on the Leaflet map.
 * Severity levels: high (red), medium (orange), low (yellow).
 */
/// <reference types="vite/client" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

interface Incident {
    id: string;
    type: 'accident' | 'closure' | 'hazard' | 'police' | 'congestion' | 'event' | 'earthquake' | 'wildfire' | 'storm';
    title: string;
    location: string;
    coords: [number, number];
    severity: 'low' | 'medium' | 'high';
    time: string;
    votes: number;
    emoji: string;
    source: 'live' | 'simulated';
}

interface City {
    name: string;
    country: string;
    emoji: string;
    coords: [number, number]; // [lng, lat]
    zoom: number;
    // bounding box [minLng, minLat, maxLng, maxLat]
    bbox: [number, number, number, number];
}

// ── City definitions ──────────────────────────────────────────────────────────

const CITIES: City[] = [
    { name: 'New York',   country: 'USA',         emoji: '🗽', coords: [-74.006, 40.712],  zoom: 11, bbox: [-74.26, 40.49, -73.70, 40.92] },
    { name: 'London',     country: 'UK',           emoji: '🎡', coords: [-0.118,  51.509],  zoom: 11, bbox: [-0.51,  51.28, 0.33,  51.69] },
    { name: 'Tokyo',      country: 'Japan',        emoji: '🗼', coords: [139.691, 35.689],  zoom: 11, bbox: [139.45, 35.50, 139.95, 35.82] },
    { name: 'Paris',      country: 'France',       emoji: '🗼', coords: [2.3488,  48.853],  zoom: 12, bbox: [2.22,   48.81, 2.47,   48.91] },
    { name: 'Dubai',      country: 'UAE',          emoji: '🏙️', coords: [55.296,  25.204],  zoom: 11, bbox: [55.00,  24.99, 55.56,  25.40] },
    { name: 'Singapore',  country: 'Singapore',    emoji: '🦁', coords: [103.820, 1.352],   zoom: 12, bbox: [103.60, 1.15,  104.05, 1.50] },
    { name: 'Sydney',     country: 'Australia',    emoji: '🦘', coords: [151.209, -33.868], zoom: 11, bbox: [150.90, -34.17, 151.55, -33.57] },
    { name: 'Mumbai',     country: 'India',        emoji: '🇮🇳', coords: [72.877,  19.076],  zoom: 11, bbox: [72.74,  18.89, 73.06,  19.28] },
    { name: 'Berlin',     country: 'Germany',      emoji: '🐻', coords: [13.405,  52.520],  zoom: 11, bbox: [13.09,  52.33, 13.76,  52.68] },
    { name: 'São Paulo',  country: 'Brazil',       emoji: '🇧🇷', coords: [-46.633, -23.548], zoom: 11, bbox: [-46.83, -23.72, -46.36, -23.35] },
    { name: 'Bangkok',    country: 'Thailand',     emoji: '🛺', coords: [100.523, 13.736],  zoom: 11, bbox: [100.33, 13.57, 100.73, 13.93] },
    { name: 'Cairo',      country: 'Egypt',        emoji: '🏺', coords: [31.235,  30.044],  zoom: 11, bbox: [31.00,  29.84, 31.50,  30.23] },
    { name: 'Lagos',      country: 'Nigeria',      emoji: '🌍', coords: [3.379,   6.524],   zoom: 11, bbox: [3.15,   6.35,  3.60,   6.71] },
    { name: 'Los Angeles',country: 'USA',          emoji: '🎬', coords: [-118.243,34.052],  zoom: 10, bbox: [-118.67,33.70,-117.65,34.34] },
    { name: 'Istanbul',   country: 'Turkey',       emoji: '🕌', coords: [28.978,  41.015],  zoom: 11, bbox: [28.60,  40.80, 29.40,  41.23] },
    { name: 'Dhaka',      country: 'Bangladesh',   emoji: '🇧🇩', coords: [90.407,  23.810],  zoom: 12, bbox: [90.28,  23.70, 90.55,  23.93] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(isoOrMs: string | number): string {
    const ms = typeof isoOrMs === 'number' ? isoOrMs : new Date(isoOrMs).getTime();
    const diff = Date.now() - ms;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
}

// ── TomTom city-specific traffic ─────────────────────────────────────────────

async function fetchCityTraffic(city: City): Promise<Incident[]> {
    const key = import.meta.env.VITE_TOMTOM_KEY;
    if (!key) return [];
    const [minLng, minLat, maxLng, maxLat] = city.bbox;
    try {
        const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${minLng},${minLat},${maxLng},${maxLat}&fields={incidents{type,geometry{coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,from,to}}}&language=en-GB&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11&timeValidityFilter=present`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        const delaySeverity = (d: number): 'low' | 'medium' | 'high' =>
            d >= 3 ? 'high' : d >= 1 ? 'medium' : 'low';
        return ((data.incidents as any[]) ?? [])
            .filter((inc: any) => inc.geometry?.coordinates)
            .slice(0, 20)
            .map((inc: any, i: number): Incident => {
                const props = inc.properties;
                // geometry can be Point [lng,lat] or LineString [[lng,lat],...] — normalise to a single point
                const raw = inc.geometry.coordinates;
                const point: [number, number] = Array.isArray(raw[0])
                    ? [raw[Math.floor(raw.length / 2)][0], raw[Math.floor(raw.length / 2)][1]]
                    : [raw[0], raw[1]];
                const desc: string = props.events?.[0]?.description ?? 'Traffic incident';
                const delay: number = props.magnitudeOfDelay ?? 0;
                const cat: number = props.iconCategory ?? 0;
                const isAccident = cat === 1 || cat === 14;
                const isClosure = cat === 6;
                const isCongestion = cat === 0;
                return {
                    id: `tt-${city.name}-${i}`,
                    type: isAccident ? 'accident' : isClosure ? 'closure' : isCongestion ? 'congestion' : 'hazard',
                    title: desc.length > 55 ? desc.slice(0, 52) + '…' : desc,
                    location: props.from ? `${props.from}${props.to ? ' → ' + props.to : ''}` : city.name,
                    coords: point,
                    severity: delaySeverity(delay),
                    time: props.startTime ? timeAgo(props.startTime) : 'now',
                    votes: 0,
                    emoji: isAccident ? '🚗' : isClosure ? '🚧' : isCongestion ? '🚦' : '⚠️',
                    source: 'live',
                };
            });
    } catch {
        return [];
    }
}

// USGS Earthquakes — globally free, no key
async function fetchEarthquakes(): Promise<Incident[]> {
    try {
        const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson');
        if (!res.ok) return [];
        const data = await res.json();
        return (data.features as any[]).slice(0, 8).map((f: any): Incident => {
            const mag: number = f.properties.mag ?? 0;
            return {
                id: `usgs-${f.id}`,
                type: 'earthquake',
                title: `M${mag.toFixed(1)} Earthquake`,
                location: f.properties.place ?? 'Unknown location',
                coords: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
                severity: mag >= 6 ? 'high' : mag >= 4.5 ? 'medium' : 'low',
                time: timeAgo(f.properties.time),
                votes: Math.round(f.properties.felt ?? 0),
                emoji: mag >= 6 ? '🔴' : mag >= 4.5 ? '🟠' : '🟡',
                source: 'live',
            };
        });
    } catch { return []; }
}

// NASA EONET — free natural events
async function fetchNASAEvents(): Promise<Incident[]> {
    try {
        const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=10&days=7');
        if (!res.ok) return [];
        const data = await res.json();
        return (data.events as any[])
            .filter((e: any) => e.geometry?.length > 0)
            .slice(0, 6)
            .map((e: any): Incident => {
                const geo = e.geometry[e.geometry.length - 1];
                const cat = (e.categories?.[0]?.title ?? '').toLowerCase();
                const isWildfire = cat.includes('wildfire') || cat.includes('fire');
                const isStorm = cat.includes('storm') || cat.includes('cyclone') || cat.includes('hurricane');
                const isVolcano = cat.includes('volcano');
                return {
                    id: `eonet-${e.id}`,
                    type: isWildfire ? 'wildfire' : isStorm ? 'storm' : 'hazard',
                    title: e.title,
                    location: e.categories?.[0]?.title ?? 'Natural Event',
                    coords: [geo.coordinates[0], geo.coordinates[1]] as [number, number],
                    severity: isStorm || isVolcano ? 'high' : isWildfire ? 'medium' : 'low',
                    time: timeAgo(geo.date ?? new Date().toISOString()),
                    votes: 0,
                    emoji: isWildfire ? '🔥' : isStorm ? '🌀' : isVolcano ? '🌋' : '⚠️',
                    source: 'live',
                };
            });
    } catch { return []; }
}

// Fallback simulated traffic for a city
function simulatedForCity(city: City): Incident[] {
    const templates = [
        { type: 'congestion' as const, title: 'Heavy traffic buildup',    emoji: '🚦', severity: 'high' as const },
        { type: 'accident'   as const, title: 'Minor road collision',      emoji: '🚗', severity: 'medium' as const },
        { type: 'closure'    as const, title: 'Road works — lane closed',  emoji: '🚧', severity: 'low' as const },
        { type: 'hazard'     as const, title: 'Debris on road reported',   emoji: '⚠️', severity: 'low' as const },
    ];
    return templates.map((t, i) => ({
        id: `sim-${city.name}-${i}`,
        ...t,
        location: `${city.name} city centre`,
        coords: [city.coords[0] + (Math.random() - 0.5) * 0.05, city.coords[1] + (Math.random() - 0.5) * 0.05] as [number, number],
        time: `${(i + 1) * 5}m ago`,
        votes: Math.floor(Math.random() * 40),
        source: 'simulated' as const,
    }));
}

// ── UI constants ──────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
    low:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    medium: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    high:   'text-red-400 bg-red-400/10 border-red-400/30',
};

const TYPE_FILTERS = [
    { key: 'all',        label: 'All' },
    { key: 'accident',   label: '🚗 Accident' },
    { key: 'congestion', label: '🚦 Traffic' },
    { key: 'closure',    label: '🚧 Closure' },
    { key: 'hazard',     label: '⚠️ Hazard' },
    { key: 'earthquake', label: '🌍 Quake' },
    { key: 'wildfire',   label: '🔥 Fire' },
    { key: 'storm',      label: '🌀 Storm' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const CrowdMode: React.FC = () => {
    const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]);
    const [cityIncidents, setCityIncidents] = useState<Incident[]>([]);
    const [globalIncidents, setGlobalIncidents] = useState<Incident[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [hasTomTom] = useState(!!import.meta.env.VITE_TOMTOM_KEY);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportType, setReportType] = useState('accident');
    const [reportNote, setReportNote] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [showCityPicker, setShowCityPicker] = useState(false);
    const refreshRef = useRef<ReturnType<typeof setInterval>>();
    const { mapInstance, setCrowdIncidents } = useMapStore();

    const loadCity = useCallback(async (city: City) => {
        setLoading(true);
        const traffic = await fetchCityTraffic(city);
        const final = traffic.length > 0 ? traffic : simulatedForCity(city);
        setCityIncidents(final);
        setCrowdIncidents(final);
        setLastUpdated(new Date());
        setLoading(false);
        // Fly map to selected city
        const [lng, lat] = city.coords;
        (mapInstance as any)?.flyTo([lat, lng], city.zoom, { duration: 2, easeLinearity: 0.25 });
    }, [mapInstance]);

    const loadGlobal = useCallback(async () => {
        const [quakes, nasa] = await Promise.all([fetchEarthquakes(), fetchNASAEvents()]);
        setGlobalIncidents([...quakes, ...nasa]);
    }, []);

    const handleCitySelect = useCallback((city: City) => {
        setSelectedCity(city);
        setShowCityPicker(false);
        setFilter('all');
        loadCity(city);
    }, [loadCity]);

    // Initial load
    useEffect(() => {
        loadCity(CITIES[0]);
        loadGlobal();
        refreshRef.current = setInterval(() => {
            loadCity(selectedCity);
            loadGlobal();
        }, 120_000);
        return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFlyTo = (inc: Incident) => {
        const [lng, lat] = inc.coords;
        (mapInstance as any)?.flyTo([lat, lng], 14, { duration: 1.5, easeLinearity: 0.25 });
    };

    const handleVote = (id: string) => {
        setCityIncidents((prev) => prev.map((i) => i.id === id ? { ...i, votes: i.votes + 1 } : i));
        setGlobalIncidents((prev) => prev.map((i) => i.id === id ? { ...i, votes: i.votes + 1 } : i));
    };

    const allIncidents = [...cityIncidents, ...globalIncidents].sort((a, b) => {
        const s = { high: 0, medium: 1, low: 2 };
        return s[a.severity] - s[b.severity];
    });
    const filtered = filter === 'all' ? allIncidents : allIncidents.filter((i) => i.type === filter);
    const highCount = allIncidents.filter((i) => i.severity === 'high').length;
    const liveCount = allIncidents.filter((i) => i.source === 'live').length;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-3">

            {/* Header */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-800/70 to-orange-800/70 px-4 py-3 flex items-center gap-2">
                    <span className="text-xl">🚨</span>
                    <h2 className="text-white font-bold text-sm">Live Crowd Alerts</h2>
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-auto flex items-center gap-1 text-red-300 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />LIVE
                    </motion.span>
                </div>

                {/* City selector */}
                <div className="px-3 pt-3 pb-1">
                    <p className="text-slate-500 text-[10px] mb-1.5 uppercase tracking-wider">Select City</p>
                    <div className="relative">
                        <button
                            onClick={() => setShowCityPicker((v) => !v)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-red-500/40 rounded-xl transition-all"
                        >
                            <span className="text-lg">{selectedCity.emoji}</span>
                            <div className="flex-1 text-left">
                                <p className="text-white text-sm font-semibold">{selectedCity.name}</p>
                                <p className="text-slate-500 text-[10px]">{selectedCity.country}</p>
                            </div>
                            <span className="text-slate-400 text-xs">{showCityPicker ? '▲' : '▼'}</span>
                        </button>

                        <AnimatePresence>
                            {showCityPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-red-900"
                                >
                                    {CITIES.map((city) => (
                                        <button
                                            key={city.name}
                                            onClick={() => handleCitySelect(city)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-red-600/10 ${selectedCity.name === city.name ? 'bg-red-600/15 border-l-2 border-red-500' : ''}`}
                                        >
                                            <span className="text-base">{city.emoji}</span>
                                            <div>
                                                <p className="text-white text-xs font-medium">{city.name}</p>
                                                <p className="text-slate-500 text-[10px]">{city.country}</p>
                                            </div>
                                            {selectedCity.name === city.name && <span className="ml-auto text-red-400 text-xs">✓</span>}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Data source badges */}
                <div className="px-3 py-2 flex items-center gap-1.5 flex-wrap">
                    {hasTomTom
                        ? <span className="text-[10px] text-orange-400 bg-orange-400/10 border border-orange-400/20 rounded-full px-2 py-0.5">🚦 TomTom Live</span>
                        : <span className="text-[10px] text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5">🚦 Simulated</span>
                    }
                    <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">🌍 USGS</span>
                    <span className="text-[10px] text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-2 py-0.5">🛰️ NASA</span>
                    <button onClick={() => { loadCity(selectedCity); loadGlobal(); }} className="ml-auto text-slate-500 hover:text-white text-sm transition-colors" title="Refresh">⟳</button>
                </div>

                {/* Stats */}
                <div className="px-3 pb-3 grid grid-cols-3 gap-2">
                    {[
                        { label: 'Active',   value: loading ? '…' : allIncidents.length, color: 'text-red-400' },
                        { label: 'High',     value: loading ? '…' : highCount,           color: 'text-orange-400' },
                        { label: 'Live',     value: loading ? '…' : liveCount,           color: 'text-green-400' },
                    ].map((s) => (
                        <div key={s.label} className="bg-slate-800/60 rounded-xl p-2 text-center border border-white/5">
                            <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                            <p className="text-slate-500 text-[10px]">{s.label}</p>
                        </div>
                    ))}
                </div>

                {lastUpdated && (
                    <p className="px-4 pb-2 text-[10px] text-slate-600">Updated {timeAgo(lastUpdated.toISOString())} · auto-refreshes every 2 min</p>
                )}

                {/* Type filter */}
                <div className="px-3 pb-3 flex gap-1.5 overflow-x-auto scrollbar-none">
                    {TYPE_FILTERS.map((t) => (
                        <button key={t.key} onClick={() => setFilter(t.key)}
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                filter === t.key
                                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border-transparent'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-red-500/40'
                            }`}>{t.label}</button>
                    ))}
                </div>
            </div>

            {/* Incidents list */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-white font-semibold text-sm">
                            {loading ? 'Loading…' : `${selectedCity.name} · ${filtered.length} incidents`}
                        </p>
                        {!loading && cityIncidents.length === 0 && (
                            <p className="text-slate-600 text-[10px]">No active incidents reported</p>
                        )}
                    </div>
                    <button onClick={() => setReportOpen(true)}
                        className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-300 rounded-full text-xs font-semibold hover:bg-red-600/30 transition">
                        + Report
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center gap-2 py-10">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-2xl">⟳</motion.span>
                        <p className="text-slate-500 text-xs">Fetching {selectedCity.name} traffic…</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-red-900">
                        {filtered.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">No incidents for this filter</p>
                        ) : filtered.map((inc) => (
                            <motion.div key={inc.id} layout className="px-4 py-3">
                                <div className="flex items-start gap-3">
                                    <motion.button whileHover={{ scale: 1.15 }} onClick={() => handleFlyTo(inc)}
                                        className="text-xl shrink-0 mt-0.5 transition-transform" title="Fly to">
                                        {inc.emoji}
                                    </motion.button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                            <p className="text-white text-xs font-medium truncate">{inc.title}</p>
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${SEVERITY_STYLES[inc.severity]}`}>
                                                {inc.severity.toUpperCase()}
                                            </span>
                                            {inc.source === 'live' && (
                                                <span className="text-[9px] text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-1.5 py-0.5">LIVE</span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-xs truncate">📍 {inc.location}</p>
                                        <p className="text-slate-600 text-[11px] mt-0.5">{inc.time}</p>
                                    </div>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        onClick={() => handleVote(inc.id)}
                                        className="shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 bg-slate-800/60 rounded-lg border border-white/5 hover:border-orange-500/30 transition-all">
                                        <span className="text-orange-400 text-xs">▲</span>
                                        <span className="text-white text-[11px] font-bold">{inc.votes}</span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Report modal */}
            <AnimatePresence>
                {reportOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-orange-500/30 shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-orange-800/50 to-red-800/50 flex items-center justify-between">
                            <p className="text-white font-bold text-sm">🚨 Report in {selectedCity.name}</p>
                            <button onClick={() => setReportOpen(false)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
                        </div>
                        {submitted ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 flex flex-col items-center gap-2">
                                <span className="text-4xl">✅</span>
                                <p className="text-green-400 font-bold">Report submitted!</p>
                                <p className="text-slate-400 text-xs">Thank you for keeping {selectedCity.name} safe.</p>
                            </motion.div>
                        ) : (
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                        { type: 'accident', emoji: '🚗', label: 'Accident' },
                                        { type: 'hazard', emoji: '⚠️', label: 'Hazard' },
                                        { type: 'police', emoji: '🚔', label: 'Police' },
                                        { type: 'congestion', emoji: '🚦', label: 'Traffic' },
                                        { type: 'closure', emoji: '🚧', label: 'Closure' },
                                        { type: 'event', emoji: '🏃', label: 'Event' },
                                    ].map((t) => (
                                        <button key={t.type} onClick={() => setReportType(t.type)}
                                            className={`py-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                                                reportType === t.type
                                                    ? 'bg-orange-600/30 border-orange-500/50 text-orange-300'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}>
                                            <span className="text-lg">{t.emoji}</span>
                                            <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)}
                                    placeholder="Additional details (optional)..." rows={2}
                                    className="w-full px-3 py-2 bg-slate-800 rounded-xl text-white text-sm border border-slate-700 focus:border-orange-500 focus:outline-none placeholder:text-slate-500 resize-none" />
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => { setSubmitted(true); setTimeout(() => { setSubmitted(false); setReportOpen(false); setReportNote(''); }, 2000); }}
                                    className="w-full py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold text-sm">
                                    📍 Submit Report
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
