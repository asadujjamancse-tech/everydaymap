import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/mapStore';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    action?: { type: string; payload: any };
}

// ── Destination database ──────────────────────────────────────────────────────
const DESTINATIONS: Record<string, {
    coords: [number, number]; zoom: number; budget: string;
    safety: string; climate: string; bestFor: string[]; tip: string;
}> = {
    thailand:    { coords: [100.99, 15.87], zoom: 5, budget: '$25–$80/day', safety: '7.5/10', climate: 'Tropical', bestFor: ['beaches','food','temples','nightlife'], tip: 'Visit Nov–Mar for best weather. Avoid rainy season.' },
    japan:       { coords: [138.25, 36.20], zoom: 5, budget: '$80–$200/day', safety: '9.5/10', climate: 'Temperate', bestFor: ['culture','food','technology','nature'], tip: 'Cherry blossom season (Mar–Apr) is magical.' },
    bali:        { coords: [115.09, -8.34], zoom: 8, budget: '$30–$90/day', safety: '7.8/10', climate: 'Tropical', bestFor: ['beaches','spirituality','surfing','food'], tip: 'Ubud for culture, Seminyak for nightlife.' },
    paris:       { coords: [2.35, 48.86], zoom: 11, budget: '$120–$300/day', safety: '7.2/10', climate: 'Temperate', bestFor: ['art','food','romance','history'], tip: 'Book the Eiffel Tower weeks in advance.' },
    tokyo:       { coords: [139.69, 35.69], zoom: 11, budget: '$100–$250/day', safety: '9.8/10', climate: 'Temperate', bestFor: ['food','technology','anime','shopping'], tip: 'Get a Suica card for seamless transit.' },
    new_york:    { coords: [-74.00, 40.71], zoom: 11, budget: '$150–$400/day', safety: '7.0/10', climate: 'Temperate', bestFor: ['culture','food','art','nightlife'], tip: 'Walk the High Line and Brooklyn Bridge.' },
    dubai:       { coords: [55.30, 25.20], zoom: 10, budget: '$100–$500/day', safety: '9.2/10', climate: 'Desert', bestFor: ['luxury','shopping','architecture','beaches'], tip: 'Oct–Apr is the best time to visit.' },
    barcelona:   { coords: [2.17, 41.39], zoom: 11, budget: '$80–$200/day', safety: '7.5/10', climate: 'Mediterranean', bestFor: ['art','food','beaches','architecture'], tip: 'Gaudí\'s Sagrada Família is breathtaking.' },
    vietnam:     { coords: [106.64, 16.47], zoom: 5, budget: '$20–$60/day', safety: '7.8/10', climate: 'Tropical', bestFor: ['food','history','nature','beaches'], tip: 'Ha Long Bay and Hoi An are must-visits.' },
    maldives:    { coords: [73.22, 3.20], zoom: 7, budget: '$200–$1000/day', safety: '8.5/10', climate: 'Tropical', bestFor: ['beaches','diving','luxury','romance'], tip: 'Book over-water bungalows 6 months ahead.' },
    santorini:   { coords: [25.43, 36.43], zoom: 11, budget: '$120–$400/day', safety: '9.0/10', climate: 'Mediterranean', bestFor: ['romance','sunsets','food','sailing'], tip: 'Stay in Oia for the famous sunset views.' },
    singapore:   { coords: [103.82, 1.35], zoom: 11, budget: '$100–$300/day', safety: '9.5/10', climate: 'Tropical', bestFor: ['food','technology','shopping','culture'], tip: 'Gardens by the Bay is free at night.' },
    iceland:     { coords: [-19.02, 64.96], zoom: 6, budget: '$150–$350/day', safety: '9.5/10', climate: 'Subarctic', bestFor: ['northern lights','nature','adventure','waterfalls'], tip: 'See northern lights Sep–Mar.' },
    morocco:     { coords: [-7.09, 31.79], zoom: 5, budget: '$40–$120/day', safety: '7.0/10', climate: 'Desert', bestFor: ['culture','food','souks','desert'], tip: 'Marrakech medina is a sensory overload in the best way.' },
    peru:        { coords: [-75.01, -9.19], zoom: 5, budget: '$40–$120/day', safety: '6.5/10', climate: 'Varied', bestFor: ['history','machu picchu','adventure','nature'], tip: 'Book Machu Picchu tickets months ahead.' },
    kenya:       { coords: [37.90, 0.02], zoom: 5, budget: '$100–$400/day', safety: '6.0/10', climate: 'Savanna', bestFor: ['safari','wildlife','nature','culture'], tip: 'Great Migration is Jul–Oct in the Masai Mara.' },
    cambodia:    { coords: [104.99, 12.57], zoom: 6, budget: '$20–$60/day', safety: '7.0/10', climate: 'Tropical', bestFor: ['temples','history','food','beaches'], tip: 'Angkor Wat at sunrise is unforgettable.' },
    portugal:    { coords: [-8.22, 39.40], zoom: 6, budget: '$60–$150/day', safety: '8.8/10', climate: 'Mediterranean', bestFor: ['food','wine','beaches','history'], tip: 'Porto\'s wine cellars are a must-visit.' },
    indonesia:   { coords: [113.92, -2.54], zoom: 5, budget: '$25–$80/day', safety: '7.0/10', climate: 'Tropical', bestFor: ['beaches','diving','culture','adventure'], tip: 'Raja Ampat for world-class diving.' },
};

