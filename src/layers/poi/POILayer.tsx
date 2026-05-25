import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import { useMapStore } from '../../store/mapStore';
import { getNearbyPOIs, GeoPlace, getPOIIcon } from '../../services/geocodingService';
import { POI_DATA, POIItem } from './poiData';

type POICategoryId = 'restaurant' | 'hotel' | 'museum' | 'airport' | 'park' | 'shopping' | 'landmark' | 'cafe' | 'attraction';

const LIVE_CATEGORIES: { id: POICategoryId; label: string; emoji: string; query: string }[] = [
    { id: 'restaurant', label: 'Restaurants', emoji: '🍽️', query: 'restaurant' },
    { id: 'cafe',       label: 'Cafes',       emoji: '☕', query: 'cafe coffee' },
    { id: 'hotel',      label: 'Hotels',      emoji: '🏨', query: 'hotel' },
    { id: 'shopping',   label: 'Shopping',    emoji: '🛍️', query: 'mall shopping' },
    { id: 'museum',     label: 'Museums',     emoji: '🏛️', query: 'museum' },
    { id: 'park',       label: 'Parks',       emoji: '🌳', query: 'park' },
    { id: 'airport',    label: 'Airports',    emoji: '✈️', query: 'airport' },
    { id: 'landmark',   label: 'Landmarks',   emoji: '🗿', query: 'landmark monument' },
    { id: 'attraction', label: 'Attractions', emoji: '🎡', query: 'attraction' },
];

const PRICE_LABELS = ['', '$', '$$', '$$$', '$$$$'];

function generateAIInsight(poi: POIItem | GeoPlace): string {
    if ('rating' in poi) {
        const p = poi as POIItem;
        const map: Record<string, string> = {
            restaurant: `A must-visit dining experience with a ${p.rating}/5 rating. ${p.priceLevel >= 3 ? 'Worth the splurge.' : 'Great value.'}`,
            hotel: `Among the top stays in ${p.city}. ${p.priceLevel >= 4 ? 'Ultra-luxury — book well in advance.' : 'Excellent value.'}`,
            landmark: `Iconic attraction in ${p.city}. Best visited in the morning to avoid crowds.`,
            museum: `World-class cultural institution. Allow 3+ hours. Book tickets online.`,
            park: `Beautiful green space. Visit early morning for the best experience.`,
            shopping: `One of the premier retail destinations in the area. Weekdays are less crowded.`,
            airport: `Major gateway. Arrive 3 hrs early for international flights. Check your terminal.`,
        };
        return map[p.category] ?? `Highly rated at ${p.rating}/5. A standout experience in ${p.city}.`;
    }
    const lp = poi as GeoPlace;
    return `Discovered via live Mapbox data near your current view. ${lp.fullName ? `Located at ${lp.fullName}.` : ''} Tap Directions to navigate here.`;
}

// ── Detail card ────────────────────────────────────────────────────────────────
interface DetailCardProps {
    poi: POIItem | null;
    livePoi: GeoPlace | null;
    onClose: () => void;
    onDirections: (coords: [number, number], name: string) => void;
}

