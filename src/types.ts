export type IncidentType = 
  | 'accident'
  | 'breakdown'
  | 'fuel'
  | 'medical'
  | 'flat_tire'
  | 'lockout'
  | 'hazard'
  | 'other';

export type IncidentStatus = 'active' | 'resolved' | 'cancelled';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  phone?: string;
  vehicleType?: string; // 'Car' | 'Two Wheeler' | 'SUV' | 'Commercial' | 'Auto'
  createdAt?: string;
  updatedAt?: string;
  karmaPoints?: number;
}

export interface IncidentLocation {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  reporterUid: string;
  reporterName: string;
  reporterPhoto?: string;
  reporterPhone?: string;
  type: IncidentType;
  description?: string;
  photoURL?: string;
  location: IncidentLocation;
  address?: string;
  status: IncidentStatus;
  createdAt: any; // Timestamp
  respondersCount: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface Responder {
  uid: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  distanceKm?: number;
  eta?: string;
  timestamp: any;
}

export interface LiveLocation {
  uid: string;
  displayName: string;
  photoURL?: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  lastUpdated: any;
}

export type TabType = 'map' | 'sos' | 'alerts' | 'profile';

export interface IncidentTypeConfig {
  id: IncidentType;
  label: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  pinBg: string;
  description: string;
}