// ── Keyword AI matching ───────────────────────────────────────────────────────
const QUICK_PROMPTS = [
    'Best beaches in Asia 🏖️',
    'Luxury Dubai travel 💎',
    'Budget backpacking route ✈️',
    'Digital nomad destinations 💻',
    'Northern lights Iceland 🌌',
    'Tokyo food guide 🍜',
    'Safari Kenya 🦁',
    'Romantic Europe 💕',
];

function buildAIResponse(userText: string): {
    text: string;
    dest?: string;
    action?: { type: 'flyTo'; coords: [number, number]; zoom: number };
} {
    const lower = userText.toLowerCase();

    // Match destination
    for (const [key, data] of Object.entries(DESTINATIONS)) {
        const name = key.replace('_', ' ');
        if (lower.includes(name) || lower.includes(key)) {
            return {
                dest: name,
                action: { type: 'flyTo', coords: data.coords, zoom: data.zoom },
                text: `🌍 **${name.charAt(0).toUpperCase() + name.slice(1)}** — ${data.climate} climate\n\n` +
                    `💰 Budget: ${data.budget}\n` +
                    `🛡️ Safety: ${data.safety}\n` +
                    `✨ Best for: ${data.bestFor.join(', ')}\n\n` +
                    `💡 Pro tip: ${data.tip}`,
            };
        }
    }

    // Thematic responses
    if (/beach|island|tropical|coast/.test(lower)) {
        return {
            dest: 'bali',
            action: { type: 'flyTo', coords: DESTINATIONS.bali.coords, zoom: 8 },
            text: '🏖️ Top beach destinations for you:\n\n1. **Bali, Indonesia** — best all-rounder\n2. **Maldives** — ultimate luxury\n3. **Thailand** — Krabi & Koh Samui\n4. **Santorini** — volcanic beauty\n\nFlying you to Bali as a starting point!',
        };
    }
    if (/budget|cheap|backpack|affordable/.test(lower)) {
        return {
            dest: 'vietnam',
            action: { type: 'flyTo', coords: DESTINATIONS.vietnam.coords, zoom: 5 },
            text: '💸 Best budget destinations:\n\n1. **Vietnam** — $20–40/day\n2. **Cambodia** — $20–35/day\n3. **Thailand** — $25–50/day\n4. **Morocco** — $40–80/day\n5. **Indonesia** — $25–60/day\n\nVietnam is my top pick — incredible value!',
        };
    }
    if (/luxury|five star|expensive|premium|honeymoon/.test(lower)) {
        return {
            dest: 'maldives',
            action: { type: 'flyTo', coords: DESTINATIONS.maldives.coords, zoom: 7 },
            text: '💎 Top luxury destinations:\n\n1. **Maldives** — overwater bungalows\n2. **Dubai** — ultra-luxury everything\n3. **Santorini** — romantic cliff hotels\n4. **Japan** — ryokan experiences\n5. **Paris** — world-class gastronomy\n\nThe Maldives is simply unmatched for luxury!',
        };
    }
    if (/nomad|remote work|cowork|wifi|internet/.test(lower)) {
        return {
            dest: 'bali',
            action: { type: 'flyTo', coords: DESTINATIONS.bali.coords, zoom: 9 },
            text: '💻 Top digital nomad hubs:\n\n1. **Bali, Indonesia** — Canggu cowork scene\n2. **Portugal** — Lisbon & Porto\n3. **Thailand** — Chiang Mai for budget nomads\n4. **Spain** — Barcelona beach life\n5. **Japan** — Tokyo for fast internet\n\nBali\'s Canggu is the world\'s #1 nomad base!',
        };
    }
    if (/safari|wildlife|africa|kenya|animals/.test(lower)) {
        return {
            dest: 'kenya',
            action: { type: 'flyTo', coords: DESTINATIONS.kenya.coords, zoom: 5 },
            text: '🦁 Ultimate safari destinations:\n\n1. **Kenya** — Masai Mara Great Migration\n2. **Tanzania** — Serengeti & Ngorongoro\n3. **South Africa** — Kruger National Park\n4. **Botswana** — Okavango Delta\n\nKenya\'s Masai Mara is the safari capital of the world!',
        };
    }
    if (/north|arctic|aurora|northern lights/.test(lower)) {
        return {
            dest: 'iceland',
            action: { type: 'flyTo', coords: DESTINATIONS.iceland.coords, zoom: 6 },
            text: '🌌 Best Northern Lights destinations:\n\n1. **Iceland** — Reykjavik & countryside\n2. **Norway** — Tromsø & Lofoten\n3. **Finland** — Lapland glass igloos\n4. **Sweden** — Abisko National Park\n\nIceland has the best infrastructure for aurora hunting!',
        };
    }
    if (/food|eat|cuisine|restaurant|gastro/.test(lower)) {
        return {
            dest: 'tokyo',
            action: { type: 'flyTo', coords: DESTINATIONS.tokyo.coords, zoom: 11 },
            text: '🍜 World\'s top food destinations:\n\n1. **Tokyo** — most Michelin stars on Earth\n2. **Bangkok** — street food paradise\n3. **Paris** — haute cuisine capital\n4. **Singapore** — hawker center culture\n5. **Barcelona** — tapas & avant-garde\n\nTokyo has more Michelin stars than any other city!',
        };
    }
    if (/rome|italy|europe|paris|spain|france/.test(lower)) {
        return {
            dest: 'barcelona',
            action: { type: 'flyTo', coords: DESTINATIONS.barcelona.coords, zoom: 11 },
            text: '🏛️ Must-visit European highlights:\n\n1. **Barcelona** — Gaudí architecture\n2. **Paris** — culture & gastronomy\n3. **Rome** — ancient history\n4. **Santorini** — island romance\n5. **Portugal** — hidden gem\n\nBarcelona is my personal favourite in Europe!',
        };
    }

    // Generic fallback
    return {
        text: `🤖 I searched my travel intelligence database for "${userText}".\n\nI can help you explore:\n• 🏖️ **Beaches** — Bali, Maldives, Thailand\n• 🏙️ **Cities** — Tokyo, Dubai, Paris, NYC\n• 🌿 **Adventure** — Peru, Kenya, Iceland\n• 💸 **Budget travel** — Vietnam, Cambodia\n• 💎 **Luxury** — Maldives, Monaco, Dubai\n\nAsk me about any destination or travel style!`,
    };
}

