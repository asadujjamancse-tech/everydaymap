/* useTrendingLayer — Leaflet layer hook for the Trending overlay. Adds/removes markers when active=true/false. */
import { useEffect, useRef } from 'react';
import { TRENDING_GEOJSON } from './trendingData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'trending-src';
const CIRCLES = 'trending-circles';
const LABELS = 'trending-labels';

export function useTrendingLayer(map: any, active: boolean) {
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
            map.addSource(SRC, { type: 'geojson', data: TRENDING_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 9, 6, 16, 10, 24],
                    'circle-color': ['interpolate', ['linear'], ['get', 'searches'],
                        1.0, '#fbbf24',
                        2.0, '#f97316',
                        3.0, '#ef4444',
                        3.5, '#dc2626',
                    ],
                    'circle-opacity': 0.9,
                    'circle-stroke-width': 2.5,
                    'circle-stroke-color': 'rgba(255,255,255,0.4)',
                    'circle-blur': 0.1,
                },
            });

            map.addLayer({
                id: LABELS, type: 'symbol', source: SRC,
                minzoom: 3,
                layout: {
                    'text-field': ['concat', ['get', 'trend']],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 7, 11],
                    'text-offset': [0, 0],
                    'text-anchor': 'center',
                },
                paint: { 'text-color': '#ffffff', 'text-halo-color': '#7c1d1d', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    p.name, `${p.tag} · ${p.momentum}`,
                    `${p.trend} searches · Rank #${p.rank}`,
                    p.reason,
                    p.momentum === 'Surging' ? '#ef4444' : p.momentum === 'Rising' ? '#f97316' : '#fbbf24',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
