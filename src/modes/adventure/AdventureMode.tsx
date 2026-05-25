import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMapStore } from '../../store/mapStore';

// ── Trail data ─────────────────────────────────────────────────────────────────
interface Trail {
    name: string;
    country: string;
    distance: number;
    elevationGain: number;
    difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert';
    duration: string;
    coords: [number, number];
    type: string;
    elevation: number[];  // elevation profile (40 points)
}

const TRAILS: Trail[] = [
    {
        name: 'Inca Trail to Machu Picchu', country: 'Peru', distance: 43, elevationGain: 1200,
        difficulty: 'Hard', duration: '4 days', coords: [-72.545, -13.163], type: 'Historical Trek',
        elevation: [2700,2800,2900,3100,3300,3500,3700,3900,4100,4200,4300,4100,3900,3700,3500,3200,3000,2800,2700,2600,2500,2450,2600,2800,3000,3100,3200,3100,3000,2900,2800,2700,2600,2500,2450,2430,2420,2410,2405,2430],
    },
    {
        name: 'Everest Base Camp Trek', country: 'Nepal', distance: 130, elevationGain: 3800,
        difficulty: 'Expert', duration: '12–14 days', coords: [86.925, 27.988], type: 'High Altitude',
        elevation: [2860,3000,3200,3400,3600,3800,4000,4200,4300,4400,4550,4700,4900,5100,5200,5100,5000,4900,5100,5300,5400,5380,5360,5340,5330,5310,5300,5290,5280,5270,5260,5250,5240,5230,5220,5210,5200,5190,5180,5364],
    },
    {
        name: 'Tour du Mont Blanc', country: 'France/Italy/Switzerland', distance: 170, elevationGain: 10000,
        difficulty: 'Hard', duration: '11 days', coords: [6.865, 45.922], type: 'Alpine Circuit',
        elevation: [1035,1200,1500,1800,2100,2400,2500,2300,2100,1900,1700,1500,1800,2000,2200,2100,1900,1700,1500,1800,2100,2300,2200,2000,1800,1600,1900,2200,2400,2200,2000,1800,1600,1900,2100,2300,2100,1900,1700,1035],
    },
    {
        name: 'Camino de Santiago', country: 'Spain', distance: 800, elevationGain: 12000,
        difficulty: 'Moderate', duration: '30 days', coords: [-3.709, 40.416], type: 'Pilgrimage',
        elevation: [800,900,1000,1100,950,800,700,600,750,850,900,850,800,750,700,650,600,700,800,750,700,650,600,550,500,550,600,550,500,450,400,350,300,280,260,240,220,200,180,100],
    },
    {
        name: 'Overland Track, Tasmania', country: 'Australia', distance: 65, elevationGain: 2000,
        difficulty: 'Moderate', duration: '6 days', coords: [146.07, -41.65], type: 'Wilderness',
        elevation: [740,800,900,950,1000,1100,1200,1100,1000,900,800,750,700,800,900,1000,1100,1200,1100,1000,900,800,750,700,650,600,700,800,750,700,650,600,550,500,550,600,620,610,600,740],
    },
];

const DIFFICULTY_COLORS: Record<string, string> = {
    Easy: 'text-green-400 bg-green-400/10 border-green-400/30',
    Moderate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    Hard: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    Expert: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-white shadow-xl">
            {payload[0].value} m
        </div>
    );
};

export const AdventureMode: React.FC = () => {
    const [selected, setSelected] = useState<Trail>(TRAILS[0]);
    const { mapInstance, toggleGlobeMode } = useMapStore();

    const handleTrailSelect = (trail: Trail) => {
        setSelected(trail);
        toggleGlobeMode(false);
        mapInstance?.flyTo({ center: trail.coords, zoom: 9, pitch: 60, duration: 2000 });
    };

    const elevData = selected.elevation.map((e, i) => ({ km: Math.round((i / selected.elevation.length) * selected.distance), elev: e }));

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
                <div className="bg-gradient-to-r from-orange-700/70 to-amber-700/70 px-4 py-3 flex items-center gap-2">
                    <span className="text-xl">🥾</span>
                    <h2 className="text-white font-bold text-sm">Adventure Mode</h2>
                    <span className="ml-auto text-orange-200 text-xs">Komoot-style</span>
                </div>

                {/* Selected trail stats */}
                <div className="p-4 space-y-3">
                    <div>
                        <p className="text-white font-bold text-sm">{selected.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">📍 {selected.country} · {selected.type}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Distance', value: `${selected.distance} km`, icon: '📏' },
                            { label: 'Gain', value: `+${selected.elevationGain}m`, icon: '⛰️' },
                            { label: 'Duration', value: selected.duration, icon: '⏱️' },
                        ].map((s) => (
                            <div key={s.label} className="bg-slate-800/60 rounded-xl p-2.5 text-center border border-white/5">
                                <p className="text-base">{s.icon}</p>
                                <p className="text-white font-bold text-xs mt-1">{s.value}</p>
                                <p className="text-slate-500 text-[10px]">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${DIFFICULTY_COLORS[selected.difficulty]}`}>
                        {selected.difficulty === 'Expert' ? '💀' : selected.difficulty === 'Hard' ? '🔴' : selected.difficulty === 'Moderate' ? '🟡' : '🟢'} {selected.difficulty}
                    </span>

                    {/* Elevation chart */}
                    <div>
                        <p className="text-slate-400 text-xs mb-2">Elevation Profile</p>
                        <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={elevData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <defs>
                                        <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="km" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone" dataKey="elev"
                                        stroke="#8b5cf6" strokeWidth={2}
                                        fill="url(#elevGrad)"
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => handleTrailSelect(selected)}
                        className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
                    >
                        🗺️ View on Map
                    </motion.button>
                </div>
            </div>

            {/* Trail list */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-white font-semibold text-sm">🌍 World's Best Trails</p>
                </div>
                <div className="divide-y divide-slate-800/60">
                    {TRAILS.map((trail) => (
                        <motion.button
                            key={trail.name}
                            whileHover={{ backgroundColor: 'rgba(139,92,246,0.08)', x: 2 }}
                            onClick={() => handleTrailSelect(trail)}
                            className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors ${selected.name === trail.name ? 'bg-purple-500/10' : ''}`}
                        >
                            <span className="text-xl shrink-0 mt-0.5">🥾</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${selected.name === trail.name ? 'text-purple-300' : 'text-white'}`}>{trail.name}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{trail.distance}km · {trail.duration}</p>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${DIFFICULTY_COLORS[trail.difficulty]}`}>
                                {trail.difficulty}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
