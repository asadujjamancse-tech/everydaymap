/* useBeachLayer — Leaflet layer hook for the Beach overlay. Adds/removes markers when active=true/false. */
import { useEffect, useRef } from 'react';
import { BEACH_GEOJSON } from './beachData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'beach-src';
const CIRCLES = 'beach-circles';
const LABELS = 'beach-labels';

export function useBeachLayer(map: any, active: boolean) {
    const cleanupRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!map) return;
        const cleanup = () => {
            cleanupRef.current.forEach((fn) => fn());
            cleanupRef.current = [];
            safeRemove(map, [LABELS, CIRCLES], [SRC]);
        };
        if (!active) { cleanup(); return; }

        const offStyleLoad = addWhenReady(map, () => {
            if (map.getSource(SRC)) safeRemove(map, [LABELS, CIRCLES], [SRC]);
            map.addSource(SRC, { type: 'geojson', data: BEACH_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 6, 15, 10, 22],
                    'circle-color': ['interpolate', ['linear'], ['get', 'rating'],
                        8.5, '#38bdf8',
                        9.0, '#06b6d4',
                        9.5, '#0ea5e9',
                        10.0, '#3b82f6',
                    ],
                    'circle-opacity': 0.85,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'rgba(255,255,255,0.4)',
                },
            });

            map.addLayer({
                id: LABELS, type: 'symbol', source: SRC,
                minzoom: 4,
                layout: {
                    'text-field': ['get', 'name'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 10,
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top',
                },
                paint: { 'text-color': '#bae6fd', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    p.name, `${p.country} · ${p.type}`,
                    `⭐ ${p.rating}/10 · 💧 ${p.water}`,
                    `Best: ${p.best} · Crowds: ${p.crowd}`,
                    '#06b6d4',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
