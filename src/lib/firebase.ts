import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  limit,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Incident, Responder, LiveLocation } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test helper per Firebase integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection check: Client operating in offline mode or network restricted.");
    }
  }
}
testConnection();

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile exists
    const userRef = doc(db, 'users', user.uid);
    let userSnap = null;
    try {
      userSnap = await getDoc(userRef);
    } catch (err) {
      console.warn('Could not reach Firestore to get user profile, using fallback profile:', err);
    }
    
    if (!userSnap || !userSnap.exists()) {
      // First sign-in: create user profile
      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Road Sahayak User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        karmaPoints: 50 // Welcome karma bonus
      };
      try {
        await setDoc(userRef, newProfile);
      } catch (err) {
        console.warn('Could not save user profile to Firestore:', err);
      }
      return { user, isNewUser: true };
    }
    
    return { user, isNewUser: false };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// Update user profile info (e.g., phone & vehicleType from onboarding)
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Fetch user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Update User Live Location
export const updateLiveLocation = async (
  uid: string,
  displayName: string,
  photoURL: string,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number
) => {
  try {
    const locRef = doc(db, 'liveLocations', uid);
    await setDoc(locRef, {
      uid,
      displayName,
      photoURL: photoURL || '',
      lat,
      lng,
      heading: heading || 0,
      speed: speed || 0,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.warn('Error updating live location in Firestore:', error);
  }
};

// Create new SOS Incident
export const createIncident = async (incidentData: Omit<Incident, 'id' | 'createdAt' | 'respondersCount'>) => {
  try {
    const incidentsRef = collection(db, 'incidents');
    const docRef = await addDoc(incidentsRef, {
      ...incidentData,
      status: 'active',
      createdAt: serverTimestamp(),
      respondersCount: 0
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'incidents');
    console.error('Error creating incident:', error);
    throw error;
  }
};

// Respond to an incident ("I can help")
export const respondToIncident = async (
  incidentId: string,
  responder: Omit<Responder, 'timestamp'>
) => {
  try {
    const responderRef = doc(db, 'incidents', incidentId, 'responders', responder.uid);
    await setDoc(responderRef, {
      ...responder,
      timestamp: serverTimestamp()
    });

    // Increment responders count on incident doc
    const incidentRef = doc(db, 'incidents', incidentId);
    try {
      const snap = await getDoc(incidentRef);
      if (snap.exists()) {
        const currentCount = snap.data().respondersCount || 0;
        await updateDoc(incidentRef, {
          respondersCount: currentCount + 1
        });
      }
    } catch (err) {
      console.warn('Could not update responders count on incident:', err);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `incidents/${incidentId}/responders/${responder.uid}`);
    console.error('Error responding to incident:', error);
    throw error;
  }
};

// Resolve an incident
export const updateIncidentStatus = async (incidentId: string, status: 'active' | 'resolved' | 'cancelled') => {
  try {
    const incidentRef = doc(db, 'incidents', incidentId);
    await updateDoc(incidentRef, {
      status
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `incidents/${incidentId}`);
    console.error('Error updating incident status:', error);
    throw error;
  }
};

