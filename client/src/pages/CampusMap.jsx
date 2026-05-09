import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap, useMapEvents, LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { Search, Navigation, LocateFixed, Layers, Info, ArrowLeft, X, Plus, Minus, Globe, Map, Check, MapPin, Volume2, VolumeX, Moon, Coffee, Home, Book, Trophy, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useNavigate, useLocation } from 'react-router-dom';
import useCampusStore from '../store/useCampusStore';
import useToastStore from '../store/useToastStore';
import useThemeStore from '../store/useThemeStore';

const MapControls = ({ userLocation, setUserLocation, userHeading, isMapFollowHeading, setIsMapFollowHeading }) => {
  const map = useMap();
  const showToast = useToastStore(state => state.showToast);
  
  const handleLocate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];
        
        const distance = L.latLng(coords).distanceTo(L.latLng(LNCT_CENTER));
        const isInside = isPointInCampus(coords);
        
        if (!isInside && distance > 1500) {
          // If too far, show toast and fly to Main Gate as fallback
          showToast("Out of LNCT Campus", "You are currently too far. Showing LNCT Main Gate instead.");
          const mainGate = [23.2514627, 77.5247203]; // LNCT Main Gate
          map.flyTo(mainGate, 17.5, { duration: 1.5 });
        } else {
          // If inside or nearby, show actual GPS location
          setUserLocation(coords);
          map.flyTo(coords, 17.5, { duration: 1.5 });
        }
      }, (error) => {
        showToast("Location Error", "Please enable GPS to see your position");
      });
    }
  };

  const { selectedBuilding } = useCampusStore();

  return (
    <div className={clsx(
      "absolute right-4 z-[1001] flex flex-col gap-2 sm:gap-3 transition-all duration-500",
      selectedBuilding ? "bottom-[340px] sm:bottom-24" : "bottom-20 sm:bottom-24"
    )}>
      {/* GPS Button */}
      <button
        onClick={(e) => {
          L.DomEvent.stopPropagation(e);
          handleLocate();
        }}
        className="p-3 sm:p-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-90 group"
      >
        <LocateFixed size={22} className="sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          onClick={(e) => {
            L.DomEvent.stopPropagation(e);
            map.zoomIn();
          }}
          className="p-3 sm:p-4 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition-colors active:bg-blue-50 dark:active:bg-blue-900/20"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={(e) => {
            L.DomEvent.stopPropagation(e);
            map.zoomOut();
          }}
          className="p-3 sm:p-4 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:bg-blue-50 dark:active:bg-blue-900/20"
        >
          <Minus size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Compass Button */}
      <button
        onClick={(e) => {
          L.DomEvent.stopPropagation(e);
          if (isMapFollowHeading) {
            setIsMapFollowHeading(false);
          } else {
            setIsMapFollowHeading(true);
            showToast("Auto-Rotation Enabled", "Map will now rotate with your device");
          }
        }}
        className={clsx(
          "p-3 sm:p-4 rounded-2xl shadow-xl border transition-all active:scale-90 group relative flex items-center justify-center overflow-hidden",
          isMapFollowHeading 
            ? "bg-blue-600 border-blue-500 text-white" 
            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
        )}
      >
        <div 
          className="transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${isMapFollowHeading ? 0 : -(userHeading || 0)}deg)` }}
        >
          <Navigation 
            size={22} 
            className={clsx(
              "sm:w-6 sm:h-6 fill-current",
              !isMapFollowHeading && "text-red-500" // Red North tip when not following
            )} 
          />
        </div>
        {!isMapFollowHeading && (
          <span className="absolute top-1 text-[10px] font-bold text-red-500">N</span>
        )}
      </button>
    </div>
  );
};

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// The coordinates for masking outside campus
const WORLD_MASK = [
  [-90, -180],
  [90, -180],
  [90, 180],
  [-90, 180]
];

