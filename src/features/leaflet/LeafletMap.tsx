/**
 * LeafletMap.tsx — Interactive World Map (Leaflet + react-leaflet)
 * ─────────────────────────────────────────────────────────────────────────────
 * The full-screen map that renders when `isGlobeMode` is false.
 * Built on react-leaflet v4 + Leaflet v1.9.4.
 *
 * Internal components (all renderless or return Leaflet elements):
 *
 *   TileLayerSwitcher   — swaps tile URL when `mapStyle` changes in the store
 *   MapController       — registers the Leaflet map in the store; wires
 *                         mousemove → currentCoords and zoomend → mapZoom
 *   PlaceFlyController  — watches `selectedPlace` and calls map.flyTo()
 *   ResizeFixer         — ResizeObserver → map.invalidateSize() (fixes blank
 *                         map when the container resizes, e.g. sidebar open/close)
 *   RouteLayer          — draws the OSRM navigation route as a layered Polyline
 *                         (shadow + main + highlight) and fits bounds on update
 *
 * Additional layers mounted inside <MapContainer>:
 *   TravelDestinationMarkers — animated hero pins for Paris, Tokyo, etc.
 *   CountryFlagsLayer        — emoji country flags at low zoom
 *   LayerOverlays            — all 13 data overlay layers (budget, safety, etc.)
 *   CrowdIncidentsLayer      — crowd safety incident markers
 *   POI markers              — shown when showPOI is true
 *
 * Map styles available: dark, satellite, standard, terrain, navigation.
 * All use free tile providers — no Mapbox token required for the map itself.
 *
 * Leaflet Vite icon fix: Leaflet's default marker images break in Vite because
 * it rewrites asset URLs. Fixed by pointing to CDN-hosted images directly.
 */

import React, { useEffect, useRef } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../store/mapStore';
import { POI_DATA } from '../../layers/poi/poiData';
import { LayerOverlays } from './LayerOverlays';
import { CountryFlagsLayer } from './CountryFlagsLayer';
import { CrowdIncidentsLayer } from './CrowdIncidentsLayer';
import { TravelDestinationMarkers } from '../../components/maps/TravelDestinationMarkers';

// Fix Leaflet's broken default icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TILE_LAYERS: Record<string, { url: string; attr: string }> = {
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr: 'Tiles &copy; Esri &mdash; Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
    },
    standard: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attr: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    },
    navigation: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        attr: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
};


