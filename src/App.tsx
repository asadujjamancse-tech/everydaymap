/**
 * App.tsx — Root Application Component
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the top-level component rendered by main.tsx.
 *
 * Responsibilities:
 *  1. Show an animated splash/loading screen while the app initialises.
 *  2. Once loading is done, render the main <Map /> layout and the floating
 *     <RouteBuilder /> button (bottom-left).
 *
 * Component tree:
 *   App
 *   ├── LoadingScreen   (shown first, fades out after ~2s)
 *   ├── Map             (full-screen map shell + all panels)
 *   └── RouteBuilder    (floating ✈️ button, bottom-left)
 *
 * Note: RouteBuilder sits outside <Map> so its z-index stacks above everything.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map } from './components/Map';
import { RouteBuilder } from './components/RouteBuilder';
import './App.css';

// ── Loading screen taglines ───────────────────────────────────────────────────
// These lines appear one-by-one while the app boots.
const TAGLINES = [
    'Initializing AI travel intelligence…',
    'Loading real-world map data…',
    'Calibrating globe renderer…',
    'Ready for liftoff.',
];

// ── LoadingScreen ─────────────────────────────────────────────────────────────
/**
 * Full-screen animated splash shown before the map loads.
 * Calls `onDone` after all taglines have appeared (~2 seconds).
 */
function LoadingScreen({ onDone }: { onDone: () => void }) {
    const [line, setLine] = useState(0);   // which tagline is currently active

    useEffect(() => {
        // Reveal each tagline 500 ms apart
        const timers = TAGLINES.map((_, i) =>
            setTimeout(() => setLine(i), i * 500)
        );
        // Signal the parent that loading is complete
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
            {/* ── Spinning logo rings ────────────────────────────────────── */}
            <div className="relative mb-10">
                {/* Outer ring — rotates clockwise */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="w-28 h-28 rounded-full border-2 border-transparent"
                    style={{ borderTopColor: '#8b5cf6', borderRightColor: '#3b82f6' }}
                />
                {/* Inner ring — rotates counter-clockwise */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-3 rounded-full border-2 border-transparent"
                    style={{ borderTopColor: '#06b6d4', borderLeftColor: '#8b5cf6' }}
                />
                {/* Globe emoji centred inside rings */}
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🌍</div>
            </div>

            {/* ── App name & subtitle ────────────────────────────────────── */}
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

            {/* ── Sequential taglines ────────────────────────────────────── */}
            <div className="space-y-1.5 text-center h-24">
                {TAGLINES.map((t, i) => (
                    <motion.p
                        key={t}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: i <= line ? 1 : 0, x: i <= line ? 0 : -8 }}
                        className={`text-xs font-mono ${i === line ? 'text-purple-300' : 'text-slate-600'}`}
                    >
                        {/* ✓ = done, ▶ = current, space = not yet reached */}
                        {i < line ? '✓ ' : i === line ? '▶ ' : '  '}{t}
                    </motion.p>
                ))}
            </div>

            {/* ── Progress bar ───────────────────────────────────────────── */}
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

// ── App (root) ────────────────────────────────────────────────────────────────
export default function App() {
    // `loading` controls whether we show the splash screen or the real map
    const [loading, setLoading] = useState(true);

    return (
        <div className="w-full h-screen bg-slate-950 overflow-hidden">

            {/* AnimatePresence lets LoadingScreen play its exit animation */}
            <AnimatePresence>
                {loading && <LoadingScreen onDone={() => setLoading(false)} />}
            </AnimatePresence>

            {/* Main app — mounted only after loading is complete */}
            {!loading && (
                <>
                    {/* Full-screen map shell with all UI panels */}
                    <Map />
                    {/* Floating route-builder button (bottom-left corner) */}
                    <RouteBuilder />
                </>
            )}
        </div>
    );
}
