import { TravelRoute, RoutePoint } from '../../store/mapStore';

export interface RouteRequest {
    type: 'backpacking' | 'luxury' | 'budget' | 'adventure' | 'custom';
    budget: number;
    duration: number;
    interests: string[];
    regions: string[];
}

export const routeAIPlanner = {
    // Mock country coordinates
    countryCoordinates: {
        Thailand: [100.9925, 15.8700],
        Vietnam: [106.6452, 20.8517],
        Cambodia: [104.9910, 12.5673],
        Laos: [104.8600, 19.8500],
        Indonesia: [113.9213, -2.5489],
        Philippines: [121.7740, 12.8797],
        Malaysia: [101.6964, 4.2105],
        Singapore: [103.8198, 1.3521],
        Japan: [138.2529, 36.2048],
        South_Korea: [127.7669, 37.2662],
    } as Record<string, [number, number]>,

    async generateRoute(request: RouteRequest): Promise<TravelRoute> {
        console.log('Generating route:', request);

        // Mock route generation
        const countries = this.selectCountries(request);
        const dailyBudget = request.budget / request.duration;

        const points: RoutePoint[] = countries.map((country, index) => ({
            country,
            coordinates: this.countryCoordinates[country as keyof typeof this.countryCoordinates] || [0, 0],
            days: Math.ceil(request.duration / countries.length),
            budget: Math.ceil((request.budget / countries.length)),
            attractions: this.getAttractions(country, request.interests),
        }));

        const totalDays = points.reduce((sum, p) => sum + p.days, 0);
        const totalBudget = points.reduce((sum, p) => sum + p.budget, 0);

        return {
            id: Date.now().toString(),
            name: `${request.type.charAt(0).toUpperCase() + request.type.slice(1)} Route (${countries.join(', ')})`,
            points,
            totalBudget,
            totalDays,
            type: request.type,
            isAnimating: false,
        };
    },

    selectCountries(request: RouteRequest): string[] {
        // Mock country selection based on type
        const countryLists: Record<string, string[]> = {
            backpacking: ['Thailand', 'Vietnam', 'Cambodia', 'Laos'],
            luxury: ['Singapore', 'Japan', 'South_Korea'],
            budget: ['Cambodia', 'Laos', 'Vietnam', 'Philippines'],
            adventure: ['Indonesia', 'Philippines', 'Thailand'],
        };

        return countryLists[request.type] || ['Thailand', 'Vietnam', 'Cambodia'];
    },

    getAttractions(country: string, interests: string[]): string[] {
        const attractions: Record<string, string[]> = {
            Thailand: ['Bangkok', 'Phuket', 'Chiang Mai', 'Krabi'],
            Vietnam: ['Ho Chi Minh City', 'Hanoi', 'Ha Long Bay', 'Da Nang'],
            Cambodia: ['Siem Reap', 'Phnom Penh', 'Angkor Wat'],
            Laos: ['Luang Prabang', 'Vientiane', 'Kuang Si Falls'],
            Indonesia: ['Bali', 'Jakarta', 'Yogyakarta', 'Lombok'],
            Philippines: ['Manila', 'Boracay', 'Cebu', 'Palawan'],
            Japan: ['Tokyo', 'Kyoto', 'Osaka', 'Mt. Fuji'],
            Singapore: ['Marina Bay', 'Sentosa', 'Gardens by the Bay'],
        };

        return attractions[country] || ['Main city', 'Beach', 'Mountains'];
    },

    async optimizeRoute(route: TravelRoute): Promise<TravelRoute> {
        // Optimize for cost or experience
        return {
            ...route,
            points: route.points.sort((a, b) => {
                return a.budget - b.budget;
            }),
        };
    },
};