function createPOIIcon(emoji: string, category: string) {
    const COLORS: Record<string, string> = {
        restaurant: '#f97316',
        hotel: '#8b5cf6',
        museum: '#06b6d4',
        landmark: '#eab308',
        park: '#10b981',
        shopping: '#ec4899',
        airport: '#3b82f6',
    };
    const color = COLORS[category] ?? '#a78bfa';
    return L.divIcon({
        html: `<div style="
            width:32px;height:32px;
            background:rgba(15,23,42,0.92);
            border:2px solid ${color};
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:15px;
            box-shadow:0 0 10px ${color}55,0 2px 10px rgba(0,0,0,0.6);
            cursor:pointer;
        ">${emoji}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
    });
}

// Registers map in store and wires events
function MapController() {
    const map = useMap();
    const setMapInstance = useMapStore((s) => s.setMapInstance);
    const setCurrentCoords = useMapStore((s) => s.setCurrentCoords);
    const setMapZoom = useMapStore((s) => s.setMapZoom);

    useEffect(() => {
        setMapInstance(map as any);
    }, [map, setMapInstance]);

    useMapEvents({
        mousemove(e) {
            setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
        zoomend() {
            setMapZoom(Math.round(map.getZoom() * 10) / 10);
        },
    });

    return null;
}

// Flies to selectedPlace when it changes
function PlaceFlyController() {
    const map = useMap();
    const selectedPlace = useMapStore((s) => s.selectedPlace);

    useEffect(() => {
        if (!selectedPlace) return;
        const [lng, lat] = selectedPlace.coords;
        map.flyTo([lat, lng], selectedPlace.zoom ?? 11, { duration: 2, easeLinearity: 0.25 });
    }, [selectedPlace]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}

// Draws navigation route and fits bounds
function RouteLayer() {
    const map = useMap();
    const navigationRoute = useMapStore((s) => s.navigationRoute);

    useEffect(() => {
        if (!navigationRoute?.geometry?.coordinates?.length) return;
        const positions: L.LatLngExpression[] = navigationRoute.geometry.coordinates.map(
            ([lng, lat]: number[]) => [lat, lng],
        );
        const bounds = L.latLngBounds(positions as L.LatLngTuple[]);
        map.fitBounds(bounds, { padding: [80, 80], animate: true, duration: 1.5 });
    }, [navigationRoute]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!navigationRoute?.geometry?.coordinates?.length) return null;
    const positions: [number, number][] = navigationRoute.geometry.coordinates.map(
        ([lng, lat]: number[]) => [lat, lng],
    );
    return (
        <>
            <Polyline positions={positions} pathOptions={{ color: '#a78bfa', weight: 10, opacity: 0.15 }} />
            <Polyline positions={positions} pathOptions={{ color: '#7c3aed', weight: 6, opacity: 0.9 }} />
            <Polyline positions={positions} pathOptions={{ color: '#8b5cf6', weight: 3, opacity: 1 }} />
        </>
    );
}

// Handles tile layer swap when mapStyle changes
function TileLayerSwitcher() {
    const mapStyle = useMapStore((s) => s.mapStyle);
    const tile = TILE_LAYERS[mapStyle] ?? TILE_LAYERS.dark;
    return <TileLayer key={mapStyle} url={tile.url} attribution={tile.attr} />;
}

// Fixes resize bug — invalidates map size when container dimensions change
function ResizeFixer() {
    const map = useMap();
    useEffect(() => {
        const container = map.getContainer();
        const ro = new ResizeObserver(() => {
            map.invalidateSize({ animate: false });
        });
        ro.observe(container);
        return () => ro.disconnect();
    }, [map]);
    return null;
}

// ── POI popup ─────────────────────────────────────────────────────────────────

const PRICE_LABELS = ['', '$', '$$', '$$$', '$$$$'];

function POIPopupContent({ poi }: { poi: (typeof POI_DATA)[0] }) {
    const stars = '★'.repeat(Math.round(poi.rating)) + '☆'.repeat(5 - Math.round(poi.rating));
    return (
        <div style={{ fontFamily: 'system-ui,sans-serif', minWidth: 170 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{poi.emoji}</span>
                <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', margin: 0 }}>{poi.name}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{poi.city} · {poi.category}</p>
                </div>
            </div>
            <p style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 6, lineHeight: 1.4 }}>{poi.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fbbf24', fontSize: 11 }}>{stars} {poi.rating}</span>
                <span style={{ color: '#64748b', fontSize: 10 }}>{PRICE_LABELS[poi.priceLevel]}</span>
            </div>
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export const LeafletMap: React.FC = () => {
    const showPOI = useMapStore((s) => s.showPOI);

    return (
        <MapContainer
            center={[20, 0]}
            zoom={3}
            zoomControl={false}
            attributionControl={false}
            style={{ width: '100%', height: '100%', background: '#020617' }}
        >
            <TileLayerSwitcher />
            <MapController />
            <PlaceFlyController />
            <ResizeFixer />
            <RouteLayer />
            <TravelDestinationMarkers />
            <CountryFlagsLayer />
            <LayerOverlays />
            <CrowdIncidentsLayer />

            {/* POI markers */}
            {showPOI &&
                POI_DATA.map((poi) => (
                    <Marker
                        key={poi.id}
                        position={[poi.coords[1], poi.coords[0]]}
                        icon={createPOIIcon(poi.emoji, poi.category)}
                    >
                        <Popup className="leaflet-dark-popup">
                            <POIPopupContent poi={poi} />
                        </Popup>
                    </Marker>
                ))}
        </MapContainer>
    );
};
