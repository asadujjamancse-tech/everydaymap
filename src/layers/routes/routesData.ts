// Famous travel routes as LineString GeoJSON
export const ROUTES_GEOJSON = {
    type: 'FeatureCollection' as const,
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [103.82, 1.35], [100.50, 13.76], [102.60, 17.97], [105.83, 21.03], [114.16, 22.28]
                ],
            },
            properties: { name: 'Southeast Asia Trail', type: 'Backpacker', duration: '30 days', budget: 1500, stops: 'Singapore → Bangkok → Chiang Rai → Hanoi → Hong Kong', color: '#f97316' },
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-9.14, 38.72], [2.17, 41.38], [2.35, 48.86], [4.90, 52.37], [-0.13, 51.51]
                ],
            },
            properties: { name: 'European Classic', type: 'Culture', duration: '21 days', budget: 3500, stops: 'Lisbon → Barcelona → Paris → Amsterdam → London', color: '#3b82f6' },
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [100.50, 13.76], [115.09, -8.34], [103.82, 1.35], [139.69, 35.69], [126.98, 37.57]
                ],
            },
            properties: { name: 'Asian Discovery', type: 'Culture', duration: '28 days', budget: 4000, stops: 'Bangkok → Bali → Singapore → Tokyo → Seoul', color: '#8b5cf6' },
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-74.01, 40.71], [-99.13, 19.43], [-74.07, 4.71], [-43.17, -22.91], [-77.04, -12.05]
                ],
            },
            properties: { name: 'Americas Adventure', type: 'Adventure', duration: '35 days', budget: 5000, stops: 'New York → Mexico City → Bogotá → Rio → Lima', color: '#10b981' },
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [55.27, 25.20], [35.21, 31.77], [36.82, -1.29], [-7.98, 31.63], [18.42, -33.92]
                ],
            },
            properties: { name: 'Middle East & Africa', type: 'Explorer', duration: '28 days', budget: 4500, stops: 'Dubai → Tel Aviv → Nairobi → Marrakech → Cape Town', color: '#f59e0b' },
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [172.47, -43.73], [151.21, -33.87], [174.76, -36.85], [157.95, -8.50], [139.69, 35.69]
                ],
            },
            properties: { name: 'Pacific Loop', type: 'Island-hop', duration: '28 days', budget: 6000, stops: 'Queenstown → Sydney → Auckland → Solomon Islands → Tokyo', color: '#06b6d4' },
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-21.93, 64.13], [13.41, 52.52], [14.42, 50.09], [18.09, 42.65], [23.73, 37.98]
                ],
            },
            properties: { name: 'Northern Europe Loop', type: 'Culture', duration: '18 days', budget: 3800, stops: 'Reykjavik → Berlin → Prague → Dubrovnik → Athens', color: '#64748b' },
        },
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [83.99, 28.00], [90.43, 27.46], [77.21, 28.61], [72.88, 19.08], [79.86, 6.92]
                ],
            },
            properties: { name: 'South Asia Spiritual', type: 'Spiritual', duration: '21 days', budget: 2000, stops: 'Nepal → Bhutan → Delhi → Mumbai → Colombo', color: '#ec4899' },
        },
    ],
};