// The coordinates you provided from geojson.io
const CAMPUS_BOUNDARY = [
  [23.251608, 77.523429],
  [23.2519626, 77.5250805],
  [23.2516967, 77.525131],
  [23.2515577, 77.5251418],
  [23.2514894, 77.5251702],
  [23.2514522, 77.5252094],
  [23.2510383, 77.5254475],
  [23.2508348, 77.5261561],
  [23.2521952, 77.5261688],
  [23.2523166, 77.5268847],
  [23.2521764, 77.5273809],
  [23.2516986, 77.5274351],
  [23.2510665, 77.5274513],
  [23.2503569, 77.5276307],
  [23.2502392, 77.5276678],
  [23.2501757, 77.527798],
  [23.2501007, 77.5281536],
  [23.2499995, 77.5289615],
  [23.2496705, 77.5292736],
  [23.2488416, 77.5288224],
  [23.2481438, 77.5285718],
  [23.2486645, 77.5272873],
  [23.2489236, 77.5270478],
  [23.2489838, 77.5265591],
  [23.2487314, 77.5258184],
  [23.2485118, 77.5245999],
  [23.2488015, 77.5232019],
  [23.2488154, 77.5228706],
  [23.2488312, 77.5225333],
  [23.2488026, 77.5222072],
  [23.2488344, 77.5219182],
  [23.2488911, 77.5215928],
  [23.249466, 77.5216335],
  [23.249929, 77.5216903],
  [23.2503919, 77.5219423],
  [23.2505412, 77.5220967],
  [23.2506905, 77.5225111],
  [23.2509743, 77.5223567],
  [23.2513327, 77.5221942],
  [23.251608, 77.523429]
];

const LNCT_CENTER = [23.25128375, 77.52472457];

// Optimized Point-in-Polygon Algorithm (Ray Casting with Bounding Box)
const isPointInCampus = (point) => {
  if (!point || point.length < 2) return false;
  const [lat, lng] = point;

  // 1. O(1) Bounding Box Pre-filter for massive speed gain
  // Min/Max values extracted from CAMPUS_BOUNDARY
  const minLat = 23.2481438;
  const maxLat = 23.2523166;
  const minLng = 77.5215928;
  const maxLng = 77.5292736;

  if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
    return false;
  }

  // 2. O(N) Precise Ray Casting Check
  let inside = false;
  for (let i = 0, j = CAMPUS_BOUNDARY.length - 1; i < CAMPUS_BOUNDARY.length; j = i++) {
    const xi = CAMPUS_BOUNDARY[i][0], yi = CAMPUS_BOUNDARY[i][1];
    const xj = CAMPUS_BOUNDARY[j][0], yj = CAMPUS_BOUNDARY[j][1];

    const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

const RecenterButton = ({ coords }) => {
  const map = useMap();
  return (
    <button 
      onClick={() => map.setView(coords, 17)}
      className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-lg text-blue-600 hover:bg-blue-50 transition-colors"
    >
      <LocateFixed size={20} />
    </button>
  );
};

import { buildingService } from '../services/api';

const RoutingEngine = ({ userLocation, destination }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !userLocation || !destination) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(destination[0], destination[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8, lineCap: 'round' }]
      },
      createMarker: () => null // Hide default markers
    }).addTo(map);

    // Hide the instruction panel (we want a clean UI)
    const container = routingControl.getContainer();
    if (container) container.style.display = 'none';

    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, userLocation, destination]);

  return null;
};

const RecenterHandler = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    const handleRecenter = () => {
      map.setView(center, 17, { animate: true });
    };
    window.addEventListener('recenter-map', handleRecenter);
    return () => window.removeEventListener('recenter-map', handleRecenter);
  }, [map, center]);
  return null;
};

const MapFocus = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 17.5, { animate: true });
    }
  }, [coords, map]);
  return null;
};

const getBuildingSVG = (name, type) => {
  const lowerName = name.toLowerCase();
  
  // Sacred & Culture
  if (lowerName.includes('temple') || lowerName.includes('mandir')) {
    return 'ॐ'; // Use the Om symbol directly as text
  }

  // Sports & Recreation
  if (lowerName.includes('volleyball') || lowerName.includes('basketball')) {
    return '<circle cx="12" cy="12" r="10"/><path d="M4.93 4.93a10 10 0 0 1 14.14 14.14M19.07 4.93a10 10 0 0 0-14.14 14.14"/>';
  }
  if (lowerName.includes('ground') || lowerName.includes('sports')) {
    return '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>';
  }
  if (lowerName.includes('gym')) {
    return '<path d="m6.5 6.5 11 11M6.5 17.5l11-11M2 9v6M22 9v6M5 21v-4M19 21v-4M5 7V3M19 7V3"/>';
  }

  // Food & Dining
  if (lowerName.includes('prasadam') || lowerName.includes('canteen') || lowerName.includes('food')) {
    return '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'; // Utensils
  }

  // Academic & Specialized
  if (lowerName.includes('agriculture')) {
    return '<path d="M2 22s4.5-2 4.5-9c0-4.42-3-8-3-8s8 3 8 8c0 4.5-2 9-9 9Z"/><path d="M22 22s-4.5-2-4.5-9c0-4.42 3-8 3-8s-8 3-8 8c0 4.5 2 9 9 9Z"/><path d="M12 2v20"/>'; // Leaves
  }
  if (lowerName.includes('library')) {
    return '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20M6.5 7v10M6.5 22c-1.35 0-2.5-1.1-2.5-2.5V4.5C4 3.1 5.15 2 6.5 2H20v20H6.5Z"/>';
  }
  if (lowerName.includes('main building')) {
    return '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>';
  }
  if (lowerName.includes('lncte') || lowerName.includes('excellence')) {
    return '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>';
  }
  
  // Gate
  if (lowerName.includes('gate')) {
    return '<path d="M3 21h18M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14M9 21V11a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10"/>';
  }

  // Medical
  if (lowerName.includes('medical') || lowerName.includes('health') || lowerName.includes('clinic')) {
    return '<path d="M12 5v14M5 12h14"/>'; // Plus symbol
  }
  
  // Transport & Events
  if (lowerName.includes('bus')) {
    return '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2m12 0c0 1.1-.9 2-2 2s-2-.9-2-2m-8 0c0 1.1-.9 2-2 2s-2-.9-2-2m4-2v-4m3 0V7"/>';
  }
  if (lowerName.includes('auditorium') || lowerName.includes('seminar')) {
    return '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>';
  }

  // Hostel & Residential
  if (lowerName.includes('hostel')) {
    return '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
  }
  if (lowerName.includes('quarter') || lowerName.includes('faculty') || type === 'Residential') {
    return '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3"/>'; // House with center detail
  }
  
  // Workshop
  if (lowerName.includes('workshop')) {
    return '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>';
  }

  // Entrance
  if (lowerName.includes('entrance') || type === 'Entrance') {
    return '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>';
  }

  return '<path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5"/>';
};

