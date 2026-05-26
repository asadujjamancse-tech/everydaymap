/**
 * LayerOverlays.tsx — Leaflet Layer Overlay Renderer
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders all 13 data overlay layers directly using react-leaflet components
 * (CircleMarker, Marker, Polyline, Tooltip, Popup).
 *
 * This is the Leaflet equivalent of the Mapbox layer hooks in src/layers/.
 * Each overlay reads its toggle flag from `activeLayers` in the store and
 * renders react-leaflet elements conditionally — no cleanup needed since
 * react-leaflet handles adding/removing from the DOM when components mount/unmount.
 *
 * Overlay layers rendered:
 *   budget, safety, weather, food, adventure, beach, nightlife, nomad,
 *   visa, trending, heatmap, liveWeather, routes
 *
 * Mounted inside <MapContainer> in LeafletMap.tsx.
 */

import React from 'react';
import { CircleMarker, Marker, Polyline, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../store/mapStore';
import { BUDGET_GEOJSON } from '../../layers/budget/budgetData';
import { SAFETY_GEOJSON } from '../../layers/safety/safetyData';
import { WEATHER_GEOJSON } from '../../layers/weather/weatherData';
import { FOOD_GEOJSON } from '../../layers/food/foodData';
import { ADVENTURE_GEOJSON } from '../../layers/adventure/adventureData';
import { BEACH_GEOJSON } from '../../layers/beach/beachData';
import { NIGHTLIFE_GEOJSON } from '../../layers/nightlife/nightlifeData';
import { NOMAD_GEOJSON } from '../../layers/nomad/nomadData';
import { VISA_GEOJSON } from '../../layers/visa/visaData';
import { TRENDING_GEOJSON } from '../../layers/trending/trendingData';
import { HEATMAP_GEOJSON } from '../../layers/heatmap/heatmapData';
import { LIVE_WEATHER_GEOJSON } from '../../layers/liveWeather/liveWeatherData';
import { ROUTES_GEOJSON } from '../../layers/routes/routesData';

// ── Shared helpers ────────────────────────────────────────────────────────────

function coords(f: { geometry: { coordinates: number[] } }): [number, number] {
    const [lng, lat] = f.geometry.coordinates;
    return [lat, lng];
}

function emojiIcon(emoji: string, bg: string, border: string, size = 36) {
    return L.divIcon({
        html: `<div style="
            width:${size}px;height:${size}px;
            background:${bg};
            border:2px solid ${border};
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:${size * 0.45}px;
            box-shadow:0 0 10px ${border}55,0 2px 12px rgba(0,0,0,0.6);
            cursor:pointer;
        ">${emoji}</div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2 + 4)],
    });
}

function popupStyle(children: React.ReactNode) {
    return (
        <div style={{ fontFamily: 'system-ui,sans-serif', minWidth: 160, color: '#f1f5f9' }}>
            {children}
        </div>
    );
}

function PopupTitle({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{emoji}</span>
            <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', margin: 0 }}>{title}</p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{sub}</p>
            </div>
        </div>
    );
}

function Row({ label, value, color = '#a78bfa' }: { label: string; value: string; color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#64748b', fontSize: 11 }}>{label}</span>
            <span style={{ color, fontSize: 11, fontWeight: 600 }}>{value}</span>
        </div>
    );
}

// ── Budget Layer ──────────────────────────────────────────────────────────────

function budgetColor(budget: number): string {
    if (budget <= 40) return '#10b981';
    if (budget <= 70) return '#84cc16';
    if (budget <= 110) return '#eab308';
    if (budget <= 160) return '#f97316';
    return '#ef4444';
}

export function BudgetLayer() {
    return (
        <>
            {BUDGET_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                const color = budgetColor(p.budget);
                return (
                    <CircleMarker
                        key={i}
                        center={coords(f)}
                        radius={12}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.82, weight: 1.5, opacity: 0.9 }}
                    >
                        <Tooltip direction="top" offset={[0, -14]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>${p.budget}/day — {p.name}</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="💰" title={p.name} sub={p.tier} />
                                <Row label="Daily Budget" value={p.range} color={color} />
                                <Row label="Annual Tourists" value={`${p.tourists}M`} color="#94a3b8" />
                            </>)}
                        </Popup>
                    </CircleMarker>
                );
            })}
        </>
    );
}

// ── Safety Layer ──────────────────────────────────────────────────────────────

function safetyColor(score: number): string {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#84cc16';
    if (score >= 55) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
}

export function SafetyLayer() {
    return (
        <>
            {SAFETY_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                const color = safetyColor(p.score);
                return (
                    <CircleMarker
                        key={i}
                        center={coords(f)}
                        radius={11}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.78, weight: 2, opacity: 1 }}
                    >
                        <Tooltip direction="top" offset={[0, -14]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>🛡️ {p.name} — {p.score}/100</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="🛡️" title={p.name} sub={p.level} />
                                <Row label="Safety Score" value={`${p.score}/100`} color={color} />
                                <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 6, lineHeight: 1.4 }}>{p.advisory}</p>
                            </>)}
                        </Popup>
                    </CircleMarker>
                );
            })}
        </>
    );
}

// ── Weather Layer ─────────────────────────────────────────────────────────────

function tempColor(temp: number): string {
    if (temp <= 5) return '#60a5fa';
    if (temp <= 15) return '#38bdf8';
    if (temp <= 25) return '#34d399';
    if (temp <= 32) return '#fbbf24';
    return '#f97316';
}

export function WeatherLayer() {
    return (
        <>
            {WEATHER_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                const color = tempColor(p.temp);
                return (
                    <Marker key={i} position={coords(f)} icon={emojiIcon(p.condition.slice(-2) || '🌡️', 'rgba(15,23,42,0.9)', color, 38)}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.name} — {p.temp}°C</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="🌡️" title={p.name} sub={p.condition} />
                                <Row label="Temperature" value={`${p.temp}°C`} color={color} />
                                <Row label="Humidity" value={`${p.humidity}%`} color="#60a5fa" />
                                <Row label="Best Time" value={p.best} color="#a78bfa" />
                                <Row label="Season" value={p.season} color="#94a3b8" />
                            </>)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

// ── Food Layer ────────────────────────────────────────────────────────────────

export function FoodLayer() {
    return (
        <>
            {FOOD_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                return (
                    <Marker key={i} position={coords(f)} icon={emojiIcon('🍽️', 'rgba(15,23,42,0.92)', '#f97316', 36)}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.name} — {p.cuisine}</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="🍽️" title={p.name} sub={p.cuisine} />
                                <Row label="Signature" value={p.signature} color="#f97316" />
                                <Row label="Michelin Stars" value={`${'★'.repeat(p.michelin)}`} color="#fbbf24" />
                                <Row label="Rating" value={`${p.rating}/10`} color="#10b981" />
                                <Row label="Vegan-Friendly" value={p.vegan ? '✓ Yes' : '✗ Limited'} color={p.vegan ? '#10b981' : '#94a3b8'} />
                            </>)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

// ── Adventure Layer ───────────────────────────────────────────────────────────

const DIFF_COLORS: Record<string, string> = { Easy: '#10b981', Medium: '#eab308', Hard: '#f97316', Extreme: '#ef4444' };

export function AdventureLayer() {
    return (
        <>
            {ADVENTURE_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                const color = DIFF_COLORS[p.difficulty] ?? '#a78bfa';
                return (
                    <Marker key={i} position={coords(f)} icon={emojiIcon('🥾', 'rgba(15,23,42,0.92)', color, 36)}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.name} — {p.activity}</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="🥾" title={p.name} sub={p.activity} />
                                <Row label="Difficulty" value={p.difficulty} color={color} />
                                <Row label="Rating" value={`${p.rating}/10`} color="#10b981" />
                                <Row label="Duration" value={p.duration} color="#a78bfa" />
                                <Row label="Best Season" value={p.season} color="#94a3b8" />
                            </>)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

// ── Beach Layer ───────────────────────────────────────────────────────────────

export function BeachLayer() {
    return (
        <>
            {BEACH_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                return (
                    <Marker key={i} position={coords(f)} icon={emojiIcon('🏖️', 'rgba(15,23,42,0.92)', '#06b6d4', 36)}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.name} — {p.country}</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="🏖️" title={p.name} sub={`${p.country} · ${p.type}`} />
                                <Row label="Water" value={p.water} color="#06b6d4" />
                                <Row label="Rating" value={`${p.rating}/10`} color="#10b981" />
                                <Row label="Crowds" value={p.crowd} color="#94a3b8" />
                                <Row label="Best Time" value={p.best} color="#a78bfa" />
                            </>)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

// ── Nightlife Layer ───────────────────────────────────────────────────────────

export function NightlifeLayer() {
    return (
        <>
            {NIGHTLIFE_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                return (
                    <Marker key={i} position={coords(f)} icon={emojiIcon('🎵', 'rgba(15,23,42,0.92)', '#ec4899', 36)}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.name} — {p.scene}</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="🎵" title={p.name} sub={p.scene} />
                                <Row label="Vibe" value={p.vibe} color="#ec4899" />
                                <Row label="Rating" value={`${p.rating}/10`} color="#10b981" />
                                <Row label="Budget" value={p.budget} color="#fbbf24" />
                                <Row label="Hours" value={`${p.opens} – ${p.closes}`} color="#94a3b8" />
                            </>)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

// ── Digital Nomad Layer ───────────────────────────────────────────────────────

function nomadColor(score: number): string {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#84cc16';
    if (score >= 70) return '#eab308';
    return '#f97316';
}

export function NomadLayer() {
    return (
        <>
            {NOMAD_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                const color = nomadColor(p.nomad_score);
                return (
                    <Marker key={i} position={coords(f)} icon={emojiIcon('💻', 'rgba(15,23,42,0.92)', color, 36)}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.name} — Score {p.nomad_score}</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="💻" title={p.name} sub={p.country} />
                                <Row label="Nomad Score" value={`${p.nomad_score}/100`} color={color} />
                                <Row label="Monthly Cost" value={`$${p.cost}`} color="#fbbf24" />
                                <Row label="Internet" value={`${p.internet}/100`} color="#60a5fa" />
                                <Row label="Co-Working" value={`${p.coworking}/100`} color="#a78bfa" />
                                <Row label="Community" value={`${p.community}/100`} color="#10b981" />
                                <Row label="Timezone" value={p.timezone} color="#94a3b8" />
                            </>)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

// ── Visa Layer ────────────────────────────────────────────────────────────────

function visaColor(ease: number): string {
    if (ease >= 90) return '#10b981';
    if (ease >= 75) return '#84cc16';
    if (ease >= 60) return '#eab308';
    return '#f97316';
}

export function VisaLayer() {
    return (
        <>
            {VISA_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                const color = visaColor(p.ease);
                return (
                    <Marker key={i} position={coords(f)} icon={emojiIcon('🛂', 'rgba(15,23,42,0.92)', color, 36)}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.name} — {p.type}</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="🛂" title={p.name} sub={p.type} />
                                <Row label="Duration" value={p.duration} color={color} />
                                <Row label="Cost" value={p.cost === 0 ? 'Free' : `$${p.cost}`} color="#fbbf24" />
                                <Row label="Ease Score" value={`${p.ease}/100`} color={color} />
                                <Row label="Nomad Visa" value={p.digital_nomad_visa ? '✓ Available' : '✗ No'} color={p.digital_nomad_visa ? '#10b981' : '#64748b'} />
                            </>)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

// ── Trending Layer ────────────────────────────────────────────────────────────

export function TrendingLayer() {
    return (
        <>
            {TRENDING_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                return (
                    <Marker key={i} position={coords(f)} icon={emojiIcon('🔥', 'rgba(15,23,42,0.92)', '#f97316', 36)}>
                        <Tooltip direction="top" offset={[0, -20]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.name} {p.trend} — {p.tag}</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji="🔥" title={p.name} sub={p.tag} />
                                <Row label="Growth" value={p.trend} color="#f97316" />
                                <Row label="Global Rank" value={`#${p.rank}`} color="#fbbf24" />
                                <Row label="Monthly Searches" value={`${p.searches}M`} color="#a78bfa" />
                                <Row label="Momentum" value={p.momentum} color="#10b981" />
                                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{p.reason}</p>
                            </>)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

// ── Heatmap Layer ─────────────────────────────────────────────────────────────

export function HeatmapLayer() {
    return (
        <>
            {HEATMAP_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                const r = Math.round(8 + p.weight * 22);
                const alpha = 0.3 + p.weight * 0.45;
                return (
                    <CircleMarker
                        key={i}
                        center={coords(f)}
                        radius={r}
                        pathOptions={{
                            color: 'transparent',
                            fillColor: `hsl(${Math.round((1 - p.weight) * 120)}, 90%, 55%)`,
                            fillOpacity: alpha,
                            weight: 0,
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -r]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>👥 {p.city} — Density {Math.round(p.weight * 100)}%</span>
                        </Tooltip>
                    </CircleMarker>
                );
            })}
        </>
    );
}

// ── Live Weather Layer ────────────────────────────────────────────────────────

export function LiveWeatherLayer() {
    return (
        <>
            {LIVE_WEATHER_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                const border = p.alert ? '#ef4444' : tempColor(p.temp);
                return (
                    <Marker key={i} position={coords(f)} icon={emojiIcon(p.icon, 'rgba(15,23,42,0.92)', border, 38)}>
                        <Tooltip direction="top" offset={[0, -22]} opacity={0.97} className="leaflet-dark-popup">
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.name} {p.temp}°C {p.alert ? '⚠️' : ''}</span>
                        </Tooltip>
                        <Popup className="leaflet-dark-popup">
                            {popupStyle(<>
                                <PopupTitle emoji={p.icon} title={p.name} sub={p.condition + (p.alert ? ' ⚠️ Alert' : '')} />
                                <Row label="Temperature" value={`${p.temp}°C`} color={border} />
                                <Row label="Feels Like" value={`${p.feels_like}°C`} color="#94a3b8" />
                                <Row label="Wind" value={`${p.wind} km/h`} color="#60a5fa" />
                                <Row label="UV Index" value={`${p.uv}/11`} color={p.uv > 7 ? '#f97316' : '#84cc16'} />
                            </>)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

// ── Travel Routes Layer ───────────────────────────────────────────────────────

export function RoutesLayer() {
    return (
        <>
            {ROUTES_GEOJSON.features.map((f, i) => {
                const p = f.properties as any;
                const geo = f.geometry as any;
                const positions: [number, number][] = geo.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
                const color = p.color ?? '#8b5cf6';
                return (
                    <React.Fragment key={i}>
                        {/* Glow */}
                        <Polyline positions={positions} pathOptions={{ color, weight: 10, opacity: 0.12 }} />
                        {/* Main line */}
                        <Polyline positions={positions} pathOptions={{ color, weight: 3, opacity: 0.9, dashArray: '8 4' }}>
                            <Tooltip sticky opacity={0.97} className="leaflet-dark-popup">
                                <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>✈️ {p.name}</span>
                            </Tooltip>
                            <Popup className="leaflet-dark-popup">
                                {popupStyle(<>
                                    <PopupTitle emoji="✈️" title={p.name} sub={p.type} />
                                    <Row label="Duration" value={p.duration} color={color} />
                                    <Row label="Budget" value={`$${p.budget}`} color="#fbbf24" />
                                    <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>{p.stops}</p>
                                </>)}
                            </Popup>
                        </Polyline>
                        {/* Stop dots */}
                        {positions.map((pos, j) => (
                            <CircleMarker key={j} center={pos} radius={4}
                                pathOptions={{ color: '#fff', fillColor: color, fillOpacity: 1, weight: 1.5, opacity: 0.8 }} />
                        ))}
                    </React.Fragment>
                );
            })}
        </>
    );
}

// ── Master overlay component (renders inside MapContainer) ────────────────────

export const LayerOverlays: React.FC = () => {
    const layers = useMapStore((s) => s.activeLayers);
    return (
        <>
            {layers.budget    && <BudgetLayer />}
            {layers.safety    && <SafetyLayer />}
            {layers.weather   && <WeatherLayer />}
            {layers.food      && <FoodLayer />}
            {layers.adventure && <AdventureLayer />}
            {layers.beach     && <BeachLayer />}
            {layers.nightlife && <NightlifeLayer />}
            {layers.nomad     && <NomadLayer />}
            {layers.visa      && <VisaLayer />}
            {layers.trending  && <TrendingLayer />}
            {layers.heatmap   && <HeatmapLayer />}
            {layers.liveWeather && <LiveWeatherLayer />}
            {layers.routes    && <RoutesLayer />}
        </>
    );
};
