import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore, MapMode, MapStyle } from '../../store/mapStore';

interface Command {
    id: string;
    label: string;
    description: string;
    icon: string;
    group: string;
    action: () => void;
    keywords: string[];
}

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

const PLACES = [
    { name: 'Tokyo', coords: [139.6917, 35.6895] as [number, number], zoom: 11, flag: '🇯🇵' },
    { name: 'Paris', coords: [2.3522, 48.8566]   as [number, number], zoom: 11, flag: '🇫🇷' },
    { name: 'Dubai', coords: [55.2708, 25.2048]  as [number, number], zoom: 11, flag: '🇦🇪' },
    { name: 'Bali',  coords: [115.092, -8.3405]  as [number, number], zoom: 10, flag: '🇮🇩' },
    { name: 'NYC',   coords: [-74.006, 40.7128]  as [number, number], zoom: 11, flag: '🇺🇸' },
    { name: 'London',coords: [-0.1278, 51.5074]  as [number, number], zoom: 11, flag: '🇬🇧' },
    { name: 'Kyoto', coords: [135.768, 35.0116]  as [number, number], zoom: 12, flag: '🇯🇵' },
    { name: 'Bangkok', coords: [100.502, 13.756] as [number, number], zoom: 11, flag: '🇹🇭' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        setActiveMode, setMapStyle, toggleGlobeMode, toggleLayer,
        activeLayers, setShowPOI, mapInstance, setSelectedCountry, openPanel,
    } = useMapStore();

    const makeCommands = useCallback((): Command[] => [
        // Mode commands
        { id: 'm-globe',   label: 'Switch to Globe Mode',       description: 'Cinematic 3D Earth view',     icon: '🌍', group: 'Modes', keywords: ['globe', 'earth', '3d'], action: () => { setActiveMode('globe'); setMapStyle('dark'); toggleGlobeMode(true); onClose(); } },
        { id: 'm-nav',     label: 'Switch to Navigation Mode',  description: 'Driving & walking routes',    icon: '🚗', group: 'Modes', keywords: ['navigate', 'drive', 'route', 'directions'], action: () => { setActiveMode('navigation'); setMapStyle('navigation'); toggleGlobeMode(false); onClose(); } },
        { id: 'm-adv',     label: 'Switch to Adventure Mode',   description: 'Hiking trails & terrain',    icon: '🥾', group: 'Modes', keywords: ['adventure', 'hike', 'trail', 'trek'], action: () => { setActiveMode('adventure'); setMapStyle('terrain'); toggleGlobeMode(false); onClose(); } },
        { id: 'm-ana',     label: 'Switch to Analytics Mode',   description: 'Travel data & charts',       icon: '📊', group: 'Modes', keywords: ['analytics', 'data', 'chart', 'compare'], action: () => { setActiveMode('analytics'); setMapStyle('dark'); toggleGlobeMode(false); onClose(); } },
        { id: 'm-imm',     label: 'Switch to Immersive Mode',   description: 'Cinematic discovery tour',   icon: '🎮', group: 'Modes', keywords: ['immersive', 'explore', 'cinematic', 'gems'], action: () => { setActiveMode('immersive'); setMapStyle('satellite'); toggleGlobeMode(false); onClose(); } },
        { id: 'm-int',     label: 'Switch to Intelligence Mode',description: 'AI travel insights & nomad', icon: '✈️', group: 'Modes', keywords: ['intelligence', 'nomad', 'visa', 'itinerary', 'ai'], action: () => { setActiveMode('intelligence'); setMapStyle('dark'); toggleGlobeMode(false); onClose(); } },
        { id: 'm-sat',     label: 'Switch to Satellite Mode',   description: 'Aerial imagery',             icon: '🛰️', group: 'Modes', keywords: ['satellite', 'aerial', 'imagery'], action: () => { setActiveMode('satellite'); setMapStyle('satellite'); toggleGlobeMode(false); onClose(); } },
        { id: 'm-crowd',   label: 'Switch to Crowd Mode',       description: 'Live incidents & alerts',    icon: '🚨', group: 'Modes', keywords: ['crowd', 'traffic', 'incident', 'alerts', 'waze'], action: () => { setActiveMode('crowd'); setMapStyle('navigation'); toggleGlobeMode(false); onClose(); } },

        // Layer commands
        { id: 'l-budget',  label: 'Toggle Budget Layer',   description: 'Daily travel costs by country', icon: '💰', group: 'Layers', keywords: ['budget', 'cost', 'price'], action: () => { toggleLayer('budget'); onClose(); } },
        { id: 'l-safety',  label: 'Toggle Safety Layer',   description: 'Safety scores & advisories',   icon: '🛡️', group: 'Layers', keywords: ['safety', 'risk', 'advisory'], action: () => { toggleLayer('safety'); onClose(); } },
        { id: 'l-weather', label: 'Toggle Weather Layer',  description: 'Weather patterns',             icon: '🌤️', group: 'Layers', keywords: ['weather', 'climate', 'rain'], action: () => { toggleLayer('weather'); onClose(); } },
        { id: 'l-food',    label: 'Toggle Food Layer',     description: 'Culinary destinations',        icon: '🍜', group: 'Layers', keywords: ['food', 'eat', 'cuisine'], action: () => { toggleLayer('food'); onClose(); } },
        { id: 'l-nomad',   label: 'Toggle Nomad Layer',    description: 'Remote work hubs',             icon: '💻', group: 'Layers', keywords: ['nomad', 'remote', 'cowork'], action: () => { toggleLayer('nomad'); onClose(); } },
        { id: 'l-poi',     label: 'Toggle POI Overlay',    description: 'Points of interest',           icon: '📍', group: 'Layers', keywords: ['poi', 'places', 'points'], action: () => { setShowPOI(!(activeLayers as any).poi); onClose(); } },

        // Place commands
        ...PLACES.map((p) => ({
            id: `p-${p.name}`, label: `Fly to ${p.name}`, description: `Jump to ${p.name} on the map`, icon: p.flag, group: 'Places',
            keywords: [p.name.toLowerCase()],
            action: () => {
                toggleGlobeMode(false);
                setTimeout(() => {
                    mapInstance?.flyTo({ center: p.coords, zoom: p.zoom, duration: 2000, pitch: 45, essential: true });
                }, 300);
                setSelectedCountry(p.name);
                openPanel('country');
                onClose();
            },
        })),
    ], [setActiveMode, setMapStyle, toggleGlobeMode, toggleLayer, setShowPOI, activeLayers, mapInstance, setSelectedCountry, openPanel, onClose]);

    const commands = makeCommands();

    const filtered = query.trim().length > 0
        ? commands.filter((c) =>
            c.label.toLowerCase().includes(query.toLowerCase()) ||
            c.description.toLowerCase().includes(query.toLowerCase()) ||
            c.keywords.some((k) => k.includes(query.toLowerCase()))
          )
        : commands.slice(0, 12);

    // Group results
    const groups = filtered.reduce<Record<string, Command[]>>((acc, c) => {
        if (!acc[c.group]) acc[c.group] = [];
        acc[c.group].push(c);
        return acc;
    }, {});

    const flatList = Object.values(groups).flat();

    useEffect(() => {
        if (open) {
            setQuery('');
            setSelected(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => { setSelected(0); }, [query]);

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((p) => Math.min(p + 1, flatList.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((p) => Math.max(p - 1, 0)); }
        if (e.key === 'Enter')     { e.preventDefault(); flatList[selected]?.action(); }
        if (e.key === 'Escape')    { onClose(); }
    };

    // Keyboard shortcut to close
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                        className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[61] w-full max-w-xl"
                    >
                        <div className="bg-slate-900/98 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">

                            {/* Input */}
                            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                                <span className="text-slate-400 text-sm">🔍</span>
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder="Search modes, places, layers, commands…"
                                    className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none"
                                />
                                <kbd className="hidden sm:flex items-center px-2 py-1 bg-white/[0.06] border border-white/[0.08] rounded text-slate-500 text-[10px] font-mono">ESC</kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                {Object.entries(groups).length === 0 ? (
                                    <div className="px-4 py-8 text-center text-slate-500 text-sm">No results for "{query}"</div>
                                ) : (
                                    Object.entries(groups).map(([group, items]) => {
                                        const groupOffset = flatList.indexOf(items[0]);
                                        return (
                                            <div key={group}>
                                                <p className="px-4 pt-3 pb-1 text-slate-600 text-[10px] font-semibold uppercase tracking-wider">{group}</p>
                                                {items.map((cmd, localIdx) => {
                                                    const globalIdx = groupOffset + localIdx;
                                                    const isSelected = selected === globalIdx;
                                                    return (
                                                        <motion.button
                                                            key={cmd.id}
                                                            onClick={cmd.action}
                                                            onMouseEnter={() => setSelected(globalIdx)}
                                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                                                                isSelected ? 'bg-purple-600/20' : 'hover:bg-white/[0.04]'
                                                            }`}
                                                        >
                                                            <span className="text-xl w-7 text-center shrink-0">{cmd.icon}</span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-white text-sm font-medium truncate">{cmd.label}</p>
                                                                <p className="text-slate-500 text-xs truncate">{cmd.description}</p>
                                                            </div>
                                                            {isSelected && (
                                                                <kbd className="shrink-0 px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-slate-400 text-[10px] font-mono">↵</kbd>
                                                            )}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer hint */}
                            <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-4 text-slate-600 text-[11px]">
                                <span><kbd className="font-mono text-slate-500">↑↓</kbd> Navigate</span>
                                <span><kbd className="font-mono text-slate-500">↵</kbd> Select</span>
                                <span><kbd className="font-mono text-slate-500">ESC</kbd> Close</span>
                                <span className="ml-auto">TravelOS Command Palette</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
