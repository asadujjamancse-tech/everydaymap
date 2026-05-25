import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

interface Incident {
    id: string;
    type: 'accident' | 'closure' | 'hazard' | 'police' | 'congestion' | 'event';
    title: string;
    location: string;
    coords: [number, number];
    severity: 'low' | 'medium' | 'high';
    time: string;
    votes: number;
    emoji: string;
}

const INCIDENTS: Incident[] = [
    { id: '1', type: 'accident', title: 'Multi-car collision', location: 'Tokyo Expressway C2', coords: [139.70, 35.69], severity: 'high', time: '2m ago', votes: 34, emoji: '🚗' },
    { id: '2', type: 'closure', title: 'Road closure — festival', location: 'Champs-Élysées, Paris', coords: [2.31, 48.87], severity: 'medium', time: '15m ago', votes: 12, emoji: '🚧' },
    { id: '3', type: 'congestion', title: 'Heavy traffic jam', location: 'I-495 New York', coords: [-74.01, 40.71], severity: 'high', time: '5m ago', votes: 89, emoji: '🚦' },
    { id: '4', type: 'hazard', title: 'Flooding on road', location: 'Bangkok Sukhumvit', coords: [100.56, 13.74], severity: 'medium', time: '8m ago', votes: 27, emoji: '🌊' },
    { id: '5', type: 'police', title: 'Speed checkpoint', location: 'M25 London', coords: [-0.25, 51.48], severity: 'low', time: '20m ago', votes: 45, emoji: '🚔' },
    { id: '6', type: 'event', title: 'Marathon — road closed', location: 'Berlin Brandenburg Gate', coords: [13.38, 52.52], severity: 'medium', time: '1h ago', votes: 18, emoji: '🏃' },
    { id: '7', type: 'hazard', title: 'Pothole reported', location: 'Sydney CBD', coords: [151.21, -33.87], severity: 'low', time: '35m ago', votes: 7, emoji: '⚠️' },
    { id: '8', type: 'congestion', title: 'Rush hour buildup', location: 'Dubai Sheikh Zayed Rd', coords: [55.27, 25.20], severity: 'medium', time: '10m ago', votes: 52, emoji: '🚗' },
];

