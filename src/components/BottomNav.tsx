import React from 'react';
import { Map, Bell, User, AlertCircle } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeAlertsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  activeAlertsCount
}) => {
  return (
    <nav className="bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-800/80 px-4 py-2 flex items-center justify-around z-40 relative shadow-2xl">
      {/* Map Tab */}
      <button
        onClick={() => setActiveTab('map')}
        className={`flex flex-col items-center gap-1 transition-all ${
          activeTab === 'map' ? 'text-orange-400 font-bold scale-105' : 'text-neutral-400 hover:text-neutral-200'
        }`}
      >
        <Map className={`w-5 h-5 ${activeTab === 'map' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[11px] tracking-tight">Map</span>
      </button>

      {/* SOS / Report Tab (Prominent central emergency CTA) */}
      <div className="relative -top-5">
        <button
          onClick={() => setActiveTab('sos')}
          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all transform active:scale-95 border-2 ${
            activeTab === 'sos'
              ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-orange-500 border-white text-white shadow-red-500/60 ring-4 ring-orange-500/40 scale-105'
              : 'bg-gradient-to-tr from-red-600 to-orange-600 border-neutral-900 text-white shadow-red-600/40 hover:scale-105'
          }`}
        >
          <AlertCircle className="w-6 h-6 animate-pulse drop-shadow-md" />
          <span className="text-[9px] font-black tracking-widest uppercase -mt-0.5 drop-shadow-md">SOS</span>
        </button>
      </div>

      {/* Alerts Tab */}
      <button
        onClick={() => setActiveTab('alerts')}
        className={`flex flex-col items-center gap-1 transition-all relative ${
          activeTab === 'alerts' ? 'text-orange-400 font-bold scale-105' : 'text-neutral-400 hover:text-neutral-200'
        }`}
      >
        <div className="relative">
          <Bell className={`w-5 h-5 ${activeTab === 'alerts' ? 'stroke-[2.5]' : ''}`} />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-neutral-900 shadow-md">
              {activeAlertsCount > 9 ? '9+' : activeAlertsCount}
            </span>
          )}
        </div>
        <span className="text-[11px] tracking-tight">Alerts</span>
      </button>

      {/* Profile Tab */}
      <button
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center gap-1 transition-all ${
          activeTab === 'profile' ? 'text-orange-400 font-bold scale-105' : 'text-neutral-400 hover:text-neutral-200'
        }`}
      >
        <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[11px] tracking-tight">Profile</span>
      </button>
    </nav>
  );
};
