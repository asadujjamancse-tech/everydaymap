/**
 * mapStore.ts — Global Application State (Zustand)
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the single source of truth for the entire TravelOS app.
 * Every panel, map layer, mode, and feature reads from and writes to this store.
 *
 * Built with Zustand — a minimal, fast React state library. No context providers
 * needed; any component can call `useMapStore(selector)` directly.
 *
 * State is divided into logical sections:
 *   1. Globe & Map        — Leaflet instance, view, zoom, style
 *   2. Modes & Layers     — which mode is active, which overlay layers are on
 *   3. Search & Filters   — search query, selected country
 *   4. AI Context         — data passed into the AI assistant
 *   5. Panels & UI        — which side panel is open
 *   6. Travel Routes      — multi-stop animated trip routes
 *   7. Navigation         — A→B turn-by-turn route (OSRM)
 *   8. POI                — points of interest markers
 *   9. Crowd Incidents     — live/simulated crowd safety data
 *  10. Actions            — all setters and toggles
 */

import { create } from 'zustand';
import type { GeoPlace } from '../services/geocodingService';

// ── Data Interfaces ───────────────────────────────────────────────────────────

/** One stop on a multi-destination travel route */
export interface RoutePoint {
    country: string;
    coordinates: [number, number]; // [lat, lng]
    days: number;
    budget: number;                // USD per day
    attractions: string[];
}

/** A complete multi-stop trip (e.g. Paris → Rome → Barcelona) */
export interface TravelRoute {
    id: string;
    name: string;
    points: RoutePoint[];
    totalBudget: number;
    totalDays: number;
    type: 'backpacking' | 'luxury' | 'budget' | 'adventure' | 'custom';
    isAnimating: boolean;
}

/** One step in a turn-by-turn navigation route */
export interface NavStep {
    instruction: string;
    distance: number; // metres
    maneuver: string;
}

/** A complete A→B navigation route returned by OSRM */
export interface NavigationRoute {
    origin: string;
    destination: string;
    originCoords: [number, number];       // [lat, lng]
    destinationCoords: [number, number];  // [lat, lng]
    mode: 'driving' | 'walking' | 'cycling';
    duration: number;   // seconds
    distance: number;   // metres
    steps: NavStep[];
    geometry: any;      // GeoJSON LineString — drawn by RouteLayer in LeafletMap
}

/** A point of interest marker on the map (restaurant, hotel, museum, etc.) */
export interface POIItem {
    id: string;
    name: string;
    category: string;
    coords: [number, number]; // [lng, lat] — GeoJSON order
    rating: number;
    priceLevel: number;       // 1 ($) to 4 ($$$$)
    description: string;
    openNow: boolean;
    city: string;
}

// ── Type Aliases ──────────────────────────────────────────────────────────────

/** Which tile style the Leaflet map uses */
export type MapStyle = 'dark' | 'satellite' | 'standard' | 'terrain' | 'navigation';

/**
 * The 9 main application modes.
 * Each mode activates a different side panel / overlay experience.
 */
export type MapMode =
    | 'globe'        // 3D globe view (cobe + nullschool)
    | 'navigation'   // Turn-by-turn routing
    | 'adventure'    // Outdoor / hiking mode
    | 'analytics'    // Country comparison stats
    | 'immersive'    // Full-screen street-level view
    | 'intelligence' // AI travel assistant
    | 'satellite'    // Satellite/aerial imagery
    | 'crowd'        // Crowd safety incidents
    | 'offline';     // Offline maps management

/** Filter for which POI category to show */
export type POICategory =
    | 'all' | 'restaurant' | 'hotel' | 'museum'
    | 'airport' | 'park' | 'shopping' | 'hospital' | 'attraction';

// ── Main Store Interface ──────────────────────────────────────────────────────

export interface MapState {

    // ── 1. Globe & Map ────────────────────────────────────────────────────────
    mapInstance: any | null;      // Leaflet Map object — set by MapController
    isGlobeMode: boolean;         // true = show Globe3D, false = show LeafletMap
    zoom: number;                 // logical zoom level (used by some panels)
    center: [number, number];     // map center [lat, lng]

    // ── 2. Modes & Layers ─────────────────────────────────────────────────────
    activeMode: MapMode;
    mapStyle: MapStyle;
    show3DBuildings: boolean;
    showTerrain: boolean;
    currentCoords: { lat: number; lng: number } | null; // mouse position on map
    mapZoom: number;                                     // actual Leaflet zoom level

