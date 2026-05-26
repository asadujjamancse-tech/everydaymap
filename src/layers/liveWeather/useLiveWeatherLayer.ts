/* useLiveWeatherLayer — Leaflet layer hook for the LiveWeather overlay. Adds/removes markers when active=true/false. */
import { useEffect, useRef } from 'react';
import { LIVE_WEATHER_GEOJSON } from './liveWeatherData';
import { addWhenReady, safeRemove, popupHTML, attachHoverPopup } from '../utils';

const SRC = 'live-weather-src';
const CIRCLES = 'live-weather-circles';
const LABELS = 'live-weather-labels';
const ALERT_CIRCLES = 'live-weather-alerts';

export function useLiveWeatherLayer(map: any, active: boolean) {
    const cleanupRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!map) return;
        const cleanup = () => {
            cleanupRef.current.forEach((fn) => fn());
            cleanupRef.current = [];
            safeRemove(map, [LABELS, ALERT_CIRCLES, CIRCLES], [SRC]);
        };
        if (!active) { cleanup(); return; }

        const offStyleLoad = addWhenReady(map, () => {
            if (map.getSource(SRC)) safeRemove(map, [LABELS, ALERT_CIRCLES, CIRCLES], [SRC]);
            map.addSource(SRC, { type: 'geojson', data: LIVE_WEATHER_GEOJSON });

            map.addLayer({
                id: CIRCLES, type: 'circle', source: SRC,
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 6, 15, 10, 22],
                    'circle-color': ['interpolate', ['linear'], ['get', 'temp'],
                        0, '#bfdbfe',
                        10, '#60a5fa',
                        20, '#22d3ee',
                        28, '#86efac',
                        35, '#fbbf24',
                        42, '#ef4444',
                    ],
                    'circle-opacity': 0.85,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': 'rgba(255,255,255,0.3)',
                },
            });

            // Alert ring for weather alerts
            map.addLayer({
                id: ALERT_CIRCLES, type: 'circle', source: SRC,
                filter: ['==', ['get', 'alert'], true],
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 13, 6, 22, 10, 32],
                    'circle-color': 'transparent',
                    'circle-stroke-width': 3,
                    'circle-stroke-color': '#ef4444',
                    'circle-opacity': 0,
                    'circle-stroke-opacity': 0.9,
                },
            });

            map.addLayer({
                id: LABELS, type: 'symbol', source: SRC,
                minzoom: 3,
                layout: {
                    'text-field': ['concat', ['get', 'icon'], ' ', ['get', 'temp'], '°'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 7, 12],
                    'text-offset': [0, 0],
                    'text-anchor': 'center',
                },
                paint: { 'text-color': '#ffffff', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 },
            });

            const offPopup = attachHoverPopup(map, CIRCLES, (p) =>
                popupHTML(
                    `${p.name} ${p.icon}`,
                    `${p.condition}${p.alert ? ' ⚠️ WEATHER ALERT' : ''}`,
                    `${p.temp}°C (feels ${p.feels_like}°C) · UV ${p.uv}`,
                    `💨 Wind: ${p.wind} km/h`,
                    p.alert ? '#ef4444' : p.temp > 35 ? '#f97316' : p.temp < 5 ? '#93c5fd' : '#22d3ee',
                ),
            );
            cleanupRef.current.push(offPopup);
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
