import React, { useState } from 'react';
import { X, MapPin, Star, Clock, Users, Navigation2, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

interface RecommendationPanelProps {
  onClose: () => void;
  recommendations: Place[];
  userLocation: [number, number] | null;
  transportMode?: string;
  language?: string;
}

export function RecommendationPanel({ 
  onClose, 
  recommendations, 
  userLocation,
  transportMode = 'driving-car',
  language = 'en'
}: RecommendationPanelProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const handlePlaceClick = (place: Place) => {
    // Navigate to map with the selected place
    navigate('/map', { 
      state: { 
        selectedPlace: {
          id: place.id,
          name: place.name,
          description: place.description,
          coordinates: {
            lat: place.location.lat,
            lng: place.location.lon
          }
        },
        userLocation
      } 
    });
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-600/80 text-white';
      case 'less crowded': return 'bg-green-600/80 text-white';
      case 'moderate': return 'bg-yellow-400/80 text-white';
      case 'busy': return 'bg-red-500/80 text-white';
      case 'high': return 'bg-red-500/80 text-white';
      default: return 'bg-blue-500/50 text-white';
    }
  };

  const getTransportIcon = () => {
    switch (transportMode) {
      case 'cycling': return '🚲';
      case 'foot-walking': return '🚶';
      default: return '🚗';
    }
  };

  const formatDistance = (distance: number) => {
    return distance >= 1 
      ? `${distance.toFixed(1)} km`
      : `${Math.round(distance * 1000)} m`;
  };

  const getEstimatedTime = (distance: number) => {
    // Rough estimates based on transport mode
    const speedKmPerHour = 
      transportMode === 'cycling' ? 15 : 
      transportMode === 'foot-walking' ? 5 : 
      40;
    
    const timeInHours = distance / speedKmPerHour;
    const timeInMinutes = Math.round(timeInHours * 60);
    
    return timeInMinutes < 1 ? 1 : timeInMinutes;
  };

  const translations = {
    en: {
      title: 'Recommendations',
      nearby: 'Nearby Places',
      noResults: 'No recommendations found',
      tryAgain: 'Try changing your location',
      distance: 'Distance',
      time: 'Est. Time',
      crowdLevel: 'Crowd Level',
      bestTime: 'Best Time'
    },
    es: {
      title: 'Recomendaciones',
      nearby: 'Lugares Cercanos',
      noResults: 'No se encontraron recomendaciones',
      tryAgain: 'Intenta cambiar tu ubicación',
      distance: 'Distancia',
      time: 'Tiempo Est.',
      crowdLevel: 'Nivel de Gente',
      bestTime: 'Mejor Momento'
    },
    fr: {
      title: 'Recommandations',
      nearby: 'Lieux à Proximité',
      noResults: 'Aucune recommandation trouvée',
      tryAgain: 'Essayez de changer votre emplacement',
      distance: 'Distance',
      time: 'Temps Est.',
      crowdLevel: 'Niveau de Foule',
      bestTime: 'Meilleur Moment'
    },
    de: {
      title: 'Empfehlungen',
      nearby: 'Orte in der Nähe',
      noResults: 'Keine Empfehlungen gefunden',
      tryAgain: 'Versuchen Sie, Ihren Standort zu ändern',
      distance: 'Entfernung',
      time: 'Geschätzte Zeit',
      crowdLevel: 'Besucherniveau',
      bestTime: 'Beste Zeit'
    }
  };

  // Use the current language or fallback to English
  const t = translations[language as keyof typeof translations] || translations.en;

  return (
    <div className="absolute top-20 right-8 z-[1000] w-96 max-h-[calc(100vh-160px)] bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{t.title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
          {recommendations.length > 0 ? (
            <>
              <h3 className="text-white/70 text-sm uppercase tracking-wider mb-2">{t.nearby}</h3>
              {recommendations.map((place, index) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => handlePlaceClick(place)}
                >
                  <div className="relative h-32">
                    <img 
                      src={place.image} 
                      alt={place.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    
                    <div className="absolute top-2 left-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCrowdLevelColor(place.crowdLevel)}`}>
                        {place.crowdLevel}
                      </div>
                    </div>
                    
                    <div className="absolute bottom-2 right-2">
                      <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                        <Star className="w-3 h-3 text-yellow-400" fill="#facc15" />
                        <span className="text-white text-xs font-medium">{place.rating}</span>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-2 left-2">
                      <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                        <span className="text-white text-xs">{place.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">{place.name}</h3>
                    <p className="text-white/60 text-sm mb-3 line-clamp-2">{place.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-white/70 text-xs">{formatDistance(place.distance)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-white/70 text-xs">{getEstimatedTime(place.distance)} min {getTransportIcon()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-white/70 text-xs">{t.crowdLevel}: {place.crowdLevel}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-white/70 text-xs">{t.bestTime}: {place.bestTime}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-blue-500/30 rounded-full hover:bg-blue-500/50 transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4 text-blue-400" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="w-12 h-12 text-white/30 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t.noResults}</h3>
              <p className="text-white/70">{t.tryAgain}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}