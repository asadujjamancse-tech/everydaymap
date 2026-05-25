/// <reference types="vite/client" />
import mapboxgl from 'mapbox-gl';

export type MapInstance = any;

/** Add layers once the style is fully loaded, and re-add after every style swap. */
export function addWhenReady(map: MapInstance, fn: () => void): () => void {
    const wrapped = () => {
        try { fn(); } catch (_) {}
    };
    if (map.isStyleLoaded()) {
        wrapped();
    } else {
        map.once('style.load', wrapped);
    }
    map.on('style.load', wrapped);
    return () => map.off('style.load', wrapped);
}

/** Safely remove layers and sources that may or may not exist. */
export function safeRemove(map: MapInstance, layers: string[], sources: string[]): void {
    if (!map) return;
    try {
        layers.forEach((id) => { if (map.getLayer(id)) map.removeLayer(id); });
        sources.forEach((id) => { if (map.getSource(id)) map.removeSource(id); });
    } catch (_) {}
}

/** Dark-themed popup HTML consistent with the app design. */
export function popupHTML(
    title: string,
    subtitle: string,
    value: string,
    extra = '',
    valueColor = '#a78bfa',
): string {
    return `<div style="font-family:system-ui,sans-serif;background:#0f172a;color:#f1f5f9;border-radius:10px;padding:12px 14px;min-width:170px;max-width:240px;border:1px solid rgba(139,92,246,0.35);box-shadow:0 8px 32px rgba(0,0,0,0.6);line-height:1.4">
        <p style="font-weight:700;font-size:13px;margin:0 0 2px 0;color:#fff">${title}</p>
        <p style="color:#94a3b8;font-size:11px;margin:0 0 5px 0">${subtitle}</p>
        <p style="color:${valueColor};font-size:14px;font-weight:700;margin:0">${value}</p>
        ${extra ? `<p style="color:#64748b;font-size:10px;margin:5px 0 0 0">${extra}</p>` : ''}
    </div>`;
}

/** Create a standard Mapbox popup (no close button — hover-style). */
export function makePopup(): any {
    return new (mapboxgl as any).Popup({ closeButton: false, closeOnClick: false, offset: 14 });
}

/** Attach hover-popup handlers to a Mapbox layer. */
export function attachHoverPopup(
    map: MapInstance,
    layerId: string,
    getHTML: (props: Record<string, any>, lngLat: any) => string,
): () => void {
    const popup = makePopup();

    const onEnter = (e: any) => {
        map.getCanvas().style.cursor = 'pointer';
        const props = e.features[0]?.properties ?? {};
        popup.setLngLat(e.lngLat).setHTML(getHTML(props, e.lngLat)).addTo(map);
    };
    const onLeave = () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    };

    map.on('mouseenter', layerId, onEnter);
    map.on('mouseleave', layerId, onLeave);

    return () => {
        map.off('mouseenter', layerId, onEnter);
        map.off('mouseleave', layerId, onLeave);
        popup.remove();
    };
}
