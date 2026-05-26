/**
 * LayerManager.tsx — Map Overlay Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 * A renderless component (returns null) that activates and deactivates all
 * 13 data overlay layers by calling their individual layer hooks.
 *
 * Each layer hook (e.g. useBudgetLayer, useSafetyLayer) receives:
 *  • `map`    — the Leaflet map instance (or null before the map is ready)
 *  • `active` — boolean from `activeLayers` in the store
 *
 * The hook itself is responsible for adding markers/polygons when active=true
 * and cleaning them up when active=false or when the component unmounts.
 *
 * This approach keeps LayerManager simple — it just wires flags to hooks —
 * and gives each layer full control over its own Leaflet objects.
 *
 * Mounted inside <Map> so it always has access to the Leaflet instance.
 */

import { useMapStore } from '../store/mapStore';
import { useBudgetLayer } from './budget/useBudgetLayer';
import { useSafetyLayer } from './safety/useSafetyLayer';
import { useWeatherLayer } from './weather/useWeatherLayer';
import { useFoodLayer } from './food/useFoodLayer';
import { useAdventureLayer } from './adventure/useAdventureLayer';
import { useBeachLayer } from './beach/useBeachLayer';
import { useNightlifeLayer } from './nightlife/useNightlifeLayer';
import { useNomadLayer } from './nomad/useNomadLayer';
import { useVisaLayer } from './visa/useVisaLayer';
import { useTrendingLayer } from './trending/useTrendingLayer';
import { useHeatmapLayer } from './heatmap/useHeatmapLayer';
import { useLiveWeatherLayer } from './liveWeather/useLiveWeatherLayer';
import { useRoutesLayer } from './routes/useRoutesLayer';

export function LayerManager() {
    const map = useMapStore((s) => s.mapInstance);
    const layers = useMapStore((s) => s.activeLayers);

    useBudgetLayer(map, layers.budget);
    useSafetyLayer(map, layers.safety);
    useWeatherLayer(map, layers.weather);
    useFoodLayer(map, layers.food);
    useAdventureLayer(map, layers.adventure);
    useBeachLayer(map, layers.beach);
    useNightlifeLayer(map, layers.nightlife);
    useNomadLayer(map, layers.nomad);
    useVisaLayer(map, layers.visa);
    useTrendingLayer(map, layers.trending);
    useHeatmapLayer(map, layers.heatmap);
    useLiveWeatherLayer(map, layers.liveWeather);
    useRoutesLayer(map, layers.routes);

    return null;
}
