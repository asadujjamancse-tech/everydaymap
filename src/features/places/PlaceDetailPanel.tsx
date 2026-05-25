import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';
import { GeoPlace, reverseGeocode } from '../../services/geocodingService';

// ── Destination intelligence DB (offline AI responses) ────────────────────────
const PLACE_INTEL: Record<string, {
    weather: string; bestTime: string; currency: string;
    language: string; safety: string; tips: string[];
    tags: string[];
}> = {
    japan:       { weather: 'Temperate — four distinct seasons', bestTime: 'Mar–May (cherry blossom) or Oct–Nov', currency: 'JPY ¥', language: 'Japanese', safety: '9.5/10', tips: ['Get a Suica card for transit', 'Bow when greeting locals', 'Remove shoes indoors'], tags: ['Culture', 'Food', 'Technology', 'Nature'] },
    france:      { weather: 'Oceanic — mild winters, warm summers', bestTime: 'Apr–Jun or Sep–Oct', currency: 'EUR €', language: 'French', safety: '7.5/10', tips: ['Book Eiffel Tower weeks ahead', 'Always say Bonjour', 'Try the local boulangeries'], tags: ['Art', 'Food', 'Romance', 'History'] },
    thailand:    { weather: 'Tropical — hot, rainy, cool seasons', bestTime: 'Nov–Feb (cool & dry)', currency: 'THB ฿', language: 'Thai', safety: '7.8/10', tips: ['Dress modestly at temples', 'Negotiate at markets', 'Eat street food — it\'s incredible'], tags: ['Beaches', 'Food', 'Culture', 'Nightlife'] },
    uae:         { weather: 'Desert — extremely hot summers', bestTime: 'Nov–Apr', currency: 'AED د.إ', language: 'Arabic (English widely spoken)', safety: '9.2/10', tips: ['Dress conservatively in public', 'Alcohol only in licensed venues', 'Book Burj Khalifa in advance'], tags: ['Luxury', 'Shopping', 'Architecture', 'Beaches'] },
    indonesia:   { weather: 'Tropical — wet & dry seasons', bestTime: 'May–Sep (dry season)', currency: 'IDR Rp', language: 'Indonesian (Balinese)', safety: '7.0/10', tips: ['Respect temple customs', 'Bargain at local markets', 'Try nasi goreng for breakfast'], tags: ['Beaches', 'Culture', 'Diving', 'Spirituality'] },
    'united states': { weather: 'Varies by region — all climates', bestTime: 'Spring & Fall are universally pleasant', currency: 'USD $', language: 'English', safety: '7.0/10', tips: ['Tip 18–20% at restaurants', 'Public transit varies by city', 'Plan well ahead for NYC visits'], tags: ['Culture', 'Food', 'Art', 'Nightlife'] },
    'united kingdom': { weather: 'Maritime — mild, frequently overcast', bestTime: 'Jun–Sep', currency: 'GBP £', language: 'English', safety: '8.2/10', tips: ['Oyster card for London transit', 'Queue politely — it\'s the law', 'Try a proper Sunday roast'], tags: ['History', 'Culture', 'Tea', 'Museums'] },
    greece:      { weather: 'Mediterranean — hot dry summers', bestTime: 'May–Jun or Sep–Oct', currency: 'EUR €', language: 'Greek', safety: '8.5/10', tips: ['Explore beyond Athens', 'Book Santorini sunsets early', 'Eat late — Greeks dine at 9pm+'], tags: ['Islands', 'History', 'Food', 'Romance'] },
    singapore:   { weather: 'Tropical — hot & humid year-round', bestTime: 'Feb–Apr', currency: 'SGD S$', language: 'English, Malay, Chinese', safety: '9.5/10', tips: ['Try hawker centers for incredible cheap food', 'MRT covers everything', 'Gardens by the Bay free at night'], tags: ['Food', 'Tech', 'Shopping', 'Culture'] },
    spain:       { weather: 'Mediterranean to semi-arid', bestTime: 'Apr–Jun or Sep–Oct', currency: 'EUR €', language: 'Spanish (Catalan in Barcelona)', safety: '7.8/10', tips: ['Lunch is the main meal — at 2pm', 'Siesta is real — plan accordingly', 'Sagrada Família requires advance booking'], tags: ['Architecture', 'Food', 'Beaches', 'Art'] },
    australia:   { weather: 'Varies — Mediterranean south, tropical north', bestTime: 'Sep–Nov or Mar–May', currency: 'AUD A$', language: 'English', safety: '8.8/10', tips: ['Always wear sunscreen', 'Book Great Barrier Reef early', 'Try a flat white — the coffee is exceptional'], tags: ['Nature', 'Beaches', 'Wildlife', 'Culture'] },
    italy:       { weather: 'Mediterranean — warm summers, mild winters', bestTime: 'Apr–Jun or Sep–Oct', currency: 'EUR €', language: 'Italian', safety: '7.8/10', tips: ['Validate train tickets before boarding', 'Aperitivo hour is sacred', 'Book Colosseum and Vatican in advance'], tags: ['History', 'Food', 'Art', 'Architecture'] },
    turkey:      { weather: 'Mediterranean — hot summers, mild winters', bestTime: 'Apr–Jun or Sep–Oct', currency: 'TRY ₺', language: 'Turkish', safety: '7.0/10', tips: ['Turkish breakfast is a multi-course feast', 'Bargain in the Grand Bazaar', 'Cappadocia hot air balloons book months ahead'], tags: ['History', 'Culture', 'Landscape', 'Food'] },
};