    /** 13 independent overlay toggles shown in the Layer panel */
    activeLayers: {
        budget: boolean;      // Cost-of-living heat overlay
        safety: boolean;      // Safety score overlay
        weather: boolean;     // Weather conditions
        food: boolean;        // Food & dining highlights
        adventure: boolean;   // Hiking / adventure spots
        beach: boolean;       // Beach destinations
        nightlife: boolean;   // Nightlife hotspots
        nomad: boolean;       // Digital nomad hubs
        visa: boolean;        // Visa requirement overlay
        trending: boolean;    // Trending destinations
        heatmap: boolean;     // Visitor density heatmap
        liveWeather: boolean; // Live weather station pins
        routes: boolean;      // Saved travel route lines
    };

    // ── 3. Search & Filters ───────────────────────────────────────────────────
    searchQuery: string;
    selectedCountry: string | null;
    filteredCountries: string[];

    // ── 4. AI Context ─────────────────────────────────────────────────────────
    /** Passed to AI assistant so it can give contextually relevant answers */
    aiContext: {
        selectedCountry?: string;
        activeLayers?: string[];
        userPreferences?: Record<string, any>;
        savedDestinations?: string[];
    };

    // ── 5. Panels & UI ────────────────────────────────────────────────────────
    isPanelOpen: boolean;
    panelContent: 'country' | 'route' | 'comparison' | 'route-builder' | null;

    // ── 6. Travel Routes (animated) ───────────────────────────────────────────
    travelRoutes: TravelRoute[];
    activeRoute: TravelRoute | null;
    isRouteAnimating: boolean;
    routeProgress: number; // 0–1 animation progress

    // ── 7. Navigation (A→B routing) ───────────────────────────────────────────
    navigationRoute: NavigationRoute | null; // drawn as purple Polyline on map
    isNavigating: boolean;

    // ── 8. POI (Points of Interest) ───────────────────────────────────────────
    showPOI: boolean;
    poiCategory: POICategory;
    selectedPOI: POIItem | null;

    // ── 9. Globe Controls (cobe) ──────────────────────────────────────────────
    cameraPosition: { x: number; y: number; z: number };
    globeRotation: boolean;

    // ── 10. Selected Place (from search bar) ──────────────────────────────────
    /** Set by TopBar when user picks a geocoded result. Watched by Globe3D and LeafletMap. */
    selectedPlace: GeoPlace | null;

    // ── 11. Crowd Incidents ───────────────────────────────────────────────────
    crowdIncidents: Array<{
        id: string;
        type: string;
        title: string;
        location: string;
        coords: [number, number]; // [lat, lng] for map marker
        severity: 'low' | 'medium' | 'high';
        time: string;
        emoji: string;
        source: 'live' | 'simulated';
    }>;

    // ── Actions ───────────────────────────────────────────────────────────────
    setCrowdIncidents: (incidents: MapState['crowdIncidents']) => void;

    setMapInstance: (instance: any) => void;
    toggleGlobeMode: (isGlobe: boolean) => void;
    setZoom: (zoom: number) => void;
    setCenter: (center: [number, number]) => void;
    toggleLayer: (layerName: keyof MapState['activeLayers']) => void;
    setSearchQuery: (query: string) => void;
    setSelectedCountry: (country: string | null) => void;
    setFilteredCountries: (countries: string[]) => void;
    updateAIContext: (context: Partial<MapState['aiContext']>) => void;
    openPanel: (type: MapState['panelContent']) => void;
    closePanel: () => void;
    setActiveLayers: (layers: string[]) => void;

    setActiveMode: (mode: MapMode) => void;
    setMapStyle: (style: MapStyle) => void;
    toggle3DBuildings: () => void;
    toggleTerrain: () => void;
    setCurrentCoords: (coords: { lat: number; lng: number } | null) => void;
    setMapZoom: (zoom: number) => void;

    setNavigationRoute: (route: NavigationRoute | null) => void;
    setIsNavigating: (v: boolean) => void;

    setShowPOI: (show: boolean) => void;
    setPOICategory: (cat: POICategory) => void;
    setSelectedPOI: (poi: POIItem | null) => void;

    createRoute: (route: TravelRoute) => void;
    setActiveRoute: (route: TravelRoute | null) => void;
    startRouteAnimation: () => void;
    stopRouteAnimation: () => void;
    setRouteProgress: (progress: number) => void;
    deleteRoute: (id: string) => void;

    setCameraPosition: (pos: { x: number; y: number; z: number }) => void;
    toggleGlobeRotation: (enabled: boolean) => void;

    setSelectedPlace: (place: GeoPlace | null) => void;
}

// ── Store Creation ────────────────────────────────────────────────────────────

