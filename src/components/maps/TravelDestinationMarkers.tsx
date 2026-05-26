/**
 * TravelDestinationMarkers — beautiful animated hero pins for top travel cities.
 * Rendered inside <MapContainer> via react-leaflet.
 */
import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export interface TravelDestination {
    id: string;
    city: string;
    country: string;
    flag: string;
    coords: [number, number]; // [lat, lng]
    tagline: string;
    budget: string;
    rating: number;
    temp: string;
    tags: string[];
    heroEmoji: string;
    accentColor: string;
    mustSee: string[];
}

export const TRAVEL_DESTINATIONS: TravelDestination[] = [
    {
        id: 'paris',
        city: 'Paris',
        country: 'France',
        flag: '🇫🇷',
        coords: [48.8566, 2.3522],
        tagline: 'City of Light & Love',
        budget: '$120–$300/day',
        rating: 4.8,
        temp: '15–22°C',
        tags: ['Romance', 'Art', 'Fashion', 'Cuisine'],
        heroEmoji: '🗼',
        accentColor: '#a78bfa',
        mustSee: ['Eiffel Tower', 'Louvre Museum', 'Montmartre'],
    },
    {
        id: 'tokyo',
        city: 'Tokyo',
        country: 'Japan',
        flag: '🇯🇵',
        coords: [35.6762, 139.6503],
        tagline: 'Future Meets Tradition',
        budget: '$80–$200/day',
        rating: 4.9,
        temp: '10–28°C',
        tags: ['Culture', 'Food', 'Tech', 'Anime'],
        heroEmoji: '⛩️',
        accentColor: '#f472b6',
        mustSee: ['Shibuya Crossing', 'Senso-ji Temple', 'Akihabara'],
    },
    {
        id: 'newyork',
        city: 'New York',
        country: 'USA',
        flag: '🇺🇸',
        coords: [40.7128, -74.0060],
        tagline: 'The City That Never Sleeps',
        budget: '$150–$400/day',
        rating: 4.7,
        temp: '5–28°C',
        tags: ['Culture', 'Food', 'Art', 'Business'],
        heroEmoji: '🗽',
        accentColor: '#60a5fa',
        mustSee: ['Central Park', 'Times Square', 'Brooklyn Bridge'],
    },
    {
        id: 'dubai',
        city: 'Dubai',
        country: 'UAE',
        flag: '🇦🇪',
        coords: [25.2048, 55.2708],
        tagline: 'Desert Luxury Redefined',
        budget: '$100–$500/day',
        rating: 4.8,
        temp: '22–40°C',
        tags: ['Luxury', 'Shopping', 'Architecture', 'Beach'],
        heroEmoji: '🏙️',
        accentColor: '#fbbf24',
        mustSee: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah'],
    },
    {
        id: 'sydney',
        city: 'Sydney',
        country: 'Australia',
        flag: '🇦🇺',
        coords: [-33.8688, 151.2093],
        tagline: 'Harbour City of Dreams',
        budget: '$100–$250/day',
        rating: 4.7,
        temp: '12–26°C',
        tags: ['Beach', 'Nature', 'Food', 'Lifestyle'],
        heroEmoji: '🦘',
        accentColor: '#34d399',
        mustSee: ['Opera House', 'Harbour Bridge', 'Bondi Beach'],
    },
];

// Creates the animated pulsing pin icon
function createDestinationIcon(dest: TravelDestination, isHovered: boolean) {
    const size = isHovered ? 52 : 44;
    const pulse = isHovered ? 'animation:destPulse 1s ease-in-out infinite;' : 'animation:destPulse 2.5s ease-in-out infinite;';

    return L.divIcon({
        html: `
            <div class="dest-pin-wrapper" style="position:relative;width:${size}px;height:${size}px;">
                <div style="
                    position:absolute;inset:0;border-radius:50%;
                    background:${dest.accentColor}22;
                    ${pulse}
                    transform-origin:center;
                "></div>
                <div style="
                    position:absolute;inset:4px;border-radius:50%;
                    background:rgba(10,14,30,0.92);
                    border:2.5px solid ${dest.accentColor};
                    box-shadow:0 0 18px ${dest.accentColor}66, inset 0 0 8px ${dest.accentColor}22;
                    display:flex;align-items:center;justify-content:center;
                    font-size:${isHovered ? 22 : 18}px;
                    transition:all 0.2s ease;
                    cursor:pointer;
                ">${dest.heroEmoji}</div>
                <div style="
                    position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);
                    white-space:nowrap;
                    background:rgba(10,14,30,0.85);
                    border:1px solid ${dest.accentColor}44;
                    border-radius:8px;
                    padding:2px 7px;
                    font-size:10px;font-weight:700;
                    color:${dest.accentColor};
                    backdrop-filter:blur(8px);
                    font-family:system-ui,sans-serif;
                ">${dest.flag} ${dest.city}</div>
            </div>`,
        className: '',
        iconSize: [size, size + 24],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2 + 20)],
    });
}

