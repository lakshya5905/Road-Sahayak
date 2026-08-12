import React, { useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Camera, 
  X, 
  Send, 
  ShieldAlert, 
  PhoneCall, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { IncidentType, UserProfile } from '../types';
import { INCIDENT_CONFIGS, reverseGeocode } from '../lib/location';
import { createIncident } from '../lib/firebase';

interface SosFormProps {
  currentUser: UserProfile | null;
  userLat: number | null;
  userLng: number | null;
  userAddress: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SosForm: React.FC<SosFormProps> = ({
  currentUser,
  userLat,
  userLng,
  userAddress,
  onSuccess,
  onCancel
}) => {
  const [selectedType, setSelectedType] = useState<IncidentType>('accident');
  const [description, setDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File Upload / Camera capture handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Photo size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result as string);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg('You must be signed in to post an SOS request.');
      return;
    }

    if (!userLat || !userLng) {
      setErrorMsg('Location access is required to attach incident coordinates.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await createIncident({
        reporterUid: currentUser.uid,
        reporterName: currentUser.displayName,
        reporterPhoto: currentUser.photoURL,
        reporterPhone: currentUser.phone || '',
        type: selectedType,
        description: description.trim(),
        photoURL: photoDataUrl || undefined,
        location: {
          lat: userLat,
          lng: userLng
        },
        address: userAddress,
        status: 'active',
        severity
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error submitting SOS:', err);
      setErrorMsg(err.message || 'Failed to post SOS. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-neutral-950 p-4 overflow-y-auto pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Report Road Incident</h2>
            <p className="text-[11px] text-neutral-400">Broadcasts instant alert to nearby helpers</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-xl bg-neutral-900 border border-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Emergency Hotline Bar */}
      <div className="mt-3 p-3 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-red-300 font-bold">
          <PhoneCall className="w-3.5 h-3.5" /> Direct Helplines:
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href="tel:112"
            className="px-2 py-1 bg-red-600 text-white rounded-lg font-black text-[10px] shadow-md"
          >
            112
          </a>
          <a
            href="tel:108"
            className="px-2 py-1 bg-rose-600 text-white rounded-lg font-black text-[10px] shadow-md"
          >
            108 Medical
          </a>
          <a
            href="tel:1033"
            className="px-2 py-1 bg-amber-600 text-white rounded-lg font-black text-[10px] shadow-md"
          >
            1033 Highway
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Incident Type Grid Selector */}
        <div>
          <label className="block text-xs font-black text-neutral-300 mb-2 uppercase tracking-wider">
            1. Select Incident Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(INCIDENT_CONFIGS).map((item) => {
              const isSelected = selectedType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedType(item.id)}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition active:scale-95 ${
                    isSelected
                      ? 'bg-neutral-900 border-orange-500 ring-2 ring-orange-500/40 text-white shadow-xl'
                      : 'bg-neutral-900/60 border-neutral-800/90 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xl shrink-0">
                    {item.id === 'accident'
                      ? '🚨'
                      : item.id === 'breakdown'
                      ? '🔧'
                      : item.id === 'fuel'
                      ? '⛽'
                      : item.id === 'medical'
                      ? '🚑'
                      : item.id === 'flat_tire'
                      ? '🛞'
                      : item.id === 'lockout'
                      ? '🔒'
                      : item.id === 'hazard'
                      ? '⚠️'
                      : '❓'}
                  </span>
                  <div className="overflow-hidden">
                    <p className={`text-xs font-bold ${isSelected ? 'text-orange-400' : 'text-neutral-200'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">{item.badgeText}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto Attached Location */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-md">
          <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-orange-400" /> 2. Auto-Attached GPS Location
          </label>
          <p className="text-xs text-neutral-200 font-semibold truncate mt-1">
            {userAddress || (userLat && userLng ? `GPS (${userLat.toFixed(4)}, ${userLng.toFixed(4)})` : 'Locating...')}
          </p>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-xs font-black text-neutral-300 mb-1.5 uppercase tracking-wider">
            3. Short Description / What happened?
          </label>
          <textarea
            rows={3}
            placeholder="e.g., Vehicle engine stalled on highway, need tow truck or mechanic assistance..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
          />
        </div>

        {/* Photo Upload Attachment */}
        <div>
          <label className="block text-xs font-black text-neutral-300 mb-1.5 uppercase tracking-wider">
            4. Photo Attachment (Optional)
          </label>

          {photoDataUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-neutral-700 bg-neutral-900 h-36">
              <img src={photoDataUrl} alt="Attached incident" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotoDataUrl(null)}
                className="absolute top-2 right-2 bg-neutral-950/80 text-white p-1.5 rounded-full hover:bg-red-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-4 bg-neutral-900/60 border border-dashed border-neutral-700 rounded-2xl cursor-pointer hover:bg-neutral-900 transition text-center shadow-inner">
              <Camera className="w-6 h-6 text-orange-400 mb-1" />
              <span className="text-xs font-bold text-neutral-200">Take or Upload Photo</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Attach site image to help helpers locate you</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-xs font-black text-neutral-300 mb-1.5 uppercase tracking-wider">
            5. Urgency Severity
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low', label: 'Low', color: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' },
              { id: 'medium', label: 'Medium', color: 'border-amber-500/50 text-amber-400 bg-amber-500/10' },
              { id: 'critical', label: 'Critical', color: 'border-red-500/50 text-red-400 bg-red-500/10' }
            ].map((sev) => (
              <button
                key={sev.id}
                type="button"
                onClick={() => setSeverity(sev.id as any)}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  severity === sev.id ? sev.color + ' ring-2 ring-orange-500/40 shadow-md' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !userLat || !userLng}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-xs tracking-wider uppercase shadow-2xl shadow-red-600/40 flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Broadcasting SOS Alert...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>BROADCAST EMERGENCY SOS</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