const DetailCard: React.FC<DetailCardProps> = ({ poi, livePoi, onClose, onDirections }) => {
    const [showInsight, setShowInsight] = useState(false);
    if (!poi && !livePoi) return null;

    const name  = poi?.name ?? livePoi?.name ?? '';
    const emoji = poi?.emoji ?? getPOIIcon(livePoi?.category, livePoi?.maki);
    const coords = poi?.coords ?? livePoi?.coords ?? [0, 0] as [number, number];
    const insight = generateAIInsight(poi ?? livePoi!);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            className="absolute bottom-20 right-5 z-40 w-80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden pointer-events-auto"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/40 px-4 py-3 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/20 flex items-center justify-center text-2xl shrink-0 border border-purple-500/20">
                    {emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">{name}</p>
                    {poi && (
                        <>
                            <p className="text-slate-400 text-xs mt-0.5">📍 {poi.city}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(poi.rating))}{'☆'.repeat(5 - Math.round(poi.rating))}</span>
                                <span className="text-white text-xs font-bold">{poi.rating}</span>
                                <span className="text-slate-500 text-xs">·</span>
                                <span className="text-green-400 text-xs font-medium">{PRICE_LABELS[poi.priceLevel]}</span>
                            </div>
                        </>
                    )}
                    {livePoi && !poi && (
                        <p className="text-slate-400 text-xs mt-0.5 truncate">{livePoi.fullName}</p>
                    )}
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white text-xl transition-colors shrink-0">×</button>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-3">
                {poi?.description && <p className="text-slate-300 text-xs leading-relaxed">{poi.description}</p>}

                <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full text-[11px] capitalize font-medium">
                        {poi?.category ?? livePoi?.category ?? 'Place'}
                    </span>
                    <span className={`px-2.5 py-1 border rounded-full text-[11px] font-medium ${poi ? 'bg-slate-700/60 border-slate-600/40 text-slate-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-300'}`}>
                        {poi ? '⭐ Curated' : '📡 Live'}
                    </span>
                </div>

                {/* AI insight */}
                <button
                    onClick={() => setShowInsight((p) => !p)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-900/40 to-blue-900/30 border border-purple-500/20 rounded-xl text-xs text-purple-300 hover:border-purple-400/40 transition-all"
                >
                    <span>🤖</span>
                    <span className="font-medium">{showInsight ? 'Hide AI insight' : 'AI insight'}</span>
                    <motion.span animate={{ rotate: showInsight ? 90 : 0 }} className="ml-auto text-slate-500 text-base leading-none">›</motion.span>
                </button>
                <AnimatePresence>
                    {showInsight && (
                        <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="text-slate-400 text-xs leading-relaxed bg-slate-800/40 rounded-xl px-3 py-2.5 border border-white/[0.04] overflow-hidden"
                        >{insight}</motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex gap-2">
                <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => onDirections(coords, name)}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                >🗺️ Directions</motion.button>
                <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    className="py-2 px-3 bg-slate-800 text-slate-400 rounded-xl text-xs hover:text-white transition-colors border border-slate-700"
                >Close</motion.button>
            </div>
        </motion.div>
    );
};

