import { useEffect, useRef } from 'react';
import { SAFETY_GEOJSON } from './safetyData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'safety-src';
const CIRCLES = 'safety-circles';

export function useSafetyLayer(map: any, active: boolean) {
    const cleanupRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!map) return;
        const cleanup = () => {
            cleanupRef.current.forEach((fn) => fn());
            cleanupRef.current = [];
            safeRemove(map, [CIRCLES], [SRC]);
        };
        if (!active) { cleanup(); return; }

        const offStyleLoad = addWhenReady(map, () => {
            if (map.getSource(SRC)) safeRemove(map, [CIRCLES], [SRC]);
            map.addSource(SRC, { type: 'geojson', data: SAFETY_GEOJSON });
            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 7, 6, 13, 10, 20],
                    'circle-color': ['interpolate', ['linear'], ['get', 'score'],
                        0, '#ef4444', 50, '#f97316', 65, '#eab308', 80, '#22c55e', 95, '#10b981',
                    ],
                    'circle-opacity': 0.80,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'rgba(255,255,255,0.2)',
                },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    p.name, p.level,
                    `${p.score}/100 safety`,
                    p.advisory,
                    p.score >= 85 ? '#10b981' : p.score >= 70 ? '#eab308' : '#ef4444',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