// Rich animated popup card
function DestinationPopup({ dest }: { dest: TravelDestination }) {
    const stars = Math.round(dest.rating);

    return (
        <div style={{
            fontFamily: 'system-ui,-apple-system,sans-serif',
            width: 260,
            background: 'rgba(10,14,30,0.97)',
            borderRadius: 16,
            overflow: 'hidden',
            border: `1px solid ${dest.accentColor}33`,
        }}>
            {/* Hero header */}
            <div style={{
                background: `linear-gradient(135deg, ${dest.accentColor}33 0%, rgba(10,14,30,0.8) 100%)`,
                padding: '16px 16px 12px',
                borderBottom: `1px solid ${dest.accentColor}22`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${dest.accentColor}22`,
                        border: `1.5px solid ${dest.accentColor}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                    }}>{dest.heroEmoji}</div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: '#fff' }}>
                            {dest.flag} {dest.city}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: dest.accentColor, fontWeight: 600 }}>
                            {dest.country}
                        </p>
                    </div>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                    "{dest.tagline}"
                </p>
            </div>

            {/* Stats grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 0,
                borderBottom: `1px solid ${dest.accentColor}22`,
            }}>
                {[
                    { label: 'Budget', value: dest.budget, icon: '💰' },
                    { label: 'Temperature', value: dest.temp, icon: '🌡️' },
                ].map(({ label, value, icon }) => (
                    <div key={label} style={{
                        padding: '10px 12px',
                        borderRight: label === 'Budget' ? `1px solid ${dest.accentColor}22` : 'none',
                    }}>
                        <p style={{ margin: 0, fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {icon} {label}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#e2e8f0', fontWeight: 700 }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Rating */}
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${dest.accentColor}22` }}>
                <span style={{ color: '#fbbf24', fontSize: 12 }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>{dest.rating}/5.0 · Traveller Rating</span>
            </div>

            {/* Tags */}
            <div style={{ padding: '8px 12px', display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${dest.accentColor}22` }}>
                {dest.tags.map((tag) => (
                    <span key={tag} style={{
                        padding: '2px 8px', borderRadius: 99,
                        background: `${dest.accentColor}18`,
                        border: `1px solid ${dest.accentColor}33`,
                        fontSize: 10, color: dest.accentColor, fontWeight: 600,
                    }}>{tag}</span>
                ))}
            </div>

            {/* Must-see */}
            <div style={{ padding: '10px 12px' }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    📍 Must-See
                </p>
                {dest.mustSee.map((place, i) => (
                    <div key={place} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        marginBottom: i < dest.mustSee.length - 1 ? 4 : 0,
                    }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: dest.accentColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#cbd5e1' }}>{place}</span>
                    </div>
                ))}
            </div>

            {/* Action button */}
            <div style={{ padding: '0 12px 12px' }}>
                <div style={{
                    padding: '8px 12px', borderRadius: 10, textAlign: 'center',
                    background: `linear-gradient(135deg, ${dest.accentColor}cc, ${dest.accentColor}88)`,
                    cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff',
                    boxShadow: `0 4px 16px ${dest.accentColor}44`,
                }}>
                    ✈️ Explore {dest.city}
                </div>
            </div>
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export const TravelDestinationMarkers: React.FC = () => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <>
            {TRAVEL_DESTINATIONS.map((dest) => (
                <Marker
                    key={dest.id}
                    position={dest.coords}
                    icon={createDestinationIcon(dest, hoveredId === dest.id)}
                    eventHandlers={{
                        mouseover: () => setHoveredId(dest.id),
                        mouseout:  () => setHoveredId(null),
                    }}
                >
                    <Popup
                        className="leaflet-dark-popup dest-popup"
                        maxWidth={280}
                        closeButton={false}
                    >
                        <DestinationPopup dest={dest} />
                    </Popup>
                </Marker>
            ))}
        </>
    );
};
