import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Users, 
  HandHeart, 
  AlertTriangle, 
  User, 
  Maximize2 
} from 'lucide-react';
import { Incident, Responder, UserProfile } from '../types';
import { INCIDENT_CONFIGS, calculateDistanceKm, formatDistance, formatTimeAgo } from '../lib/location';
import { respondToIncident, updateIncidentStatus } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface IncidentDetailSheetProps {
  incident: Incident;
  currentUser: UserProfile | null;
  userLat: number | null;
  userLng: number | null;
  onClose: () => void;
}

export const IncidentDetailSheet: React.FC<IncidentDetailSheetProps> = ({
  incident,
  currentUser,
  userLat,
  userLng,
  onClose
}) => {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [etaInput, setEtaInput] = useState('10 mins');
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [fullPhotoUrl, setFullPhotoUrl] = useState<string | null>(null);

  const config = INCIDENT_CONFIGS[incident.type] || INCIDENT_CONFIGS.other;
  const isReporter = currentUser?.uid === incident.reporterUid;

  // Calculate distance
  const distanceKm =
    userLat && userLng && incident.location
      ? calculateDistanceKm(userLat, userLng, incident.location.lat, incident.location.lng)
      : null;

  const hasResponded = responders.some((r) => r.uid === currentUser?.uid);

  // Real-time snapshot listener for responders subcollection
  useEffect(() => {
    if (!incident.id) return;
    const respondersRef = collection(db, 'incidents', incident.id, 'responders');
    const unsubscribe = onSnapshot(
      respondersRef,
      (snapshot) => {
        const list: Responder[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Responder);
        });
        setResponders(list);
      },
      (error) => {
        console.error('Responders snapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [incident.id]);

  // Handle "I can help"
  const handleOfferHelp = async () => {
    if (!currentUser) return;
    setIsSubmittingHelp(true);
    try {
      await respondToIncident(incident.id, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        phone: currentUser.phone || '',
        distanceKm: distanceKm || 0,
        eta: etaInput
      });
      setShowRespondModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingHelp(false);
    }
  };

  // Handle Mark as Resolved
  const handleMarkResolved = async () => {
    setIsResolving(true);
    try {
      await updateIncidentStatus(incident.id, 'resolved');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  // Open directions in external Google Maps
  const handleOpenDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${incident.location.lat},${incident.location.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border-t border-neutral-800 w-full max-w-md rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Sheet Top Grab Handle & Header */}
        <div className="p-4 pb-3 border-b border-neutral-800 flex items-center justify-between relative shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-neutral-700 rounded-full" />
          
          <div className="flex items-center gap-2.5 mt-2">
            <span className="text-2xl">
              {incident.type === 'accident'
                ? '🚨'
                : incident.type === 'breakdown'
                ? '🔧'
                : incident.type === 'fuel'
                ? '⛽'
                : incident.type === 'medical'
                ? '🚑'
                : '⚠️'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{config.label} Emergency</h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
                  {config.badgeText}
                </span>
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-neutral-500" />
                <span>{formatTimeAgo(incident.createdAt)}</span>
                {distanceKm !== null && (
                  <>
                    <span>•</span>
                    <span className="text-orange-400 font-bold">{formatDistance(distanceKm)}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition border border-neutral-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sheet Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Location Address Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-inner">
            <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-neutral-200 block">Incident Location</span>
              <span className="text-neutral-400 leading-relaxed block mt-0.5">
                {incident.address || `Coordinates (${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)})`}
              </span>
            </div>
          </div>

          {/* Description */}
          {incident.description && (
            <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3.5 text-xs text-neutral-300 leading-relaxed shadow-inner">
              <span className="font-bold text-neutral-400 block mb-1">Details from Reporter:</span>
              "{incident.description}"
            </div>
          )}

          {/* Attached Photo */}
          {incident.photoURL && (
            <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 group">
              <img
                src={incident.photoURL}
                alt="Incident site"
                className="w-full h-40 object-cover cursor-pointer hover:scale-105 transition"
                onClick={() => setFullPhotoUrl(incident.photoURL!)}
              />
              <button
                onClick={() => setFullPhotoUrl(incident.photoURL!)}
                className="absolute bottom-2 right-2 bg-neutral-900/90 backdrop-blur px-2.5 py-1 rounded-xl text-[10px] text-white flex items-center gap-1 border border-neutral-700"
              >
                <Maximize2 className="w-3 h-3" /> Tap to view
              </button>
            </div>
          )}

          {/* Reporter Profile */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700 flex items-center justify-center text-neutral-400">
                {incident.reporterPhoto ? (
                  <img src={incident.reporterPhoto} alt={incident.reporterName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-200">{incident.reporterName}</p>
                <p className="text-[11px] text-neutral-400">SOS Reporter</p>
              </div>
            </div>

            {incident.reporterPhone && (
              <a
                href={`tel:${incident.reporterPhone}`}
                className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            )}
          </div>

          {/* Active Responders List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span>Responders ({responders.length})</span>
              </h4>
              {hasResponded && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  You are responding
                </span>
              )}
            </div>

            {responders.length === 0 ? (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
                No responders on the way yet. Be the first helper!
              </div>
            ) : (
              <div className="space-y-2">
                {responders.map((resp) => (
                  <div
                    key={resp.uid}
                    className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-neutral-800 overflow-hidden flex items-center justify-center text-neutral-400 border border-neutral-700/50">
                        {resp.photoURL ? (
                          <img src={resp.photoURL} alt={resp.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200">{resp.displayName}</p>
                        <p className="text-[10px] text-neutral-400">ETA: {resp.eta || 'En route'}</p>
                      </div>
                    </div>

                    {resp.phone && (
                      <a
                        href={`tel:${resp.phone}`}
                        className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1 font-bold"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center gap-2 shrink-0">
          {/* Navigation Directions Button */}
          <button
            onClick={handleOpenDirections}
            className="flex-1 py-3 px-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>Directions</span>
          </button>

          {/* Conditional Action: Reporter vs Helper */}
          {isReporter ? (
            <button
              onClick={handleMarkResolved}
              disabled={isResolving}
              className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isResolving ? 'Updating...' : 'Mark Resolved'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowRespondModal(true)}
              disabled={hasResponded}
              className={`flex-1 py-3 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 ${
                hasResponded
                  ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gradient-to-r from-orange-500 via-rose-600 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-orange-500/20'
              }`}
            >
              <HandHeart className="w-4 h-4" />
              <span>{hasResponded ? 'Help Offered ✓' : "I Can Help!"}</span>
            </button>
          )}
        </div>

        {/* Offer Help Modal Prompt */}
        {showRespondModal && (
          <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md p-5 flex flex-col justify-center z-50">
            <h4 className="text-base font-black text-white mb-1 flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-orange-400" />
              Respond to Emergency
            </h4>
            <p className="text-xs text-neutral-400 mb-4">
              Thank you for stepping up! Let the reporter know your estimated arrival time.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Estimated Arrival Time (ETA)
                </label>
                <select
                  value={etaInput}
                  onChange={(e) => setEtaInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 shadow-inner"
                >
                  <option value="5 mins">5 minutes</option>
                  <option value="10 mins">10 minutes</option>
                  <option value="15 mins">15 minutes</option>
                  <option value="30 mins">30 minutes</option>
                  <option value="Already Nearby">Already Nearby</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowRespondModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 text-xs font-bold hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOfferHelp}
                  disabled={isSubmittingHelp}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-black shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50"
                >
                  {isSubmittingHelp ? 'Confirming...' : 'Confirm Response'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Screen Photo View Modal */}
        {fullPhotoUrl && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setFullPhotoUrl(null)}
          >
            <button
              onClick={() => setFullPhotoUrl(null)}
              className="absolute top-4 right-4 text-white p-2 bg-neutral-900/80 rounded-full border border-neutral-700"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={fullPhotoUrl} alt="Incident Full Site" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
          </div>
        )}
      </div>
    </div>
  );
};
