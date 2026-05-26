/* useNomadLayer — Leaflet layer hook for the Nomad overlay. Adds/removes markers when active=true/false. */
import { useEffect, useRef } from 'react';
import { NOMAD_GEOJSON } from './nomadData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'nomad-src';
const CIRCLES = 'nomad-circles';
const LABELS = 'nomad-labels';

export function useNomadLayer(map: any, active: boolean) {
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
            map.addSource(SRC, { type: 'geojson', data: NOMAD_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 7, 6, 14, 10, 20],
                    'circle-color': ['interpolate', ['linear'], ['get', 'nomad_score'],
                        70, '#64748b',
                        80, '#06b6d4',
                        88, '#3b82f6',
                        94, '#6366f1',
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
                    'text-field': ['concat', ['get', 'nomad_score'], ''],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 10,
                    'text-offset': [0, 0],
                    'text-anchor': 'center',
                },
                paint: { 'text-color': '#ffffff', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    p.name, `${p.country} · ${p.timezone}`,
                    `Score: ${p.nomad_score}/100 · $${p.cost}/mo`,
                    `WiFi: ${p.internet}% · Co-working: ${p.coworking}% · Community: ${p.community}%`,
                    '#6366f1',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