const IMPORTANT_BUILDINGS = [
  "LNCT MAIN BUILDING",
  "LNCTS NEW BUILDING",
  "LNCTE BUILDING",
  "LNCP BUILDING",
  "MAIN GATE",
  "LNCT MAIN GATE"
];

const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  let themeColor = '#3b82f6'; // Blue
  if (count > 5) themeColor = '#6366f1'; // Indigo
  if (count > 10) themeColor = '#8b5cf6'; // Violet

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <!-- Subtle glassmorphic ring -->
        <div class="absolute w-10 h-10 rounded-full bg-white/30 backdrop-blur-[1px] border border-white/40 animate-pulse"></div>
        
        <!-- Main Crisp Icon -->
        <div class="w-7 h-7 rounded-full shadow-xl border-2 border-white flex items-center justify-center text-white font-black text-[10px] z-10" 
             style="background: ${themeColor}">
          ${count}
        </div>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [40, 40]
  });
};

const createBuildingIcon = (name, type, isSelected, currentZoom, mapCenter, coords) => {
  const content = getBuildingSVG(name, type);
  const isText = !content.startsWith('<');
  
  let colorClass = 'bg-slate-500';
  const lowerName = name.toLowerCase();

  if (isSelected) {
    colorClass = 'bg-blue-600';
  } else if (lowerName.includes('gate')) {
    colorClass = 'bg-[#f58220]'; // LNCT Orange
  } else if (lowerName.includes('mandir') || lowerName.includes('temple')) {
    colorClass = 'bg-[#f97316]'; // Sacred Saffron/Orange
  } else if (lowerName.includes('girls hostel')) {
    colorClass = 'bg-pink-500';
  } else if (lowerName.includes('boys hostel') || lowerName.includes('hostel')) {
    colorClass = 'bg-indigo-600';
  } else if (lowerName.includes('quarter') || lowerName.includes('faculty') || type === 'Residential') {
    colorClass = 'bg-teal-600'; // Teal for Faculty/Residential
  } else if (lowerName.includes('workshop')) {
    colorClass = 'bg-slate-700'; // Steel grey for Workshops
  } else if (lowerName.includes('bus')) {
    colorClass = 'bg-amber-500';
  } else if (type === 'Sports') {
    colorClass = 'bg-green-600';
  } else if (type === 'Facility') {
    colorClass = 'bg-amber-600';
  } else if (type === 'Entrance') {
    colorClass = 'bg-blue-400';
  } else if (type === 'Gate') {
    colorClass = 'bg-slate-800';
  } else if (lowerName.includes('medical') || lowerName.includes('health')) {
    colorClass = 'bg-red-500'; // Red for medical
  }
  
  const isImportant = IMPORTANT_BUILDINGS.includes(name.toUpperCase());
  const isSubLocation = type === 'Room' || type === 'Lab' || type === 'Entrance' || type === 'Gate';
  
  // Dynamic Spatial Focus System:
  // Calculate distance from the current map center to determine if this location is "in focus"
  let isInFocus = true;
  if (mapCenter && coords) {
    const dist = L.latLng(coords).distanceTo(L.latLng(mapCenter));
    // The "Focus Radius" expands as we zoom in
    // Zoom 17: ~120m radius, Zoom 18: ~250m radius, Zoom 19: All visible
    const focusRadius = 120 + (currentZoom - 17) * 130;
    isInFocus = dist < focusRadius || currentZoom >= 18.8;
  }

  // Label Visibility Rules:
  // 1. Selected building: Always show
  // 2. Important Landmarks: Always show if in focus (17+)
  // 3. Secondary Buildings: Show if in focus (17.8+)
  // 4. Sub-locations: Show if in focus and zoomed in deep (18.9+)
  // 5. SUPPRESS: Never show labels for Paths or secondary Gates
  const isPathOrSecondaryGate = type === 'Path' || (type === 'Gate' && !name.toLowerCase().includes('main gate'));
  
  const showLabel = !isPathOrSecondaryGate && (
                   isSelected || 
                   (isImportant && isInFocus && currentZoom >= 17) || 
                   (!isSubLocation && isInFocus && currentZoom >= 17.8) || 
                   (isSubLocation && isInFocus && currentZoom >= 18.9)
  );

  return L.divIcon({
    className: 'custom-building-icon',
    html: `
      <div class="relative flex flex-col items-center">
        ${isSelected ? '<div class="absolute -top-1 w-10 h-10 bg-blue-600/30 rounded-full animate-ping"></div>' : ''}
        <div class="relative w-8 h-8 ${colorClass} rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-500 z-10">
          ${isText 
            ? `<span class="text-white font-bold text-lg leading-none">${content}</span>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`
          }
        </div>
        ${showLabel ? `
          <div class="mt-1 px-2 py-0.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded shadow-lg border border-slate-200 dark:border-slate-800 transition-all ${isSelected ? 'scale-110 -translate-y-1 ring-2 ring-blue-500 z-20' : 'scale-90 opacity-90 z-0'}">
            <span class="text-[10px] font-black whitespace-nowrap text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
              ${name}
            </span>
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [32, 48],
    iconAnchor: [16, 40]
  });
};

