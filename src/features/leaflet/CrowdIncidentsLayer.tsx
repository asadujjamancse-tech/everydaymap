/**
 * CrowdIncidentsLayer.tsx — Crowd Safety Incident Markers
 * Reads `crowdIncidents` from the store (populated by CrowdMode sidebar)
 * and renders colour-coded markers on the Leaflet map.
 * Severity colours: high=red, medium=orange, low=yellow.
 * Clicking a marker shows a popup with incident title, time, and source.
 */
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../store/mapStore';

const SEVERITY_COLORS: Record<string, string> = {
    high:   '#ef4444',
    medium: '#f97316',
    low:    '#eab308',
};

function createIncidentIcon(emoji: string, severity: string) {
    const color = SEVERITY_COLORS[severity] ?? '#94a3b8';
    return L.divIcon({
        html: `<div style="
            position:relative;
            width:36px; height:36px;
        ">
            <div style="
                width:36px; height:36px;
                background:rgba(15,23,42,0.95);
                border:2.5px solid ${color};
                border-radius:50%;
                display:flex; align-items:center; justify-content:center;
                font-size:16px;
                box-shadow:0 0 12px ${color}88, 0 2px 8px rgba(0,0,0,0.7);
                cursor:pointer;
            ">${emoji}</div>
            <div style="
                position:absolute; bottom:-6px; left:50%; transform:translateX(-50%);
                width:0; height:0;
                border-left:5px solid transparent;
                border-right:5px solid transparent;
                border-top:6px solid ${color};
            "></div>
        </div>`,
        className: '',
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -44],
    });
}

const SEVERITY_LABEL: Record<string, string> = {
    high: '#ef4444', medium: '#f97316', low: '#eab308',
};

export const CrowdIncidentsLayer: React.FC = () => {
    const crowdIncidents = useMapStore((s) => s.crowdIncidents);
    const activeMode = useMapStore((s) => s.activeMode);

    // Only show markers when in crowd mode
    if (activeMode !== 'crowd' || crowdIncidents.length === 0) return null;

    const validIncidents = crowdIncidents.filter((inc) => {
        const [lng, lat] = inc.coords;
        return typeof lng === 'number' && typeof lat === 'number' &&
            isFinite(lng) && isFinite(lat) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });

    return (
        <>
            {validIncidents.map((inc) => (
                <Marker
                    key={inc.id}
                    position={[inc.coords[1], inc.coords[0]]}
                    icon={createIncidentIcon(inc.emoji, inc.severity)}
                >
                    <Popup className="leaflet-dark-popup">
                        <div style={{ fontFamily: 'system-ui,sans-serif', minWidth: 180 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 22 }}>{inc.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 700, fontSize: 12, color: '#fff', margin: 0, lineHeight: 1.3 }}>{inc.title}</p>
                                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>📍 {inc.location}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    color: SEVERITY_LABEL[inc.severity],
                                    background: `${SEVERITY_LABEL[inc.severity]}18`,
                                    border: `1px solid ${SEVERITY_LABEL[inc.severity]}44`,
                                    borderRadius: 99, padding: '2px 8px',
                                }}>{inc.severity.toUpperCase()}</span>
                                <span style={{ fontSize: 10, color: '#64748b' }}>{inc.time}</span>
                                {inc.source === 'live' && (
                                    <span style={{ fontSize: 9, color: '#4ade80', background: '#4ade8018', border: '1px solid #4ade8033', borderRadius: 99, padding: '2px 6px' }}>LIVE</span>
                                )}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};
