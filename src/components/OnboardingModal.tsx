import React, { useState } from 'react';
import { Phone, Car, Shield, ArrowRight, X } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  userProfile: UserProfile;
  onSave: (phone: string, vehicleType: string) => Promise<void>;
  onSkip: () => void;
}

const VEHICLE_OPTIONS = [
  { id: 'Car', label: 'Car / Sedan', icon: '🚗' },
  { id: 'Two Wheeler', label: 'Motorcycle / Scooter', icon: '🏍️' },
  { id: 'SUV', label: 'SUV / 4x4', icon: '🚙' },
  { id: 'Commercial', label: 'Truck / Commercial', icon: '🚚' },
  { id: 'Auto', label: 'Auto Rickshaw / Taxi', icon: '🛺' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  userProfile,
  onSave,
  onSkip
}) => {
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [vehicleType, setVehicleType] = useState(userProfile.vehicleType || 'Car');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(phone, vehicleType);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Complete Profile</h3>
              <p className="text-xs text-neutral-400">Help responders identify you faster</p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-neutral-400 hover:text-neutral-200 text-xs font-semibold p-1 bg-neutral-800 rounded-xl border border-neutral-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-400" /> Phone Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
            />
            <p className="text-[10px] text-neutral-500 mt-1">Shared only with helpers responding to your SOS</p>
          </div>

          {/* Vehicle Type Selection */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-orange-400" /> Primary Vehicle Type
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {VEHICLE_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVehicleType(item.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition active:scale-95 ${
                    vehicleType === item.id
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-800 text-neutral-400 text-xs font-bold hover:bg-neutral-800 transition"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 via-rose-600 to-red-600 text-white text-xs font-black shadow-lg shadow-orange-500/20 hover:brightness-110 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Get Started'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
