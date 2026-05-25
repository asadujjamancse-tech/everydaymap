import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map } from './components/Map';
import { RouteBuilder } from './components/RouteBuilder';
import './App.css';

const TAGLINES = [
    'Initializing AI travel intelligence…',
    'Loading real-world map data…',
    'Calibrating globe renderer…',
    'Ready for liftoff.',
];

function LoadingScreen({ onDone }: { onDone: () => void }) {
    const [line, setLine] = useState(0);

    useEffect(() => {
        const timers = TAGLINES.map((_, i) =>
            setTimeout(() => setLine(i), i * 500)
        );
        const done = setTimeout(onDone, TAGLINES.length * 500 + 300);
        return () => { timers.forEach(clearTimeout); clearTimeout(done); };
    }, [onDone]);

    return (
        <motion.div
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950"
            style={{ background: 'radial-gradient(ellipse at center, #0d1530 0%, #020617 70%)' }}
        >
            {/* Animated logo ring */}
            <div className="relative mb-10">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="w-28 h-28 rounded-full border-2 border-transparent"
                    style={{ borderTopColor: '#8b5cf6', borderRightColor: '#3b82f6' }}
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-3 rounded-full border-2 border-transparent"
                    style={{ borderTopColor: '#06b6d4', borderLeftColor: '#8b5cf6' }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🌍</div>
            </div>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white mb-1 tracking-tight"
            >
                Travel Intelligence
            </motion.h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-purple-400 text-sm mb-8 tracking-widest uppercase"
            >
                AI-Powered World Explorer
            </motion.p>

            {/* Loading lines */}
            <div className="space-y-1.5 text-center h-24">
                {TAGLINES.map((t, i) => (
                    <motion.p
                        key={t}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: i <= line ? 1 : 0, x: i <= line ? 0 : -8 }}
                        className={`text-xs font-mono ${i === line ? 'text-purple-300' : 'text-slate-600'}`}
                    >
                        {i < line ? '✓ ' : i === line ? '▶ ' : '  '}{t}
                    </motion.p>
                ))}
            </div>

            {/* Progress bar */}
            <div className="w-56 h-0.5 bg-slate-800 rounded-full overflow-hidden mt-6">
                <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((line + 1) / TAGLINES.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>
        </motion.div>
    );
}

export default function App() {
    const [loading, setLoading] = useState(true);

    return (
        <div className="w-full h-screen bg-slate-950 overflow-hidden">
            <AnimatePresence>
                {loading && <LoadingScreen onDone={() => setLoading(false)} />}
            </AnimatePresence>

            {!loading && (
                <>
                    <Map />
                    <RouteBuilder />
                </>
            )}
        </div>
    );
}
