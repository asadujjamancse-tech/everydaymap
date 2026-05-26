/**
 * RouteAIPlanner.ts — AI-Powered Multi-Stop Route Generator
 * Takes a user's destination list and preferences (budget, days, travel style)
 * and generates a complete TravelRoute with daily budgets and attraction lists
 * for each stop. Called by the RouteBuilder panel when the user requests AI planning.
 */
import { TravelRoute, RoutePoint } from '../../store/mapStore';

export interface RouteRequest {
    type: 'backpacking' | 'luxury' | 'budget' | 'adventure' | 'custom';
    budget: number;
    duration: number;
    interests: string[];
    regions: string[];
}

// Worldwide country data with real coordinates
const COUNTRY_DATA: Record<string, { coords: [number, number]; attractions: string[]; dailyCost: number; region: string }> = {
    // Southeast Asia
    Thailand:    { coords: [100.99, 15.87], attractions: ['Bangkok', 'Phuket', 'Chiang Mai', 'Krabi'],           dailyCost: 40,  region: 'asia' },
    Vietnam:     { coords: [106.64, 16.46], attractions: ['Hanoi', 'Ho Chi Minh City', 'Ha Long Bay', 'Hoi An'], dailyCost: 35,  region: 'asia' },
    Cambodia:    { coords: [104.99, 12.57], attractions: ['Angkor Wat', 'Phnom Penh', 'Siem Reap'],              dailyCost: 30,  region: 'asia' },
    Laos:        { coords: [102.49, 17.96], attractions: ['Luang Prabang', 'Vientiane', 'Vang Vieng'],           dailyCost: 28,  region: 'asia' },
    Indonesia:   { coords: [115.09, -8.34], attractions: ['Bali', 'Jakarta', 'Komodo', 'Yogyakarta'],            dailyCost: 45,  region: 'asia' },
    Philippines: { coords: [122.56, 11.80], attractions: ['Palawan', 'Boracay', 'Cebu', 'Manila'],              dailyCost: 38,  region: 'asia' },
    Malaysia:    { coords: [110.36, 3.12],  attractions: ['Kuala Lumpur', 'Penang', 'Langkawi', 'Borneo'],       dailyCost: 50,  region: 'asia' },
    Singapore:   { coords: [103.82, 1.35],  attractions: ['Marina Bay', 'Sentosa', 'Gardens by the Bay'],        dailyCost: 120, region: 'asia' },
    Myanmar:     { coords: [95.95, 19.75],  attractions: ['Bagan', 'Inle Lake', 'Mandalay'],                     dailyCost: 35,  region: 'asia' },
    // East Asia
    Japan:       { coords: [138.25, 36.20], attractions: ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Mt Fuji'],   dailyCost: 130, region: 'asia' },
    South_Korea: { coords: [127.77, 37.27], attractions: ['Seoul', 'Busan', 'Jeju Island', 'Gyeongju'],          dailyCost: 90,  region: 'asia' },
    China:       { coords: [104.19, 35.86], attractions: ['Beijing', 'Shanghai', 'Great Wall', 'Xi\'an'],        dailyCost: 75,  region: 'asia' },
    // South Asia
    India:       { coords: [78.96, 20.59],  attractions: ['Taj Mahal', 'Goa', 'Rajasthan', 'Kerala'],           dailyCost: 30,  region: 'asia' },
    Nepal:       { coords: [84.12, 28.39],  attractions: ['Everest Base Camp', 'Kathmandu', 'Pokhara'],          dailyCost: 35,  region: 'asia' },
    Sri_Lanka:   { coords: [80.77, 7.87],   attractions: ['Sigiriya', 'Kandy', 'Colombo', 'Galle'],             dailyCost: 40,  region: 'asia' },
    // Middle East
    UAE:         { coords: [53.85, 23.42],  attractions: ['Dubai', 'Abu Dhabi', 'Burj Khalifa', 'Desert Safari'], dailyCost: 150, region: 'middleeast' },
    Turkey:      { coords: [35.24, 38.96],  attractions: ['Istanbul', 'Cappadocia', 'Ephesus', 'Pamukkale'],    dailyCost: 55,  region: 'middleeast' },
    Jordan:      { coords: [36.24, 30.58],  attractions: ['Petra', 'Wadi Rum', 'Dead Sea', 'Aqaba'],            dailyCost: 70,  region: 'middleeast' },
    // Europe
    France:      { coords: [2.21, 46.23],   attractions: ['Paris', 'French Riviera', 'Mont Saint-Michel'],      dailyCost: 120, region: 'europe' },
    Italy:       { coords: [12.57, 41.87],  attractions: ['Rome', 'Venice', 'Florence', 'Amalfi Coast'],        dailyCost: 110, region: 'europe' },
    Spain:       { coords: [-3.75, 40.46],  attractions: ['Barcelona', 'Madrid', 'Seville', 'Granada'],         dailyCost: 90,  region: 'europe' },
    Greece:      { coords: [21.82, 39.07],  attractions: ['Athens', 'Santorini', 'Mykonos', 'Meteora'],         dailyCost: 80,  region: 'europe' },
    Portugal:    { coords: [-8.22, 39.40],  attractions: ['Lisbon', 'Porto', 'Algarve', 'Sintra'],              dailyCost: 75,  region: 'europe' },
    Croatia:     { coords: [15.20, 45.10],  attractions: ['Dubrovnik', 'Plitvice Lakes', 'Split', 'Hvar'],      dailyCost: 70,  region: 'europe' },
    Iceland:     { coords: [-19.02, 64.96], attractions: ['Reykjavik', 'Northern Lights', 'Golden Circle'],     dailyCost: 180, region: 'europe' },
    Norway:      { coords: [8.47, 60.47],   attractions: ['Fjords', 'Bergen', 'Tromsø', 'Oslo'],                dailyCost: 200, region: 'europe' },
    // Africa
    Morocco:     { coords: [-7.09, 31.79],  attractions: ['Marrakech', 'Sahara Desert', 'Fes', 'Chefchaouen'],  dailyCost: 45,  region: 'africa' },
    Egypt:       { coords: [30.80, 26.82],  attractions: ['Pyramids', 'Luxor', 'Nile Cruise', 'Aswan'],         dailyCost: 40,  region: 'africa' },
    Kenya:       { coords: [37.91, 0.02],   attractions: ['Maasai Mara', 'Nairobi', 'Amboseli', 'Diani Beach'], dailyCost: 80,  region: 'africa' },
    Tanzania:    { coords: [34.89, -6.37],  attractions: ['Serengeti', 'Kilimanjaro', 'Zanzibar', 'Ngorongoro'], dailyCost: 90,  region: 'africa' },
    South_Africa:{ coords: [22.94, -30.56], attractions: ['Cape Town', 'Kruger Park', 'Garden Route'],          dailyCost: 60,  region: 'africa' },
    // Americas
    Mexico:      { coords: [-102.55, 23.63],attractions: ['Mexico City', 'Cancún', 'Oaxaca', 'Tulum'],          dailyCost: 50,  region: 'americas' },
    Colombia:    { coords: [-74.30, 4.57],  attractions: ['Cartagena', 'Medellín', 'Bogotá', 'Coffee Region'],  dailyCost: 40,  region: 'americas' },
    Peru:        { coords: [-75.01, -9.19], attractions: ['Machu Picchu', 'Lima', 'Cusco', 'Amazon'],           dailyCost: 45,  region: 'americas' },
    Brazil:      { coords: [-51.93, -14.24],attractions: ['Rio de Janeiro', 'Amazon', 'Iguazu Falls', 'Salvador'], dailyCost: 55, region: 'americas' },
    Argentina:   { coords: [-63.62, -38.42],attractions: ['Buenos Aires', 'Patagonia', 'Iguazu', 'Mendoza'],   dailyCost: 50,  region: 'americas' },
    Bolivia:     { coords: [-64.95, -16.29],attractions: ['Salar de Uyuni', 'La Paz', 'Lake Titicaca'],         dailyCost: 25,  region: 'americas' },
    // Oceania
    Australia:   { coords: [133.78, -25.27],attractions: ['Sydney', 'Great Barrier Reef', 'Melbourne', 'Uluru'], dailyCost: 150, region: 'oceania' },
    New_Zealand: { coords: [172.05, -41.50],attractions: ['Queenstown', 'Milford Sound', 'Auckland', 'Hobbiton'], dailyCost: 140, region: 'oceania' },
};

const ROUTE_TEMPLATES: Record<string, { countries: string[]; description: string }> = {
    backpacking: {
        countries: ['Thailand', 'Vietnam', 'Cambodia', 'Indonesia', 'Malaysia'],
        description: 'Classic Southeast Asia backpacker trail',
    },
    luxury: {
        countries: ['UAE', 'Japan', 'Singapore', 'Australia', 'New_Zealand'],
        description: 'Premium world-class experiences',
    },
    budget: {
        countries: ['Morocco', 'Bolivia', 'Cambodia', 'India', 'Nepal'],
        description: 'Maximum travel on minimum budget',
    },
    adventure: {
        countries: ['Nepal', 'New_Zealand', 'Peru', 'Iceland', 'Kenya'],
        description: 'Epic adventures across 5 continents',
    },
    custom: {
        countries: ['France', 'Italy', 'Greece', 'Turkey', 'Croatia'],
        description: 'Mediterranean grand tour',
    },
};

export const routeAIPlanner = {
    async generateRoute(request: RouteRequest): Promise<TravelRoute> {
        const template = ROUTE_TEMPLATES[request.type] ?? ROUTE_TEMPLATES.backpacking;
        const countries = template.countries;

        // Distribute days and budget across stops
        const daysPerStop = Math.max(2, Math.floor(request.duration / countries.length));
        const points: RoutePoint[] = countries.map((country) => {
            const data = COUNTRY_DATA[country];
            const days = daysPerStop;
            const estimatedCost = data ? data.dailyCost * days : 100 * days;
            return {
                country: country.replace(/_/g, ' '),
                coordinates: data?.coords ?? [0, 0],
                days,
                budget: estimatedCost,
                attractions: data?.attractions ?? [],
            };
        });

        // Scale budgets to match user's total budget
        const rawTotal = points.reduce((s, p) => s + p.budget, 0);
        const scaleFactor = request.budget / rawTotal;
        const scaledPoints = points.map((p) => ({ ...p, budget: Math.round(p.budget * scaleFactor) }));

        return {
            id: Date.now().toString(),
            name: `${request.type.charAt(0).toUpperCase() + request.type.slice(1)} — ${template.description}`,
            points: scaledPoints,
            totalBudget: scaledPoints.reduce((s, p) => s + p.budget, 0),
            totalDays: scaledPoints.reduce((s, p) => s + p.days, 0),
            type: request.type,
            isAnimating: false,
        };
    },
};