const CustomLayersControl = ({ baseLayer, setBaseLayer, showBoundary, setShowBoundary }) => {
  const [isOpen, setIsOpen] = useState(false);

  const layers = [
    { id: 'street', name: 'Street View', icon: Map, color: 'bg-blue-500' },
    { id: 'satellite', name: 'Satellite View', icon: Globe, color: 'bg-indigo-600' },
    { id: 'dark', name: 'Dark View', icon: Moon, color: 'bg-slate-900' },
  ];

  return (
    <div className="flex flex-col items-start gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mb-1 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-2 min-w-[190px]"
          >
            <div className="px-3 pt-1.5 pb-0.5 flex items-center justify-between">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Map Styles</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={12} className="text-slate-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-1">
              {layers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setBaseLayer(layer.id)}
                  className={clsx(
                    "flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 group",
                    baseLayer === layer.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <layer.icon size={16} className={clsx(baseLayer === layer.id ? "text-white" : "text-blue-500")} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{layer.name}</span>
                  </div>
                  {baseLayer === layer.id && <Check size={12} />}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5">
              <button
                onClick={() => setShowBoundary(!showBoundary)}
                className={clsx(
                  "w-full flex items-center justify-between p-2.5 rounded-xl transition-all",
                  showBoundary 
                    ? "bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border border-green-100/50 dark:border-green-900/30" 
                    : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={clsx(
                    "w-1.5 h-1.5 rounded-full",
                    showBoundary ? "bg-green-500 animate-pulse" : "bg-slate-300"
                  )} />
                  <span className="text-[10px] font-black uppercase tracking-tight">Boundary</span>
                </div>
                {showBoundary && <Check size={12} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "p-2.5 rounded-xl shadow-xl backdrop-blur-xl transition-all group border-2 relative overflow-hidden",
          isOpen 
            ? "bg-blue-600 text-white border-blue-400/50 shadow-blue-500/30" 
            : "bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-white dark:border-slate-800"
        )}
      >
        {isOpen && (
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] pointer-events-none"
          />
        )}
        <Layers 
          size={18} 
          className={clsx(
            "transition-all duration-300 ease-out",
            isOpen ? "rotate-12" : "rotate-0 group-hover:rotate-12 group-active:rotate-12"
          )} 
        />
      </motion.button>
    </div>
  );
};

const MapEventsHandler = ({ setZoom, setSelectedBuilding, setMapCenter }) => {
  const setIsNavbarVisible = useCampusStore(state => state.setIsNavbarVisible);
  const [lastY, setLastY] = useState(null);

  useMapEvents({
    zoomend: (e) => {
      setZoom(e.target.getZoom());
      setMapCenter(e.target.getCenter());
    },
    movestart: (e) => {
      setLastY(e.target.getCenter().lat);
    },
    move: (e) => {
      const currentY = e.target.getCenter().lat;
      if (lastY !== null) {
        const delta = currentY - lastY;
        // User pulls map DOWN (seeing North) = Scrolling UP
        if (delta > 0.00005) {
          setIsNavbarVisible(false);
        } 
        // User pulls map UP (seeing South) = Scrolling DOWN
        else if (delta < -0.00005) {
          setIsNavbarVisible(true);
        }
      }
      setLastY(currentY);
    },
    moveend: (e) => {
      setMapCenter(e.target.getCenter());
      // Show navbar when scrolling stops
      setTimeout(() => setIsNavbarVisible(true), 200);
    },
    click: () => {
      setSelectedBuilding(null);
      setIsNavbarVisible(true);
    }
  });
  return null;
};

const NEARBY_CATEGORIES = [
  { id: 'canteen', name: 'Canteen', icon: Coffee },
  { id: 'hostel', name: 'Hostel', icon: Home },
  { id: 'library', name: 'Library', icon: Book },
  { id: 'medical', name: 'Medical', icon: Plus },
  { id: 'ground', name: 'Ground', icon: Trophy },
  { id: 'stationery', name: 'Stationery', icon: PenTool },
];

const CampusMap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const targetBuildingName = searchParams.get('building');

  const { 
    buildings, 
    isLoading, 
    fetchBuildings, 
    selectedBuilding, 
    setSelectedBuilding,
    navigationPath,
    setNavigationPath
  } = useCampusStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(null);
  const [distanceToSelected, setDistanceToSelected] = useState(null);
  const [baseLayer, setBaseLayer] = useState('street');
  const [showBoundary, setShowBoundary] = useState(true);
  const [zoom, setZoom] = useState(17);
  const [mapCenter, setMapCenter] = useState(LNCT_CENTER);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [wakeLock, setWakeLock] = useState(null);
  const { isDark } = useThemeStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMapFollowHeading, setIsMapFollowHeading] = useState(false);
  const showToast = useToastStore(state => state.showToast);

  // Voice Instruction System
  const speak = (text) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Wake Lock System
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isNavigating) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        } catch (err) {
          console.error("Wake Lock Error", err);
        }
      } else if (wakeLock) {
        wakeLock.release().then(() => setWakeLock(null));
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [isNavigating]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track User Location & Heading with Boundary Control
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        const distance = L.latLng(coords).distanceTo(L.latLng(LNCT_CENTER));
        const isInside = isPointInCampus(coords);

        // Continuous tracking only if within or near campus
        if (isInside || distance <= 1500) {
          setUserLocation(coords);
        } else if (userLocation) {
          // Stop showing marker if they exit the boundary
          setUserLocation(null);
        }
      },
      (err) => console.error("GPS Error", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    // Compass / Orientation Logic
    const handleOrientation = (e) => {
      // Use webkitCompassHeading for iOS, alpha for Android (absolute)
      const heading = e.webkitCompassHeading || (e.absolute ? e.alpha : null);
      if (heading !== null) {
        // We subtract from 360 because alpha is counter-clockwise
        setUserHeading(e.webkitCompassHeading ? heading : 360 - heading);
      }
    };

    const startOrientation = async () => {
      // iOS 13+ requires permission
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        } catch (err) {
          console.error("Orientation Permission Error", err);
        }
      } else {
        // Android / Desktop
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        // Fallback to standard if absolute not supported
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    };

    startOrientation();

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);

  useEffect(() => {
    if (!selectedBuilding) {
      setIsNavigating(false);
    }
  }, [selectedBuilding]);

  // Calculate Distance when location or selection changes
  useEffect(() => {
    if (userLocation && selectedBuilding) {
      const dist = L.latLng(userLocation).distanceTo(L.latLng(selectedBuilding.coords));
      setDistanceToSelected(dist);
    } else {
      setDistanceToSelected(null);
    }
  }, [userLocation, selectedBuilding]);

  const handleStartNavigation = (target) => {
    navigate(`/navigate?to=${encodeURIComponent(target.name)}`);
  };

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useEffect(() => {
    if (targetBuildingName && buildings.length > 0) {
      const found = buildings.find(b => b.name === targetBuildingName);
      if (found) {
        setSelectedBuilding(found);
      }
    }
  }, [targetBuildingName, buildings, setSelectedBuilding]);

  const handleFindNearby = (category) => {
    if (!userLocation) {
      showToast("Please enable GPS to find places 'Near Me'", "info");
      return;
    }

    const filtered = buildings.filter(b => 
      b.type?.toLowerCase().includes(category.toLowerCase()) || 
      b.name?.toLowerCase().includes(category.toLowerCase())
    );

    if (filtered.length === 0) {
      showToast(`No ${category} found on campus`, "warning");
      return;
    }

    // Sort by distance
    const sorted = [...filtered].sort((a, b) => {
      const distA = L.latLng(userLocation).distanceTo(L.latLng(a.coords));
      const distB = L.latLng(userLocation).distanceTo(L.latLng(b.coords));
      return distA - distB;
    });

    const nearest = sorted[0];
    const distance = L.latLng(userLocation).distanceTo(L.latLng(nearest.coords));
    
    setSelectedBuilding(nearest);
    showToast(`Found nearest ${category}: ${nearest.name} (${Math.round(distance)}m away)`, "success");
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      {/* Search Header */}
      <div className="absolute top-4 left-4 right-4 z-20 md:left-1/2 md:-translate-x-1/2 md:w-[500px]">
        <div className="relative">
          <div className="flex items-center gap-2 p-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <button 
              onClick={() => navigate('/search')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
            >
              {targetBuildingName ? <ArrowLeft size={20} /> : <Search size={20} />}
            </button>
            <div className="flex-1 flex items-center px-1">
              <input 
                type="text" 
                placeholder="Search LNCT Campus..." 
                className="w-full bg-transparent border-none focus:ring-0 px-2 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                value={searchQuery || targetBuildingName || ''}
                readOnly
                onClick={() => navigate('/search')}
              />
            </div>
            {targetBuildingName && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  navigate('/map');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}
            <button 
              onClick={() => navigate('/navigate')}
              className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
            >
              <Navigation size={20} />
            </button>
          </div>

          {/* Near Me Category Chips */}
          {!targetBuildingName && (
            <div className="relative group/scroll mt-2">
              <div 
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-0.5 cursor-grab active:cursor-grabbing select-none scroll-smooth"
              >
                {NEARBY_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleFindNearby(cat.name)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm whitespace-nowrap hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 group active:scale-95"
                  >
                    <cat.icon size={14} className="group-hover:scale-110 transition-transform sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
              {/* Fade Indicators for Desktop */}
              <div className="hidden sm:block absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-white/50 dark:from-slate-950/50 to-transparent pointer-events-none rounded-r-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Map Content */}
      <MapContainer 
        center={LNCT_CENTER} 
        zoom={17} 
        minZoom={17}
        maxZoom={19}
        zoomControl={false}
        attributionControl={false}
        className={clsx("z-0 transition-transform duration-300 ease-out", isMapFollowHeading ? "map-rotating" : "")}
        style={isMapFollowHeading ? { 
          transform: `rotate(${userHeading || 0}deg)`,
          '--map-rotation': `${-(userHeading || 0)}deg` 
        } : { 
          '--map-rotation': '0deg' 
        }}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        preferCanvas={true}
        maxBounds={[
          [23.245, 77.518], // Southwest
          [23.258, 77.532]  // Northeast
        ]}
        maxBoundsViscosity={1.0}
        bounceAtZoomLimits={true}
      >
        <MapEventsHandler 
          setZoom={setZoom} 
          setSelectedBuilding={setSelectedBuilding} 
          setMapCenter={setMapCenter}
        />
        <MapFocus coords={selectedBuilding?.coords} />
        
        {isNavigating && userLocation && selectedBuilding && (
          <RoutingEngine userLocation={userLocation} destination={selectedBuilding.coords} />
        )}
        
        {/* World Mask - Hides area outside campus */}
        <Polygon 
          positions={[WORLD_MASK, CAMPUS_BOUNDARY]}
          pathOptions={{
            color: 'transparent',
            fillColor: isDark ? '#020617' : '#94a3b8',
            fillOpacity: isDark ? 0.7 : 0.4,
          }}
          interactive={true}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              setSelectedBuilding(null);
            }
          }}
        />
        
        {baseLayer === 'street' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={22}
            maxNativeZoom={19}
          />
        )}
        {baseLayer === 'satellite' && (
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={22}
            maxNativeZoom={19}
          />
        )}
        {baseLayer === 'dark' && (
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            maxZoom={22}
            maxNativeZoom={19}
          />
        )}

        {showBoundary && (
          <Polygon 
            positions={CAMPUS_BOUNDARY}
            pathOptions={{
              color: (isDark || baseLayer === 'dark') ? '#3b82f6' : '#2563eb',
              fillColor: (isDark || baseLayer === 'dark') ? '#3b82f6' : '#3b82f6',
              fillOpacity: (isDark || baseLayer === 'dark') ? 0.04 : 0.08,
              dashArray: (isDark || baseLayer === 'dark') ? '10, 15' : null,
              weight: (isDark || baseLayer === 'dark') ? 3 : 4
            }}
          />
        )}

        {/* Render Navigation Paths (Walking Network/Shortcuts) */}
        {useMemo(() => buildings.map((building) => {
          if (building.type !== 'Path' || !building.polylineCoords) return null;
          
          // Only show shortcuts if a target is selected or we are actively navigating
          const activeNav = !!selectedBuilding || !!navigationPath;
          if (!activeNav) return null;

          return (
            <Polyline 
              key={`path-${building.id}`}
              positions={building.polylineCoords}
              pathOptions={{
                color: isDark ? '#64748b' : '#94a3b8',
                weight: 2,
                dashArray: '5, 10',
                opacity: 0.6
              }}
            />
          );
        }), [buildings, selectedBuilding, navigationPath, isDark])}

        {/* Render Active A* Navigation Path (Calculated) */}
        {navigationPath && (
          <Polyline 
            positions={navigationPath}
            pathOptions={{
              color: '#3b82f6',
              weight: 5,
              opacity: 0.8,
              lineJoin: 'round',
              lineCap: 'round'
            }}
          />
        )}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={80}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          iconCreateFunction={createClusterIcon}
        >
          {useMemo(() => buildings.map((building) => {
            if (!building || !building.coords) return null;
            
            const isSelected = selectedBuilding?.id === building.id;
            const isMainGate = building.name?.toLowerCase().includes('main gate') && !building.name?.toLowerCase().includes('area');
            const isGateOrEntrance = building.type === 'Gate' || building.type === 'Entrance';
            const isPath = building.type === 'Path' || building.id?.includes('path');
            const isSub = building.type === 'Room' || building.type === 'Lab' || building.parent_id;
            
            // STRICT FILTERING:
            // 1. If it's a Path, NEVER show marker (paths are polyline only)
            // 2. If it's a Gate/Entrance, ONLY show if it's the MAIN GATE
            // 3. Otherwise show if not sub-location, or if sub-location and zoomed in
            const shouldInclude = isSelected || (
                                   !isPath && (
                                     isMainGate || 
                                     (!isGateOrEntrance && !isSub) ||
                                     (!isGateOrEntrance && isSub && zoom >= 18)
                                   )
                                 );

            if (!shouldInclude) return null;

            return (
              <Marker 
                key={building.id}
                position={building.coords}
                icon={createBuildingIcon(building.name, building.type, isSelected, zoom, mapCenter, building.coords)}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    setSelectedBuilding(building);
                  },
                }}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                {!isMobile && (
                  <Popup className="custom-popup" closeButton={false} autoPan={true}>
                    <div className="loc-card">
                      <div className="loc-badge">{building.type || 'Location'}</div>
                      <h2 className="loc-title">{building.name}</h2>
                      <p className="loc-desc">
                        {building.description || 'Institutional facility within the LNCT Smart Campus.'}
                      </p>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          }), [buildings, selectedBuilding, zoom, mapCenter, isMobile])}
        </MarkerClusterGroup>

        {/* Render Polygons separately from clusters */}
        {useMemo(() => buildings.map((building) => {
          if (!building.polygonCoords) return null;
          const isSelected = selectedBuilding?.id === building.id;
          
          return (
            <Polygon 
              key={`poly-${building.id}`}
              positions={building.polygonCoords}
              pathOptions={{
                color: isSelected ? '#ef4444' : (selectedBuilding ? 'transparent' : (
                  building.name.toLowerCase().includes('girls hostel') ? '#ec4899' :
                  building.name.toLowerCase().includes('boys hostel') ? '#4f46e5' :
                  building.name.toLowerCase().includes('workshop') ? '#334155' :
                  (building.name.toLowerCase().includes('mandir') || building.name.toLowerCase().includes('temple')) ? '#f97316' :
                  building.type === 'Academic' ? '#3b82f6' : '#64748b'
                )),
                fillColor: isSelected ? '#ef4444' : (selectedBuilding ? 'transparent' : (
                  building.name.toLowerCase().includes('girls hostel') ? '#ec4899' :
                  building.name.toLowerCase().includes('boys hostel') ? '#4f46e5' :
                  building.name.toLowerCase().includes('workshop') ? '#334155' :
                  (building.name.toLowerCase().includes('mandir') || building.name.toLowerCase().includes('temple')) ? '#f97316' :
                  building.type === 'Academic' ? '#3b82f6' : '#94a3b8'
                )),
                fillOpacity: isSelected ? 0.5 : (selectedBuilding ? 0 : 0.2),
                weight: isSelected ? 3 : 1
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  setSelectedBuilding(building);
                },
              }}
            />
          );
        }), [buildings, selectedBuilding])}

        {/* Large Background Branding Label - North of Campus */}
        <Marker 
          position={[23.2548, 77.525]} 
          interactive={false}
          icon={L.divIcon({
            className: 'bg-branding-label',
            html: `
              <div class="select-none pointer-events-none flex flex-col items-center text-center opacity-25 dark:opacity-20">
                <h1 class="text-5xl sm:text-7xl font-black uppercase tracking-[-0.05em] text-slate-900 dark:text-white leading-none">
                  LNCT GROUP
                </h1>
                <h2 class="text-xl sm:text-3xl font-black uppercase tracking-[0.4em] text-blue-600 dark:text-blue-400 mt-2">
                  BHOPAL CAMPUS
                </h2>
              </div>
            `,
            iconSize: [1000, 300],
            iconAnchor: [500, 35] 
          })}
        />

        {/* User Location Marker with Direction Cone */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div class="relative flex items-center justify-center">
                  <!-- Direction Cone -->
                  <div 
                    style="transform: rotate(${userHeading || 0}deg); transition: transform 0.2s ease-out;"
                    class="absolute w-32 h-32 bg-gradient-to-t from-blue-500/30 to-transparent rounded-full origin-center"
                    style="clip-path: polygon(50% 50%, 20% 0%, 80% 0%);"
                  ></div>
                  <!-- GPS Pulse -->
                  <div class="relative w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-xl z-10">
                    <div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
              `,
              iconSize: [128, 128],
              iconAnchor: [64, 64]
            })}
          />
        )}

        {/* Floating Action Buttons */}
        <MapControls 
          userLocation={userLocation} 
          setUserLocation={setUserLocation} 
          userHeading={userHeading}
          isMapFollowHeading={isMapFollowHeading}
          setIsMapFollowHeading={setIsMapFollowHeading}
        />
        <RecenterHandler center={LNCT_CENTER} />
      </MapContainer>

      {/* Mobile Info Panel */}
      <AnimatePresence>
        {selectedBuilding && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl p-6 sm:hidden"
          >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" onClick={() => setSelectedBuilding(null)}></div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                    {selectedBuilding.type}
                  </span>
                  {distanceToSelected && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {distanceToSelected > 1000 
                        ? `${(distanceToSelected / 1000).toFixed(1)} km away` 
                        : `${Math.round(distanceToSelected)} m away`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedBuilding.name}</h2>
                  <p className="text-slate-500 text-sm mt-1">{selectedBuilding.description}</p>
                </div>
                <button 
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={clsx(
                    "p-3 rounded-2xl transition-all active:scale-90",
                    isVoiceEnabled ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}
                >
                  {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleStartNavigation(selectedBuilding)}
                  className={clsx(
                    "flex items-center justify-center gap-2 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95",
                    isNavigating 
                      ? "bg-red-500 text-white shadow-red-500/20" 
                      : "bg-blue-600 text-white shadow-blue-500/20"
                  )}
                >
                  <Navigation size={18} className={isNavigating ? "animate-pulse" : ""} />
                  {isNavigating ? "Stop" : "Navigate"}
                </button>
                {['Ground', 'Sports', 'Gate', 'Garden'].indexOf(selectedBuilding.type) === -1 && (
                  <button className="flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold">
                    Inside View
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Campus Info & Layer Control */}
      {/* Bottom Left Controls: Info Pill & Layer Control */}
      <div className={clsx(
        "absolute left-4 z-[1001] flex flex-col-reverse items-start gap-2 transition-all duration-500",
        selectedBuilding ? "bottom-[340px] sm:bottom-4" : "bottom-20 sm:bottom-4"
      )}>
        {/* Campus Info Pill - Hidden on Mobile */}
        <motion.div 
          whileHover={{ x: 2 }}
          className="hidden sm:flex p-1.5 pr-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-full border border-white/20 dark:border-slate-800 shadow-xl items-center gap-2.5 group"
        >
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-blue-500 blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
              <MapPin size={14} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-black text-slate-900 dark:text-white whitespace-nowrap">
              LNCT Campus, Bhopal
            </p>
          </div>
        </motion.div>

        {/* Custom Layer Control */}
        <CustomLayersControl 
          baseLayer={baseLayer} 
          setBaseLayer={setBaseLayer} 
          showBoundary={showBoundary} 
          setShowBoundary={setShowBoundary} 
        />
      </div>
    </div>
  );
};

export default CampusMap;
