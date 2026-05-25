import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

// ── Country data ───────────────────────────────────────────────────────────────
interface CountryData {
    flag: string;
    capital: string;
    region: string;
    currency: string;
    language: string;
    budget: { backpacker: string; standard: string; luxury: string };
    safety: number;
    internet: string;
    temperature: string;
    visaFree: boolean;
    bestSeasons: string[];
    topCities: string[];
    mustSee: string[];
    aiTip: string;
    travelStyle: string[];
}

const COUNTRY_DB: Record<string, CountryData> = {
    Thailand: {
        flag: '🇹🇭', capital: 'Bangkok', region: 'Southeast Asia', currency: 'Thai Baht (฿)', language: 'Thai',
        budget: { backpacker: '$20/day', standard: '$60/day', luxury: '$200/day' },
        safety: 7.5, internet: '45 Mbps', temperature: '28–35°C', visaFree: true,
        bestSeasons: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        topCities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Koh Samui'],
        mustSee: ['Grand Palace', 'Wat Pho', 'Floating Markets', 'Tiger Cave Temple', 'Phi Phi Islands'],
        aiTip: 'Book Songkran (Thai New Year) in April for a huge water festival — but expect bigger crowds.',
        travelStyle: ['Backpacking', 'Beach', 'Culture', 'Food', 'Nightlife'],
    },
    Japan: {
        flag: '🇯🇵', capital: 'Tokyo', region: 'East Asia', currency: 'Japanese Yen (¥)', language: 'Japanese',
        budget: { backpacker: '$60/day', standard: '$120/day', luxury: '$400/day' },
        safety: 9.8, internet: '120 Mbps', temperature: '15–28°C', visaFree: true,
        bestSeasons: ['Mar', 'Apr', 'Oct', 'Nov'],
        topCities: ['Tokyo', 'Kyoto', 'Osaka', 'Nara', 'Hiroshima'],
        mustSee: ['Mt. Fuji', 'Fushimi Inari', 'Arashiyama Bamboo', 'Shibuya Crossing', 'Nara Deer Park'],
        aiTip: 'Get the JR Pass before you arrive — unlimited bullet train travel for 14/21 days.',
        travelStyle: ['Culture', 'Food', 'Technology', 'Nature', 'Shopping'],
    },
    Vietnam: {
        flag: '🇻🇳', capital: 'Hanoi', region: 'Southeast Asia', currency: 'Vietnamese Dong (₫)', language: 'Vietnamese',
        budget: { backpacker: '$20/day', standard: '$50/day', luxury: '$150/day' },
        safety: 7.8, internet: '40 Mbps', temperature: '25–32°C', visaFree: false,
        bestSeasons: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        topCities: ['Hanoi', 'Ho Chi Minh City', 'Hoi An', 'Da Nang', 'Sapa'],
        mustSee: ['Ha Long Bay', 'Hoi An Ancient Town', 'Mỹ Sơn Sanctuary', 'Phong Nha Caves', 'Sapa Rice Terraces'],
        aiTip: 'Rent a motorbike and drive the Hai Van Pass — one of the world\'s most scenic coastal roads.',
        travelStyle: ['Backpacking', 'Food', 'History', 'Nature', 'Beach'],
    },
    Singapore: {
        flag: '🇸🇬', capital: 'Singapore City', region: 'Southeast Asia', currency: 'Singapore Dollar (S$)', language: 'English',
        budget: { backpacker: '$80/day', standard: '$180/day', luxury: '$600/day' },
        safety: 9.5, internet: '200 Mbps', temperature: '26–32°C', visaFree: true,
        bestSeasons: ['Feb', 'Mar', 'Apr', 'Jun', 'Jul'],
        topCities: ['Orchard Road', 'Chinatown', 'Little India', 'Sentosa', 'Marina Bay'],
        mustSee: ['Gardens by the Bay', 'Marina Bay Sands', 'Hawker Centres', 'Sentosa Island', 'Jewel Changi'],
        aiTip: 'Singapore hawker centres are UNESCO listed — eat like a local for $3–5 a meal.',
        travelStyle: ['City Break', 'Food', 'Shopping', 'Family', 'Luxury'],
    },
    Indonesia: {
        flag: '🇮🇩', capital: 'Jakarta', region: 'Southeast Asia', currency: 'Indonesian Rupiah (Rp)', language: 'Indonesian',
        budget: { backpacker: '$25/day', standard: '$70/day', luxury: '$200/day' },
        safety: 7.0, internet: '25 Mbps', temperature: '27–33°C', visaFree: true,
        bestSeasons: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        topCities: ['Bali', 'Jakarta', 'Yogyakarta', 'Lombok', 'Komodo'],
        mustSee: ['Bali Temples', 'Komodo Dragons', 'Borobudur Temple', 'Raja Ampat', 'Mount Bromo'],
        aiTip: 'Fly into Bali but go east — Raja Ampat has the best marine biodiversity on Earth.',
        travelStyle: ['Backpacking', 'Beach', 'Adventure', 'Culture', 'Diving'],
    },
    Cambodia: {
        flag: '🇰🇭', capital: 'Phnom Penh', region: 'Southeast Asia', currency: 'Cambodian Riel (KHR)', language: 'Khmer',
        budget: { backpacker: '$20/day', standard: '$50/day', luxury: '$150/day' },
        safety: 7.0, internet: '20 Mbps', temperature: '27–35°C', visaFree: false,
        bestSeasons: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        topCities: ['Siem Reap', 'Phnom Penh', 'Sihanoukville', 'Kep', 'Battambang'],
        mustSee: ['Angkor Wat', 'Bayon Temple', 'Ta Prohm', 'Phnom Penh Palace', 'Koh Rong Island'],
        aiTip: 'Watch Angkor Wat sunrise with a local guide — the crowds arrive after 8am.',
        travelStyle: ['Backpacking', 'History', 'Budget', 'Culture', 'Temples'],
    },
    default: {
        flag: '🌍', capital: 'Capital City', region: 'World', currency: 'Local Currency', language: 'Local',
        budget: { backpacker: '$30/day', standard: '$80/day', luxury: '$250/day' },
        safety: 7.5, internet: '40 Mbps', temperature: '20–28°C', visaFree: true,
        bestSeasons: ['Apr', 'May', 'Sep', 'Oct', 'Nov'],
        topCities: ['Capital City', 'Main City'],
        mustSee: ['Historic Centre', 'Natural Wonders', 'Local Markets'],
        aiTip: 'Travel in the shoulder season for smaller crowds and better prices.',
        travelStyle: ['Culture', 'Nature', 'Adventure'],
    },
};

