/**
 * POI (Points of Interest) Service
 * Provides functions to fetch nearby points of interest using OpenStreetMap's Overpass API
 */

/**
 * Fetches points of interest of a specific type near a location
 * @param lat Latitude
 * @param lon Longitude
 * @param radius Search radius in meters
 * @param type Type of POI (e.g., "restaurant", "museum", "cafe")
 * @returns Array of POIs with name, coordinates, and type
 */
export async function getPOIsByType(lat: number, lon: number, radius = 1000, type = "restaurant") {
    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const query = `
        [out:json];
        node["amenity"="${type}"](around:${radius}, ${lat}, ${lon});
        out;
    `;
    
    try {
        const response = await fetch(overpassUrl, {
            method: "POST",
            body: query
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.elements.map((poi: any) => ({
            id: poi.id.toString(),
            name: poi.tags.name || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
            description: poi.tags.description || `${type.charAt(0).toUpperCase() + type.slice(1)} near your location`,
            lat: poi.lat,
            lon: poi.lon,
            type: poi.tags.amenity || type,
            category: type.charAt(0).toUpperCase() + type.slice(1)
        }));
    } catch (error) {
        console.error("Error fetching POIs by type:", error);
        return [];
    }
}

/**
 * Fetches various points of interest near a location
 * @param lat Latitude
 * @param lon Longitude
 * @param radius Search radius in meters
 * @returns Array of POIs with name, coordinates, and type
 */
export async function getNearbyPOIs(lat: number, lon: number, radius = 1000) {
    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const query = `
        [out:json];
        (
            node["tourism"](around:${radius}, ${lat}, ${lon});
            node["historic"](around:${radius}, ${lat}, ${lon});
            node["amenity"="restaurant"](around:${radius}, ${lat}, ${lon});
            node["amenity"="cafe"](around:${radius}, ${lat}, ${lon});
            node["amenity"="bar"](around:${radius}, ${lat}, ${lon});
            node["amenity"="museum"](around:${radius}, ${lat}, ${lon});
            node["leisure"="park"](around:${radius}, ${lat}, ${lon});
        );
        out;
    `;

    try {
        const response = await fetch(overpassUrl, {
            method: "POST",
            body: query
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Map response to a usable format
        return data.elements.map((poi: any) => {
            // Determine category based on tags
            let category = "Point of Interest";
            if (poi.tags?.tourism) category = poi.tags.tourism.charAt(0).toUpperCase() + poi.tags.tourism.slice(1);
            else if (poi.tags?.historic) category = "Historic Site";
            else if (poi.tags?.amenity === "restaurant") category = "Restaurant";
            else if (poi.tags?.amenity === "cafe") category = "Cafe";
            else if (poi.tags?.amenity === "bar") category = "Bar";
            else if (poi.tags?.amenity === "museum") category = "Museum";
            else if (poi.tags?.leisure === "park") category = "Park";
            
            return {
                id: poi.id.toString(),
                name: poi.tags?.name || `${category}`,
                description: poi.tags?.description || `${category} near your location`,
                lat: poi.lat,
                lon: poi.lon,
                type: poi.tags?.amenity || poi.tags?.tourism || poi.tags?.historic || poi.tags?.leisure || "poi",
                category: category
            };
        });
    } catch (error) {
        console.error("Error fetching nearby POIs:", error);
        return [];
    }
}

/**
 * Generates a random crowd level for a POI
 * @returns Object with crowd level information
 */
export function generateCrowdLevel() {
    const levels = ['Low', 'Moderate', 'High'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    
    // Generate peak hours based on type
    const morningHour = 7 + Math.floor(Math.random() * 4);
    const afternoonHour = 12 + Math.floor(Math.random() * 4);
    const eveningHour = 17 + Math.floor(Math.random() * 4);
    
    const bestTimes = ['Morning', 'Afternoon', 'Evening'];
    const bestTime = bestTimes[Math.floor(Math.random() * bestTimes.length)];
    
    return {
        level,
        bestTime
    };
}

/**
 * Generates a random rating for a POI
 * @returns Rating between 3.0 and 5.0
 */
export function generateRating() {
    return (3 + Math.random() * 2).toFixed(1);
}

/**
 * Calculates distance between two coordinates in kilometers
 * @param lat1 First latitude
 * @param lon1 First longitude
 * @param lat2 Second latitude
 * @param lon2 Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Fetches an image for a POI based on its category
 * @param category POI category
 * @returns URL to an image
 */
export function getPOIImage(category: string): string {
    const categoryImages: {[key: string]: string[]} = {
        "Restaurant": [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        ],
        "Cafe": [
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        ],
        "Museum": [
            "https://images.unsplash.com/photo-1565060169861-2d4a3c960a7a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1518998053901-5348d3961a04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        ],
        "Historic Site": [
            "https://images.unsplash.com/photo-1558616629-899031969d5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1569383746724-6f1b94291282?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        ],
        "Park": [
            "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1500964757637-c85e8a162699?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        ],
        "Bar": [
            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        ],
        "Attraction": [
            "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        ]
    };
    
    // Default images for any category not specifically defined
    const defaultImages = [
        "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1549346155-7b5c55586122?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1541943869728-4bd4f450c8f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ];
    
    // Get images for the category or use default
    const images = categoryImages[category] || defaultImages;
    
    // Return a random image from the category
    return images[Math.floor(Math.random() * images.length)];
}