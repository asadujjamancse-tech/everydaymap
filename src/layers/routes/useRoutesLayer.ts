/* useRoutesLayer — Leaflet layer hook for the Routes overlay. Adds/removes markers when active=true/false. */
import { useEffect, useRef } from 'react';
import { ROUTES_GEOJSON } from './routesData';
import { addWhenReady, safeRemove } from '../utils';

const SRC = 'routes-src';
const LINES = 'routes-lines';
const DOTS = 'routes-dots';
const LABELS = 'routes-labels';

export function useRoutesLayer(map: any, active: boolean) {
    const cleanupRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!map) return;
        const cleanup = () => {
            cleanupRef.current.forEach((fn) => fn());
            cleanupRef.current = [];
            safeRemove(map, [LABELS, DOTS, LINES], [SRC]);
        };
        if (!active) { cleanup(); return; }

        const offStyleLoad = addWhenReady(map, () => {
            if (map.getSource(SRC)) safeRemove(map, [LABELS, DOTS, LINES], [SRC]);
            map.addSource(SRC, { type: 'geojson', data: ROUTES_GEOJSON });

            map.addLayer({
                id: LINES, type: 'line', source: SRC,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': ['interpolate', ['linear'], ['zoom'], 2, 2, 6, 4, 10, 6],
                    'line-opacity': 0.75,
                    'line-dasharray': [2, 1],
                },
            });

            map.addLayer({
                id: LABELS, type: 'symbol', source: SRC,
                minzoom: 3,
                layout: {
                    'symbol-placement': 'line-center',
                    'text-field': ['get', 'name'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 11,
                    'text-offset': [0, -1],
                    'text-anchor': 'bottom',
                    'text-max-angle': 30,
                },
                paint: { 'text-color': '#f1f5f9', 'text-halo-color': '#0f172a', 'text-halo-width': 2 },
            });

            // Hover popup on lines
            const popup = { setLngLat: () => popup, setHTML: () => popup, addTo: () => popup, remove: () => {} } as any;

            const onMouseEnter = (e: any) => {
                map.getCanvas().style.cursor = 'pointer';
                const p = e.features?.[0]?.properties;
                if (!p) return;
                popup.setLngLat(e.lngLat).setHTML(`
                    <div style="background:#0f172a;border:1px solid #6366f1;border-radius:10px;padding:12px 14px;min-width:200px;font-family:sans-serif;">
                        <div style="font-weight:700;font-size:13px;color:#f1f5f9;margin-bottom:4px;">${p.name}</div>
                        <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">${p.type} · ${p.duration}</div>
                        <div style="font-size:12px;color:#6366f1;font-weight:600;">$${p.budget} budget</div>
                        <div style="font-size:10px;color:#64748b;margin-top:6px;line-height:1.5;">${p.stops}</div>
                    </div>
                `).addTo(map);
            };

            const onMouseLeave = () => {
                map.getCanvas().style.cursor = '';
                popup.remove();
            };

            map.on('mouseenter', LINES, onMouseEnter);
            map.on('mouseleave', LINES, onMouseLeave);

            cleanupRef.current.push(() => {
                map.off('mouseenter', LINES, onMouseEnter);
                map.off('mouseleave', LINES, onMouseLeave);
                popup.remove();
            });
        });

        cleanupRef.current.push(offStyleLoad);
        return cleanup;
    }, [map, active]);
}
