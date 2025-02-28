import React, { useState } from 'react';
import { X, Navigation2, Share2, Star, Clock, Users, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialShareModal } from './SocialShareModal';

interface LocationInfoBoxProps {
  location: any;
  onGetDirections: () => void;
  onClose: () => void;
}

export function LocationInfoBox({ location, onGetDirections, onClose }: LocationInfoBoxProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  if (!location) return null;

  const displayName = location.display_name || 'Unknown Location';
  const shortName = displayName.split(',')[0];
  const description = displayName.split(',').slice(1, 3).join(',');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="absolute top-20 left-8 z-[1000] w-96 max-h-[calc(100vh-160px)] bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Location Details</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-medium text-lg mb-2">{shortName}</h3>
              <p className="text-white/70 text-sm">{description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-white/70 text-sm">Rating</p>
                <p className="text-white font-medium">4.5/5</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-white/70 text-sm">Best Time</p>
                <p className="text-white font-medium">Morning</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-white/70 text-sm">Crowd Level</p>
                <p className="text-white font-medium">Moderate</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-yellow-500/30 rounded-full flex items-center justify-center mb-2">
                  <Info className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-white/70 text-sm">Type</p>
                <p className="text-white font-medium">Point of Interest</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetDirections}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-white font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Navigation2 className="w-5 h-5" />
                <span>Directions</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowShareModal(true)}
                className="py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <SocialShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        location={{
          name: shortName,
          description: description
        }}
      />
    </>
  );
}