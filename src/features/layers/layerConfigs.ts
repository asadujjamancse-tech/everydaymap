export interface LayerConfig {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    gradients: {
        min: string;
        max: string;
    };
    dataSource: string;
    filters: Record<string, any>;
}

export const layerConfigs: Record<string, LayerConfig> = {
    budget: {
        id: 'budget',
        name: 'Budget',
        description: 'Daily travel costs by country',
        icon: '💰',
        color: '#10b981',
        gradients: {
            min: 'rgb(16, 185, 129)',
            max: 'rgb(5, 46, 22)',
        },
        dataSource: 'budget-api',
        filters: {
            backpacker: true,
            standard: true,
            luxury: true,
        },
    },

    safety: {
        id: 'safety',
        name: 'Safety',
        description: 'Safety scores and travel advisories',
        icon: '🛡️',
        color: '#f59e0b',
        gradients: {
            min: 'rgb(34, 197, 94)',
            max: 'rgb(239, 68, 68)',
        },
        dataSource: 'safety-api',
        filters: {
            crimeRate: true,
            healthRisks: true,
            politicalStability: true,
        },
    },

    weather: {
        id: 'weather',
        name: 'Weather',
        description: 'Current weather and seasonal patterns',
        icon: '🌤️',
        color: '#3b82f6',
        gradients: {
            min: 'rgb(59, 130, 246)',
            max: 'rgb(15, 23, 42)',
        },
        dataSource: 'weather-api',
        filters: {
            temperature: true,
            rainfall: true,
            humidity: true,
        },
    },

    food: {
        id: 'food',
        name: 'Food',
        description: 'Culinary destinations and restaurants',
        icon: '🍜',
        color: '#ec4899',
        gradients: {
            min: 'rgb(236, 72, 153)',
            max: 'rgb(44, 13, 30)',
        },
        dataSource: 'food-api',
        filters: {
            streetFood: true,
            fineDining: true,
            localCuisine: true,
        },
    },

    adventure: {
        id: 'adventure',
        name: 'Adventure',
        description: 'Hiking, diving, and outdoor activities',
        icon: '🏔️',
        color: '#f97316',
        gradients: {
            min: 'rgb(249, 115, 22)',
            max: 'rgb(55, 21, 0)',
        },
        dataSource: 'adventure-api',
        filters: {
            hiking: true,
            mountaineering: true,
            watersports: true,
        },
    },

    beach: {
        id: 'beach',
        name: 'Beach',
        description: 'Tropical beaches and island destinations',
        icon: '🏖️',
        color: '#06b6d4',
        gradients: {
            min: 'rgb(6, 182, 212)',
            max: 'rgb(8, 47, 61)',
        },
        dataSource: 'beach-api',
        filters: {
            tropical: true,
            luxury: true,
            crowded: true,
        },
    },

    nightlife: {
        id: 'nightlife',
        name: 'Nightlife',
        description: 'Party scenes and entertainment areas',
        icon: '🌃',
        color: '#d946ef',
        gradients: {
            min: 'rgb(217, 70, 239)',
            max: 'rgb(44, 10, 54)',
        },
        dataSource: 'nightlife-api',
        filters: {
            clubs: true,
            bars: true,
            liveMusic: true,
        },
    },

    nomad: {
        id: 'nomad',
        name: 'Digital Nomad',
        description: 'Remote work hubs and coworking spaces',
        icon: '💻',
        color: '#8b5cf6',
        gradients: {
            min: 'rgb(139, 92, 246)',
            max: 'rgb(32, 10, 53)',
        },
        dataSource: 'nomad-api',
        filters: {
            internetSpeed: true,
            coworkingSpaces: true,
            monthlyExpense: true,
        },
    },

    visa: {
        id: 'visa',
        name: 'Visa',
        description: 'Visa requirements and travel restrictions',
        icon: '📋',
        color: '#0ea5e9',
        gradients: {
            min: 'rgb(14, 165, 233)',
            max: 'rgb(7, 40, 74)',
        },
        dataSource: 'visa-api',
        filters: {
            visaFree: true,
            eVisa: true,
            restrictions: true,
        },
    },

    trending: {
        id: 'trending',
        name: 'Trending',
        description: 'Popular and emerging destinations',
        icon: '🔥',
        color: '#ef4444',
        gradients: {
            min: 'rgb(239, 68, 68)',
            max: 'rgb(28, 7, 7)',
        },
        dataSource: 'trending-api',
        filters: {
            socialMedia: true,
            visitors: true,
            emerging: true,
        },
    },

    heatmap: {
        id: 'heatmap',
        name: 'Heatmap',
        description: 'Travel density and popularity',
        icon: '🔥',
        color: '#ff6b6b',
        gradients: {
            min: 'rgb(255, 107, 107)',
            max: 'rgb(139, 0, 0)',
        },
        dataSource: 'heatmap-api',
        filters: {
            density: true,
            popularity: true,
            seasonality: true,
        },
    },

    liveWeather: {
        id: 'liveWeather',
        name: 'Live Weather',
        description: 'Real-time weather overlay',
        icon: '⛅',
        color: '#87ceeb',
        gradients: {
            min: 'rgb(135, 206, 235)',
            max: 'rgb(25, 25, 112)',
        },
        dataSource: 'weather-api',
        filters: {
            temperature: true,
            precipitation: true,
            windSpeed: true,
        },
    },

    routes: {
        id: 'routes',
        name: 'Travel Routes',
        description: 'Popular travel paths',
        icon: '✈️',
        color: '#9d4edd',
        gradients: {
            min: 'rgb(157, 78, 221)',
            max: 'rgb(51, 16, 77)',
        },
        dataSource: 'routes-api',
        filters: {
            flights: true,
            trains: true,
            backpackingTrails: true,
        },
    },
};
