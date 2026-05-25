/// <reference types="vite/client" />

const BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

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
};

export function getPOIIcon(category: string = '', maki: string = ''): string {
    const combined = `${category} ${maki}`.toLowerCase();
    for (const [key, icon] of Object.entries(POI_CATEGORY_ICONS)) {
        if (combined.includes(key)) return icon;
    }
    return '📍';
}

function mapFeature(f: any): GeoPlace {
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

export async function searchPlaces(
    query: string,
    options: {
        types?: string;
        limit?: number;
        proximity?: [number, number];
    } = {}
): Promise<GeoPlace[]> {
    const tk = token();
    if (!tk || query.trim().length < 1) return [];
    const {
        types = 'country,region,place,locality,address,poi',
        limit = 8,
        proximity,
    } = options;
    const proxParam = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : '';
    const url = `${BASE}/${encodeURIComponent(query)}.json?access_token=${tk}&types=${types}&language=en&limit=${limit}${proxParam}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.features || []).map(mapFeature);
    } catch {
        return [];
    }
}

export async function reverseGeocode(lng: number, lat: number): Promise<GeoPlace | null> {
    const tk = token();
    if (!tk) return null;
    try {
        const url = `${BASE}/${lng},${lat}.json?access_token=${tk}&types=place,country&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.features?.length) return null;
        return mapFeature(data.features[0]);
    } catch {
        return null;
    }
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
        const url = `${BASE}/${encodeURIComponent(category)}.json?proximity=${lng},${lat}&access_token=${tk}&types=poi&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.features || []).map(mapFeature);
    } catch {
        return [];
    }
}
