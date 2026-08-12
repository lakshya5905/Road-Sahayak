import { IncidentType, IncidentTypeConfig } from '../types';

// Calculate distance in kilometers using Haversine formula
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance nicely
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

// Format time ago from timestamp or Date
export function formatTimeAgo(time: any): string {
  if (!time) return 'Just now';
  
  let date: Date;
  if (typeof time === 'object' && time.seconds) {
    date = new Date(time.seconds * 1000);
  } else if (typeof time === 'string' || typeof time === 'number') {
    date = new Date(time);
  } else if (time instanceof Date) {
    date = time;
  } else {
    return 'Recently';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

// Reverse geocoding helper using OSM Nominatim API with fast caching
const addressCache = new Map<string, string>();

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (addressCache.has(key)) {
    return addressCache.get(key)!;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
      {
        headers: {
          'User-Agent': 'RoadSahayakApp/1.0'
        }
      }
    );
    if (response.ok) {
      const data = await response.json();
      let addressStr = '';
      if (data.address) {
        const parts = [
          data.address.road || data.address.pedestrian || data.address.suburb,
          data.address.neighbourhood || data.address.city_district || data.address.city || data.address.town
        ].filter(Boolean);
        addressStr = parts.join(', ');
      }
      if (!addressStr) {
        addressStr = data.display_name?.split(',').slice(0, 3).join(',') || `Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
      }
      addressCache.set(key, addressStr);
      return addressStr;
    }
  } catch (err) {
    console.warn('Geocoding fallback triggered:', err);
  }

  const fallback = `Highway / Sector (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
  addressCache.set(key, fallback);
  return fallback;
}

// Incident configurations
export const INCIDENT_CONFIGS: Record<IncidentType, IncidentTypeConfig> = {
  accident: {
    id: 'accident',
    label: 'Accident',
    iconName: 'AlertTriangle',
    badgeBg: 'bg-red-500/20 border-red-500/50 text-red-400',
    badgeText: 'CRITICAL',
    pinBg: '#ef4444',
    description: 'Vehicle collision or road accident requiring urgent help'
  },
  breakdown: {
    id: 'breakdown',
    label: 'Breakdown',
    iconName: 'Wrench',
    badgeBg: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    badgeText: 'ASSISTANCE',
    pinBg: '#f59e0b',
    description: 'Engine failure, battery dead, or mechanical breakdown'
  },
  fuel: {
    id: 'fuel',
    label: 'Out of Fuel',
    iconName: 'Fuel',
    badgeBg: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    badgeText: 'REFILL',
    pinBg: '#3b82f6',
    description: 'Ran out of petrol, diesel, or EV battery charging help'
  },
  medical: {
    id: 'medical',
    label: 'Medical',
    iconName: 'Cross',
    badgeBg: 'bg-rose-600/20 border-rose-500/50 text-rose-300',
    badgeText: 'EMERGENCY',
    pinBg: '#e11d48',
    description: 'Injuries, illness, or medical aid required on road'
  },
  flat_tire: {
    id: 'flat_tire',
    label: 'Flat Tire',
    iconName: 'Disc',
    badgeBg: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    badgeText: 'REPAIR',
    pinBg: '#eab308',
    description: 'Punctured tire, jack needed, or spare tire assistance'
  },
  lockout: {
    id: 'lockout',
    label: 'Locked Out / Tow',
    iconName: 'Key',
    badgeBg: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    badgeText: 'TOW/KEYS',
    pinBg: '#a855f7',
    description: 'Keys locked inside vehicle or towing required'
  },
  hazard: {
    id: 'hazard',
    label: 'Road Hazard',
    iconName: 'ShieldAlert',
    badgeBg: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
    badgeText: 'HAZARD',
    pinBg: '#f97316',
    description: 'Oil spill, fallen tree, waterlogging, or severe roadblock'
  },
  other: {
    id: 'other',
    label: 'Other Help',
    iconName: 'HelpCircle',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    badgeText: 'GENERAL',
    pinBg: '#10b981',
    description: 'General assistance or road direction help'
  }
};
