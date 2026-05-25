/// <reference types="vite/client" />
import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapStore, MapStyle } from '../../store/mapStore';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const STYLE_URLS: Record<MapStyle, string> = {
    dark:       'mapbox://styles/mapbox/dark-v11',
    satellite:  'mapbox://styles/mapbox/satellite-streets-v12',
    standard:   'mapbox://styles/mapbox/streets-v12',
    terrain:    'mapbox://styles/mapbox/outdoors-v12',
    navigation: 'mapbox://styles/mapbox/navigation-night-v1',
};

// Mapbox zoom level at which we auto-switch back to the Three.js globe
const ZOOM_OUT_GLOBE_THRESHOLD = 1.8;

export const useGlobe = (container: HTMLDivElement | null) => {
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const buildingsAddedRef = useRef(false);
    const terrainSourceAddedRef = useRef(false);

    const {
        setMapInstance,
        isGlobeMode,
        toggleGlobeMode,
        zoom,
        center,
        mapStyle,
        show3DBuildings,
        showTerrain,
        setCurrentCoords,
        setMapZoom,
        setSelectedCountry,
        openPanel,
    } = useMapStore();

    // Keep isGlobeMode fresh inside event closures without re-running the init effect
    const isGlobeModeRef = useRef(isGlobeMode);
    isGlobeModeRef.current = isGlobeMode;
    const toggleGlobeModeRef = useRef(toggleGlobeMode);
    toggleGlobeModeRef.current = toggleGlobeMode;

    // ── Init map ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!container) return;
        if (!mapboxgl.accessToken) {
            console.warn('Set VITE_MAPBOX_TOKEN in .env for the real-world map.');
            return;
        }

        try {
            mapRef.current = new mapboxgl.Map({
                container,
                style: STYLE_URLS[mapStyle],
                projection: 'globe',
                zoom,
                center: center as [number, number],
                pitch: 45,
                bearing: 0,
                antialias: true,
            } as any);

            const map = mapRef.current;

            // Navigation controls
            map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
            map.addControl(new mapboxgl.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-left');

            map.on('load', () => {
                // ── Cinematic fog / atmosphere ────────────────────────────
                (map as any).setFog({
                    color: 'rgb(12, 16, 32)',
                    'high-color': 'rgb(18, 28, 70)',
                    'horizon-blend': 0.04,
                    'space-color': 'rgb(4, 5, 18)',
                    'star-intensity': 0.8,
                });

                // ── Sky layer (realistic daytime sky) ─────────────────────
                if (!map.getLayer('sky')) {
                    map.addLayer({
                        id: 'sky',
                        type: 'sky',
                        paint: {
                            'sky-type': 'atmosphere',
                            'sky-atmosphere-sun': [0.0, 90.0],
                            'sky-atmosphere-sun-intensity': 15,
                            'sky-atmosphere-color': 'rgba(30, 50, 120, 1)',
                            'sky-atmosphere-halo-color': 'rgba(60, 100, 200, 0.5)',
                        },
                    } as any);
                }

                // ── DEM terrain source ────────────────────────────────────
                if (!map.getSource('mapbox-dem')) {
                    map.addSource('mapbox-dem', {
                        type: 'raster-dem',
                        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        tileSize: 512,
                        maxzoom: 14,
                    });
                    terrainSourceAddedRef.current = true;
                }

                // Apply terrain immediately if enabled
                if (showTerrain) {
                    (map as any).setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
                }

                // ── 3-D Buildings ─────────────────────────────────────────
                add3DBuildings(map, show3DBuildings);

                // ── Country click → open CountryPanel ────────────────────
                map.on('click', (e) => {
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: ['country-label'],
                    });
                    if (features.length > 0) {
                        const name = features[0].properties?.name_en || features[0].properties?.name;
                        if (name) {
                            setSelectedCountry(name);
                            openPanel('country');
                        }
                    }
                });

                map.on('mouseenter', 'country-label', () => { map.getCanvas().style.cursor = 'pointer'; });
                map.on('mouseleave', 'country-label', () => { map.getCanvas().style.cursor = ''; });
            });

            // ── Live coordinates ──────────────────────────────────────────
            map.on('mousemove', (e) => {
                setCurrentCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            });

            // ── Zoom tracking + auto globe-switch on deep zoom-out ────────
            map.on('zoom', () => {
                const z = map.getZoom();
                setMapZoom(Math.round(z * 10) / 10);

                // When user zooms out past the threshold while in map mode, hand back to globe
                if (z < ZOOM_OUT_GLOBE_THRESHOLD && !isGlobeModeRef.current) {
                    toggleGlobeModeRef.current(true);
                }
            });

            setMapInstance(map);
        } catch (err) {
            console.error('Mapbox init error:', err);
        }

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
            buildingsAddedRef.current = false;
            terrainSourceAddedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container]);

    // ── Swap map style ────────────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        map.setStyle(STYLE_URLS[mapStyle]);
        buildingsAddedRef.current = false;
        terrainSourceAddedRef.current = false;
        map.once('styledata', () => {
            // Re-add atmosphere after style swap
            try {
                (map as any).setFog({
                    color: 'rgb(12, 16, 32)',
                    'high-color': 'rgb(18, 28, 70)',
                    'horizon-blend': 0.04,
                    'space-color': 'rgb(4, 5, 18)',
                    'star-intensity': 0.8,
                });
            } catch (_) {}

            // Re-add sky
            if (!map.getLayer('sky')) {
                try {
                    map.addLayer({
                        id: 'sky',
                        type: 'sky',
                        paint: {
                            'sky-type': 'atmosphere',
                            'sky-atmosphere-sun': [0.0, 90.0],
                            'sky-atmosphere-sun-intensity': 15,
                            'sky-atmosphere-color': 'rgba(30, 50, 120, 1)',
                        },
                    } as any);
                } catch (_) {}
            }

            // Re-add DEM source
            if (!map.getSource('mapbox-dem')) {
                try {
                    map.addSource('mapbox-dem', {
                        type: 'raster-dem',
                        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        tileSize: 512,
                        maxzoom: 14,
                    });
                    terrainSourceAddedRef.current = true;
                } catch (_) {}
            }

            if (showTerrain) {
                try { (map as any).setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 }); } catch (_) {}
            }

            add3DBuildings(map, show3DBuildings);
            buildingsAddedRef.current = true;
        });
    }, [mapStyle]);

    // ── Toggle 3-D buildings ──────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;
        const vis = show3DBuildings ? 'visible' : 'none';
        if (map.getLayer('3d-buildings')) {
            map.setLayoutProperty('3d-buildings', 'visibility', vis);
        }
    }, [show3DBuildings]);

    // ── Terrain toggle ────────────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;
        try {
            if (showTerrain) {
                if (!map.getSource('mapbox-dem')) {
                    map.addSource('mapbox-dem', {
                        type: 'raster-dem',
                        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        tileSize: 512,
                        maxzoom: 14,
                    });
                }
                (map as any).setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
            } else {
                (map as any).setTerrain(null);
            }
        } catch (_) {}
    }, [showTerrain]);

    // ── Globe ↔ Mercator projection ───────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        try {
            (map as any).setProjection(isGlobeMode ? 'globe' : 'mercator');
        } catch (_) {}
    }, [isGlobeMode]);

    // ── flyTo helper ──────────────────────────────────────────────────────────
    const flyTo = useCallback(
        (dest: [number, number], targetZoom: number, duration = 2000) => {
            mapRef.current?.flyTo({
                center: dest,
                zoom: targetZoom,
                duration,
                pitch: targetZoom > 14 ? 65 : targetZoom > 10 ? 50 : 35,
                essential: true,
            });
        },
        []
    );

    return { map: mapRef.current, flyTo };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function add3DBuildings(map: mapboxgl.Map, visible = true) {
    if (map.getLayer('3d-buildings')) return;
    if (!map.getSource('composite')) return;

    map.addLayer(
        {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 13,
            layout: { visibility: visible ? 'visible' : 'none' },
            paint: {
                'fill-extrusion-color': [
                    'interpolate', ['linear'], ['zoom'],
                    13,   'hsl(228, 28%, 10%)',
                    15,   'hsl(228, 28%, 15%)',
                    17,   'hsl(230, 30%, 20%)',
                    20,   'hsl(232, 32%, 26%)',
                ],
                'fill-extrusion-height': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 0,
                    13.5, ['get', 'height'],
                ],
                'fill-extrusion-base': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 0,
                    13.5, ['get', 'min_height'],
                ],
                'fill-extrusion-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 0,
                    14, 0.8,
                    18, 0.92,
                ],
                'fill-extrusion-ambient-occlusion-intensity': 0.4,
                'fill-extrusion-ambient-occlusion-radius': 3,
            },
        } as any,
        // Insert below label layers
        getLabelLayerId(map)
    );
}

function getLabelLayerId(map: mapboxgl.Map): string | undefined {
    const candidates = ['road-label-simple', 'road-label', 'waterway-label', 'natural-label'];
    for (const id of candidates) {
        if (map.getLayer(id)) return id;
    }
    return undefined;
}