const SEVERITY_STYLES: Record<string, string> = {
    low: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    medium: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    high: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const TYPE_COLORS: Record<string, string> = {
    accident: '#ef4444', closure: '#f59e0b', hazard: '#f97316',
    police: '#3b82f6', congestion: '#ef4444', event: '#8b5cf6',
};

const ALERT_TICKERS = [
    '🚨 LIVE: Heavy traffic on Tokyo Expressway C2',
    '⚠️ ROAD CLOSURE: Champs-Élysées closed for festival until 22:00',
    '🚔 CHECKPOINT: Speed camera active M25 London Junction 12',
    '🌊 FLOODING: Sukhumvit Soi 11 partially flooded',
    '🚦 JAM: I-495 New York 45 min delay — seek alternate route',
];

export const CrowdMode: React.FC = () => {
    const [incidents, setIncidents] = useState<Incident[]>(INCIDENTS);
    const [filter, setFilter] = useState<string>('all');
    const [tickerIdx, setTickerIdx] = useState(0);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportType, setReportType] = useState<string>('accident');
    const [reportNote, setReportNote] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval>>();
    const { mapInstance, toggleGlobeMode } = useMapStore();

    // Rotate alert ticker
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setTickerIdx((p) => (p + 1) % ALERT_TICKERS.length);
        }, 4000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const handleFlyTo = (inc: Incident) => {
        toggleGlobeMode(false);
        mapInstance?.flyTo({ center: inc.coords, zoom: 13, pitch: 45, duration: 1800 });
    };

    const handleVote = (id: string) => {
        setIncidents((prev) => prev.map((inc) => inc.id === id ? { ...inc, votes: inc.votes + 1 } : inc));
    };

    const handleReport = () => {
        setSubmitted(true);
        setTimeout(() => { setSubmitted(false); setReportOpen(false); setReportNote(''); }, 2000);
    };

    const filtered = filter === 'all' ? incidents : incidents.filter((i) => i.type === filter);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
        >
            {/* Header */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-800/70 to-orange-800/70 px-4 py-3 flex items-center gap-2">
                    <span className="text-xl">🚨</span>
                    <h2 className="text-white font-bold text-sm">Live Crowd Alerts</h2>
                    <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-auto flex items-center gap-1 text-red-300 text-xs"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                        LIVE
                    </motion.span>
                </div>

                {/* Ticker */}
                <div className="bg-slate-950/60 px-4 py-2 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={tickerIdx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="text-orange-300 text-xs font-medium truncate"
                        >
                            {ALERT_TICKERS[tickerIdx]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Stats */}
                <div className="px-4 py-3 grid grid-cols-3 gap-2">
                    {[
                        { label: 'Active', value: incidents.length, color: 'text-red-400' },
                        { label: 'High', value: incidents.filter((i) => i.severity === 'high').length, color: 'text-orange-400' },
                        { label: 'Reports', value: incidents.reduce((s, i) => s + i.votes, 0), color: 'text-purple-400' },
                    ].map((s) => (
                        <div key={s.label} className="bg-slate-800/60 rounded-xl p-2 text-center border border-white/5">
                            <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                            <p className="text-slate-500 text-[10px]">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Type filter */}
                <div className="px-3 pb-3 flex gap-1.5 overflow-x-auto scrollbar-none">
                    {['all', 'accident', 'congestion', 'hazard', 'police', 'closure', 'event'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                filter === t
                                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border-transparent'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-red-500/40'
                            }`}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Incidents list */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <p className="text-white font-semibold text-sm">Incidents ({filtered.length})</p>
                    <button
                        onClick={() => setReportOpen(true)}
                        className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-300 rounded-full text-xs font-semibold hover:bg-red-600/30 transition"
                    >
                        + Report
                    </button>
                </div>
                <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-red-900">
                    {filtered.map((inc) => (
                        <motion.div
                            key={inc.id}
                            layout
                            className="px-4 py-3"
                        >
                            <div className="flex items-start gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    onClick={() => handleFlyTo(inc)}
                                    className="text-xl shrink-0 mt-0.5 hover:scale-110 transition-transform"
                                >
                                    {inc.emoji}
                                </motion.button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-white text-sm font-medium truncate">{inc.title}</p>
                                        <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${SEVERITY_STYLES[inc.severity]}`}>
                                            {inc.severity.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-xs truncate">📍 {inc.location}</p>
                                    <p className="text-slate-600 text-[11px] mt-0.5">{inc.time}</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => handleVote(inc.id)}
                                    className="shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 bg-slate-800/60 rounded-lg border border-white/5 hover:border-orange-500/30 transition-all"
                                >
                                    <span className="text-orange-400 text-xs">▲</span>
                                    <span className="text-white text-[11px] font-bold">{inc.votes}</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Report modal */}
            <AnimatePresence>
                {reportOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-orange-500/30 shadow-2xl overflow-hidden"
                    >
                        <div className="px-4 py-3 bg-gradient-to-r from-orange-800/50 to-red-800/50 flex items-center justify-between">
                            <p className="text-white font-bold text-sm">🚨 Report Incident</p>
                            <button onClick={() => setReportOpen(false)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
                        </div>
                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="p-6 flex flex-col items-center gap-2"
                            >
                                <span className="text-4xl">✅</span>
                                <p className="text-green-400 font-bold">Report submitted!</p>
                                <p className="text-slate-400 text-xs">Thank you for keeping roads safe.</p>
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
                                        <button
                                            key={t.type}
                                            onClick={() => setReportType(t.type)}
                                            className={`py-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                                                reportType === t.type
                                                    ? 'bg-orange-600/30 border-orange-500/50 text-orange-300'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}
                                        >
                                            <span className="text-lg">{t.emoji}</span>
                                            <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={reportNote}
                                    onChange={(e) => setReportNote(e.target.value)}
                                    placeholder="Additional details (optional)..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-slate-800 rounded-xl text-white text-sm border border-slate-700 focus:border-orange-500 focus:outline-none placeholder:text-slate-500 resize-none"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={handleReport}
                                    className="w-full py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold text-sm"
                                >
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
