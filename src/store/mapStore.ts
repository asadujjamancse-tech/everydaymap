import { create } from 'zustand';
import type { GeoPlace } from '../services/geocodingService';

export interface RoutePoint {
    country: string;
    coordinates: [number, number];
    days: number;
    budget: number;
    attractions: string[];
}

export interface TravelRoute {
    id: string;
    name: string;
    points: RoutePoint[];
    totalBudget: number;
    totalDays: number;
    type: 'backpacking' | 'luxury' | 'budget' | 'adventure' | 'custom';
    isAnimating: boolean;
}

export interface NavStep {
    instruction: string;
    distance: number; // metres
    maneuver: string;
}

export interface NavigationRoute {
    origin: string;
    destination: string;
    originCoords: [number, number];
    destinationCoords: [number, number];
    mode: 'driving' | 'walking' | 'cycling';
    duration: number;   // seconds
    distance: number;   // metres
    steps: NavStep[];
    geometry: any;      // GeoJSON LineString
}

export interface POIItem {
    id: string;
    name: string;
    category: string;
    coords: [number, number];
    rating: number;
    priceLevel: number;      // 1-4
    description: string;
    openNow: boolean;
    city: string;
}

export type MapStyle   = 'dark' | 'satellite' | 'standard' | 'terrain' | 'navigation';
export type MapMode    = 'globe' | 'navigation' | 'adventure' | 'analytics' | 'immersive' | 'intelligence' | 'satellite' | 'crowd' | 'offline';
export type POICategory = 'all' | 'restaurant' | 'hotel' | 'museum' | 'airport' | 'park' | 'shopping' | 'hospital' | 'attraction';

export interface MapState {
    // Globe & Map
    mapInstance: any | null;
    isGlobeMode: boolean;
    zoom: number;
    center: [number, number];

    // Active mode
    activeMode: MapMode;

    // Map style & visuals
    mapStyle: MapStyle;
    show3DBuildings: boolean;
    showTerrain: boolean;
    currentCoords: { lat: number; lng: number } | null;
    mapZoom: number;

    // Layers
    activeLayers: {
        budget: boolean; safety: boolean; weather: boolean; food: boolean;
        adventure: boolean; beach: boolean; nightlife: boolean; nomad: boolean;
        visa: boolean; trending: boolean; heatmap: boolean; liveWeather: boolean; routes: boolean;
    };

    // Search & Filters
    searchQuery: string;
    selectedCountry: string | null;
    filteredCountries: string[];

    // AI
    aiContext: {
        selectedCountry?: string;
        activeLayers?: string[];
        userPreferences?: Record<string, any>;
        savedDestinations?: string[];
    };

    // UI
    isPanelOpen: boolean;
    panelContent: 'country' | 'route' | 'comparison' | 'route-builder' | null;

    // Travel routes (animated)
    travelRoutes: TravelRoute[];
    activeRoute: TravelRoute | null;
    isRouteAnimating: boolean;
    routeProgress: number;

    // Navigation
    navigationRoute: NavigationRoute | null;
    isNavigating: boolean;

    // POI
    showPOI: boolean;
    poiCategory: POICategory;
    selectedPOI: POIItem | null;

    // Globe controls
    cameraPosition: { x: number; y: number; z: number };
    globeRotation: boolean;

    // Selected geocoded place (from search)
    selectedPlace: GeoPlace | null;

    // ── Actions ──────────────────────────────────────────────────────────────
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

export const useMapStore = create<MapState>((set) => ({
    mapInstance: null,
    isGlobeMode: true,
    zoom: 1.5,
    center: [0, 20],
    activeMode: 'globe',

    mapStyle: 'dark',
    show3DBuildings: true,
    showTerrain: false,
    currentCoords: null,
    mapZoom: 2,

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

    setMapInstance: (instance) => set({ mapInstance: instance }),
    toggleGlobeMode: (isGlobe) => set({ isGlobeMode: isGlobe }),
    setZoom: (zoom) => set({ zoom }),
    setCenter: (center) => set({ center }),

    toggleLayer: (layerName) => set((state) => ({
        activeLayers: { ...state.activeLayers, [layerName]: !state.activeLayers[layerName] },
    })),

    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedCountry: (country) => set({ selectedCountry: country, isPanelOpen: country !== null }),
    setFilteredCountries: (countries) => set({ filteredCountries: countries }),
    updateAIContext: (context) => set((state) => ({ aiContext: { ...state.aiContext, ...context } })),
    openPanel: (type) => set({ isPanelOpen: true, panelContent: type }),
    closePanel: () => set({ isPanelOpen: false, panelContent: null }),
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
    setActiveRoute: (route) => set({ activeRoute: route, isPanelOpen: route !== null, panelContent: route ? 'route' : null }),
    startRouteAnimation: () => set({ isRouteAnimating: true, routeProgress: 0 }),
    stopRouteAnimation: () => set({ isRouteAnimating: false }),
    setRouteProgress: (progress) => set({ routeProgress: progress }),
    deleteRoute: (id) => set((state) => ({
        travelRoutes: state.travelRoutes.filter((r) => r.id !== id),
        activeRoute: state.activeRoute?.id === id ? null : state.activeRoute,
    })),

    setCameraPosition: (pos) => set({ cameraPosition: pos }),
    toggleGlobeRotation: (enabled) => set({ globeRotation: enabled }),

    setSelectedPlace: (place) => set({ selectedPlace: place }),
}));
