import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

interface HiddenGem {
    name: string;
    country: string;
    coords: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
    description: string;
    tags: string[];
    emoji: string;
}

const HIDDEN_GEMS: HiddenGem[] = [
    { name: 'Zhangjiajie', country: 'China', coords: [110.47, 29.11], zoom: 12, pitch: 70, bearing: 45, description: 'Floating mountains that inspired Avatar. Ancient forest pillars rising from the clouds.', tags: ['Nature','UNESCO','Avatar'], emoji: '🏔️' },
    { name: 'Pamukkale', country: 'Turkey', coords: [29.12, 37.92], zoom: 13, pitch: 60, bearing: 180, description: 'Cotton Castle — white terraced thermal pools cascading down the hillside.', tags: ['Thermal','UNESCO','Surreal'], emoji: '🏛️' },
    { name: 'Glowworm Caves', country: 'New Zealand', coords: [175.15, -37.98], zoom: 12, pitch: 45, bearing: 0, description: 'Underground caves illuminated by thousands of bioluminescent glowworms.', tags: ['Underground','Bioluminescence','Unique'], emoji: '✨' },
    { name: 'Socotra Island', country: 'Yemen', coords: [53.85, 12.46], zoom: 10, pitch: 50, bearing: 90, description: 'The Galápagos of the Indian Ocean — alien landscape with Dragon Blood trees.', tags: ['Alien','Biodiversity','Untouched'], emoji: '🌿' },
    { name: 'Salar de Uyuni', country: 'Bolivia', coords: [-67.48, -20.13], zoom: 9, pitch: 55, bearing: 30, description: "The world's largest salt flat creates a perfect mirror of the sky.', tags: ['Mirror','Salt Flat','Surreal'], emoji: '🪞'", tags: ['Mirror','Salt Flat','Surreal'], emoji: '🪞' },
    { name: 'Antelope Canyon', country: 'USA', coords: [-111.37, 36.86], zoom: 14, pitch: 70, bearing: 0, description: 'Slot canyon carved by wind and water into undulating waves of orange sandstone.', tags: ['Slot Canyon','Photography','Sacred'], emoji: '🌅' },
    { name: 'Trolltunga', country: 'Norway', coords: [6.74, 60.12], zoom: 12, pitch: 65, bearing: 270, description: 'Troll\'s Tongue — a rock formation jutting horizontally 700m above Lake Ringedalsvatnet.', tags: ['Hiking','Fjord','Extreme'], emoji: '👅' },
    { name: 'Meteora', country: 'Greece', coords: [21.63, 39.72], zoom: 12, pitch: 60, bearing: 120, description: 'Ancient Orthodox monasteries perched on top of towering natural rock pillars.', tags: ['Monasteries','Rock Pillars','Spiritual'], emoji: '⛪' },
    { name: 'Waitomo Glowworm Caves', country: 'New Zealand', coords: [175.10, -38.26], zoom: 13, pitch: 40, bearing: 0, description: 'Mystical underground river cave lit by thousands of blue glowworms.', tags: ['Cave','Glowworms','Magical'], emoji: '🌌' },
    { name: 'Cappadocia', country: 'Turkey', coords: [34.85, 38.64], zoom: 11, pitch: 50, bearing: 200, description: 'Fairy chimney rock formations with ancient cave dwellings — balloon capital of the world.', tags: ['Balloons','Cave Homes','Ancient'], emoji: '🎈' },
    { name: 'Fly Geyser', country: 'USA', coords: [-119.33, 40.86], zoom: 14, pitch: 55, bearing: 0, description: 'Accidental man-made geyser that has grown into a psychedelic technicolor wonder.', tags: ['Geyser','Accidental','Colorful'], emoji: '💦' },
    { name: 'Ha Long Bay', country: 'Vietnam', coords: [107.05, 20.91], zoom: 10, pitch: 60, bearing: 45, description: 'Thousands of limestone islands rising from emerald green waters of the Gulf of Tonkin.', tags: ['Islands','Limestone','UNESCO'], emoji: '⛵' },
];

