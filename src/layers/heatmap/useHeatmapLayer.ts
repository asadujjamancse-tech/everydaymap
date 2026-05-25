import { useEffect, useRef } from 'react';
import { HEATMAP_GEOJSON } from './heatmapData';
import { addWhenReady, safeRemove } from '../utils';

const SRC = 'heatmap-src';
const HEATMAP = 'heatmap-layer';
const CIRCLES = 'heatmap-circles';

export function useHeatmapLayer(map: any, active: boolean) {
    const cleanupRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!map) return;
        const cleanup = () => {
            cleanupRef.current.forEach((fn) => fn());
            cleanupRef.current = [];
            safeRemove(map, [CIRCLES, HEATMAP], [SRC]);
        };
        if (!active) { cleanup(); return; }

        const offStyleLoad = addWhenReady(map, () => {
            if (map.getSource(SRC)) safeRemove(map, [CIRCLES, HEATMAP], [SRC]);
            map.addSource(SRC, { type: 'geojson', data: HEATMAP_GEOJSON });

            // Heatmap layer visible at lower zooms
            map.addLayer({
                id: HEATMAP,
                type: 'heatmap',
                source: SRC,
                maxzoom: 9,
                paint: {
                    'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
                    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(0,0,255,0)',
                        0.2, 'rgba(65,182,196,0.6)',
                        0.4, 'rgba(127,205,187,0.7)',
                        0.6, 'rgba(199,233,180,0.8)',
                        0.8, 'rgba(255,237,160,0.9)',
                        1, 'rgba(240,59,32,1)',
                    ],
                    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 9, 30],
                    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0],
                },
            });

            // Circle layer appears at higher zooms
            map.addLayer({
                id: CIRCLES,
                type: 'circle',
                source: SRC,
                minzoom: 7,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 4, 12, 12],
                    'circle-color': ['interpolate', ['linear'], ['get', 'weight'],
                        0.5, '#38bdf8',
                        0.7, '#f97316',
                        0.9, '#ef4444',
                        1.0, '#dc2626',
                    ],
                    'circle-stroke-color': 'white',
                    'circle-stroke-width': 1,
                    'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 1],
                },
            });
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
