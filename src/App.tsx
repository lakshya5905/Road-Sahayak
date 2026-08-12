import React, { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db, updateLiveLocation, updateUserProfile } from './lib/firebase';
import { UserProfile, Incident, LiveLocation, TabType } from './types';
import { reverseGeocode, calculateDistanceKm } from './lib/location';
import { getSampleIncidents, getSampleLiveHelpers } from './lib/mockData';

// Components
import { PhoneFrame } from './components/PhoneFrame';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { LocationBanner } from './components/LocationBanner';
import { MapView } from './components/MapView';
import { SosForm } from './components/SosForm';
import { AlertsView } from './components/AlertsView';
import { ProfileView } from './components/ProfileView';
import { IncidentDetailSheet } from './components/IncidentDetailSheet';
import { NotificationToast } from './components/NotificationToast';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabType>('map');

  // Location state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userAddress, setUserAddress] = useState<string>('Locating...');
  const [locationStatus, setLocationStatus] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isBroadcastingLocation, setIsBroadcastingLocation] = useState(true);

  // Incidents & Helpers Realtime state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [liveHelpers, setLiveHelpers] = useState<LiveLocation[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Toast Notification state
  const [toastIncident, setToastIncident] = useState<Incident | null>(null);
  const prevIncidentIdsRef = useRef<Set<string>>(new Set());

  // Location watcher ref
  const watchIdRef = useRef<number | null>(null);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        setIsDemoUser(false);
        // Fetch or create user profile
        try {
          const userRef = doc(db, 'users', u.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            setUserProfile(profile);
            // Prompt onboarding if phone is missing
            if (!profile.phone && !profile.vehicleType) {
              setShowOnboarding(true);
            }
          } else {
            const newProf: UserProfile = {
              uid: u.uid,
              displayName: u.displayName || 'Sahayak User',
              email: u.email || '',
              photoURL: u.photoURL || '',
              createdAt: new Date().toISOString(),
              karmaPoints: 50
            };
            setUserProfile(newProf);
            setShowOnboarding(true);
          }
        } catch (err) {
          console.warn('Could not fetch Firestore user profile, setting fallback session profile:', err);
          const fallbackProf: UserProfile = {
            uid: u.uid,
            displayName: u.displayName || 'Sahayak User',
            email: u.email || '',
            photoURL: u.photoURL || '',
            createdAt: new Date().toISOString(),
            karmaPoints: 50
          };
          setUserProfile(fallbackProf);
        }
      } else {
        if (!isDemoUser) {
          setUserProfile(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  // Demo Sign In fallback
  const handleDemoSignIn = () => {
    const demoProf: UserProfile = {
      uid: 'demo-user-123',
      displayName: 'Sahayak First Responder',
      email: 'helper.demo@roadsahayak.org',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      phone: '+91 98765 00000',
      vehicleType: 'Car',
      createdAt: new Date().toISOString(),
      karmaPoints: 120
    };
    setUserProfile(demoProf);
    setIsDemoUser(true);
    setAuthLoading(false);
  };

  // 2. Continuous Location Watcher (watchPosition)
  const startLocationWatcher = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      setLocationError('Geolocation API is not supported in this browser.');
      return;
    }

    setLocationStatus('pending');

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const heading = pos.coords.heading || 0;
        const speed = pos.coords.speed || 0;

        setUserLat(lat);
        setUserLng(lng);
        setLocationStatus('granted');
        setLocationError(null);

        // Reverse geocode
        const addr = await reverseGeocode(lat, lng);
        setUserAddress(addr);

        // Update live location in Firestore if authenticated & broadcasting enabled
        if (userProfile && isBroadcastingLocation && !isDemoUser) {
          updateLiveLocation(
            userProfile.uid,
            userProfile.displayName,
            userProfile.photoURL,
            lat,
            lng,
            heading,
            speed
          );
        }
      },
      (err) => {
        console.warn('Geolocation watch position error:', err);
        setLocationStatus('denied');
        setLocationError(err.message || 'Location permission denied or unavailable.');
        
        // Fallback default coordinates (New Delhi) if denied
        if (userLat === null) {
          setUserLat(28.6139);
          setUserLng(77.2090);
          setUserAddress('New Delhi Capital Region (Demo)');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  };

  useEffect(() => {
    if (userProfile) {
      startLocationWatcher();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [userProfile, isBroadcastingLocation]);

  // 3. Realtime Snapshot Listeners for Incidents & Helpers
  useEffect(() => {
    const lat = userLat ?? 28.6139;
    const lng = userLng ?? 77.2090;

    // Load initial seed sample data so map is instantly populated
    const sampleIncs = getSampleIncidents(lat, lng);
    const sampleHelpers = getSampleLiveHelpers(lat, lng);

    let unsubIncidents: (() => void) | null = null;
    let unsubHelpers: (() => void) | null = null;

    try {
      // Listener for Incidents collection
      const qIncidents = collection(db, 'incidents');
      unsubIncidents = onSnapshot(
        qIncidents,
        (snapshot) => {
          const firestoreIncs: Incident[] = [];
          snapshot.forEach((docSnap) => {
            firestoreIncs.push({ id: docSnap.id, ...docSnap.data() } as Incident);
          });

          // Merge firestore incidents with sample demo incidents
          const combinedMap = new Map<string, Incident>();
          sampleIncs.forEach((i) => combinedMap.set(i.id, i));
          firestoreIncs.forEach((i) => combinedMap.set(i.id, i));

          const mergedIncidents = Array.from(combinedMap.values());
          setIncidents(mergedIncidents);

          // Detect new nearby incident for Toast Notification
          const currentIds = new Set(mergedIncidents.map((i) => i.id));
          if (prevIncidentIdsRef.current.size > 0) {
            const newlyAdded = mergedIncidents.find(
              (i) => !prevIncidentIdsRef.current.has(i.id) && i.status === 'active'
            );
            if (newlyAdded) {
              setToastIncident(newlyAdded);
            }
          }
          prevIncidentIdsRef.current = currentIds;
        },
        (err) => {
          console.warn('Incidents snapshot fallback to local dataset:', err);
          setIncidents(sampleIncs);
        }
      );

      // Listener for Live Locations collection
      const qHelpers = collection(db, 'liveLocations');
      unsubHelpers = onSnapshot(
        qHelpers,
        (snapshot) => {
          const helpersList: LiveLocation[] = [];
          snapshot.forEach((docSnap) => {
            helpersList.push(docSnap.data() as LiveLocation);
          });

          const combinedHelpersMap = new Map<string, LiveLocation>();
          sampleHelpers.forEach((h) => combinedHelpersMap.set(h.uid, h));
          helpersList.forEach((h) => combinedHelpersMap.set(h.uid, h));

          setLiveHelpers(Array.from(combinedHelpersMap.values()));
        },
        (err) => {
          console.warn('Helpers snapshot fallback:', err);
          setLiveHelpers(sampleHelpers);
        }
      );
    } catch (err) {
      console.warn('Firestore snapshot setup fallback:', err);
      setIncidents(sampleIncs);
      setLiveHelpers(sampleHelpers);
    }

    return () => {
      if (unsubIncidents) unsubIncidents();
      if (unsubHelpers) unsubHelpers();
    };
  }, [userLat, userLng]);

  // Onboarding Save handler
  const handleSaveOnboarding = async (phone: string, vehicleType: string) => {
    if (userProfile) {
      const updated = { ...userProfile, phone, vehicleType };
      setUserProfile(updated);
      if (!isDemoUser) {
        await updateUserProfile(userProfile.uid, { phone, vehicleType });
      }
    }
    setShowOnboarding(false);
  };

  // SOS Creation Success Handler
  const handleSosCreated = () => {
    setActiveTab('map');
  };

  // Filter user's reported incidents for profile tab
  const myIncidents = incidents.filter((i) => i.reporterUid === userProfile?.uid);

  // Active alerts count for bottom nav badge
  const activeAlertsCount = incidents.filter((i) => i.status === 'active').length;

  return (
    <PhoneFrame>
      {/* Auth Check */}
      {authLoading ? (
        <div className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-300">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4 shadow-xl" />
          <p className="text-xs font-black tracking-wider uppercase text-neutral-400">
            Connecting Road Sahayak...
          </p>
        </div>
      ) : !userProfile ? (
        <AuthScreen onDemoSignIn={handleDemoSignIn} />
      ) : (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-neutral-950">
          {/* Location Denied Banner */}
          {locationStatus === 'denied' && (
            <LocationBanner
              status="denied"
              errorMessage={locationError || undefined}
              onRetry={startLocationWatcher}
            />
          )}

          {/* In-App Toast Notification */}
          {toastIncident && (
            <NotificationToast
              incident={toastIncident}
              userLat={userLat}
              userLng={userLng}
              onView={() => {
                setSelectedIncident(toastIncident);
                setToastIncident(null);
              }}
              onDismiss={() => setToastIncident(null)}
            />
          )}

          {/* Core Tab Views */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'map' && (
              <MapView
                userLat={userLat}
                userLng={userLng}
                incidents={incidents}
                liveHelpers={liveHelpers}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onOpenSosForm={() => setActiveTab('sos')}
              />
            )}

            {activeTab === 'sos' && (
              <SosForm
                currentUser={userProfile}
                userLat={userLat}
                userLng={userLng}
                userAddress={userAddress}
                onSuccess={handleSosCreated}
                onCancel={() => setActiveTab('map')}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                incidents={incidents}
                userLat={userLat}
                userLng={userLng}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onOpenSos={() => setActiveTab('sos')}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                userProfile={userProfile}
                myIncidents={myIncidents}
                isBroadcastingLocation={isBroadcastingLocation}
                onToggleLocationBroadcast={() => setIsBroadcastingLocation((prev) => !prev)}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onRefreshProfile={() => {}}
              />
            )}
          </div>

          {/* Bottom Sheet Incident Detail Modal */}
          {selectedIncident && (
            <IncidentDetailSheet
              incident={selectedIncident}
              currentUser={userProfile}
              userLat={userLat}
              userLng={userLng}
              onClose={() => setSelectedIncident(null)}
            />
          )}

          {/* Post-Login Onboarding Modal */}
          {showOnboarding && userProfile && (
            <OnboardingModal
              userProfile={userProfile}
              onSave={handleSaveOnboarding}
              onSkip={() => setShowOnboarding(false)}
            />
          )}

          {/* Bottom Nav Bar */}
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeAlertsCount={activeAlertsCount}
          />
        </div>
      )}
    </PhoneFrame>
  );
}