// ── Main POI Layer ────────────────────────────────────────────────────────────
export const POILayer: React.FC = () => {
    const { showPOI, mapInstance, toggleGlobeMode, setActiveMode, setMapStyle } = useMapStore();
    const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null);
    const [selectedLivePOI, setSelectedLivePOI] = useState<GeoPlace | null>(null);
    const [activeCategories, setActiveCategories] = useState<Set<POICategoryId>>(
        new Set(['restaurant', 'hotel', 'landmark', 'shopping'] as POICategoryId[])
    );
    const [livePOIs, setLivePOIs] = useState<GeoPlace[]>([]);
    const [isLoadingLive, setIsLoadingLive] = useState(false);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasToken = !!import.meta.env.VITE_MAPBOX_TOKEN;

    // ── Fetch live POIs ──────────────────────────────────────────────────────
    const fetchLivePOIs = useCallback(async () => {
        if (!mapInstance || !hasToken) return;
        setIsLoadingLive(true);
        const center = mapInstance.getCenter();
        const activeCatList = [...activeCategories].slice(0, 3);
        const allPOIs = await Promise.all(
            activeCatList.map((catId) => {
                const cfg = LIVE_CATEGORIES.find((c) => c.id === catId);
                return getNearbyPOIs(cfg?.query ?? catId, [center.lng, center.lat], 8);
            })
        );
        const merged = allPOIs.flat().filter(
            (p, i, arr) => arr.findIndex((q) => q.id === p.id) === i
        );
        setLivePOIs(merged);
        setIsLoadingLive(false);
    }, [mapInstance, activeCategories, hasToken]);

    useEffect(() => {
        if (!showPOI || !mapInstance) return;
        fetchLivePOIs();
        const onEnd = () => {
            if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
            fetchTimerRef.current = setTimeout(fetchLivePOIs, 900);
        };
        mapInstance.on('moveend', onEnd);
        return () => { mapInstance.off('moveend', onEnd); if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current); };
    }, [showPOI, mapInstance, fetchLivePOIs]);

    // ── Render markers ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapInstance) return;
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        if (!showPOI) return;

        // Static curated markers
        POI_DATA.filter((p) => activeCategories.has(p.category as POICategoryId)).forEach((poi) => {
            const el = document.createElement('div');
            el.style.cssText = 'cursor:pointer;';
            el.innerHTML = `<div style="
                background:linear-gradient(135deg,#7c3aed,#2563eb);
                border:2px solid rgba(139,92,246,0.7);
                border-radius:50%; width:34px; height:34px;
                display:flex; align-items:center; justify-content:center;
                font-size:15px; box-shadow:0 0 14px rgba(139,92,246,0.45);
                transition:transform 0.15s ease;
            ">${poi.emoji}</div>`;
            const inner = el.firstChild as HTMLElement;
            el.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.22)'; });
            el.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)'; });
            el.addEventListener('click', () => {
                setSelectedPOI(poi); setSelectedLivePOI(null);
                toggleGlobeMode(false);
                mapInstance.flyTo({ center: poi.coords, zoom: 16, pitch: 55, duration: 1400 });
            });
            markersRef.current.push(
                new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(poi.coords).addTo(mapInstance)
            );
        });

        // Live markers
        livePOIs.forEach((place) => {
            const el = document.createElement('div');
            el.style.cssText = 'cursor:pointer;';
            el.innerHTML = `<div style="
                background:linear-gradient(135deg,#0f172a,#1e293b);
                border:1.5px solid rgba(59,130,246,0.55);
                border-radius:50%; width:28px; height:28px;
                display:flex; align-items:center; justify-content:center;
                font-size:13px; box-shadow:0 0 8px rgba(59,130,246,0.3);
                transition:transform 0.15s ease;
            ">${getPOIIcon(place.category, place.maki)}</div>`;
            const inner = el.firstChild as HTMLElement;
            el.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.25)'; });
            el.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)'; });
            el.addEventListener('click', () => {
                setSelectedLivePOI(place); setSelectedPOI(null);
                toggleGlobeMode(false);
                mapInstance.flyTo({ center: place.coords, zoom: 16, pitch: 55, duration: 1400 });
            });
            markersRef.current.push(
                new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(place.coords).addTo(mapInstance)
            );
        });

        return () => { markersRef.current.forEach((m) => m.remove()); markersRef.current = []; };
    }, [showPOI, mapInstance, livePOIs, activeCategories, toggleGlobeMode]);

    const handleDirections = (coords: [number, number], name: string) => {
        toggleGlobeMode(false);
        setActiveMode('navigation');
        setMapStyle('navigation');
        setSelectedPOI(null);
        setSelectedLivePOI(null);
        mapInstance?.flyTo({ center: coords, zoom: 14, pitch: 45, duration: 1200 });
    };

    const toggleCategory = (cat: POICategoryId) => {
        setActiveCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
        });
    };

    const totalPOIs = livePOIs.length + POI_DATA.filter((p) => activeCategories.has(p.category as POICategoryId)).length;

    if (!showPOI) return null;

    return (
        <>
            {/* ── Category filter bar ────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
            >
                <div className="bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-purple-500/20 shadow-2xl px-3 py-2 flex items-center gap-2 max-w-[calc(100vw-80px)]">
                    {/* Live count */}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg shrink-0">
                        {isLoadingLive ? (
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-blue-400 text-xs">⟳</motion.span>
                        ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        )}
                        <span className="text-blue-300 text-[10px] font-semibold whitespace-nowrap">{totalPOIs} POIs</span>
                    </div>
                    <div className="w-px h-5 bg-white/10 shrink-0" />
                    {/* Scrollable category pills */}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                        {LIVE_CATEGORIES.map((cat) => {
                            const active = activeCategories.has(cat.id);
                            return (
                                <motion.button
                                    key={cat.id}
                                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                                        active
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-[0_0_8px_rgba(139,92,246,0.3)]'
                                            : 'bg-slate-800/60 text-slate-500 border-slate-700/50 hover:text-slate-300'
                                    }`}
                                >
                                    <span>{cat.emoji}</span>
                                    <span className="hidden md:inline">{cat.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* ── Detail card ──────────────────────────────── */}
            <AnimatePresence>
                {(selectedPOI || selectedLivePOI) && (
                    <DetailCard
                        poi={selectedPOI}
                        livePoi={selectedLivePOI}
                        onClose={() => { setSelectedPOI(null); setSelectedLivePOI(null); }}
                        onDirections={handleDirections}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