function getIntel(place: GeoPlace) {
    const search = (place.country ?? place.fullName ?? '').toLowerCase();
    for (const [key, intel] of Object.entries(PLACE_INTEL)) {
        if (search.includes(key)) return intel;
    }
    return null;
}

function getZoomCategory(zoom: number): string {
    if (zoom <= 4) return 'Country';
    if (zoom <= 7) return 'Region';
    if (zoom <= 12) return 'City';
    if (zoom <= 15) return 'District';
    return 'Location';
}

// ── Component ─────────────────────────────────────────────────────────────────
interface PlaceDetailPanelProps {
    place: GeoPlace;
    onClose: () => void;
}

export const PlaceDetailPanel: React.FC<PlaceDetailPanelProps> = ({ place, onClose }) => {
    const [tab, setTab] = useState<'overview' | 'intel' | 'explore'>('overview');
    const [isExpanded, setIsExpanded] = useState(true);
    const { mapInstance, toggleGlobeMode, setActiveMode, setMapStyle } = useMapStore();

    const intel = getIntel(place);

    const flyToPlace = () => {
        toggleGlobeMode(false);
        setTimeout(() => {
            mapInstance?.flyTo({
                center: place.coords,
                zoom: place.zoom,
                pitch: place.zoom > 12 ? 55 : 35,
                duration: 2000,
                essential: true,
            });
        }, 200);
    };

    useEffect(() => { flyToPlace(); }, []);

    const handleNavigateTo = () => {
        toggleGlobeMode(false);
        setActiveMode('navigation');
        setMapStyle('navigation');
    };

    const handleSatellite = () => {
        toggleGlobeMode(false);
        setActiveMode('satellite');
        setMapStyle('satellite');
        mapInstance?.flyTo({ center: place.coords, zoom: Math.max(place.zoom, 12), pitch: 45, duration: 1500 });
    };

    const TABS = [
        { id: 'overview' as const, label: 'Overview', icon: '🗺️' },
        { id: 'intel' as const, label: 'Intelligence', icon: '🤖' },
        { id: 'explore' as const, label: 'Explore', icon: '🔭' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="absolute top-20 right-5 z-40 w-80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-purple-500/25 shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
        >
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-purple-800/60 to-blue-800/40 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0 border border-white/10">
                    {place.type === 'country' ? '🌍' : place.type === 'poi' ? '📍' : '🏙️'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{place.name}</p>
                    <p className="text-purple-300 text-[10px] truncate">
                        {place.country ? `${place.country} · ` : ''}{getZoomCategory(place.zoom)}
                    </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setIsExpanded((p) => !p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs"
                        title={isExpanded ? 'Minimize' : 'Expand'}
                    >
                        {isExpanded ? '−' : '+'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm"
                    >×</motion.button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {/* Coordinates bar */}
                        <div className="px-4 py-2 bg-slate-800/40 border-y border-white/[0.04] flex items-center gap-3 text-[10px] font-mono text-slate-500">
                            <span>LAT {place.coords[1].toFixed(4)}</span>
                            <span className="text-slate-700">|</span>
                            <span>LNG {place.coords[0].toFixed(4)}</span>
                            <span className="text-slate-700">|</span>
                            <span>ZOOM {place.zoom}</span>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/[0.06]">
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-all relative ${
                                        tab === t.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <span>{t.icon}</span>
                                    <span>{t.label}</span>
                                    {tab === t.id && (
                                        <motion.div layoutId="panel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="p-4">
                            <AnimatePresence mode="wait">
                                {/* ── Overview tab ─────────────────────── */}
                                {tab === 'overview' && (
                                    <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                                        {intel && (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { icon: '🌤️', label: 'Weather', val: intel.weather },
                                                        { icon: '📅', label: 'Best time', val: intel.bestTime },
                                                        { icon: '💰', label: 'Currency', val: intel.currency },
                                                        { icon: '🗣️', label: 'Language', val: intel.language },
                                                        { icon: '🛡️', label: 'Safety', val: intel.safety },
                                                    ].map(({ icon, label, val }) => (
                                                        <div key={label} className="bg-slate-800/60 rounded-xl p-2.5 border border-white/[0.04]">
                                                            <p className="text-slate-500 text-[9px] uppercase tracking-wider mb-0.5">{icon} {label}</p>
                                                            <p className="text-white text-[11px] font-medium leading-tight">{val}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {intel.tags.map((tag) => (
                                                        <span key={tag} className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/25 text-purple-300 rounded-full text-[10px]">{tag}</span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        {!intel && (
                                            <div className="text-center py-4">
                                                <p className="text-3xl mb-2">🌐</p>
                                                <p className="text-slate-400 text-sm font-medium">{place.name}</p>
                                                <p className="text-slate-600 text-xs mt-1">{place.fullName}</p>
                                                <div className="mt-3 text-[10px] font-mono text-slate-600 space-y-0.5">
                                                    <p>Coordinates: {place.coords[1].toFixed(6)}, {place.coords[0].toFixed(6)}</p>
                                                    <p>Type: {place.type} · Zoom: {place.zoom}</p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* ── Intelligence tab ─────────────────── */}
                                {tab === 'intel' && (
                                    <motion.div key="intel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                                        {intel ? (
                                            <>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center text-sm border border-purple-500/30">🤖</div>
                                                    <div>
                                                        <p className="text-white text-xs font-semibold">AI Travel Insights</p>
                                                        <p className="text-slate-500 text-[9px]">Powered by travel intelligence</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {intel.tips.map((tip, i) => (
                                                        <div key={i} className="flex items-start gap-2 px-3 py-2 bg-slate-800/40 rounded-xl border border-white/[0.04]">
                                                            <span className="text-purple-400 text-xs shrink-0 mt-0.5">💡</span>
                                                            <p className="text-slate-300 text-xs leading-relaxed">{tip}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-6 text-slate-500 text-sm">
                                                <p className="text-2xl mb-2">🤖</p>
                                                <p>No intelligence data available for this location yet.</p>
                                                <p className="text-xs mt-1 text-slate-600">Try searching for a major city or country.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* ── Explore tab ──────────────────────── */}
                                {tab === 'explore' && (
                                    <motion.div key="explore" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                                        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-2">Quick Actions</p>
                                        {[
                                            { icon: '🛰️', label: 'Satellite View', desc: 'Aerial imagery of this location', action: handleSatellite },
                                            { icon: '🏙️', label: '3D City View', desc: 'Fly in with 3D buildings', action: () => { toggleGlobeMode(false); mapInstance?.flyTo({ center: place.coords, zoom: Math.max(place.zoom, 14), pitch: 65, bearing: 30, duration: 2200 }); } },
                                            { icon: '🚗', label: 'Navigate Here', desc: 'Get driving directions', action: handleNavigateTo },
                                            { icon: '🌍', label: 'Back to Globe', desc: 'Return to cinematic globe', action: () => { toggleGlobeMode(true); setActiveMode('globe'); setMapStyle('dark'); } },
                                        ].map(({ icon, label, desc, action }) => (
                                            <motion.button
                                                key={label}
                                                whileHover={{ x: 2, backgroundColor: 'rgba(139,92,246,0.08)' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => { action(); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.04] bg-slate-800/40 text-left transition-all"
                                            >
                                                <span className="text-lg w-8 text-center shrink-0">{icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-xs font-semibold">{label}</p>
                                                    <p className="text-slate-500 text-[10px]">{desc}</p>
                                                </div>
                                                <span className="text-slate-600 text-sm shrink-0">›</span>
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Action bar */}
                        <div className="px-4 pb-4 flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={flyToPlace}
                                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                            >✈️ Fly Here</motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleNavigateTo}
                                className="py-2 px-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 hover:text-white transition-colors"
                            >🗺️ Route</motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
