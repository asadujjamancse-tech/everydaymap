import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
    Cell,
} from 'recharts';

// ── Country analytics data ─────────────────────────────────────────────────────
const COUNTRY_DATA = [
    { name: 'Thailand',   budget: 35,  safety: 75, nomad: 82, food: 90, tourism: 88, internet: 65 },
    { name: 'Japan',      budget: 120, safety: 98, nomad: 78, food: 98, tourism: 95, internet: 92 },
    { name: 'Bali',       budget: 45,  safety: 72, nomad: 91, food: 88, tourism: 85, internet: 58 },
    { name: 'Vietnam',    budget: 28,  safety: 78, nomad: 80, food: 92, tourism: 80, internet: 60 },
    { name: 'Portugal',   budget: 75,  safety: 89, nomad: 88, food: 85, tourism: 82, internet: 80 },
    { name: 'Singapore',  budget: 160, safety: 97, nomad: 85, food: 96, tourism: 90, internet: 96 },
    { name: 'Colombia',   budget: 40,  safety: 55, nomad: 76, food: 80, tourism: 70, internet: 62 },
    { name: 'Iceland',    budget: 200, safety: 98, nomad: 70, food: 72, tourism: 88, internet: 88 },
];

const BAR_COLORS = ['#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#a855f7'];

type Metric = 'budget' | 'safety' | 'nomad' | 'food' | 'tourism' | 'internet';

const METRICS: { id: Metric; label: string; icon: string; unit?: string }[] = [
    { id: 'budget',   label: 'Daily Budget',     icon: '💰', unit: '$/day' },
    { id: 'safety',   label: 'Safety Score',     icon: '🛡️', unit: '/100' },
    { id: 'nomad',    label: 'Nomad Score',      icon: '💻', unit: '/100' },
    { id: 'food',     label: 'Food Scene',       icon: '🍜', unit: '/100' },
    { id: 'tourism',  label: 'Tourism Appeal',   icon: '🏖️', unit: '/100' },
    { id: 'internet', label: 'Internet Quality', icon: '📶', unit: '/100' },
];

const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
            <p className="font-bold mb-1">{label}</p>
            <p className="text-purple-300">{payload[0].name}: <span className="text-white">{payload[0].value}</span></p>
        </div>
    );
};

export const AnalyticsMode: React.FC = () => {
    const [metric, setMetric] = useState<Metric>('budget');
    const [view, setView] = useState<'bar' | 'radar'>('bar');

    const activeMetric = METRICS.find((m) => m.id === metric)!;
    const sorted = [...COUNTRY_DATA].sort((a, b) =>
        metric === 'budget' ? a[metric] - b[metric] : b[metric] - a[metric]
    );

    const radarData = METRICS.map((m) => ({
        subject: m.label.split(' ')[0],
        value: COUNTRY_DATA[0][m.id],
        max: 200,
    }));

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
                <div className="bg-gradient-to-r from-blue-800/70 to-cyan-800/70 px-4 py-3 flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h2 className="text-white font-bold text-sm">Travel Analytics</h2>
                    <span className="ml-auto text-cyan-200 text-xs">CARTO-style</span>
                </div>

                <div className="p-4 space-y-3">
                    {/* View toggle */}
                    <div className="flex gap-2 bg-slate-800 rounded-xl p-1">
                        {(['bar', 'radar'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    view === v ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-slate-400'
                                }`}
                            >
                                {v === 'bar' ? '📊 Bar Chart' : '🕸️ Radar'}
                            </button>
                        ))}
                    </div>

                    {/* Metric selector */}
                    <div className="grid grid-cols-3 gap-1.5">
                        {METRICS.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMetric(m.id)}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                                    metric === m.id
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent'
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-purple-500/40'
                                }`}
                            >
                                {m.icon} {m.label.split(' ')[0]}
                            </button>
                        ))}
                    </div>

                    {/* Chart */}
                    <div>
                        <p className="text-slate-400 text-xs mb-2">
                            {activeMetric.icon} {activeMetric.label} {activeMetric.unit && `(${activeMetric.unit})`}
                        </p>

                        {view === 'bar' ? (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={62} />
                                        <Tooltip content={<CustomBarTooltip />} />
                                        <Bar dataKey={metric} radius={[0, 4, 4, 0]} barSize={14}>
                                            {sorted.map((_, i) => (
                                                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={METRICS.map((m) => ({
                                        subject: m.icon + ' ' + m.label.split(' ')[0],
                                        Thailand: COUNTRY_DATA[0][m.id],
                                        Japan: COUNTRY_DATA[1][m.id],
                                    }))}>
                                        <PolarGrid stroke="#334155" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
                                        <Radar name="Thailand" dataKey="Thailand" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                                        <Radar name="Japan" dataKey="Japan" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rankings table */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <p className="text-white font-semibold text-sm">Country Rankings</p>
                    <p className="text-slate-500 text-xs">{activeMetric.icon} {activeMetric.label}</p>
                </div>
                <div className="divide-y divide-slate-800/60">
                    {sorted.map((c, i) => {
                        const val = c[metric];
                        const max = Math.max(...COUNTRY_DATA.map((x) => x[metric]));
                        const pct = (val / max) * 100;
                        return (
                            <div key={c.name} className="px-4 py-2.5 flex items-center gap-3">
                                <span className="text-slate-500 text-xs font-mono w-4 shrink-0">{i + 1}</span>
                                <span className="text-white text-sm flex-1">{c.name}</span>
                                <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ delay: i * 0.04, duration: 0.5 }}
                                        className="h-full rounded-full"
                                        style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                                    />
                                </div>
                                <span className="text-slate-400 text-xs w-10 text-right">{val}{activeMetric.unit === '$/day' ? '$' : ''}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
