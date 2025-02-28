import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import { 
  Search, 
  MapPin, 
  Navigation2, 
  Award, 
  Calendar, 
  Settings, 
  Compass, 
  Sun, 
  Moon, 
  Share2, 
  AlertTriangle,
  Layers,
  Satellite,
  Mountain,
  Bus,
  Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ItineraryPanel } from './ItineraryPanel';
import { ChallengesPanel } from './ChallengesPanel';
import { SearchBar } from './SearchBar';
import { DirectionsPanel } from './DirectionsPanel';
import { LocationInfoBox } from './LocationInfoBox';
import { SettingsPanel } from './SettingsPanel';
import { AchievementPopup } from './AchievementPopup';
import { useTheme } from '../hooks/useTheme';
import { useMapZoom } from '../hooks/useMapZoom';
import { useTraffic } from '../hooks/useTraffic';
import { useCrowdLevel } from '../hooks/useCrowdLevel';
import { useWeather } from '../hooks/useWeather';
import { ItineraryPlanner } from './ItineraryPlanner';

interface MapProps {
  language?: string;
  initialSelectedPlace?: any;
  initialUserLocation?: [number, number];
}

// Map view types
type MapViewType = 'standard' | 'satellite' | 'terrain' | 'traffic' | 'transit';

// Fix Leaflet icon issues
const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const waypointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fix default icon issue
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ onZoomEnd, onBoundsChange, onLocationClick }: { 
  onZoomEnd: (zoom: number) => void;
  onBoundsChange: (bounds: [[number, number], [number, number]]) => void;
  onLocationClick: (location: any) => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    map.on('zoomend', () => {
      const zoom = map.getZoom();
      onZoomEnd(zoom);
    });

    map.on('moveend', () => {
      const bounds = map.getBounds();
      onBoundsChange([
        [bounds.getSouth(), bounds.getWest()],
        [bounds.getNorth(), bounds.getEast()]
      ]);
    });

    map.on('click', async (e) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        if (data) {
          onLocationClick({
            ...data,
            lat: e.latlng.lat,
            lon: e.latlng.lng
          });
        }
      } catch (error) {
        console.error('Error fetching location data:', error);
      }
    });

    // Cleanup event listeners on unmount
    return () => {
      map.off('zoomend');
      map.off('moveend');
      map.off('click');
    };
  }, [map, onZoomEnd, onBoundsChange, onLocationClick]);

  return null;
}

// Component to handle initial map setup with selected place
function InitialMapSetup({ selectedPlace, userLocation }: { 
  selectedPlace: any; 
  userLocation: [number, number] | null;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedPlace && userLocation) {
      // Create bounds that include both user location and selected place
      const bounds = L.latLngBounds(
        [userLocation[0], userLocation[1]],
        [selectedPlace.coordinates.lat, selectedPlace.coordinates.lng]
      );
      
      // Fit map to these bounds
      map.fitBounds(bounds, { padding: [50, 50] });
      
      // Add a slight delay to ensure the map has rendered properly
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } else if (selectedPlace) {
      // If only selected place is available
      map.setView(
        [selectedPlace.coordinates.lat, selectedPlace.coordinates.lng], 
        13
      );
    } else if (userLocation) {
      // If only user location is available
      map.setView(userLocation, 13);
    }
  }, [map, selectedPlace, userLocation]);
  
  return null;
}

