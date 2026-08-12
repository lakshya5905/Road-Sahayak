import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Locate, Filter, ShieldAlert, Layers, Navigation, RefreshCw } from 'lucide-react';
import { Incident, IncidentType, LiveLocation } from '../types';
import { INCIDENT_CONFIGS, calculateDistanceKm, formatDistance } from '../lib/location';

interface MapViewProps {
  userLat: number | null;
  userLng: number | null;
  incidents: Incident[];
  liveHelpers: LiveLocation[];
  onSelectIncident: (incident: Incident) => void;
  onOpenSosForm: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  userLat,
  userLng,
  incidents,
  liveHelpers,
  onSelectIncident,
  onOpenSosForm
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [mapReady, setMapReady] = useState(false);

  // Default fallback center (e.g., New Delhi)
  const defaultLat = userLat ?? 28.6139;
  const defaultLng = userLng ?? 77.2090;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: false
    });

    // Dark styled / High contrast OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when user location changes
  useEffect(() => {
    if (mapInstanceRef.current && userLat && userLng) {
      mapInstanceRef.current.setView([userLat, userLng], mapInstanceRef.current.getZoom() || 14);
    }
  }, [userLat, userLng]);

  // Render Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !mapReady) return;

    const group = markersGroupRef.current;
    group.clearLayers();

    // 1. Render User Location Marker (Blue Radar Pulse)
    if (userLat && userLng) {
      const userHtml = `
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
          <div className="w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userHtml,
        className: 'custom-user-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(group);
      userMarker.bindTooltip('You are here', { permanent: false, direction: 'top' });
    }

    // 2. Render Live Helpers Markers (Green Dot / Vehicle)
    liveHelpers.forEach((helper) => {
      if (!helper.lat || !helper.lng) return;
      const helperHtml = `
        <div className="relative flex items-center justify-center w-7 h-7">
          <div className="w-6 h-6 bg-emerald-600/90 text-white rounded-full border border-white shadow-md flex items-center justify-center text-[10px]">
            🛞
          </div>
        </div>
      `;
      const helperIcon = L.divIcon({
        html: helperHtml,
        className: 'custom-helper-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const helperMarker = L.marker([helper.lat, helper.lng], { icon: helperIcon }).addTo(group);
      helperMarker.bindTooltip(helper.displayName || 'Active Sahayak Helper', {
        permanent: false,
        direction: 'top'
      });
    });

    // 3. Render Incident Markers
    const activeIncidents = incidents.filter((inc) => inc.status === 'active');

    activeIncidents.forEach((inc) => {
      if (!inc.location?.lat || !inc.location?.lng) return;

      // Filter by type
      if (selectedType !== 'all' && inc.type !== selectedType) return;

      // Filter by radius if user position is available
      if (userLat && userLng) {
        const dist = calculateDistanceKm(userLat, userLng, inc.location.lat, inc.location.lng);
        if (dist > radiusKm) return;
      }

      const config = INCIDENT_CONFIGS[inc.type] || INCIDENT_CONFIGS.other;
      const isCritical = inc.type === 'accident' || inc.type === 'medical';

      const incidentHtml = `
        <div className="relative group cursor-pointer flex items-center justify-center">
          ${
            isCritical
              ? `<div className="absolute w-10 h-10 bg-red-500/40 rounded-full animate-ping"></div>`
              : ''
          }
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-xl border-2 border-white transition transform hover:scale-110" style="background-color: ${config.pinBg}">
            <span style="font-size: 14px;">${
              inc.type === 'accident'
                ? '🚨'
                : inc.type === 'breakdown'
                ? '🔧'
                : inc.type === 'fuel'
                ? '⛽'
                : inc.type === 'medical'
                ? '🚑'
                : inc.type === 'flat_tire'
                ? '🛞'
                : '⚠️'
            }</span>
          </div>
          ${
            inc.respondersCount > 0
              ? `<span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">${inc.respondersCount}</span>`
              : ''
          }
        </div>
      `;

      const incidentIcon = L.divIcon({
        html: incidentHtml,
        className: 'custom-incident-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([inc.location.lat, inc.location.lng], {
        icon: incidentIcon
      }).addTo(group);

      marker.on('click', () => {
        onSelectIncident(inc);
      });
    });
  }, [incidents, liveHelpers, userLat, userLng, selectedType, radiusKm, mapReady]);

  // Recenter button click
  const handleRecenter = () => {
    if (mapInstanceRef.current && userLat && userLng) {
      mapInstanceRef.current.flyTo([userLat, userLng], 15, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-neutral-950">
      {/* Top Floating Filter Bar */}
      <div className="absolute top-3 inset-x-3 z-20 flex flex-col gap-2">
        {/* Incident Type Filter Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none px-1">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-xl border transition ${
              selectedType === 'all'
                ? 'bg-orange-500 text-white border-orange-400'
                : 'bg-neutral-900/90 text-neutral-300 border-neutral-800/80 backdrop-blur-md hover:bg-neutral-800'
            }`}
          >
            All Alerts ({incidents.filter((i) => i.status === 'active').length})
          </button>

          {Object.values(INCIDENT_CONFIGS).map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg border flex items-center gap-1.5 transition ${
                selectedType === item.id
                  ? 'bg-neutral-100 text-neutral-950 border-white font-black'
                  : 'bg-neutral-900/90 text-neutral-300 border-neutral-800/80 backdrop-blur-md hover:bg-neutral-800'
              }`}
            >
              <span>{item.id === 'accident' ? '🚨' : item.id === 'breakdown' ? '🔧' : item.id === 'fuel' ? '⛽' : item.id === 'medical' ? '🚑' : '⚠️'}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Sub Header info pill */}
        <div className="flex items-center justify-between text-[11px] text-neutral-300 px-3.5 py-2 bg-neutral-900/90 backdrop-blur-xl border border-neutral-800/80 rounded-2xl shadow-xl">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Sahayak Radar</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-400 font-normal">{liveHelpers.length} helpers active</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-neutral-400">Radius:</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="bg-neutral-950 text-orange-400 text-xs font-bold border border-neutral-800 rounded-lg px-1.5 py-0.5 focus:outline-none"
            >
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaflet Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Action Controls on Map */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-3">
        {/* Recenter button */}
        <button
          onClick={handleRecenter}
          className="w-11 h-11 bg-neutral-900/90 backdrop-blur-md hover:bg-neutral-800 text-white rounded-2xl shadow-2xl border border-neutral-800 flex items-center justify-center active:scale-95 transition"
          title="Recenter on my location"
        >
          <Locate className="w-5 h-5 text-orange-400" />
        </button>

        {/* Quick Report SOS FAB */}
        <button
          onClick={onOpenSosForm}
          className="px-4 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white font-black rounded-2xl shadow-2xl shadow-red-600/40 border border-white/20 flex items-center gap-2 active:scale-95 transition hover:brightness-110 text-xs tracking-wider"
        >
          <ShieldAlert className="w-4 h-4 animate-bounce" />
          <span>REPORT SOS</span>
        </button>
      </div>
    </div>
  );
};
