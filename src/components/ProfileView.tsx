import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Car, 
  LogOut, 
  Award, 
  MapPin, 
  History, 
  ShieldCheck, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Radio, 
  ShieldAlert 
} from 'lucide-react';
import { UserProfile, Incident } from '../types';
import { logOut, updateUserProfile } from '../lib/firebase';
import { INCIDENT_CONFIGS, formatTimeAgo } from '../lib/location';

interface ProfileViewProps {
  userProfile: UserProfile | null;
  myIncidents: Incident[];
  isBroadcastingLocation: boolean;
  onToggleLocationBroadcast: () => void;
  onSelectIncident: (incident: Incident) => void;
  onRefreshProfile: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  myIncidents,
  isBroadcastingLocation,
  onToggleLocationBroadcast,
  onSelectIncident,
  onRefreshProfile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [vehicleType, setVehicleType] = useState(userProfile?.vehicleType || 'Car');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    setIsSaving(true);
    try {
      await updateUserProfile(userProfile.uid, {
        phone,
        vehicleType
      });
      setIsEditing(false);
      onRefreshProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeReports = myIncidents.filter((i) => i.status === 'active');
  const resolvedReports = myIncidents.filter((i) => i.status === 'resolved');

  return (
    <div className="flex-1 bg-neutral-950 p-4 overflow-y-auto pb-8 flex flex-col">
      {/* Top Header Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 p-0.5 shadow-xl shrink-0">
            <div className="w-full h-full rounded-[14px] bg-neutral-900 overflow-hidden flex items-center justify-center">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-orange-400" />
              )}
            </div>
          </div>

          <div className="overflow-hidden flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-white truncate">
                {userProfile?.displayName || 'Road Sahayak Member'}
              </h2>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <p className="text-xs text-neutral-400 truncate">{userProfile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 flex items-center gap-1">
                <Award className="w-3 h-3" /> {userProfile?.karmaPoints || 50} Karma Score
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-800/80 text-center">
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 shadow-inner">
            <span className="text-sm font-black text-white block">{myIncidents.length}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">SOS Reported</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 shadow-inner">
            <span className="text-sm font-black text-emerald-400 block">{resolvedReports.length}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Resolved</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 shadow-inner">
            <span className="text-sm font-black text-orange-400 block">5⭐</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Help Rating</span>
          </div>
        </div>
      </div>

      {/* Live Location Sharing Broadcast Toggle */}
      <div className="mt-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isBroadcastingLocation ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
            <Radio className={`w-5 h-5 ${isBroadcastingLocation ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Live Helper Location Sharing</h3>
            <p className="text-[10px] text-neutral-400">
              {isBroadcastingLocation ? 'Broadcasting live coordinates to emergency network' : 'Location broadcast paused'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleLocationBroadcast}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
            isBroadcastingLocation
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          {isBroadcastingLocation ? 'ACTIVE' : 'PAUSED'}
        </button>
      </div>

      {/* Tab Switcher: Past SOS History vs Profile Details */}
      <div className="mt-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
          }`}
        >
          <History className="w-3.5 h-3.5" /> My SOS History ({myIncidents.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" /> Details & Vehicle
        </button>
      </div>

      {/* History View */}
      {activeTab === 'history' && (
        <div className="mt-3 space-y-2.5 flex-1">
          {myIncidents.length === 0 ? (
            <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl text-center text-xs text-neutral-400 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              You haven't posted any SOS requests yet.
            </div>
          ) : (
            myIncidents.map((inc) => {
              const config = INCIDENT_CONFIGS[inc.type] || INCIDENT_CONFIGS.other;
              return (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc)}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-neutral-700 transition shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">
                      {inc.type === 'accident'
                        ? '🚨'
                        : inc.type === 'breakdown'
                        ? '🔧'
                        : inc.type === 'fuel'
                        ? '⛽'
                        : inc.type === 'medical'
                        ? '🚑'
                        : '⚠️'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">{config.label} SOS</p>
                      <p className="text-[10px] text-neutral-400">{formatTimeAgo(inc.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        inc.status === 'active'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          : inc.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      {inc.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Settings / Profile Details Form View */}
      {activeTab === 'settings' && (
        <div className="mt-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-400" /> Emergency Contact Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-orange-400" /> Primary Vehicle Type
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 shadow-inner"
            >
              <option value="Car">Car / Sedan</option>
              <option value="Two Wheeler">Motorcycle / Scooter</option>
              <option value="SUV">SUV / 4x4</option>
              <option value="Commercial">Truck / Commercial</option>
              <option value="Auto">Auto Rickshaw / Taxi</option>
            </select>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Details'}</span>
          </button>
        </div>
      )}

      {/* Sign Out Button */}
      <div className="mt-6 pt-2">
        <button
          onClick={logOut}
          className="w-full py-3 px-4 bg-neutral-900 border border-neutral-800 hover:border-red-800 text-red-400 hover:text-red-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out from Road Sahayak</span>
        </button>
      </div>
    </div>
  );
};
