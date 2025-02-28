import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Search, 
  MapPin, 
  Star, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Coffee,
  Utensils,
  Camera,
  Building,
  Landmark,
  Trees,
  Music
} from 'lucide-react';
import { RecommendationPanel } from './RecommendationPanel';
import { 
  getNearbyPOIs, 
  generateCrowdLevel, 
  generateRating, 
  calculateDistance,
  getPOIImage
} from '../utils/poiService';

interface Place {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  crowdLevel: string;
  bestTime: string;
  category: string;
  distance: number;
  location: {
    lat: number;
    lon: number;
  };
}

export function RecommendationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [recommendations, setRecommendations] = useState<Place[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');
  const [showRecommendationPanel, setShowRecommendationPanel] = useState(false);
  const navigate = useNavigate();
  
  const categories = [
    { name: 'All', icon: MapPin },
    { name: 'Restaurant', icon: Utensils },
    { name: 'Cafe', icon: Coffee },
    { name: 'Museum', icon: Building },
    { name: 'Historic', icon: Landmark },
    { name: 'Park', icon: Trees },
    { name: 'Entertainment', icon: Music },
    { name: 'Attraction', icon: Camera }
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchRecommendations();
    }
  }, [userLocation]);

  useEffect(() => {
    filterRecommendations();
  }, [recommendations, searchQuery, selectedCategory, sortBy]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newUserLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newUserLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use a default location if we can't get the user's location
          const defaultLocation: [number, number] = [37.7749, -122.4194]; // San Francisco
          setUserLocation(defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
      // Use a default location if geolocation is not supported
      const defaultLocation: [number, number] = [37.7749, -122.4194]; // San Francisco
      setUserLocation(defaultLocation);
    }
  };

  const fetchRecommendations = async () => {
    if (!userLocation) return;
    
    setIsLoading(true);
    try {
      // In a real app, we would fetch from an API
      // For now, we'll simulate with mock data
      await simulateNetworkDelay();
      const pois = await getNearbyPOIs(userLocation[0], userLocation[1], 5000);
      
      // Transform POIs into recommendations
      const recs = pois.map(poi => {
        const { level, bestTime } = generateCrowdLevel();
        return {
          id: poi.id,
          name: poi.name,
          description: poi.description,
          image: getPOIImage(poi.category),
          rating: parseFloat(generateRating()),
          crowdLevel: level,
          bestTime: bestTime,
          category: poi.category,
          distance: calculateDistance(userLocation[0], userLocation[1], poi.lat, poi.lon),
          location: {
            lat: poi.lat,
            lon: poi.lon
          }
        };
      });
      
      setRecommendations(recs);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Fallback to mock data
      generateMockRecommendations();
    } finally {
      setIsLoading(false);
    }
  };

  const simulateNetworkDelay = () => {
    return new Promise(resolve => setTimeout(resolve, 1500));
  };

  const generateMockRecommendations = () => {
    if (!userLocation) return;
    
    const mockPlaces: Place[] = [
      {
        id: '1',
        name: 'Golden Gate Bridge',
        description: 'Iconic suspension bridge with stunning views of the bay and city skyline.',
        image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        rating: 4.8,
        crowdLevel: 'High',
        bestTime: 'Morning',
        category: 'Attraction',
        distance: 3.2,
        location: {
          lat: 37.8199,
          lon: -122.4783
        }
      },
      {
        id: '2',
        name: 'Fisherman\'s Wharf',
        description: 'Popular waterfront area with seafood restaurants, shops, and sea lion viewing.',
        image: 'https://images.unsplash.com/photo-1541464522988-31b420f688b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        rating: 4.5,
        crowdLevel: 'High',
        bestTime: 'Afternoon',
        category: 'Attraction',
        distance: 1.8,
        location: {
          lat: 37.8080,
          lon: -122.4177
        }
      },
      {
        id: '3',
        name: 'Alcatraz Island',
        description: 'Historic federal prison on an island with tours of the facility and bay views.',
        image: 'https://images.unsplash.com/photo-1541943181603-d8fe267a5dcf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        rating: 4.7,
        crowdLevel: 'Moderate',
        bestTime: 'Morning',
        category: 'Historic',
        distance: 4.5,
        location: {
          lat: 37.8270,
          lon: -122.4230
        }
      },
      {
        id: '4',
        name: 'Palace of Fine Arts',
        description: 'Monumental structure with a classical European-inspired design and a lagoon.',
        image: 'https://images.unsplash.com/photo-1549346155-7b5c55586122?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        rating: 4.6,
        crowdLevel: 'Low',
        bestTime: 'Evening',
        category: 'Attraction',
        distance: 2.3,
        location: {
          lat: 37.8029,
          lon: -122.4484
        }
      },
      {
        id: '5',
        name: 'Pier 39',
        description: 'Lively bayside pier with scenic views, shopping, dining and sea lions.',
        image: 'https://images.unsplash.com/photo-1566137147-aab6fdcb0c7f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        rating: 4.4,
        crowdLevel: 'High',
        bestTime: 'Afternoon',
        category: 'Entertainment',
        distance: 1.9,
        location: {
          lat: 37.8087,
          lon: -122.4098
        }
      },
      {
        id: '6',
        name: 'Ghirardelli Square',
        description: 'Historic chocolate factory converted into shops and restaurants.',
        image: 'https://images.unsplash.com/photo-1569388330292-79cc1ec67270?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        rating: 4.3,
        crowdLevel: 'Moderate',
        bestTime: 'Evening',
        category: 'Restaurant',
        distance: 2.1,
        location: {
          lat: 37.8056,
          lon: -122.4212
        }
      },
      {
        id: '7',
        name: 'Golden Gate Park',
        description: 'Expansive urban park with gardens, museums, and recreational areas.',
        image: 'https://images.unsplash.com/photo-1598502710991-0d0f8b22a58e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        rating: 4.7,
        crowdLevel: 'Low',
        bestTime: 'Morning',
        category: 'Park',
        distance: 3.7,
        location: {
          lat: 37.7694,
          lon: -122.4862
        }
      },
      {
        id: '8',
        name: 'Lombard Street',
        description: 'Famous steep, crooked street with eight hairpin turns and beautiful gardens.',
        image: 'https://images.unsplash.com/photo-1541464522988-31b420f688b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        rating: 4.4,
        crowdLevel: 'High',
        bestTime: 'Morning',
        category: 'Attraction',
        distance: 1.5,
        location: {
          lat: 37.8021,
          lon: -122.4186
        }
      }
    ];
    
    setRecommendations(mockPlaces);
  };

  const filterRecommendations = () => {
    let filtered = [...recommendations];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(place => 
        place.name.toLowerCase().includes(query) || 
        place.description.toLowerCase().includes(query) ||
        place.category.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(place => 
        place.category === selectedCategory
      );
    }
    
    // Apply sorting
    if (sortBy === 'distance') {
      filtered.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }
    
    setFilteredRecommendations(filtered);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === 'All' ? null : category);
  };

  const handleSortChange = (sort: 'distance' | 'rating') => {
    setSortBy(sort);
  };

  const handlePlaceClick = (place: Place) => {
    // Navigate to place details page
    navigate(`/place/${place.id}`);
  };

  const handleShowOnMap = () => {
    navigate('/map', { 
      state: { 
        userLocation
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 overflow-hidden">
      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center">
          <Compass className="w-8 h-8 text-blue-400 mr-2" />
          <h1 className="text-2xl font-bold text-white">GeoGuide AI</h1>
        </div>
        <button
          onClick={handleShowOnMap}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
        >
          Explore Map
        </button>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for places, attractions, or activities..."
              className="w-full px-6 py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 pl-12"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.name}
                    onClick={() => handleCategorySelect(category.name)}
                    className={`px-4 py-2 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all duration-300 ${
                      (selectedCategory === category.name) || (!selectedCategory && category.name === 'All')
                        ? 'bg-blue-500/50 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
            >
              <Filter className="w-5 h-5 text-white" />
              <span className="text-white">Filters</span>
              {showFilters ? (
                <ChevronUp className="w-4 h-4 text-white" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 p-4 mb-4"
            >
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-white/70 mb-2">Sort by</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSortChange('distance')}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                        sortBy === 'distance'
                          ? 'bg-blue-500/50 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      Nearest
                    </button>
                    <button
                      onClick={() => handleSortChange('rating')}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                        sortBy === 'rating'
                          ? 'bg-blue-500/50 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      Top Rated
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-xl">Finding the best places for you...</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {filteredRecommendations.length} {filteredRecommendations.length === 1 ? 'Place' : 'Places'} Found
              </h2>
              <button
                onClick={() => setShowRecommendationPanel(true)}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/50 rounded-xl text-white transition-colors flex items-center space-x-2"
              >
                <MapPin className="w-4 h-4" />
                <span>View All on Panel</span>
              </button>
            </div>

            {/* Results Grid */}
            {filteredRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecommendations.map((place, index) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-300 cursor-pointer group"
                    onClick={() => handlePlaceClick(place)}
                  >
                    <div className="relative h-48">
                      <img 
                        src={place.image} 
                        alt={place.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      
                      <div className="absolute top-4 left-4 flex space-x-2">
                        <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                          {place.category}
                        </div>
                        <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-blue-400" />
                          <span>{place.distance.toFixed(1)} km</span>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{place.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400" fill="#facc15" />
                            <span className="text-white ml-1">{place.rating}</span>
                          </div>
                          <span className="text-white/60">•</span>
                          <span className="text-white/60">{place.crowdLevel} crowd</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-white/70 mb-4 line-clamp-2">{place.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-white/60">
                          Best time: <span className="text-blue-400">{place.bestTime}</span>
                        </div>
                        <button className="px-3 py-1 bg-blue-500/30 hover:bg-blue-500/50 rounded-lg text-white text-sm transition-colors">
                          Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-16 h-16 text-white/30 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No places found</h3>
                <p className="text-white/70 max-w-md">
                  We couldn't find any places matching your search criteria. Try adjusting your filters or search for something else.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="mt-6 px-6 py-3 bg-blue-500/30 hover:bg-blue-500/50 rounded-xl text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showRecommendationPanel && (
        <RecommendationPanel
          onClose={() => setShowRecommendationPanel(false)}
          recommendations={filteredRecommendations}
          userLocation={userLocation}
        />
      )}
    </div>
  );
}