// ── Component ─────────────────────────────────────────────────────────────────
export const CountryPanel: React.FC = () => {
    const { isPanelOpen, panelContent, selectedCountry, closePanel, mapInstance, toggleGlobeMode } = useMapStore();

    const data = useMemo<CountryData>(() => {
        if (!selectedCountry) return COUNTRY_DB.default;
        return COUNTRY_DB[selectedCountry] ?? COUNTRY_DB.default;
    }, [selectedCountry]);

    const show = isPanelOpen && panelContent === 'country' && !!selectedCountry;

    const safetyColor = data.safety >= 9 ? 'text-green-400' : data.safety >= 7 ? 'text-yellow-400' : 'text-red-400';

    const handleFlyTo = () => {
        // Find coords from AI service data
        const coords: Record<string, [number, number]> = {
            Thailand: [100.99, 15.87], Japan: [138.25, 36.20], Vietnam: [106.64, 16.47],
            Singapore: [103.82, 1.35], Indonesia: [113.92, -2.54], Cambodia: [104.99, 12.57],
        };
        const c = selectedCountry ? coords[selectedCountry] : null;
        if (c && mapInstance) {
            toggleGlobeMode(false);
            setTimeout(() => mapInstance.flyTo({ center: c, zoom: 6, duration: 2000, pitch: 40 }), 300);
        }
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, x: 420 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 420 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="fixed right-0 top-14 bottom-10 w-96 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl z-45 overflow-y-auto border-l border-purple-500/20 scrollbar-thin scrollbar-thumb-purple-800"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-700 to-blue-700 p-6 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.4),transparent)]" />
                        <button onClick={closePanel} className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 w-8 h-8 flex items-center justify-center rounded-lg transition text-lg z-10">
                            ✕
                        </button>
                        <div className="text-5xl mb-2">{data.flag}</div>
                        <h1 className="text-3xl font-bold text-white">{selectedCountry}</h1>
                        <p className="text-purple-200 text-sm mt-1">{data.capital} · {data.region}</p>
                        <p className="text-purple-300/70 text-xs mt-1">{data.language} · {data.currency}</p>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Quick stats */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
                            className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Safety Score', value: `${data.safety}/10`, color: safetyColor },
                                { label: 'Internet Speed', value: data.internet, color: 'text-blue-400' },
                                { label: 'Temperature', value: data.temperature, color: 'text-orange-400' },
                                { label: 'Visa Free', value: data.visaFree ? '✓ Yes' : '✗ Visa Required', color: data.visaFree ? 'text-green-400' : 'text-red-400' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-slate-800/60 rounded-xl p-3.5 border border-white/5">
                                    <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">{stat.label}</p>
                                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))}
                        </motion.div>

                        {/* Budget */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                            className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                            <h3 className="text-white font-semibold mb-3 text-sm">💰 Daily Budget Guide</h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'Backpacker', value: data.budget.backpacker, color: 'text-green-400', bar: 30 },
                                    { label: 'Standard', value: data.budget.standard, color: 'text-blue-400', bar: 60 },
                                    { label: 'Luxury', value: data.budget.luxury, color: 'text-purple-400', bar: 100 },
                                ].map((b) => (
                                    <div key={b.label} className="flex items-center gap-3">
                                        <span className="text-slate-400 text-xs w-24 shrink-0">{b.label}</span>
                                        <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${b.bar}%` }}
                                                transition={{ delay: 0.3, duration: 0.7 }}
                                                className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"
                                            />
                                        </div>
                                        <span className={`${b.color} font-bold text-sm w-20 text-right shrink-0`}>{b.value}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Best Seasons */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                            className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                            <h3 className="text-white font-semibold mb-3 text-sm">🗓️ Best Time to Visit</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.bestSeasons.map((s) => (
                                    <span key={s} className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-medium shadow-lg">{s}</span>
                                ))}
                            </div>
                        </motion.div>

                        {/* Top Cities */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                            className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                            <h3 className="text-white font-semibold mb-3 text-sm">🏙️ Top Cities</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.topCities.map((city) => (
                                    <span key={city} className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs cursor-pointer transition">{city}</span>
                                ))}
                            </div>
                        </motion.div>

                        {/* Must See */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                            className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                            <h3 className="text-white font-semibold mb-3 text-sm">📍 Must-See Attractions</h3>
                            <ul className="space-y-2">
                                {data.mustSee.map((item, i) => (
                                    <li key={item} className="flex items-start gap-2 text-sm">
                                        <span className="text-purple-400 font-bold shrink-0">{i + 1}.</span>
                                        <span className="text-slate-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Travel Styles */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.28 }}
                            className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                            <h3 className="text-white font-semibold mb-3 text-sm">🎯 Travel Style</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.travelStyle.map((style) => (
                                    <span key={style} className="px-2.5 py-1 bg-blue-600/25 border border-blue-500/30 text-blue-300 rounded-lg text-xs">{style}</span>
                                ))}
                            </div>
                        </motion.div>

                        {/* AI Tip */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.32 }}
                            className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl p-4 border border-purple-500/25">
                            <h3 className="text-purple-300 font-semibold mb-2 text-sm flex items-center gap-2">
                                <span>🤖</span> AI Travel Tip
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed">{data.aiTip}</p>
                        </motion.div>

                        {/* Actions */}
                        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.36 }}
                            className="grid grid-cols-2 gap-3 pb-4">
                            <button
                                onClick={handleFlyTo}
                                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                🗺️ Fly There
                            </button>
                            <button className="px-4 py-3 border border-purple-500/40 text-purple-300 rounded-xl font-semibold text-sm hover:bg-purple-500/10 transition-all">
                                ❤️ Save Destination
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
