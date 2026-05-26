/**
 * CountryFlagsLayer.tsx — Country Flag Markers on the Leaflet Map
 * Shows emoji flag markers at each country's capital when zoomed out (zoom < 7).
 * Markers scale with zoom and hide at close zoom to avoid clutter.
 * Clicking a flag opens a popup with country name and flag emoji.
 */
import React from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../store/mapStore';
import { COUNTRIES, isoToFlag } from '../../data/countryFlags';

// Show flags only when zoomed out enough (world/continent view)
const HIDE_AT_ZOOM = 7;

function createFlagIcon(flag: string, zoom: number) {
    // Scale the icon slightly with zoom
    const size = zoom <= 3 ? 26 : zoom <= 5 ? 28 : 30;
    const fontSize = zoom <= 3 ? 14 : zoom <= 5 ? 16 : 18;

    return L.divIcon({
        html: `<div style="
            width:${size}px;height:${size}px;
            display:flex;align-items:center;justify-content:center;
            font-size:${fontSize}px;
            line-height:1;
            filter:drop-shadow(0 1px 3px rgba(0,0,0,0.7));
            cursor:pointer;
            user-select:none;
        ">${flag}</div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2 + 4)],
    });
}

// Inner component that tracks zoom reactively
function FlagMarkers() {
    const [zoom, setZoom] = React.useState(3);
    const { setSelectedCountry, openPanel } = useMapStore();

    useMapEvents({
        zoomend(e) {
            setZoom(e.target.getZoom());
        },
        zoom(e) {
            setZoom(e.target.getZoom());
        },
    });

    if (zoom >= HIDE_AT_ZOOM) return null;

    return (
        <>
            {COUNTRIES.map((country) => {
                const flag = isoToFlag(country.code);
                return (
                    <Marker
                        key={country.code}
                        position={[country.lat, country.lng]}
                        icon={createFlagIcon(flag, zoom)}
                        eventHandlers={{
                            click: () => {
                                setSelectedCountry(country.name);
                                openPanel('country');
                            },
                        }}
                    >
                        <Popup className="leaflet-dark-popup">
                            <div style={{ fontFamily: 'system-ui,sans-serif', minWidth: 140 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 28 }}>{flag}</span>
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', margin: 0 }}>{country.name}</p>
                                        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>🏛️ {country.capital}</p>
                                    </div>
                                </div>
                                <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>
                                    {country.lat.toFixed(2)}°, {country.lng.toFixed(2)}°
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

export const CountryFlagsLayer: React.FC = () => <FlagMarkers />;
