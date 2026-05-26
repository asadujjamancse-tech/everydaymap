/**
 * geocodingService.ts — Place Search & Geocoding
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides place search (forward geocoding) and reverse geocoding for the
 * TopBar search box and any component that needs to resolve a name → coords.
 *
 * Two backends — chosen automatically based on whether VITE_MAPBOX_TOKEN is set:
 *
 *  1. Mapbox Geocoding API (preferred)
 *     • Requires VITE_MAPBOX_TOKEN in .env
 *     • Best result quality — handles streets, landmarks, POIs worldwide
 *     • Returns POI category + maki icon hints
 *
 *  2. Nominatim (OpenStreetMap) fallback
 *     • Free, no token needed
 *     • Rate limit: 1 request per second — enforced via _lastNominatimCall
 *     • Requires User-Agent header per Nominatim usage policy
 *
 * All results are normalised into the GeoPlace interface so callers don't need
 * to know which backend provided the data.
 *
 * Exported functions:
 *   searchPlaces(query, options)    → GeoPlace[]  (main search)
 *   reverseGeocode(lng, lat)        → GeoPlace | null
 *   getNearbyPOIs(category, center) → GeoPlace[]  (Mapbox only)
 */

/// <reference types="vite/client" />

const MAPBOX_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

const token = () => import.meta.env.VITE_MAPBOX_TOKEN || '';

export interface GeoPlace {
    id: string;
    name: string;
    fullName: string;
    type: string;
    coords: [number, number]; // [lng, lat]
    zoom: number;
    country?: string;
    category?: string;
    maki?: string;
}

const TYPE_ZOOM: Record<string, number> = {
    country: 4,
    region: 6,
    district: 8,
    place: 11,
    locality: 12,
    neighborhood: 14,
    address: 16,
    poi: 17,
};

export const TYPE_ICONS: Record<string, string> = {
    country: '🌍',
    region: '🗺️',
    district: '📍',
    place: '🏙️',
    locality: '🏘️',
    neighborhood: '🏠',
    address: '🏢',
    poi: '📌',
    road: '🛣️',
    suburb: '🏘️',
    city: '🏙️',
    town: '🏙️',
    village: '🏡',
};

const POI_CATEGORY_ICONS: Record<string, string> = {
    restaurant: '🍽️',
    cafe: '☕',
    hotel: '🏨',
    shop: '🛍️',
    mall: '🏬',
    hospital: '🏥',
    airport: '✈️',
    train: '🚂',
    museum: '🏛️',
    park: '🌳',
    landmark: '🗿',
    attraction: '🎡',
    school: '🏫',
    beach: '🏖️',
    mosque: '🕌',
    church: '⛪',
    temple: '⛩️',
    stadium: '🏟️',
    university: '🎓',
    zoo: '🦁',
};

export function getPOIIcon(category: string = '', maki: string = ''): string {
    const combined = `${category} ${maki}`.toLowerCase();
    for (const [key, icon] of Object.entries(POI_CATEGORY_ICONS)) {
        if (combined.includes(key)) return icon;
    }
    return '📍';
}

// ── Mapbox feature mapper ─────────────────────────────────────────────────────

function mapMapboxFeature(f: any): GeoPlace {
    const type = f.place_type?.[0] || 'place';
    const country = f.context?.find((c: any) => c.id?.startsWith('country'))?.text;
    return {
        id: f.id,
        name: f.text || f.place_name,
        fullName: f.place_name,
        type,
        coords: f.center as [number, number],
        zoom: TYPE_ZOOM[type] ?? 13,
        country,
        category: f.properties?.category,
        maki: f.properties?.maki,
    };
}

// ── Nominatim type → zoom ─────────────────────────────────────────────────────

function nominatimZoom(osmType: string, osmClass: string, type: string): number {
    const combined = `${osmType} ${osmClass} ${type}`.toLowerCase();
    if (combined.includes('country'))      return 4;
    if (combined.includes('state') || combined.includes('province') || combined.includes('region')) return 6;
    if (combined.includes('county') || combined.includes('district'))  return 9;
    if (combined.includes('city') || combined.includes('municipality')) return 10;
    if (combined.includes('town') || combined.includes('village'))      return 12;
    if (combined.includes('suburb') || combined.includes('neighbourhood') || combined.includes('quarter')) return 13;
    if (combined.includes('road') || combined.includes('street') || combined.includes('highway') || combined.includes('motorway')) return 15;
    if (combined.includes('building') || combined.includes('house') || combined.includes('residential')) return 17;
    return 14;
}

