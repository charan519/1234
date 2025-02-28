import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Navigation2, Calendar, ArrowRight, Loader, Check, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as turf from '@turf/turf';

interface Place {
  id: string;
  name: string;
  description?: string;
  location: {
    lat: number;
    lon: number;
  };
  distance?: number;
  category?: string;
  image?: string;
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: [number, number];
  endLocation: [number, number];
  fromPlace?: string;
  toPlace?: string;
}

interface Route {
  duration: number;
  distance: number;
  steps: RouteStep[];
  coordinates: [number, number][];
}

interface ItineraryPlannerProps {
  onClose: () => void;
  places: Place[];
  userLocation: [number, number] | null;
  onRouteGenerated?: (route: Route) => void;
}

export function ItineraryPlanner({ onClose, places, userLocation, onRouteGenerated }: ItineraryPlannerProps) {
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<Route | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transportMode, setTransportMode] = useState<'driving-car' | 'cycling-regular' | 'foot-walking'>('driving-car');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [showDirections, setShowDirections] = useState(false);

  useEffect(() => {
    // Pre-select all places by default
    setSelectedPlaces([...places]);
  }, [places]);

  const togglePlaceSelection = (place: Place) => {
    if (selectedPlaces.some(p => p.id === place.id)) {
      setSelectedPlaces(selectedPlaces.filter(p => p.id !== place.id));
    } else {
      setSelectedPlaces([...selectedPlaces, place]);
    }
    // Reset route when selection changes
    setOptimizedRoute(null);
  };

  const generateItinerary = async () => {
    if (!userLocation || selectedPlaces.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      // In a real app, we would call the backend API
      // For now, we'll simulate with a delay and generate a route
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate route with the user location as starting point
      const allPoints = [
        { id: 'user', name: 'Your Location', location: { lat: userLocation[0], lon: userLocation[1] } },
        ...selectedPlaces
      ];
      
      const route = await generateRoute(allPoints, transportMode);
      setOptimizedRoute(route);
      
      if (onRouteGenerated) {
        onRouteGenerated(route);
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const optimizeRoute = async () => {
    if (!userLocation || selectedPlaces.length === 0) return;
    
    setIsOptimizing(true);
    
    try {
      // Simulate API call for route optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reorder places by distance (simple greedy algorithm)
      // In a real app, this would use a proper TSP algorithm or API
      const startPoint = { lat: userLocation[0], lon: userLocation[1] };
      let remainingPlaces = [...selectedPlaces];
      const orderedPlaces = [];
      let currentPoint = startPoint;
      
      while (remainingPlaces.length > 0) {
        // Find closest place to current point
        let closestIdx = 0;
        let closestDistance = calculateDistance(
          currentPoint.lat, currentPoint.lon, 
          remainingPlaces[0].location.lat, remainingPlaces[0].location.lon
        );
        
        for (let i = 1; i < remainingPlaces.length; i++) {
          const distance = calculateDistance(
            currentPoint.lat, currentPoint.lon,
            remainingPlaces[i].location.lat, remainingPlaces[i].location.lon
          );
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIdx = i;
          }
        }
        
        // Add closest place to ordered list
        const nextPlace = remainingPlaces[closestIdx];
        orderedPlaces.push(nextPlace);
        currentPoint = { lat: nextPlace.location.lat, lon: nextPlace.location.lon };
        remainingPlaces = remainingPlaces.filter((_, idx) => idx !== closestIdx);
      }
      
      setSelectedPlaces(orderedPlaces);
      
      // Generate route with optimized order
      const allPoints = [
        { id: 'user', name: 'Your Location', location: { lat: userLocation[0], lon: userLocation[1] } },
        ...orderedPlaces
      ];
      
      const route = await generateRoute(allPoints, transportMode);
      setOptimizedRoute(route);
      
      if (onRouteGenerated) {
        onRouteGenerated(route);
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmitItinerary = async () => {
    if (!optimizedRoute) {
      // Generate the route first if it doesn't exist
      await generateItinerary();
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show directions panel
      setShowDirections(true);
      
      // If we have a callback, send the route data
      if (optimizedRoute && onRouteGenerated) {
        onRouteGenerated(optimizedRoute);
      }
    } catch (error) {
      console.error('Error submitting itinerary:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRoute = async (points: Place[], mode: string): Promise<Route> => {
    // In a real app, this would call a routing API like OpenRouteService
    // For now, we'll simulate a route
    
    const coordinates: [number, number][] = [];
    const steps: RouteStep[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    
    // Generate route segments between each point
    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i];
      const to = points[i + 1];
      
      // Create a straight line between points
      const fromCoord: [number, number] = [from.location.lon, from.location.lat];
      const toCoord: [number, number] = [to.location.lon, to.location.lat];
      
      // Calculate distance in kilometers
      const distance = calculateDistance(
        from.location.lat, from.location.lon,
        to.location.lat, to.location.lon
      );
      
      // Estimate duration based on transport mode (minutes)
      let speed = 40; // km/h for driving
      if (mode === 'cycling-regular') speed = 15;
      if (mode === 'foot-walking') speed = 5;
      
      const duration = (distance / speed) * 60; // Convert to minutes
      
      totalDistance += distance;
      totalDuration += duration;
      
      // Generate some intermediate points for a more realistic route
      const line = turf.lineString([fromCoord, toCoord]);
      const lineDistance = turf.length(line, {units: 'kilometers'});
      const steps = Math.max(5, Math.floor(lineDistance / 0.5)); // One point every 500m
      
      const segmentCoordinates: [number, number][] = [];
      for (let j = 0; j <= steps; j++) {
        const segment = j / steps;
        const point = turf.along(line, lineDistance * segment, {units: 'kilometers'});
        segmentCoordinates.push(point.geometry.coordinates as [number, number]);
      }
      
      // Add all coordinates to the route
      if (i === 0) {
        coordinates.push(...segmentCoordinates);
      } else {
        // Skip the first point as it's the same as the last point of the previous segment
        coordinates.push(...segmentCoordinates.slice(1));
      }
      
      // Add step information
      steps.push({
        instruction: `Head to ${to.name}`,
        distance: Math.round(distance * 1000), // Convert to meters
        duration: Math.round(duration),
        startLocation: [from.location.lat, from.location.lon],
        endLocation: [to.location.lat, to.location.lon],
        fromPlace: from.name,
        toPlace: to.name
      });
    }
    
    return {
      distance: parseFloat(totalDistance.toFixed(1)),
      duration: Math.round(totalDuration),
      steps,
      coordinates
    };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (meters: number) => {
    return meters >= 1000 
      ? `${(meters / 1000).toFixed(1)} km`
      : `${Math.round(meters)} m`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours} h ${mins} min`;
    }
  };

  const getTransportIcon = () => {
    switch (transportMode) {
      case 'cycling-regular': return '🚲';
      case 'foot-walking': return '🚶';
      default: return '🚗';
    }
  };

  const getEstimatedArrivalTime = (startTimeStr: string, durationMinutes: number) => {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const arrivalDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="absolute top-20 right-8 z-[1000] w-96 max-h-[calc(100vh-160px)] bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Plan Your Itinerary</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showDirections && optimizedRoute ? (
            <motion.div
              key="directions"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowDirections(false)}
                  className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Back to Itinerary</span>
                </button>
              </div>
              
              {/* Route Overview */}
              <div className="bg-white/5 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">{formatDuration(optimizedRoute.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">{formatDistance(optimizedRoute.distance * 1000)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-white/70 text-sm">
                  <span>Transport mode:</span>
                  <span className="text-white">{getTransportIcon()} {transportMode.replace('-', ' ')}</span>
                </div>
              </div>
              
              {/* Steps */}
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-320px)] pr-2">
                {optimizedRoute.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="relative"
                  >
                    {/* Connecting line */}
                    {index < optimizedRoute.steps.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-white/10 z-0"></div>
                    )}
                    
                    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 relative z-10">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-blue-400">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-medium">
                              {step.fromPlace === 'Your Location' ? 'Start from Your Location' : step.instruction}
                            </h3>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-white/70 mb-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-blue-400" />
                              <span>{formatDuration(step.duration)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4 text-blue-400" />
                              <span>{formatDistance(step.distance)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-white/60 text-xs">
                            <span>From:</span>
                            <span className="text-white">{step.fromPlace}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-white/60 text-xs">
                            <span>To:</span>
                            <span className="text-white">{step.toPlace}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="planner"
              initial={{ opacity: 0, x: isGenerating ? -100 : 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="space-y-6"
            >
              {/* Settings */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <h3 className="text-white font-medium mb-3">Trip Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-white/70 text-sm block mb-2">Transport Mode</label>
                    <select
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value as any)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="driving-car">Driving 🚗</option>
                      <option value="cycling-regular">Cycling 🚲</option>
                      <option value="foot-walking">Walking 🚶</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/70 text-sm block mb-2">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm block mb-2">End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Places Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium">Selected Places ({selectedPlaces.length})</h3>
                  <button
                    onClick={() => setSelectedPlaces(places)}
                    className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                  >
                    Select All
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
                  {places.map((place) => {
                    const isSelected = selectedPlaces.some(p => p.id === place.id);
                    return (
                      <div
                        key={place.id}
                        onClick={() => togglePlaceSelection(place)}
                        className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                          isSelected ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 border border-transparent hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-blue-500' : 'bg-white/20'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{place.name}</h4>
                          {place.category && (
                            <p className="text-white/60 text-sm">{place.category}</p>
                          )}
                        </div>
                        
                        {place.distance !== undefined && (
                          <div className="text-white/70 text-sm whitespace-nowrap">
                            {place.distance.toFixed(1)} km
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={generateItinerary}
                  disabled={isGenerating || selectedPlaces.length === 0}
                  className="w-full py-3 bg-blue-600/80 hover:bg-blue-700/80 disabled:bg-blue-600/40 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Generating Itinerary...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      <span>Generate Itinerary</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={optimizeRoute}
                  disabled={isOptimizing || selectedPlaces.length <= 1}
                  className="w-full py-3 bg-purple-600/50 hover:bg-purple-700/50 disabled:bg-purple-600/30 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {isOptimizing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Optimizing Route...</span>
                    </>
                  ) : (
                    <>
                      <Navigation2 className="w-5 h-5" />
                      <span>Optimize Route</span>
                    </>
                  )}
                </button>
                
                {optimizedRoute && (
                  <button
                    onClick={() => setShowDirections(true)}
                    className="w-full py-3 bg-green-600/50 hover:bg-green-700/50 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>View Directions</span>
                  </button>
                )}
                
                {/* Submit Button */}
                <button
                  onClick={handleSubmitItinerary}
                  disabled={isSubmitting || selectedPlaces.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Itinerary</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Itinerary Preview */}
              {optimizedRoute && (
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-3">Itinerary Summary</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Distance:</span>
                      <span className="text-white">{formatDistance(optimizedRoute.distance * 1000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Duration:</span>
                      <span className="text-white">{formatDuration(optimizedRoute.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Start Time:</span>
                      <span className="text-white">{startTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Estimated Finish:</span>
                      <span className="text-white">{getEstimatedArrivalTime(startTime, optimizedRoute.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Places to Visit:</span>
                      <span className="text-white">{selectedPlaces.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}