/**
 * TravelIntelligenceMode.tsx — AI Travel Intelligence Sidebar Panel
 * The ✈️ Intelligence mode panel shown in the left sidebar.
 * Displays AI-generated travel tips, country insights, budget recommendations,
 * and best-time-to-visit guidance based on the currently selected country.
 * Reads `selectedCountry` and `aiContext` from the store.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

interface CountryIntel {
    name: string;
    flag: string;
    coords: [number, number];
    costPerDay: number;
    nomadScore: number;
    safetyScore: number;
    visaFree: string[];
    visaOnArrival: string[];
    climate: string;
    internet: number;
    coworking: number;
    bestMonths: string;
    currency: string;
    language: string;
    timezone: string;
    highlight: string;
    itinerary: string[];
}

const INTEL: CountryIntel[] = [
    {
        name: 'Thailand', flag: '🇹🇭', coords: [100.5018, 13.7563],
        costPerDay: 45, nomadScore: 88, safetyScore: 74,
        visaFree: ['UK', 'EU', 'USA', 'AUS'],
        visaOnArrival: ['India', 'China', 'Russia'],
        climate: 'Tropical', internet: 68, coworking: 85,
        bestMonths: 'Nov – Feb', currency: 'THB ฿', language: 'Thai', timezone: 'UTC+7',
        highlight: 'Affordable paradise with incredible food, temples & beaches',
        itinerary: ['Day 1-2: Bangkok temples & street food', 'Day 3-4: Chiang Mai night markets', 'Day 5-7: Krabi islands & snorkeling'],
    },
    {
        name: 'Japan', flag: '🇯🇵', coords: [139.6917, 35.6895],
        costPerDay: 120, nomadScore: 79, safetyScore: 98,
        visaFree: ['USA', 'UK', 'EU', 'AUS', 'Canada'],
        visaOnArrival: [],
        climate: 'Temperate', internet: 93, coworking: 72,
        bestMonths: 'Mar – May, Sep – Nov', currency: 'JPY ¥', language: 'Japanese', timezone: 'UTC+9',
        highlight: 'Ultra-safe, hyper-efficient — the world\'s most unique cultural experience',
        itinerary: ['Day 1-3: Tokyo — Shibuya & Akihabara', 'Day 4-5: Kyoto temples & Arashiyama', 'Day 6-7: Osaka food & Nara deer'],
    },
    {
        name: 'Portugal', flag: '🇵🇹', coords: [-9.1393, 38.7223],
        costPerDay: 70, nomadScore: 91, safetyScore: 89,
        visaFree: ['EU', 'USA', 'UK', 'AUS', 'Canada'],
        visaOnArrival: [],
        climate: 'Mediterranean', internet: 82, coworking: 90,
        bestMonths: 'Apr – Oct', currency: 'EUR €', language: 'Portuguese', timezone: 'UTC+0',
        highlight: 'Europe\'s digital nomad capital — NHR tax regime & vibrant startup scene',
        itinerary: ['Day 1-2: Lisbon historic trams & pastéis', 'Day 3-4: Sintra palaces day trip', 'Day 5-7: Porto wine cellars & Douro valley'],
    },
    {
        name: 'Colombia', flag: '🇨🇴', coords: [-74.0721, 4.7110],
        costPerDay: 38, nomadScore: 78, safetyScore: 58,
        visaFree: ['USA', 'EU', 'UK', 'AUS'],
        visaOnArrival: [],
        climate: 'Tropical (varied)', internet: 62, coworking: 74,
        bestMonths: 'Dec – Mar, Jul – Aug', currency: 'COP $', language: 'Spanish', timezone: 'UTC-5',
        highlight: 'Eternal spring in Medellín, Caribbean coast, Amazon edge — rapidly rising nomad hub',
        itinerary: ['Day 1-2: Medellín cable cars & communes', 'Day 3-4: Coffee region (Salento)', 'Day 5-7: Cartagena old city & beaches'],
    },
    {
        name: 'Indonesia (Bali)', flag: '🇮🇩', coords: [115.0920, -8.3405],
        costPerDay: 42, nomadScore: 87, safetyScore: 73,
        visaFree: ['Most countries 30 days'],
        visaOnArrival: ['USA', 'EU', 'AUS', 'UK'],
        climate: 'Tropical', internet: 58, coworking: 88,
        bestMonths: 'Apr – Oct', currency: 'IDR Rp', language: 'Indonesian/Balinese', timezone: 'UTC+8',
        highlight: 'Spiritual surf paradise — world\'s densest digital nomad community in Canggu & Ubud',
        itinerary: ['Day 1-2: Canggu surf & cafes', 'Day 3-4: Ubud rice terraces & temples', 'Day 5-7: Nusa Penida cliff beaches'],
    },
    {
        name: 'Vietnam', flag: '🇻🇳', coords: [105.8342, 21.0278],
        costPerDay: 30, nomadScore: 80, safetyScore: 78,
        visaFree: ['Some ASEAN nations'],
        visaOnArrival: ['USA', 'EU', 'UK', 'AUS', 'Canada'],
        climate: 'Tropical (varied N–S)', internet: 60, coworking: 76,
        bestMonths: 'Sep – Apr (varies by region)', currency: 'VND ₫', language: 'Vietnamese', timezone: 'UTC+7',
        highlight: 'Cheapest quality-of-life in Asia — incredible cuisine, Ha Long Bay, ancient Hội An',
        itinerary: ['Day 1-2: Hanoi Old Quarter', 'Day 3-4: Ha Long Bay cruise', 'Day 5-7: Hội An lantern town & beach'],
    },
];

type TabId = 'overview' | 'visa' | 'nomad' | 'itinerary';

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '🌐' },
    { id: 'visa', label: 'Visa', icon: '🛂' },
    { id: 'nomad', label: 'Nomad', icon: '💻' },
    { id: 'itinerary', label: 'AI Trip', icon: '✈️' },
];

const ScoreBar: React.FC<{ value: number; max?: number; color: string; delay?: number }> = ({
    value, max = 100, color, delay = 0,
}) => (
    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${(value / max) * 100}%` }}
            transition={{ duration: 0.7, delay, ease: 'easeOut' }}
        />
    </div>
);

export const TravelIntelligenceMode: React.FC = () => {
    const [selected, setSelected] = useState<CountryIntel>(INTEL[0]);
    const [tab, setTab] = useState<TabId>('overview');
    const { mapInstance, toggleGlobeMode } = useMapStore();

    const handleSelect = (c: CountryIntel) => {
        setSelected(c);
        toggleGlobeMode(false);
        mapInstance?.flyTo({ center: c.coords, zoom: 5, pitch: 35, duration: 2000 });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
        >
            {/* Header */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-800/70 to-violet-800/70 px-4 py-3 flex items-center gap-2">
                    <span className="text-xl">✈️</span>
                    <h2 className="text-white font-bold text-sm">Travel Intelligence</h2>
                    <span className="ml-auto text-indigo-200 text-xs">NomadList-style</span>
                </div>

                {/* Country selector */}
                <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none">
                    {INTEL.map((c) => (
                        <motion.button
                            key={c.name}
                            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                            onClick={() => handleSelect(c)}
                            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                selected.name === c.name
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-purple-500/40'
                            }`}
                        >
                            <span>{c.flag}</span>
                            <span className="hidden sm:inline">{c.name.split(' ')[0]}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Tab bar */}
                <div className="flex border-t border-slate-800">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 py-2 text-[11px] font-semibold transition-all ${
                                tab === t.id ? 'text-purple-300 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab + selected.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="p-4"
                    >
                        {tab === 'overview' && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-4xl">{selected.flag}</span>
                                    <div>
                                        <p className="text-white font-bold">{selected.name}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">{selected.language} · {selected.timezone}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-green-400 font-bold text-sm">${selected.costPerDay}</p>
                                        <p className="text-slate-500 text-[10px]">per day</p>
                                    </div>
                                </div>
                                <p className="text-slate-300 text-xs leading-relaxed">{selected.highlight}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Currency', value: selected.currency, icon: '💱' },
                                        { label: 'Best Time', value: selected.bestMonths, icon: '📅' },
                                        { label: 'Climate', value: selected.climate, icon: '🌤️' },
                                        { label: 'Internet', value: `${selected.internet}/100`, icon: '📶' },
                                    ].map((s) => (
                                        <div key={s.label} className="bg-slate-800/60 rounded-xl p-2.5 border border-white/5">
                                            <p className="text-slate-500 text-[10px]">{s.icon} {s.label}</p>
                                            <p className="text-white text-xs font-semibold mt-0.5">{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Safety', value: selected.safetyScore, color: '#10b981' },
                                        { label: 'Nomad Score', value: selected.nomadScore, color: '#8b5cf6' },
                                        { label: 'Internet', value: selected.internet, color: '#3b82f6' },
                                        { label: 'Coworking', value: selected.coworking, color: '#06b6d4' },
                                    ].map((s, i) => (
                                        <div key={s.label}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-slate-400 text-[11px]">{s.label}</span>
                                                <span className="text-slate-300 text-[11px] font-semibold">{s.value}/100</span>
                                            </div>
                                            <ScoreBar value={s.value} color={s.color} delay={i * 0.08} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === 'visa' && (
                            <div className="space-y-3">
                                <p className="text-slate-400 text-xs">Entry requirements for {selected.name}</p>
                                <div>
                                    <p className="text-green-400 text-xs font-semibold mb-2">✅ Visa Free</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selected.visaFree.map((v) => (
                                            <span key={v} className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-300 rounded-full text-[11px]">{v}</span>
                                        ))}
                                        {selected.visaFree.length === 0 && <span className="text-slate-500 text-xs">None</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-amber-400 text-xs font-semibold mb-2">🟡 Visa on Arrival</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selected.visaOnArrival.map((v) => (
                                            <span key={v} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-[11px]">{v}</span>
                                        ))}
                                        {selected.visaOnArrival.length === 0 && <span className="text-slate-500 text-xs">None listed</span>}
                                    </div>
                                </div>
                                <div className="bg-slate-800/60 rounded-xl p-3 border border-white/5">
                                    <p className="text-slate-400 text-[11px] leading-relaxed">
                                        ⚠️ Visa rules change frequently. Always verify with the official embassy or consulate before travel.
                                    </p>
                                </div>
                            </div>
                        )}

                        {tab === 'nomad' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-white font-bold text-2xl">{selected.nomadScore}<span className="text-slate-500 text-sm font-normal">/100</span></p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        selected.nomadScore >= 85 ? 'text-green-300 bg-green-500/10 border-green-500/30'
                                        : selected.nomadScore >= 70 ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                                        : 'text-red-300 bg-red-500/10 border-red-500/30'
                                    }`}>
                                        {selected.nomadScore >= 85 ? 'Excellent' : selected.nomadScore >= 70 ? 'Good' : 'Fair'}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs">Nomad Score for {selected.name}</p>
                                <div className="space-y-2.5">
                                    {[
                                        { label: '💰 Cost of Living', value: Math.round(100 - (selected.costPerDay / 2)), note: `$${selected.costPerDay}/day` },
                                        { label: '🛡️ Safety', value: selected.safetyScore, note: `${selected.safetyScore}/100` },
                                        { label: '📶 Internet Speed', value: selected.internet, note: `${selected.internet}/100` },
                                        { label: '🏢 Coworking Spaces', value: selected.coworking, note: `${selected.coworking}/100` },
                                        { label: '🌤️ Weather', value: selected.climate === 'Tropical' ? 78 : selected.climate === 'Mediterranean' ? 90 : 72, note: selected.climate },
                                    ].map((item, i) => (
                                        <div key={item.label}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-slate-400 text-[11px]">{item.label}</span>
                                                <span className="text-slate-400 text-[11px]">{item.note}</span>
                                            </div>
                                            <ScoreBar value={item.value} color="linear-gradient(90deg, #8b5cf6, #06b6d4)" delay={i * 0.07} />
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                                    <p className="text-indigo-300 text-[11px]">📅 Best months: <span className="font-semibold text-white">{selected.bestMonths}</span></p>
                                </div>
                            </div>
                        )}

                        {tab === 'itinerary' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{selected.flag}</span>
                                    <p className="text-white font-bold text-sm">AI Itinerary — {selected.name}</p>
                                </div>
                                <p className="text-slate-400 text-xs">Suggested 7-day journey</p>
                                <div className="space-y-2">
                                    {selected.itinerary.map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex gap-3 items-start"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-violet-300 text-[10px] font-bold">{i + 1}</span>
                                            </div>
                                            <p className="text-slate-300 text-xs leading-relaxed flex-1">{item}</p>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="bg-slate-800/60 rounded-xl p-3 border border-white/5 mt-2">
                                    <p className="text-slate-400 text-[11px]">💰 Estimated budget: <span className="text-green-400 font-bold">${selected.costPerDay * 7} – ${Math.round(selected.costPerDay * 7 * 1.4)}</span> for 7 days</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Comparison quick-view */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-white font-semibold text-sm">🏆 Top Nomad Rankings</p>
                </div>
                <div className="divide-y divide-slate-800/60">
                    {[...INTEL].sort((a, b) => b.nomadScore - a.nomadScore).map((c, i) => (
                        <motion.button
                            key={c.name}
                            whileHover={{ x: 3, backgroundColor: 'rgba(139,92,246,0.08)' }}
                            onClick={() => handleSelect(c)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors"
                        >
                            <span className="text-slate-500 text-xs font-mono w-4 shrink-0">#{i + 1}</span>
                            <span className="text-lg shrink-0">{c.flag}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{c.name}</p>
                                <p className="text-slate-500 text-xs">${c.costPerDay}/day</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-purple-300 font-bold text-sm">{c.nomadScore}</p>
                                <p className="text-slate-600 text-[10px]">score</p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