export function Map({ language = 'en', initialSelectedPlace, initialUserLocation }: MapProps) {
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]);
  const [showItinerary, setShowItinerary] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showItineraryPlanner, setShowItineraryPlanner] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isGlobeView, setIsGlobeView } = useMapZoom();
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(initialUserLocation || null);
  const mapRef = useRef<any>(null);
  const [achievement, setAchievement] = useState<{
    title: string;
    description: string;
    points: number;
  } | null>(null);
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]]>([
    [0, 0],
    [0, 0]
  ]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapViewType, setMapViewType] = useState<MapViewType>('standard');
  const [showViewSelector, setShowViewSelector] = useState(false);
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [multiPointRoute, setMultiPointRoute] = useState<any>(null);

  const { traffic, loading: trafficLoading } = useTraffic(mapBounds);
  const crowdData = useCrowdLevel(selectedLocation?.place_id);
  const { weather, loading: weatherLoading } = useWeather(
    selectedLocation?.lat ? parseFloat(selectedLocation.lat) : undefined,
    selectedLocation?.lon ? parseFloat(selectedLocation.lon) : undefined
  );

  // Set initial selected location from props if available
  useEffect(() => {
    if (initialSelectedPlace && isInitialLoad) {
      console.log("Setting initial selected place:", initialSelectedPlace);
      
      // Convert the place data to the format expected by the map
      const locationData = {
        place_id: initialSelectedPlace.id,
        display_name: initialSelectedPlace.name + ", " + initialSelectedPlace.description,
        lat: initialSelectedPlace.coordinates.lat.toString(),
        lon: initialSelectedPlace.coordinates.lng.toString()
      };
      
      setSelectedLocation(locationData);
      
      // If we have a route, clear it to prepare for new route calculation
      if (route) {
        setRoute(null);
      }
      
      // Set initial position to the selected place
      setPosition([initialSelectedPlace.coordinates.lat, initialSelectedPlace.coordinates.lng]);
      
      // After a short delay, calculate route to the selected place
      setTimeout(() => {
        if (userLocation) {
          handleGetDirections();
        }
      }, 1000);
      
      setIsInitialLoad(false);
    }
  }, [initialSelectedPlace, isInitialLoad, userLocation]);

  useEffect(() => {
    if (initialUserLocation) {
      setUserLocation(initialUserLocation);
    } else {
      getUserLocation();
    }
  }, [initialUserLocation]);

  const getUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newUserLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          console.log("Got user location:", newUserLocation);
          setUserLocation(newUserLocation);
          if (!selectedLocation && !initialSelectedPlace) {
            setPosition(newUserLocation);
            if (mapRef.current) {
              const map = mapRef.current;
              if (map.setView) {
                map. setView(newUserLocation, 13);
              }
            }
          }
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError(`Location error: ${error.message}. Please enable location services.`);
          setIsLoadingLocation(false);
          
          // Use a default location if we can't get the user's location
          const defaultLocation: [number, number] = [37.7749, -122.4194]; // San Francisco
          setUserLocation(defaultLocation);
          setPosition(defaultLocation);
          if (mapRef.current) {
            const map = mapRef.current;
            if (map.setView) {
              map.setView(defaultLocation, 13);
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser");
      setIsLoadingLocation(false);
      
      // Use a default location if geolocation is not supported
      const defaultLocation: [number, number] = [37.7749, -122.4194]; // San Francisco
      setUserLocation(defaultLocation);
      setPosition(defaultLocation);
    }
  };

  const handleLocateMe = () => {
    if (userLocation) {
      setPosition(userLocation);
      if (mapRef.current) {
        const map = mapRef.current;
        if (map.setView) {
          map.setView(userLocation, 13);
        }
      }
    } else {
      getUserLocation();
    }
  };

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleGetDirections = async () => {
    if (!userLocation || !selectedLocation) return;

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${selectedLocation.lon},${selectedLocation.lat}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        
        setRoute({
          coordinates: coordinates,
          duration: Math.round(route.duration / 60),
          distance: (route.distance / 1000).toFixed(1),
          steps: [{
            instruction: `Head to your destination`,
            distance: Math.round(route.distance)
          }]
        });

        if (mapRef.current) {
          const map = mapRef.current;
          if (map.fitBounds) {
            const bounds = L.latLngBounds(
              coordinates.map((coord: number[]) => [coord[1], coord[0]])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
        
        // Show achievement for route planning
        setAchievement({
          title: "Route Planner",
          description: "Successfully planned your first route!",
          points: 50
        });
      }
    } catch (error) {
      console.error('Directions error:', error);
      // Fallback to simulated route
      simulateRoute();
    }
  };

  const simulateRoute = () => {
    if (!userLocation || !selectedLocation) return;
    
    // Create a straight line between user location and destination
    const startPoint = [userLocation[1], userLocation[0]];
    const endPoint = [parseFloat(selectedLocation.lon), parseFloat(selectedLocation.lat)];
    
    // Generate some intermediate points for a more realistic route
    const line = turf.lineString([startPoint, endPoint]);
    const distance = turf.length(line, {units: 'kilometers'});
    const steps = Math.max(5, Math.floor(distance / 0.5)); // One point every 500m
    
    const coordinates = [];
    for (let i = 0; i <= steps; i++) {
      const segment = i / steps;
      const point = turf.along(line, distance * segment, {units: 'kilometers'});
      coordinates.push(point.geometry.coordinates);
    }
    
    setRoute({
      coordinates: coordinates,
      duration: Math.round(distance * 3), // Rough estimate: 3 min per km
      distance: distance.toFixed(1),
      steps: [{
        instruction: `Head to ${selectedLocation.display_name.split(',')[0]}`,
        distance: Math.round(distance * 1000)
      }]
    });
    
    if (mapRef.current) {
      const map = mapRef.current;
      if (map.fitBounds) {
        const bounds = L.latLngBounds(
          coordinates.map((coord: number[]) => [coord[1], coord[0]])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    
    // Show achievement for route planning
    setAchievement({
      title: "Route Planner",
      description: "Successfully planned your first route!",
      points: 50
    });
  };

  const handleMultiPointRoute = (route: any) => {
    if (!route || !route.coordinates) return;
    
    setMultiPointRoute(route);
    
    // Extract waypoints from the route
    const extractedWaypoints = [];
    if (route.steps && route.steps.length > 0) {
      for (let i = 0; i < route.steps.length; i++) {
        const step = route.steps[i];
        if (step.fromPlace && step.startLocation) {
          extractedWaypoints.push({
            name: step.fromPlace,
            location: {
              lat: step.startLocation[0],
              lon: step.startLocation[1]
            }
          });
        }
        if (i === route.steps.length - 1 && step.toPlace && step.endLocation) {
          extractedWaypoints.push({
            name: step.toPlace,
            location: {
              lat: step.endLocation[0],
              lon: step.endLocation[1]
            }
          });
        }
      }
    }
    
    setWaypoints(extractedWaypoints);
    
    // Fit map to show the entire route
    if (mapRef.current && route.coordinates.length > 0) {
      const map = mapRef.current;
      if (map.fitBounds) {
        const bounds = L.latLngBounds(
          route.coordinates.map((coord: number[]) => [coord[1], coord[0]])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    
    // Show achievement for multi-point route planning
    setAchievement({
      title: "Itinerary Master",
      description: "Successfully planned a multi-stop itinerary!",
      points: 100
    });
  };

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
    const newPosition: [number, number] = [parseFloat(location.lat), parseFloat(location.lon)];
    setPosition(newPosition);
    if (mapRef.current) {
      const map = mapRef.current;
      if (map.setView) {
        map.setView(newPosition, 13);
      }
    }
    setRoute(null);
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    const newPosition: [number, number] = [parseFloat(location.lat), parseFloat(location.lon)];
    setPosition(newPosition);
    if (mapRef.current) {
      const map = mapRef.current;
      if (map.setView) {
        map.setView(newPosition, 13);
      }
    }
    setRoute(null);
  };

  const handleZoomEnd = (zoom: number) => {
    if (zoom < 3 && !isGlobeView) {
      setIsGlobeView(true);
    } else if (zoom >= 3 && isGlobeView) {
      setIsGlobeView(false);
    }
  };

  const handleBoundsChange = (bounds: [[number, number], [number, number]]) => {
    setMapBounds(bounds);
  };

  // Get the appropriate tile layer URL based on the map view type
  const getTileLayerUrl = () => {
    switch (mapViewType) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'traffic':
        // Using standard map for traffic as we'll overlay traffic data
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'transit':
        // Using standard map with transit data
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  // Get the appropriate attribution for the current map view
  const getTileLayerAttribution = () => {
    switch (mapViewType) {
      case 'satellite':
        return '&copy; <a href="https://www.arcgis.com/">Esri</a>';
      case 'terrain':
        return '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };

  // Map view type icon and label
  const getMapViewTypeInfo = (type: MapViewType) => {
    switch (type) {
      case 'satellite':
        return { icon: Satellite, label: 'Satellite' };
      case 'terrain':
        return { icon: Mountain, label: 'Terrain' };
      case 'traffic':
        return { icon: Car, label: 'Traffic' };
      case 'transit':
        return { icon: Bus, label: 'Transit' };
      default:
        return { icon: MapPin, label: 'Standard' };
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-6 h-6 text-blue-400" />
            <span className="text-white font-bold text-xl">GeoGuide AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={() => setShowChallenges(!showChallenges)}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
            >
              <Award className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} results={searchResults} onSelect={handleLocationSelect} />

      {locationError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1100] bg-red-500/80 backdrop-blur-md rounded-xl px-4 py-2 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-white" />
          <span className="text-white text-sm">{locationError}</span>
          <button 
            onClick={getUserLocation}
            className="ml-2 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-white text-xs transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="w-full h-full">
        <MapContainer
          center={position}
          zoom={13}
          className="w-full h-full"
          style={{ background: theme === 'dark' ? '#1a1a2e' : '#fff' }}
          ref={mapRef}
        >
          <TileLayer
            attribution={getTileLayerAttribution()}
            url={getTileLayerUrl()}
            className={theme === 'dark' && mapViewType !== 'satellite' ? 'map-tiles dark' : 'map-tiles'}
          />
          
          {/* Show traffic incidents if in traffic view */}
          {(mapViewType === 'traffic' || traffic.incidents.length > 0) && traffic.incidents.map((incident) => (
            <Circle
              key={incident.id}
              center={incident.location}
              radius={500}
              pathOptions={{
                color: incident.type === 'high' ? '#ef4444' : 
                       incident.type === 'moderate' ? '#f59e0b' : '#22c55e',
                fillColor: incident.type === 'high' ? '#ef4444' : 
                          incident.type === 'moderate' ? '#f59e0b' : '#22c55e',
                fillOpacity: 0.3
              }}
            >
              <Popup className="custom-popup">
                <div className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="font-bold">{incident.type}</h3>
                  </div>
                  <p className="text-sm">{incident.description}</p>
                </div>
              </Popup>
            </Circle>
          ))}

          {selectedLocation && (
            <Marker 
              position={[parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lon)]}
              icon={destinationIcon}
            >
              <Popup className="custom-popup">
                <div className="p-3">
                  <h3 className="font-bold text-lg">{selectedLocation.display_name}</h3>
                  {crowdData && (
                    <div className="mt-2 text-sm">
                      <p>Crowd Level: {crowdData.level}</p>
                      <p>Peak Hours: {crowdData.peakHours.join(', ')}</p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Show waypoints for multi-point route */}
          {waypoints.map((waypoint, index) => (
            <Marker 
              key={`waypoint-${index}`}
              position={[waypoint.location.lat, waypoint.location.lon]}
              icon={waypointIcon}
            >
              <Popup className="custom-popup">
                <div className="p-3">
                  <h3 className="font-bold text-lg">{waypoint.name}</h3>
                  <p className="text-sm">Stop #{index + 1}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {userLocation && (
            <Marker position={userLocation}>
              <Popup className="custom-popup">
                <div className="p-3">
                  <h3 className="font-bold text-lg">Your Location</h3>
                  {weather && (
                    <div className="mt-2 text-sm">
                      <p>{weather.temperature}°C - {weather.description}</p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Show single-point route */}
          {route && (
            <Polyline
              positions={route.coordinates.map((coord: number[]) => [coord[1], coord[0]])}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
            />
          )}
          
          {/* Show multi-point route */}
          {multiPointRoute && (
            <Polyline
              positions={multiPointRoute.coordinates.map((coord: number[]) => [coord[1], coord[0]])}
              color="#8b5cf6"
              weight={4}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}

          <MapController 
            onZoomEnd={handleZoomEnd}
            onBoundsChange={handleBoundsChange}
            onLocationClick={handleLocationClick}
          />
          
          {initialSelectedPlace && userLocation && isInitialLoad && (
            <InitialMapSetup 
              selectedPlace={initialSelectedPlace} 
              userLocation={userLocation} 
            />
          )}
        </MapContainer>
      </div>

      {/* Map View Type Selector */}
      <div className="absolute bottom-24 right-8 z-[1000]">
        <AnimatePresence>
          {showViewSelector && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-2 mb-4 flex items-center space-x-2"
            >
              {(['standard', 'satellite', 'terrain', 'traffic', 'transit'] as MapViewType[]).map((type) => {
                const { icon: Icon, label } = getMapViewTypeInfo(type);
                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setMapViewType(type);
                      setShowViewSelector(false);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                      mapViewType === type 
                        ? 'bg-blue-500/50 text-white' 
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowViewSelector(!showViewSelector)}
          className="p-4 bg-black/40 backdrop-blur-xl rounded-full text-white hover:bg-black/60 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          <Layers className="w-6 h-6 text-blue-400" />
        </motion.button>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 right-8 z-[1000] flex flex-col space-y-4">
        <button
          onClick={() => setShowItineraryPlanner(!showItineraryPlanner)}
          className="p-4 bg-black/40 backdrop-blur-xl rounded-full text-white hover:bg-black/60 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 group"
        >
          <Calendar className="w-6 h-6 text-purple-400 group-hover:animate-pulse" />
        </button>
        <button
          onClick={() => setShowItinerary(!showItinerary)}
          className="p-4 bg-black/40 backdrop-blur-xl rounded-full text-white hover:bg-black/60 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 group"
        >
          <Bus className="w-6 h-6 text-blue-400 group-hover:animate-pulse" />
        </button>
        <button
          onClick={handleLocateMe}
          className="p-4 bg-black/40 backdrop-blur-xl rounded-full text-white hover:bg-black/60 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 group"
        >
          <Navigation2 className="w-6 h-6 text-green-400 group-hover:animate-spin" />
        </button>
      </div>

      {showItinerary && (
        <ItineraryPanel 
          onClose={() => setShowItinerary(false)} 
          userLocation={userLocation}
        />
      )}
      {showChallenges && <ChallengesPanel onClose={() => setShowChallenges(false)} />}
      {showSettings && (
        <SettingsPanel 
          onClose={() => setShowSettings(false)}
          theme={theme}
          onThemeChange={toggleTheme}
          language={language}
        />
      )}
      {route && <DirectionsPanel route={route} onClose={() => setRoute(null)} />}
      {selectedLocation && (
        <LocationInfoBox
          location={selectedLocation}
          onGetDirections={handleGetDirections}
          onClose={() => setSelectedLocation(null)}
        />
      )}
      {showItineraryPlanner && userLocation && (
        <ItineraryPlanner
          onClose={() => setShowItineraryPlanner(false)}
          places={[
            {
              id: '1',
              name: 'Golden Gate Bridge',
              description: 'Iconic suspension bridge with stunning views',
              location: { lat: userLocation[0] + 0.02, lon: userLocation[1] + 0.03 },
              distance: 3.2,
              category: 'Attraction'
            },
            {
              id: '2',
              name: 'Local Cafe',
              description: 'Cozy cafe with great coffee and pastries',
              location: { lat: userLocation[0] + 0.01, lon: userLocation[1] - 0.01 },
              distance: 1.5,
              category: 'Dining'
            },
            {
              id: '3',
              name: 'City Museum',
              description: 'Historical museum with local artifacts',
              location: { lat: userLocation[0] - 0.01, lon: userLocation[1] + 0.02 },
              distance: 2.1,
              category: 'Sightseeing'
            },
            {
              id: '4',
              name: 'Central Market',
              description: 'Bustling market with local goods',
              location: { lat: userLocation[0] - 0.02, lon: userLocation[1] - 0.01 },
              distance: 2.8,
              category: 'Shopping'
            },
            {
              id: '5',
              name: 'Sunset Restaurant',
              description: 'Fine dining with panoramic views',
              location: { lat: userLocation[0] + 0.03, lon: userLocation[1] + 0.01 },
              distance: 3.5,
              category: 'Dining'
            }
          ]}
          userLocation={userLocation}
          onRouteGenerated={handleMultiPointRoute}
        />
      )}

      <AnimatePresence>
        {achievement && (
          <AchievementPopup
            title={achievement.title}
            description={achievement.description}
            points={achievement.points}
            onClose={() => setAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}