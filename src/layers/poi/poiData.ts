export type POICategory = 'restaurant' | 'hotel' | 'museum' | 'airport' | 'park' | 'shopping' | 'landmark';

export interface POIItem {
    id: string;
    name: string;
    category: POICategory;
    city: string;
    coords: [number, number];
    rating: number;
    description: string;
    priceLevel: 1 | 2 | 3 | 4;
    emoji: string;
}

export const POI_DATA: POIItem[] = [
    // Tokyo
    { id: 'tok-1', name: 'Sukiyabashi Jiro', category: 'restaurant', city: 'Tokyo', coords: [139.7647, 35.6713], rating: 4.9, description: 'World-famous sushi restaurant — 3 Michelin stars', priceLevel: 4, emoji: '🍣' },
    { id: 'tok-2', name: 'The Peninsula Tokyo', category: 'hotel', city: 'Tokyo', coords: [139.7586, 35.6722], rating: 4.8, description: 'Iconic luxury hotel overlooking the Imperial Palace', priceLevel: 4, emoji: '🏨' },
    { id: 'tok-3', name: 'Tokyo National Museum', category: 'museum', city: 'Tokyo', coords: [139.7762, 35.7189], rating: 4.6, description: "Japan's oldest and largest museum", priceLevel: 1, emoji: '🏛️' },
    { id: 'tok-4', name: 'Shinjuku Gyoen', category: 'park', city: 'Tokyo', coords: [139.7102, 35.6851], rating: 4.7, description: 'Stunning cherry blossom park in the heart of Tokyo', priceLevel: 1, emoji: '🌸' },
    { id: 'tok-5', name: 'Narita International Airport', category: 'airport', city: 'Tokyo', coords: [140.3929, 35.7720], rating: 4.2, description: 'Primary international gateway to Tokyo', priceLevel: 2, emoji: '✈️' },

    // Paris
    { id: 'par-1', name: 'Le Jules Verne', category: 'restaurant', city: 'Paris', coords: [2.2945, 48.8583], rating: 4.6, description: 'Michelin-starred dining inside the Eiffel Tower', priceLevel: 4, emoji: '🍷' },
    { id: 'par-2', name: 'Hôtel Ritz Paris', category: 'hotel', city: 'Paris', coords: [2.3308, 48.8688], rating: 4.9, description: 'The most legendary hotel in the world — Place Vendôme', priceLevel: 4, emoji: '🏨' },
    { id: 'par-3', name: 'Musée du Louvre', category: 'museum', city: 'Paris', coords: [2.3376, 48.8606], rating: 4.8, description: "World's largest art museum — home of the Mona Lisa", priceLevel: 2, emoji: '🖼️' },
    { id: 'par-4', name: 'Eiffel Tower', category: 'landmark', city: 'Paris', coords: [2.2945, 48.8584], rating: 4.7, description: "Paris's iconic iron lattice tower", priceLevel: 2, emoji: '🗼' },
    { id: 'par-5', name: 'Jardins du Trocadéro', category: 'park', city: 'Paris', coords: [2.2885, 48.8636], rating: 4.5, description: 'Best view of the Eiffel Tower with fountains & gardens', priceLevel: 1, emoji: '🌿' },

    // Bangkok
    { id: 'bkk-1', name: 'Gaggan Anand', category: 'restaurant', city: 'Bangkok', coords: [100.5369, 13.7490], rating: 4.8, description: 'Asia\'s best restaurant — progressive Indian cuisine', priceLevel: 4, emoji: '🍛' },
    { id: 'bkk-2', name: 'Mandarin Oriental Bangkok', category: 'hotel', city: 'Bangkok', coords: [100.5120, 13.7250], rating: 4.9, description: 'Legendary riverside luxury hotel since 1876', priceLevel: 4, emoji: '🏨' },
    { id: 'bkk-3', name: 'Wat Phra Kaew', category: 'landmark', city: 'Bangkok', coords: [100.4913, 13.7516], rating: 4.8, description: "Thailand's holiest temple within the Grand Palace complex", priceLevel: 1, emoji: '⛩️' },
    { id: 'bkk-4', name: 'Chatuchak Weekend Market', category: 'shopping', city: 'Bangkok', coords: [100.5532, 13.7999], rating: 4.5, description: "World's largest weekend market — 15,000 stalls", priceLevel: 1, emoji: '🛍️' },
    { id: 'bkk-5', name: 'Suvarnabhumi Airport', category: 'airport', city: 'Bangkok', coords: [100.7480, 13.6812], rating: 4.1, description: "Thailand's main international airport", priceLevel: 2, emoji: '✈️' },

    // New York
    { id: 'nyc-1', name: 'Eleven Madison Park', category: 'restaurant', city: 'New York', coords: [-73.9872, 40.7413], rating: 4.8, description: 'World top-3 restaurant — plant-based tasting menu', priceLevel: 4, emoji: '🌿' },
    { id: 'nyc-2', name: 'The Plaza Hotel', category: 'hotel', city: 'New York', coords: [-73.9747, 40.7645], rating: 4.7, description: 'National Historic Landmark — Central Park South icon', priceLevel: 4, emoji: '🏨' },
    { id: 'nyc-3', name: 'Metropolitan Museum of Art', category: 'museum', city: 'New York', coords: [-73.9632, 40.7794], rating: 4.8, description: "One of the world's greatest art museums", priceLevel: 2, emoji: '🏛️' },
    { id: 'nyc-4', name: 'Central Park', category: 'park', city: 'New York', coords: [-73.9654, 40.7829], rating: 4.8, description: '843-acre urban oasis in the heart of Manhattan', priceLevel: 1, emoji: '🌳' },
    { id: 'nyc-5', name: 'Empire State Building', category: 'landmark', city: 'New York', coords: [-73.9857, 40.7484], rating: 4.7, description: 'Iconic 1931 Art Deco skyscraper — observation deck', priceLevel: 2, emoji: '🏙️' },

    // Dubai
    { id: 'dxb-1', name: 'Nobu Dubai', category: 'restaurant', city: 'Dubai', coords: [55.2714, 25.2131], rating: 4.6, description: 'World-famous Japanese-Peruvian fusion at Atlantis', priceLevel: 4, emoji: '🍱' },
    { id: 'dxb-2', name: 'Burj Al Arab', category: 'hotel', city: 'Dubai', coords: [55.1853, 25.1412], rating: 4.9, description: "World's most luxurious hotel — the iconic sail shape", priceLevel: 4, emoji: '⛵' },
    { id: 'dxb-3', name: 'Burj Khalifa', category: 'landmark', city: 'Dubai', coords: [55.2744, 25.1972], rating: 4.8, description: "World's tallest building — 828m — observation at 148F", priceLevel: 3, emoji: '🏗️' },
    { id: 'dxb-4', name: 'Dubai Mall', category: 'shopping', city: 'Dubai', coords: [55.2796, 25.1987], rating: 4.5, description: "World's largest shopping mall — 1,200+ stores", priceLevel: 3, emoji: '🛍️' },
    { id: 'dxb-5', name: 'Dubai International Airport', category: 'airport', city: 'Dubai', coords: [55.3644, 25.2528], rating: 4.3, description: "World's busiest international airport", priceLevel: 2, emoji: '✈️' },

    // Bali
    { id: 'bal-1', name: 'Locavore', category: 'restaurant', city: 'Bali', coords: [115.2626, -8.5069], rating: 4.8, description: "Asia's 50 Best — hyper-local Balinese fine dining", priceLevel: 3, emoji: '🍽️' },
    { id: 'bal-2', name: 'Four Seasons Sayan', category: 'hotel', city: 'Bali', coords: [115.2489, -8.5059], rating: 4.9, description: 'Suspended over the Ayung River in lush jungle valley', priceLevel: 4, emoji: '🌿' },
    { id: 'bal-3', name: 'Tanah Lot Temple', category: 'landmark', city: 'Bali', coords: [115.0874, -8.6211], rating: 4.7, description: 'Ancient Hindu shrine on a rocky islet — sunset icon', priceLevel: 1, emoji: '⛩️' },
    { id: 'bal-4', name: 'Tegallalang Rice Terraces', category: 'park', city: 'Bali', coords: [115.2780, -8.4318], rating: 4.6, description: 'Stunning UNESCO-recognized subak irrigation terraces', priceLevel: 1, emoji: '🌾' },
];

export const POI_CATEGORIES: { id: POICategory; label: string; emoji: string }[] = [
    { id: 'restaurant', label: 'Restaurants', emoji: '🍽️' },
    { id: 'hotel', label: 'Hotels', emoji: '🏨' },
    { id: 'museum', label: 'Museums', emoji: '🏛️' },
    { id: 'airport', label: 'Airports', emoji: '✈️' },
    { id: 'park', label: 'Parks', emoji: '🌳' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { id: 'landmark', label: 'Landmarks', emoji: '📍' },
];
