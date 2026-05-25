import { useEffect, useRef } from 'react';
import { NIGHTLIFE_GEOJSON } from './nightlifeData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'nightlife-src';
const CIRCLES = 'nightlife-circles';
const LABELS = 'nightlife-labels';

export function useNightlifeLayer(map: any, active: boolean) {
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
            map.addSource(SRC, { type: 'geojson', data: NIGHTLIFE_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 6, 15, 10, 22],
                    'circle-color': ['interpolate', ['linear'], ['get', 'rating'],
                        8.5, '#a855f7',
                        9.0, '#8b5cf6',
                        9.5, '#7c3aed',
                        10.0, '#6d28d9',
                    ],
                    'circle-opacity': 0.88,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'rgba(255,255,255,0.25)',
                    'circle-blur': 0.2,
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
                paint: { 'text-color': '#d8b4fe', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    p.name, `${p.scene} · ${p.vibe}`,
                    `⭐ ${p.rating}/10 · 💰 ${p.budget}`,
                    `Open: ${p.opens} – ${p.closes}`,
                    '#8b5cf6',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
