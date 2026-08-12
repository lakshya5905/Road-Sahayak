import React, { useEffect } from 'react';
import { ShieldAlert, X, ChevronRight, MapPin } from 'lucide-react';
import { Incident } from '../types';
import { INCIDENT_CONFIGS, formatDistance, calculateDistanceKm } from '../lib/location';

interface NotificationToastProps {
  incident: Incident;
  userLat: number | null;
  userLng: number | null;
  onView: () => void;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  incident,
  userLat,
  userLng,
  onView,
  onDismiss
}) => {
  const config = INCIDENT_CONFIGS[incident.type] || INCIDENT_CONFIGS.other;

  const distanceKm =
    userLat && userLng && incident.location
      ? calculateDistanceKm(userLat, userLng, incident.location.lat, incident.location.lng)
      : null;

  // Auto dismiss after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [incident, onDismiss]);

  return (
    <div className="absolute top-12 inset-x-3 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-red-950/95 via-neutral-900 to-neutral-900 border-2 border-red-500/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
        
        <div
          onClick={onView}
          className="flex items-center gap-3 flex-1 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center text-xl shrink-0 shadow-lg animate-pulse border border-white/20">
            🚨
          </div>

          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                NEW SOS ALERT
              </span>
              {distanceKm !== null && (
                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/20 px-1.5 py-0.2 rounded-md border border-orange-500/30">
                  {formatDistance(distanceKm)}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-neutral-100 truncate group-hover:text-orange-400 transition mt-0.5">
              {config.label} reported near {incident.address || 'your route'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onView}
            className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-lg shadow-red-600/30 transition active:scale-95"
          >
            <span>View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDismiss}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