function nominatimType(osmClass: string, type: string): string {
    const combined = `${osmClass} ${type}`.toLowerCase();
    if (combined.includes('country'))                 return 'country';
    if (combined.includes('state') || combined.includes('province')) return 'region';
    if (combined.includes('city') || combined.includes('municipality')) return 'place';
    if (combined.includes('town') || combined.includes('village'))    return 'locality';
    if (combined.includes('suburb') || combined.includes('neighbourhood')) return 'neighborhood';
    if (combined.includes('road') || combined.includes('street') || combined.includes('highway')) return 'address';
    if (combined.includes('amenity') || combined.includes('tourism') || combined.includes('shop')) return 'poi';
    return 'place';
}

function mapNominatimFeature(f: any): GeoPlace {
    const type = nominatimType(f.class ?? '', f.type ?? '');
    const zoom = nominatimZoom(f.osm_type ?? '', f.class ?? '', f.type ?? '');
    const address = f.address ?? {};
    const country = address.country;

    // Build a clean display name (Nominatim full names can be very long)
    const parts = f.display_name?.split(',') ?? [];
    const shortName = parts[0]?.trim() ?? f.name ?? f.display_name;
    const fullName = parts.slice(0, 4).join(', ').trim();

    return {
        id: `nominatim-${f.place_id}`,
        name: shortName,
        fullName,
        type,
        coords: [parseFloat(f.lon), parseFloat(f.lat)] as [number, number],
        zoom,
        country,
        category: f.class,
        maki: f.type,
    };
}

// ── Nominatim search (free, no token needed) ──────────────────────────────────

let _lastNominatimCall = 0;

async function searchNominatim(query: string, limit = 8): Promise<GeoPlace[]> {
    // Nominatim rate limit: 1 req/sec — add a small polite delay
    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - _lastNominatimCall));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    _lastNominatimCall = Date.now();

    try {
        const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1&accept-language=en`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'TravelOS/1.0 (travel-intelligence-app)' },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data as any[]).map(mapNominatimFeature);
    } catch {
        return [];
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function searchPlaces(
    query: string,
    options: {
        types?: string;
        limit?: number;
        proximity?: [number, number];
    } = {}
): Promise<GeoPlace[]> {
    if (!query.trim() || query.length < 1) return [];
    const { types = 'country,region,place,locality,address,poi', limit = 8, proximity } = options;

    const tk = token();
    if (tk) {
        // Use Mapbox Geocoding when token is available — best quality
        try {
            const proxParam = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : '';
            const url = `${MAPBOX_BASE}/${encodeURIComponent(query)}.json?access_token=${tk}&types=${types}&language=en&limit=${limit}${proxParam}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const results = (data.features || []).map(mapMapboxFeature);
                if (results.length > 0) return results;
            }
        } catch { /* fall through to Nominatim */ }
    }

    // Nominatim fallback — free, works for any city/street/landmark worldwide
    return searchNominatim(query, limit);
}

export async function reverseGeocode(lng: number, lat: number): Promise<GeoPlace | null> {
    const tk = token();
    if (tk) {
        try {
            const url = `${MAPBOX_BASE}/${lng},${lat}.json?access_token=${tk}&types=place,country&limit=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.features?.length) return mapMapboxFeature(data.features[0]);
        } catch { /* fall through */ }
    }
    // Nominatim reverse
    try {
        const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'TravelOS/1.0' } });
        const data = await res.json();
        if (data?.place_id) return mapNominatimFeature(data);
    } catch { }
    return null;
}

export async function getNearbyPOIs(
    category: string,
    center: [number, number],
    limit = 20
): Promise<GeoPlace[]> {
    const tk = token();
    if (!tk) return [];
    try {
        const [lng, lat] = center;
        const url = `${MAPBOX_BASE}/${encodeURIComponent(category)}.json?proximity=${lng},${lat}&access_token=${tk}&types=poi&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.features || []).map(mapMapboxFeature);
    } catch {
        return [];
    }
}
