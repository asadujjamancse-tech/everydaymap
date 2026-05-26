/* useAdventureLayer — Leaflet layer hook for the Adventure overlay. Adds/removes markers when active=true/false. */
import { useEffect, useRef } from 'react';
import { ADVENTURE_GEOJSON } from './adventureData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'adventure-src';
const CIRCLES = 'adventure-circles';
const LABELS = 'adventure-labels';

const DIFFICULTY_COLOR: Record<string, string> = {
    Easy: '#22c55e',
    Medium: '#f97316',
    Hard: '#ef4444',
    Extreme: '#7c3aed',
};

export function useAdventureLayer(map: any, active: boolean) {
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
            map.addSource(SRC, { type: 'geojson', data: ADVENTURE_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 6, 15, 10, 22],
                    'circle-color': [
                        'match', ['get', 'difficulty'],
                        'Easy', '#22c55e',
                        'Medium', '#f97316',
                        'Hard', '#ef4444',
                        'Extreme', '#7c3aed',
                        '#64748b',
                    ],
                    'circle-opacity': 0.87,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'rgba(255,255,255,0.35)',
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
                paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    p.name, `${p.activity} · ${p.difficulty}`,
                    `⭐ ${p.rating}/10 · ⏱ ${p.duration}`,
                    `Best: ${p.season}`,
                    DIFFICULTY_COLOR[p.difficulty] || '#64748b',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
