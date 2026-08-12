import { Incident, LiveLocation } from '../types';

// Generate dynamic realistic seed incidents around a given lat/lng center
export function getSampleIncidents(centerLat: number, centerLng: number): Incident[] {
  return [
    {
      id: 'demo-incident-1',
      reporterUid: 'user-rajesh-99',
      reporterName: 'Rajesh Kumar',
      reporterPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      reporterPhone: '+91 98765 43210',
      type: 'breakdown',
      description: 'Car overheated on flyover. Need coolant water or tow help. Engine warning light on.',
      photoURL: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
      location: {
        lat: centerLat + 0.0082,
        lng: centerLng + 0.0061
      },
      address: 'Outer Ring Road, near Metro Pillar 142',
      status: 'active',
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      respondersCount: 2,
      severity: 'medium'
    },
    {
      id: 'demo-incident-2',
      reporterUid: 'user-ananya-42',
      reporterName: 'Ananya Sharma',
      reporterPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      reporterPhone: '+91 99887 76655',
      type: 'flat_tire',
      description: 'Rear right tire punctured. Spare wheel is ready but car jack is jammed/stuck. Any help appreciated!',
      photoURL: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80',
      location: {
        lat: centerLat - 0.0054,
        lng: centerLng + 0.0093
      },
      address: 'NH-48 Service Road, opposite Fuel Station',
      status: 'active',
      createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      respondersCount: 1,
      severity: 'low'
    },
    {
      id: 'demo-incident-3',
      reporterUid: 'user-vikram-88',
      reporterName: 'Vikram Singh',
      reporterPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      reporterPhone: '+91 91234 56789',
      type: 'medical',
      description: 'Two-wheeler skid on slippery curve. Rider conscious with knee abrasion. First-aid box or water needed.',
      location: {
        lat: centerLat + 0.0125,
        lng: centerLng - 0.0078
      },
      address: 'Main Arterial Avenue, Sector 5 Intersection',
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      respondersCount: 3,
      severity: 'critical'
    },
    {
      id: 'demo-incident-4',
      reporterUid: 'user-deepak-15',
      reporterName: 'Deepak Patel',
      reporterPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      reporterPhone: '+91 94567 89012',
      type: 'fuel',
      description: 'Out of petrol 500m before toll plaza. Need 1-2 litres petrol in bottle to reach nearest station.',
      location: {
        lat: centerLat - 0.0112,
        lng: centerLng - 0.0089
      },
      address: 'Toll Expressway, Lane 3 Approach',
      status: 'active',
      createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      respondersCount: 0,
      severity: 'low'
    }
  ];
}

// Nearby live helpers for map radar preview
export function getSampleLiveHelpers(centerLat: number, centerLng: number): LiveLocation[] {
  return [
    {
      uid: 'helper-1',
      displayName: 'Amit R. (Sahayak Helper)',
      photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      lat: centerLat + 0.0035,
      lng: centerLng - 0.0042,
      heading: 120,
      speed: 25,
      lastUpdated: new Date()
    },
    {
      uid: 'helper-2',
      displayName: 'Priya M. (First Responder)',
      photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      lat: centerLat - 0.0028,
      lng: centerLng + 0.0051,
      heading: 45,
      speed: 18,
      lastUpdated: new Date()
    },
    {
      uid: 'helper-3',
      displayName: 'Sanjay Patrol',
      photoURL: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
      lat: centerLat + 0.0071,
      lng: centerLng + 0.0039,
      heading: 270,
      speed: 40,
      lastUpdated: new Date()
    }
  ];
}