export const ImmersiveMode: React.FC = () => {
    const [isExploring, setIsExploring] = useState(false);
    const [currentGem, setCurrentGem] = useState<HiddenGem | null>(null);
    const [gemIndex, setGemIndex] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particleRef = useRef<number>();
    const intervalRef = useRef<ReturnType<typeof setInterval>>();
    const { mapInstance, toggleGlobeMode } = useMapStore();

    const flyToGem = useCallback((gem: HiddenGem) => {
        setCurrentGem(gem);
        toggleGlobeMode(false);
        mapInstance?.flyTo({
            center: gem.coords,
            zoom: gem.zoom,
            pitch: gem.pitch,
            bearing: gem.bearing,
            duration: 3500,
            essential: true,
        });
    }, [mapInstance, toggleGlobeMode]);

    // Cinematic particle canvas
    useEffect(() => {
        if (!isExploring || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; color: string }[] = [];
        const colors = ['rgba(139,92,246,', 'rgba(59,130,246,', 'rgba(6,182,212,'];
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 2 + 0.5,
                a: Math.random(),
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.x += p.vx; p.y += p.vy;
                p.a = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * 0.001 + p.r));
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color + p.a.toFixed(2) + ')';
                ctx.fill();
            });
            particleRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => { if (particleRef.current) cancelAnimationFrame(particleRef.current); };
    }, [isExploring]);

    // Auto-tour
    useEffect(() => {
        if (!isExploring) return;
        const first = HIDDEN_GEMS[0];
        setGemIndex(0);
        flyToGem(first);

        intervalRef.current = setInterval(() => {
            setGemIndex((prev) => {
                const next = (prev + 1) % HIDDEN_GEMS.length;
                flyToGem(HIDDEN_GEMS[next]);
                return next;
            });
        }, 7000);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isExploring, flyToGem]);

    const stopExploring = () => {
        setIsExploring(false);
        setCurrentGem(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const surpriseMe = () => {
        const gem = HIDDEN_GEMS[Math.floor(Math.random() * HIDDEN_GEMS.length)];
        setCurrentGem(gem);
        flyToGem(gem);
    };

    return (
        <>
            {/* Particle overlay (behind UI) */}
            {isExploring && (
                <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" style={{ mixBlendMode: 'screen' }} />
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-3"
            >
                {/* Control panel */}
                <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-800/70 to-pink-800/70 px-4 py-3 flex items-center gap-2">
                        <span className="text-xl">🎮</span>
                        <h2 className="text-white font-bold text-sm">Immersive Explorer</h2>
                        <span className="ml-auto text-pink-200 text-xs">GTA-style</span>
                    </div>

                    <div className="p-4 space-y-3">
                        {!isExploring ? (
                            <>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Cinematic auto-tour through 12 hidden gems around the world. Sit back and explore.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsExploring(true)}
                                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                                >
                                    🎬 Start Cinematic Tour
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={surpriseMe}
                                    className="w-full py-2.5 bg-slate-800 border border-purple-500/30 text-purple-300 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-all"
                                >
                                    🎲 Surprise Me
                                </motion.button>
                            </>
                        ) : (
                            <>
                                {/* Progress indicator */}
                                <div className="flex gap-1.5 flex-wrap">
                                    {HIDDEN_GEMS.map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ scale: i === gemIndex ? 1.3 : 1 }}
                                            className={`w-2 h-2 rounded-full transition-colors ${
                                                i === gemIndex ? 'bg-violet-400' : i < gemIndex ? 'bg-purple-600' : 'bg-slate-700'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={stopExploring}
                                    className="w-full py-2.5 bg-red-900/40 border border-red-500/30 text-red-300 rounded-xl font-semibold text-sm hover:bg-red-900/60 transition-all"
                                >
                                    ⏹ Stop Tour
                                </motion.button>
                            </>
                        )}
                    </div>
                </div>

                {/* Current discovery card */}
                <AnimatePresence mode="wait">
                    {currentGem && (
                        <motion.div
                            key={currentGem.name}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-violet-500/30 shadow-2xl overflow-hidden"
                        >
                            <div className="bg-gradient-to-br from-violet-900/60 to-pink-900/40 p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-4xl">{currentGem.emoji}</span>
                                    <div>
                                        <p className="text-white font-bold">{currentGem.name}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">📍 {currentGem.country}</p>
                                    </div>
                                    <span className="ml-auto text-xs bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-full px-2.5 py-1">
                                        Hidden Gem
                                    </span>
                                </div>
                                <p className="text-slate-300 text-sm mt-3 leading-relaxed">{currentGem.description}</p>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {currentGem.tags.map((tag) => (
                                        <span key={tag} className="px-2 py-0.5 bg-slate-800/60 text-slate-400 rounded-md text-[11px]">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hidden gems grid */}
                {!isExploring && (
                    <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-800">
                            <p className="text-white font-semibold text-sm">🌍 Hidden Gems Library</p>
                        </div>
                        <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-800">
                            {HIDDEN_GEMS.map((gem) => (
                                <motion.button
                                    key={gem.name}
                                    whileHover={{ x: 3, backgroundColor: 'rgba(139,92,246,0.08)' }}
                                    onClick={() => flyToGem(gem)}
                                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors"
                                >
                                    <span className="text-lg">{gem.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{gem.name}</p>
                                        <p className="text-slate-500 text-xs">{gem.country}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-600">{gem.tags[0]}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </>
    );
};
