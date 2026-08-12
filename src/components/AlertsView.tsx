import React, { useState } from 'react';
import { 
  Bell, 
  MapPin, 
  Clock, 
  Navigation, 
  HandHeart, 
  Filter, 
  ChevronRight, 
  ShieldAlert, 
  Users 
} from 'lucide-react';
import { Incident, IncidentType } from '../types';
import { INCIDENT_CONFIGS, calculateDistanceKm, formatDistance, formatTimeAgo } from '../lib/location';

interface AlertsViewProps {
  incidents: Incident[];
  userLat: number | null;
  userLng: number | null;
  onSelectIncident: (incident: Incident) => void;
  onOpenSos: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  incidents,
  userLat,
  userLng,
  onSelectIncident,
  onOpenSos
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'recency'>('distance');

  // Active incidents
  const activeIncidents = incidents.filter((i) => i.status === 'active');

  // Attach calculated distance
  const incidentsWithDistance = activeIncidents.map((inc) => {
    const dist =
      userLat && userLng && inc.location
        ? calculateDistanceKm(userLat, userLng, inc.location.lat, inc.location.lng)
        : 0;
    return { ...inc, calculatedDist: dist };
  });

  // Filter
  const filtered = incidentsWithDistance.filter((inc) => {
    if (filterType !== 'all' && inc.type !== filterType) return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.calculatedDist - b.calculatedDist;
    } else {
      const timeA = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0).getTime();
      return timeB - timeA;
    }
  });

  return (
    <div className="flex-1 bg-neutral-950 p-4 overflow-y-auto pb-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Nearby Road Alerts</h2>
            <p className="text-[11px] text-neutral-400">
              {sorted.length} active emergency requests nearby
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSos}
          className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition"
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Post SOS
        </button>
      </div>

      {/* Filter and Sort Bar */}
      <div className="mt-3 flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
              filterType === 'all'
                ? 'bg-orange-500 text-white border-orange-400'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
            }`}
          >
            All ({activeIncidents.length})
          </button>
          <button
            onClick={() => setFilterType('accident')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
              filterType === 'accident'
                ? 'bg-red-500 text-white border-red-400'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
            }`}
          >
            🚨 Accidents
          </button>
          <button
            onClick={() => setFilterType('breakdown')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
              filterType === 'breakdown'
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
            }`}
          >
            🔧 Breakdowns
          </button>
          <button
            onClick={() => setFilterType('medical')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
              filterType === 'medical'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
            }`}
          >
            🚑 Medical
          </button>
        </div>

        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-[11px] shrink-0">
          <button
            onClick={() => setSortBy('distance')}
            className={`px-2 py-0.5 rounded-lg font-bold transition ${
              sortBy === 'distance' ? 'bg-orange-500 text-white shadow-sm' : 'text-neutral-400'
            }`}
          >
            Nearest
          </button>
          <button
            onClick={() => setSortBy('recency')}
            className={`px-2 py-0.5 rounded-lg font-bold transition ${
              sortBy === 'recency' ? 'bg-orange-500 text-white shadow-sm' : 'text-neutral-400'
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* Incidents List */}
      <div className="mt-4 space-y-3 flex-1">
        {sorted.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center my-6 shadow-inner">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto mb-3 border border-neutral-700/50">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-200">No Active Incidents Found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
              There are currently no active SOS help requests in this category. You are safe on the roads!
            </p>
          </div>
        ) : (
          sorted.map((inc) => {
            const config = INCIDENT_CONFIGS[inc.type] || INCIDENT_CONFIGS.other;
            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className="bg-neutral-900/90 border border-neutral-800 hover:border-orange-500/50 rounded-2xl p-3.5 shadow-xl cursor-pointer transition transform active:scale-[0.98] group backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 text-white shadow-md border border-white/20"
                      style={{ backgroundColor: config.pinBg }}
                    >
                      {inc.type === 'accident'
                        ? '🚨'
                        : inc.type === 'breakdown'
                        ? '🔧'
                        : inc.type === 'fuel'
                        ? '⛽'
                        : inc.type === 'medical'
                        ? '🚑'
                        : inc.type === 'flat_tire'
                        ? '🛞'
                        : '⚠️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                          {config.label} Help
                        </h3>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${config.badgeBg}`}>
                          {config.badgeText}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>{formatTimeAgo(inc.createdAt)}</span>
                        <span>•</span>
                        <span className="text-orange-400 font-bold">
                          {formatDistance(inc.calculatedDist)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-neutral-500 group-hover:text-orange-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>

                {/* Location / Details */}
                <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-300">
                  <p className="text-[11px] text-neutral-400 truncate max-w-[210px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                    <span>{inc.address || 'Road location'}</span>
                  </p>

                  <div className="flex items-center gap-2">
                    {inc.respondersCount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {inc.respondersCount} helper{inc.respondersCount > 1 ? 's' : ''}
                      </span>
                    )}

                    <span className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white rounded-xl text-[10px] font-bold border border-orange-500/30 flex items-center gap-1 transition">
                      <HandHeart className="w-3 h-3" /> View / Respond
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
