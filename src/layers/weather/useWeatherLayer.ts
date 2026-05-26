/* useWeatherLayer — Leaflet layer hook for the Weather overlay. Adds/removes markers when active=true/false. */
import { useEffect, useRef } from 'react';
import { WEATHER_GEOJSON } from './weatherData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'weather-src';
const CIRCLES = 'weather-circles';
const LABELS = 'weather-labels';

export function useWeatherLayer(map: any, active: boolean) {
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
            map.addSource(SRC, { type: 'geojson', data: WEATHER_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 6, 15, 10, 22],
                    'circle-color': ['interpolate', ['linear'], ['get', 'temp'],
                        -10, '#93c5fd', 5, '#3b82f6', 15, '#22d3ee', 22, '#86efac', 28, '#fbbf24', 35, '#ef4444',
                    ],
                    'circle-opacity': 0.85,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': 'rgba(255,255,255,0.3)',
                },
            });

            map.addLayer({
                id: LABELS, type: 'symbol', source: SRC,
                minzoom: 3,
                layout: {
                    'text-field': ['concat', ['get', 'temp'], '°'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 7, 12],
                    'text-offset': [0, 0],
                    'text-anchor': 'center',
                },
                paint: { 'text-color': '#ffffff', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    p.name, p.condition,
                    `${p.temp}°C · ${p.humidity}% humidity`,
                    `Best time: ${p.best}`,
                    p.temp > 28 ? '#f97316' : p.temp > 15 ? '#22d3ee' : '#93c5fd',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