export const useMapStore = create<MapState>((set) => ({

    // ── Initial state ─────────────────────────────────────────────────────────
    mapInstance: null,
    isGlobeMode: false,
    zoom: 3,
    center: [0, 20],
    activeMode: 'globe',

    mapStyle: 'dark',
    show3DBuildings: true,
    showTerrain: false,
    currentCoords: null,
    mapZoom: 2,

    // All layers off by default — user enables them from the Layer panel
    activeLayers: {
        budget: false, safety: false, weather: false, food: false,
        adventure: false, beach: false, nightlife: false, nomad: false,
        visa: false, trending: false, heatmap: false, liveWeather: false, routes: false,
    },

    searchQuery: '',
    selectedCountry: null,
    filteredCountries: [],
    aiContext: {},

    isPanelOpen: false,
    panelContent: null,

    travelRoutes: [],
    activeRoute: null,
    isRouteAnimating: false,
    routeProgress: 0,

    navigationRoute: null,
    isNavigating: false,

    showPOI: false,
    poiCategory: 'all',
    selectedPOI: null,

    cameraPosition: { x: 0, y: 0, z: 2.5 },
    globeRotation: true,

    selectedPlace: null,
    crowdIncidents: [],

    // ── Actions ───────────────────────────────────────────────────────────────

    setCrowdIncidents: (incidents) => set({ crowdIncidents: incidents }),

    setMapInstance: (instance) => set({ mapInstance: instance }),
    toggleGlobeMode: (isGlobe) => set({ isGlobeMode: isGlobe }),
    setZoom: (zoom) => set({ zoom }),
    setCenter: (center) => set({ center }),

    // Flips a single layer flag without touching the others
    toggleLayer: (layerName) => set((state) => ({
        activeLayers: { ...state.activeLayers, [layerName]: !state.activeLayers[layerName] },
    })),

    setSearchQuery: (query) => set({ searchQuery: query }),

    // Selecting a country also opens the country detail panel automatically
    setSelectedCountry: (country) => set({ selectedCountry: country, isPanelOpen: country !== null }),
    setFilteredCountries: (countries) => set({ filteredCountries: countries }),

    // Deep-merges partial AI context so callers only need to pass changed keys
    updateAIContext: (context) => set((state) => ({ aiContext: { ...state.aiContext, ...context } })),

    openPanel: (type) => set({ isPanelOpen: true, panelContent: type }),
    closePanel: () => set({ isPanelOpen: false, panelContent: null }),

    // Replaces all layers with the given list (everything else is turned off)
    setActiveLayers: (layers) => set({ activeLayers: layers.reduce((acc, l) => ({ ...acc, [l]: true }), {} as any) }),

    setActiveMode: (mode) => set({ activeMode: mode }),
    setMapStyle: (style) => set({ mapStyle: style }),
    toggle3DBuildings: () => set((state) => ({ show3DBuildings: !state.show3DBuildings })),
    toggleTerrain: () => set((state) => ({ showTerrain: !state.showTerrain })),
    setCurrentCoords: (coords) => set({ currentCoords: coords }),
    setMapZoom: (zoom) => set({ mapZoom: zoom }),

    setNavigationRoute: (route) => set({ navigationRoute: route }),
    setIsNavigating: (v) => set({ isNavigating: v }),

    setShowPOI: (show) => set({ showPOI: show }),
    setPOICategory: (cat) => set({ poiCategory: cat }),
    setSelectedPOI: (poi) => set({ selectedPOI: poi }),

    createRoute: (route) => set((state) => ({ travelRoutes: [...state.travelRoutes, route] })),

    // Selecting a route also opens the route detail panel
    setActiveRoute: (route) => set({
        activeRoute: route,
        isPanelOpen: route !== null,
        panelContent: route ? 'route' : null,
    }),
    startRouteAnimation: () => set({ isRouteAnimating: true, routeProgress: 0 }),
    stopRouteAnimation: () => set({ isRouteAnimating: false }),
    setRouteProgress: (progress) => set({ routeProgress: progress }),

    // Removes route and clears activeRoute if it was the deleted one
    deleteRoute: (id) => set((state) => ({
        travelRoutes: state.travelRoutes.filter((r) => r.id !== id),
        activeRoute: state.activeRoute?.id === id ? null : state.activeRoute,
    })),

    setCameraPosition: (pos) => set({ cameraPosition: pos }),
    toggleGlobeRotation: (enabled) => set({ globeRotation: enabled }),

    setSelectedPlace: (place) => set({ selectedPlace: place }),
}));
