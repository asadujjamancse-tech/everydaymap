/* useVisaLayer — Leaflet layer hook for the Visa overlay. Adds/removes markers when active=true/false. */
import { useEffect, useRef } from 'react';
import { VISA_GEOJSON } from './visaData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'visa-src';
const CIRCLES = 'visa-circles';
const LABELS = 'visa-labels';

export function useVisaLayer(map: any, active: boolean) {
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
            map.addSource(SRC, { type: 'geojson', data: VISA_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 7, 6, 13, 10, 19],
                    'circle-color': ['interpolate', ['linear'], ['get', 'ease'],
                        70, '#ef4444',
                        80, '#f97316',
                        88, '#22c55e',
                        95, '#10b981',
                    ],
                    'circle-opacity': 0.83,
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
                    'text-size': 9,
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top',
                },
                paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    p.name, p.type,
                    `Stay: ${p.duration} · Cost: ${p.cost === 0 ? 'Free' : `$${p.cost}`}`,
                    `${p.digital_nomad_visa ? '💻 Digital Nomad Visa available' : '📋 Standard visa only'} · ${p.countries_free} passports free`,
                    p.ease >= 88 ? '#10b981' : p.ease >= 80 ? '#f97316' : '#ef4444',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
