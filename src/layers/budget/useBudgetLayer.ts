/**
 * useBudgetLayer — Cost-of-Living Overlay
 * Adds colour-coded circles to the map showing daily travel budget ranges
 * (green = cheap, red = expensive). Labels appear at zoom ≥ 4.
 * Uses Mapbox layer API — no-ops when the map is a Leaflet instance.
 * The visual equivalent is rendered by LayerOverlays.tsx for Leaflet.
 */
import { useEffect, useRef } from 'react';
import { BUDGET_GEOJSON } from './budgetData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'budget-src';
const CIRCLES = 'budget-circles';
const LABELS = 'budget-labels';

export function useBudgetLayer(map: any, active: boolean) {
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

            map.addSource(SRC, { type: 'geojson', data: BUDGET_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 6, 6, 12, 10, 18],
                    'circle-color': ['interpolate', ['linear'], ['get', 'budget'],
                        20, '#10b981',
                        50, '#84cc16',
                        80, '#eab308',
                        130, '#f97316',
                        200, '#ef4444',
                    ],
                    'circle-opacity': 0.82,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': 'rgba(255,255,255,0.25)',
                },
            });

            map.addLayer({
                id: LABELS, type: 'symbol', source: SRC,
                minzoom: 4,
                layout: {
                    'text-field': ['concat', '$', ['get', 'budget']],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 10,
                    'text-offset': [0, 1.4],
                    'text-anchor': 'top',
                },
                paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(p.name, p.tier, p.range, `${p.tourists}M annual tourists`, '#10b981'),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
