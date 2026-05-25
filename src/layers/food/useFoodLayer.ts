import { useEffect, useRef } from 'react';
import { FOOD_GEOJSON } from './foodData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'food-src';
const CIRCLES = 'food-circles';
const LABELS = 'food-labels';

export function useFoodLayer(map: any, active: boolean) {
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
            map.addSource(SRC, { type: 'geojson', data: FOOD_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 7, 6, 13, 10, 20],
                    'circle-color': ['interpolate', ['linear'], ['get', 'rating'],
                        8.0, '#f97316',
                        9.0, '#fb923c',
                        9.5, '#fbbf24',
                        10.0, '#facc15',
                    ],
                    'circle-opacity': 0.85,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'rgba(255,255,255,0.3)',
                },
            });

            map.addLayer({
                id: LABELS, type: 'symbol', source: SRC,
                minzoom: 4,
                layout: {
                    'text-field': ['get', 'name'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': ['interpolate', ['linear'], ['zoom'], 4, 9, 8, 12],
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top',
                },
                paint: { 'text-color': '#fbbf24', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    p.name, p.cuisine,
                    `⭐ ${p.rating}/10 · 🍽️ ${p.signature}`,
                    `Michelin: ${'★'.repeat(p.michelin || 0) || 'Not rated'} · ${p.vegan ? '🌱 Vegan options' : '🥩 Meat focus'}`,
                    '#f97316',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
