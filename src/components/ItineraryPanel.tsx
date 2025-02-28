import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Coffee, Sun, Moon, Utensils, Camera, Bus, Calendar, Navigation2 } from 'lucide-react';
import { ItineraryPlanner } from './ItineraryPlanner';

interface ItineraryPanelProps {
  onClose: () => void;
  userLocation?: [number, number];
}

interface ItineraryItem {
  id: number;
  time: string;
  activity: string;
  duration: string;
  type: string;
  icon: any;
  location?: string;
}

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
}

export function ItineraryPanel({ onClose, userLocation }: ItineraryPanelProps) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [currentTime] = useState(new Date());
  const [showPlanner, setShowPlanner] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);

  useEffect(() => {
    // Generate dynamic itinerary based on current time
    const hour = currentTime.getHours();
    let dynamicItinerary: ItineraryItem[] = [];

    // Morning activities
    if (hour <= 10) {
      dynamicItinerary.push({
        id: 1,
        time: "08:00 AM",
        activity: "Breakfast at Local Cafe",
        duration: "1 hour",
        type: "dining",
        icon: Coffee,
      });
    }

    // Late morning activities
    if (hour <= 12) {
      dynamicItinerary.push({
        id: 2,
        time: "10:00 AM",
        activity: "Visit Historical Sites",
        duration: "2 hours",
        type: "sightseeing",
        icon: Camera,
      });
    }

    // Afternoon activities
    if (hour <= 15) {
      dynamicItinerary.push({
        id: 3,
        time: "12:30 PM",
        activity: "Lunch at Popular Restaurant",
        duration: "1.5 hours",
        type: "dining",
        icon: Utensils,
      });
    }

    // Late afternoon activities
    if (hour <= 18) {
      dynamicItinerary.push({
        id: 4,
        time: "03:00 PM",
        activity: "Local Market Tour",
        duration: "2 hours",
        type: "shopping",
        icon: MapPin,
      });
    }

    // Evening activities
    if (hour <= 22) {
      dynamicItinerary.push({
        id: 5,
        time: "06:00 PM",
        activity: "Evening City Tour",
        duration: "2 hours",
        type: "tour",
        icon: Bus,
      });
    }

    // If it's past certain activities, show tomorrow's schedule
    if (hour >= 22) {
      dynamicItinerary = [
        {
          id: 1,
          time: "Tomorrow 08:00 AM",
          activity: "Breakfast at Local Cafe",
          duration: "1 hour",
          type: "dining",
          icon: Coffee,
        },
        // Add more tomorrow activities...
      ];
    }

    // If we have user location, fetch nearby places for activities
    if (userLocation) {
      fetchNearbyPlaces(userLocation[0], userLocation[1])
        .then(places => {
          const updatedItinerary = dynamicItinerary.map(item => {
            const matchingPlace = places.find(place => 
              place.category?.toLowerCase().includes(item.type.toLowerCase())
            );
            if (matchingPlace) {
              return {
                ...item,
                activity: `${item.activity} at ${matchingPlace.name}`,
                location: matchingPlace.description
              };
            }
            return item;
          });
          setItinerary(updatedItinerary);
          
          // Also store the places for the planner
          setNearbyPlaces(places);
        });
    } else {
      setItinerary(dynamicItinerary);
    }
  }, [currentTime, userLocation]);

  const fetchNearbyPlaces = async (lat: number, lon: number) => {
    try {
      // In a real app, we would fetch from an API
      // For now, we'll simulate with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [
        {
          id: '1',
          name: 'Golden Gate Bridge',
          description: 'Iconic suspension bridge with stunning views',
          location: { lat: lat + 0.02, lon: lon + 0.03 },
          distance: 3.2,
          category: 'Attraction'
        },
        {
          id: '2',
          name: 'Local Cafe',
          description: 'Cozy cafe with great coffee and pastries',
          location: { lat: lat + 0.01, lon: lon - 0.01 },
          distance: 1.5,
          category: 'Dining'
        },
        {
          id: '3',
          name: 'City Museum',
          description: 'Historical museum with local artifacts',
          location: { lat: lat - 0.01, lon: lon + 0.02 },
          distance: 2.1,
          category: 'Sightseeing'
        },
        {
          id: '4',
          name: 'Central Market',
          description: 'Bustling market with local goods',
          location: { lat: lat - 0.02, lon: lon - 0.01 },
          distance: 2.8,
          category: 'Shopping'
        },
        {
          id: '5',
          name: 'Sunset Restaurant',
          description: 'Fine dining with panoramic views',
          location: { lat: lat + 0.03, lon: lon + 0.01 },
          distance: 3.5,
          category: 'Dining'
        },
        {
          id: '6',
          name: 'City Park',
          description: 'Expansive park with walking trails',
          location: { lat: lat - 0.01, lon: lon - 0.03 },
          distance: 2.3,
          category: 'Outdoor'
        },
        {
          id: '7',
          name: 'Historic District',
          description: 'Well-preserved historic neighborhood',
          location: { lat: lat + 0.01, lon: lon + 0.02 },
          distance: 1.9,
          category: 'Sightseeing'
        }
      ];
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  };

  const handlePlanItinerary = () => {
    setShowPlanner(true);
  };

  return (
    <>
      <div className="absolute top-20 right-8 z-[1000] w-96 max-h-[calc(100vh-160px)] bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Today's Itinerary</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
            {itinerary.map((item, index) => {
              const Icon = item.icon;
              const isPast = new Date(`${currentTime.toDateString()} ${item.time}`) < currentTime;

              return (
                <div
                  key={item.id}
                  className={`relative flex items-start space-x-4 bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 group ${
                    isPast ? 'opacity-50' : ''
                  }`}
                >
                  {index !== itinerary.length - 1 && (
                    <div className="absolute left-8 top-16 w-0.5 h-12 bg-white/20 group-hover:bg-white/30 transition-colors" />
                  )}
                  
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center group-hover:bg-blue-500/50 transition-colors">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/70 text-sm">{item.time}</span>
                      <div className="flex items-center space-x-1 text-white/50 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{item.duration}</span>
                      </div>
                    </div>
                    <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                      {item.activity}
                    </h3>
                    {item.location && (
                      <p className="text-white/60 text-sm mt-1">{item.location}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <button 
              onClick={handlePlanItinerary}
              className="w-full py-3 bg-blue-600/80 hover:bg-blue-700/80 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Calendar className="w-5 h-5" />
              <span>Plan Custom Itinerary</span>
            </button>
          </div>
        </div>
      </div>
      
      {showPlanner && (
        <ItineraryPlanner 
          onClose={() => setShowPlanner(false)} 
          places={nearbyPlaces}
          userLocation={userLocation}
        />
      )}
    </>
  );
}