/**
 * mapUtils.ts — Shared Leaflet Helper Functions
 * ─────────────────────────────────────────────────────────────────────────────
 * Small utility functions used by multiple map components so they don't each
 * duplicate the same Leaflet boilerplate.
 *
 *   createDarkDivIcon  — builds a consistent circular dark-themed DivIcon
 *                        with an emoji centre and optional text label below
 *   fitToCoords        — fits the map viewport to a set of coordinates with padding
 *   geoJsonToLatLng    — converts GeoJSON [lng,lat] order to Leaflet [lat,lng] order
 *
 * All exported from src/components/maps/index.ts for clean imports.
 */

import L from 'leaflet';

/** Dark-themed divIcon factory used across map components */
export function createDarkDivIcon(
    emoji: string,
    color: string,
    size = 32,
    label?: string,
): L.DivIcon {
    return L.divIcon({
        html: `
            <div style="
                width:${size}px;height:${size}px;
                background:rgba(10,14,30,0.92);
                border:2px solid ${color};
                border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                font-size:${Math.round(size * 0.47)}px;
                box-shadow:0 0 12px ${color}55, 0 2px 8px rgba(0,0,0,0.6);
                cursor:pointer;
                position:relative;
            ">${emoji}${label ? `<span style="
                position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);
                white-space:nowrap;font-size:9px;font-weight:700;color:${color};
                background:rgba(10,14,30,0.85);padding:1px 5px;border-radius:4px;
                font-family:system-ui,sans-serif;
            ">${label}</span>` : ''}</div>`,
        className: '',
        iconSize: [size, size + (label ? 22 : 0)],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2 + 6)],
    });
}

/** Fit Leaflet map to an array of [lat,lng] coordinate pairs */
export function fitToCoords(map: L.Map, coords: [number, number][], padding = 80) {
    if (!coords.length) return;
    const bounds = L.latLngBounds(coords as L.LatLngTuple[]);
    map.fitBounds(bounds, { padding: [padding, padding], animate: true, duration: 1.4 });
}

/** Convert GeoJSON [lng, lat] pairs to Leaflet [lat, lng] tuples */
export function geoJsonToLatLng(coords: number[][]): [number, number][] {
    return coords.map(([lng, lat]) => [lat, lng]);
}