// ── Component ─────────────────────────────────────────────────────────────────
export const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([{
        id: '0',
        text: '👋 I\'m your AI travel navigator. Ask me about any destination, travel style, or budget — I\'ll fly you there and give you the full intel!',
        sender: 'ai',
        timestamp: new Date(),
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { setSelectedCountry, openPanel, toggleGlobeMode, mapInstance } = useMapStore();

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleSend = (text: string) => {
        if (!text.trim() || isLoading) return;
        const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        setTimeout(() => {
            const response = buildAIResponse(text);

            // Execute map action
            if (response.action?.type === 'flyTo') {
                const { coords, zoom } = response.action;
                toggleGlobeMode(false);
                setTimeout(() => {
                    mapInstance?.flyTo({ center: coords, zoom, duration: 2500, pitch: zoom > 9 ? 55 : 30, essential: true });
                }, 400);
                if (response.dest) {
                    setSelectedCountry(response.dest.charAt(0).toUpperCase() + response.dest.slice(1));
                    openPanel('country');
                }
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setIsLoading(false);
        }, 900);
    };

    return (
        <div className="fixed bottom-14 right-5 z-40">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.93 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                        className="mb-4 w-96 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-purple-500/25 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-700 to-blue-700 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl">🤖</div>
                                <div>
                                    <h2 className="text-white font-bold text-sm">AI Travel Navigator</h2>
                                    <p className="text-purple-200 text-[10px]">Powered by travel intelligence</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-green-300 text-xs">Live</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="h-72 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-purple-800">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                                        msg.sender === 'user'
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-sm'
                                            : 'bg-slate-700/80 text-slate-100 rounded-bl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-700/80 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ y: [0, -6, 0] }}
                                                transition={{ delay: i * 0.12, duration: 0.5, repeat: Infinity }}
                                                className="w-2 h-2 bg-purple-400 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick prompts */}
                        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
                            {QUICK_PROMPTS.slice(0, 4).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handleSend(p)}
                                    className="shrink-0 text-[10px] px-2.5 py-1.5 rounded-full bg-slate-700/70 hover:bg-purple-600/40 text-slate-300 hover:text-white border border-slate-600/50 hover:border-purple-500/50 transition-all"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 pt-2 border-t border-slate-700/60">
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex gap-2">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything about travel…"
                                    className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm border border-slate-600/50 focus:border-purple-500 focus:outline-none placeholder:text-slate-500 transition-colors"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-40 transition-all"
                                >
                                    ✈️
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center text-2xl relative"
            >
                {isOpen ? '✕' : '🤖'}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-slate-900 animate-pulse" />
                )}
            </motion.button>
        </div>
    );
};
