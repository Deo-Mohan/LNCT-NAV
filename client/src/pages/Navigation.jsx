import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useCampusStore from '../store/useCampusStore';
import useToastStore from '../store/useToastStore';
import { 
  CheckCircle, 
  Search as SearchIcon, 
  Compass, 
  MapPin as MapPinIcon,
  ChevronRight,
  ArrowLeft,
  MoreVertical,
  X,
  Navigation as NavIcon,
  ArrowUpDown,
  Clock,
  Map as MapIcon,
  Layers,
  Globe,
  Check,
  Sparkles,
  Trophy,
  Moon
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Reusable Routing Component for Step 2
const RoutingModule = ({ origin, destination, userLocation, onRouteUpdate }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !destination) return;
    
    // Resolve start point
    const startPoint = origin 
      ? L.latLng(origin.coords[0], origin.coords[1])
      : (userLocation ? L.latLng(userLocation[0], userLocation[1]) : null);

    if (!startPoint) return;

    const control = L.Routing.control({
      waypoints: [
        startPoint,
        L.latLng(destination.coords[0], destination.coords[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }]
      }
    }).addTo(map);

    control.on('routesfound', (e) => {
      const routes = e.routes;
      const summary = routes[0].summary;
      onRouteUpdate({
        distance: summary.totalDistance,
        time: Math.round(summary.totalTime / 60),
        instructions: routes[0].instructions
      });
    });

    const container = control.getContainer();
    if (container) container.style.display = 'none';

    return () => {
      if (map && control) {
        try {
          map.removeControl(control);
        } catch (e) {
          // Silence leaflet-routing-machine unmount errors
          console.debug("Routing cleanup handled", e);
        }
      }
    };
  }, [map, origin, destination, userLocation]);

  return null;
};
const OfflineRoutingModule = ({ origin, destination, userLocation, onRouteUpdate }) => {
  const { calculatePath, findNearestNode } = useCampusStore();
  const [path, setPath] = useState([]);

  useEffect(() => {
    if (!destination) return;
    const startPos = origin ? origin.coords : userLocation;
    if (!startPos) return;

    const startNode = findNearestNode(startPos);
    const endNode = findNearestNode(destination.coords);

    if (startNode && endNode) {
      const calculatedPath = calculatePath(startNode.id, endNode.id);
      if (calculatedPath) {
        // Add exact start and end points for visual continuity
        const fullPath = [startPos, ...calculatedPath, destination.coords];
        setPath(fullPath);
        
        let dist = 0;
        for (let i = 0; i < fullPath.length - 1; i++) {
          dist += L.latLng(fullPath[i]).distanceTo(L.latLng(fullPath[i+1]));
        }
        
        onRouteUpdate({
          distance: dist,
          time: Math.round(dist / 1.4 / 60),
          instructions: [{ text: "Navigating via Offline Campus Network" }]
        });
      }
    }
  }, [origin, destination, userLocation, calculatePath, findNearestNode, onRouteUpdate]);

  return path.length > 0 ? (
    <Polyline 
      positions={path} 
      pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.8, dashArray: '1, 12', lineCap: 'round' }} 
    />
  ) : null;
};

const Navigation = () => {
  const navigate = useNavigate();
  const { buildings, fetchBuildings } = useCampusStore();
  const showToast = useToastStore(state => state.showToast);
  
  const [step, setStep] = useState(1);
  const [userLocation, setUserLocation] = useState(null);
  const [origin, setOrigin] = useState(null); // null = Current Location
  const [destination, setDestination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [originQuery, setOriginQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState(null); // 'origin' or 'destination'
  const [routeSummary, setRouteSummary] = useState({ distance: 0, time: 0, instructions: [] });
  const [heading, setHeading] = useState(0);
  const [baseLayer, setBaseLayer] = useState('street');
  const [routingMode, setRoutingMode] = useState('offline'); // 'online' or 'offline'
  const location = useLocation();

  // Auto-fill destination from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const toParam = params.get('to');
    if (toParam && buildings.length > 0) {
      const found = buildings.find(b => b.name === toParam);
      if (found) {
        setDestination(found);
        setSearchQuery(found.name);
      }
    }
  }, [location.search, buildings]);

  useEffect(() => {
    fetchBuildings();
    
    const LNCT_CENTER = [23.25128375, 77.52472457];
    const MAIN_GATE_COORDS = [23.251608, 77.523429];

    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const current = [pos.coords.latitude, pos.coords.longitude];
          const distance = L.latLng(current).distanceTo(L.latLng(LNCT_CENTER));

          if (distance > 1500) {
            setUserLocation(MAIN_GATE_COORDS);
            // Only show toast once to avoid spam
            if (!sessionStorage.getItem('location_fallback_shown')) {
              showToast("Starting from Main Gate", "You are outside campus. Navigation will start from the LNCT Main Gate.");
              sessionStorage.setItem('location_fallback_shown', 'true');
            }
          } else {
            setUserLocation(current);
            sessionStorage.removeItem('location_fallback_shown');
          }
        },
        (err) => {
          console.error("GPS Watch Error:", err);
          showToast("GPS Error", "Could not track your movement");
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    }

    const handleOrientation = (e) => {
      const alpha = e.webkitCompassHeading || e.alpha;
      if (alpha !== null) setHeading(alpha);
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [fetchBuildings]);

  const filteredBuildings = (query) => buildings.filter(b => 
    b.name.toLowerCase().includes(query.toLowerCase()) && !b.parent_id
  ).slice(0, 5);

  const handleSwap = () => {
    const tempOrigin = origin;
    setOrigin(destination);
    setDestination(tempOrigin);
    setSearchQuery(tempOrigin ? tempOrigin.name : '');
    setOriginQuery(destination ? destination.name : '');
  };

  const handleStartNavigation = () => {
    if (destination) {
      if (!origin && !userLocation) {
        showToast("Location Required", "Wait for GPS signal to start");
        return;
      }
      setStep(2);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-black text-xl text-slate-900 dark:text-white">Directions</h1>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto w-full p-4 space-y-6 overflow-y-auto h-full no-scrollbar"
            >
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-2">
                {/* Visual Path Decorator */}
                <div className="absolute left-9 top-14 bottom-14 w-0.5 bg-slate-100 dark:bg-slate-800 z-0"></div>
                
                {/* Swap Button */}
                <button 
                  onClick={handleSwap}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-lg text-blue-600 active:rotate-180 transition-all duration-500 hover:scale-110"
                >
                  <ArrowUpDown size={18} />
                </button>

                {/* From Input */}
                <div className="relative flex items-center gap-4 z-10">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/30"></div>
                  </div>
                  <div className={clsx(
                    "flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-3.5 transition-all border relative flex items-center",
                    activeSearch === 'origin' ? "border-blue-500 ring-2 ring-blue-500/10 shadow-sm" : "border-transparent"
                  )}>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-0.5">From</span>
                      <input 
                        className="w-full bg-transparent border-none focus:ring-0 outline-none p-0 text-sm font-black text-slate-900 dark:text-white placeholder:text-slate-400"
                        value={origin ? origin.name : originQuery}
                        onFocus={() => setActiveSearch('origin')}
                        onChange={(e) => {
                          setOriginQuery(e.target.value);
                          setOrigin(null);
                          setActiveSearch('origin');
                        }}
                        placeholder={userLocation ? "Your Current Location" : "Locating..."}
                      />
                    </div>
                    {(origin || originQuery) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrigin(null);
                          setOriginQuery('');
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors ml-2"
                      >
                        <X size={14} className="text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* To Input */}
                <div className="relative flex items-center gap-4 z-10">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <MapPinIcon size={20} className="text-red-500" />
                  </div>
                  <div className={clsx(
                    "flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-3.5 transition-all border relative flex items-center",
                    activeSearch === 'destination' ? "border-red-500 ring-2 ring-red-500/10 shadow-sm" : "border-transparent"
                  )}>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-0.5">To</span>
                      <input 
                        className="w-full bg-transparent border-none focus:ring-0 outline-none p-0 text-sm font-black text-slate-900 dark:text-white placeholder:text-slate-400"
                        value={destination ? destination.name : searchQuery}
                        onFocus={() => setActiveSearch('destination')}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setDestination(null);
                          setActiveSearch('destination');
                        }}
                        placeholder="Search destination"
                      />
                    </div>
                    {(destination || searchQuery) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDestination(null);
                          setSearchQuery('');
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors ml-2"
                      >
                        <X size={14} className="text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Suggestions */}
              {activeSearch && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Suggestions</h3>
                  <div className="space-y-1">
                    {activeSearch === 'origin' && (
                      <button 
                        onClick={() => {
                          setOrigin(null);
                          setOriginQuery('');
                          setActiveSearch(null);
                        }}
                        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50 group"
                      >
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Compass size={18} className="animate-spin-slow" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-blue-600 dark:text-blue-400">Your Current Location</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time GPS Tracking</p>
                        </div>
                      </button>
                    )}
                    {filteredBuildings(activeSearch === 'origin' ? originQuery : searchQuery).map(b => (
                      <button 
                        key={b.id}
                        onClick={() => {
                          if (activeSearch === 'origin') {
                            setOrigin(b);
                            setOriginQuery(b.name);
                          } else {
                            setDestination(b);
                            setSearchQuery(b.name);
                          }
                          setActiveSearch(null);
                        }}
                        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                      >
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                          <MapPinIcon size={16} className="text-slate-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-slate-900 dark:text-white">{b.name}</p>
                          <p className="text-xs text-slate-500">{b.type}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handleStartNavigation}
                disabled={!destination}
                className="w-full mt-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                Start Navigation
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full"
            >
              <div className="absolute inset-0 z-0">
                {userLocation && destination && (
                  <MapContainer 
                    center={userLocation} 
                    zoom={17.5} 
                    className="w-full h-full"
                    zoomControl={false}
                  >
                    {routingMode === 'online' ? (
                      <RoutingModule 
                        origin={origin}
                        destination={destination}
                        userLocation={userLocation} 
                        onRouteUpdate={setRouteSummary}
                      />
                    ) : (
                      <OfflineRoutingModule 
                        origin={origin}
                        destination={destination}
                        userLocation={userLocation} 
                        onRouteUpdate={setRouteSummary}
                      />
                    )}
                    
                    {baseLayer === 'street' && (
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    )}
                    {baseLayer === 'satellite' && (
                      <TileLayer 
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                        attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                      />
                    )}
                    {baseLayer === 'dark' && (
                      <TileLayer 
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      />
                    )}
                    
                    <Marker 
                      position={origin ? origin.coords : userLocation}
                      icon={L.divIcon({
                        className: 'origin-icon',
                        html: origin 
                          ? `<div class="w-8 h-8 bg-blue-600 rounded-xl border-2 border-white shadow-xl flex items-center justify-center text-white">
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/></svg>
                             </div>`
                          : `<div style="transform: rotate(${heading}deg); transition: transform 0.2s ease-out;" class="relative">
                               <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
                               <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-blue-600 drop-shadow-sm"></div>
                             </div>`
                      })}
                    />

                    <Marker 
                      position={destination.coords}
                      icon={L.divIcon({
                        className: 'dest-icon',
                        html: `<div class="relative group">
                                 <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 p-2 rounded-full border-2 border-white shadow-2xl animate-bounce-slow">
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="red"/></svg>
                                 </div>
                               </div>`
                      })}
                    />
                  </MapContainer>
                )}
              </div>

              {/* Floating Overlays */}
              <div className="absolute inset-0 pointer-events-none flex flex-col p-4">
                {/* Top Info Card */}
                <div className="pointer-events-auto max-w-lg mx-auto w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/50 overflow-hidden">
                  <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-lg">To {destination?.name}</h3>
                      <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">
                        {routeSummary.distance > 1000 
                          ? `${(routeSummary.distance / 1000).toFixed(1)} km` 
                          : `${Math.round(routeSummary.distance)}m`} • {routeSummary.time} mins
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const modes = ['online', 'offline'];
                          const next = modes[(modes.indexOf(routingMode) + 1) % modes.length];
                          setRoutingMode(next);
                          showToast(`Mode: ${next.toUpperCase()}`, next === 'offline' ? "Using local campus network" : "Using satellite GPS routing");
                        }}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          routingMode === 'offline' 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        )}
                      >
                        {routingMode}
                      </button>
                      <button 
                        onClick={() => {
                          const layers = ['street', 'satellite', 'dark'];
                          const nextIndex = (layers.indexOf(baseLayer) + 1) % layers.length;
                          setBaseLayer(layers[nextIndex]);
                        }}
                        className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex items-center gap-2"
                      >
                        {baseLayer === 'street' && <Globe size={18} />}
                        {baseLayer === 'satellite' && <MapIcon size={18} />}
                        {baseLayer === 'dark' && <Moon size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      routingMode === 'offline' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                    )}>
                      {routingMode === 'offline' ? <CheckCircle size={20} /> : <NavIcon size={20} className="animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {routingMode === 'offline' ? 'Verified Local Path' : 'Next Step'}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {routingMode === 'offline' ? 'Navigating via Campus Network (Offline)' : (routeSummary.instructions[0]?.text || "Follow the highlighted path")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1" />

                {/* Bottom Actions Card */}
                <div className="pointer-events-auto max-w-lg mx-auto w-full flex gap-3">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-red-600 rounded-2xl font-bold text-sm border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 shadow-xl"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group"
                  >
                    Arrived
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-slate-950"
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </div>

              {/* Confetti Particles (CSS Only simulation) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      top: -20, 
                      left: `${Math.random() * 100}%`,
                      rotate: 0,
                      scale: Math.random() * 0.5 + 0.5
                    }}
                    animate={{ 
                      top: '110%', 
                      rotate: 360,
                      left: `${(Math.random() * 20 - 10) + (i * 5)}%` 
                    }}
                    transition={{ 
                      duration: Math.random() * 3 + 2, 
                      repeat: Infinity, 
                      ease: "linear",
                      delay: Math.random() * 5
                    }}
                    className={clsx(
                      "absolute w-2 h-2 rounded-full",
                      i % 3 === 0 ? "bg-blue-400" : i % 3 === 1 ? "bg-emerald-400" : "bg-amber-400"
                    )}
                  />
                ))}
              </div>

              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="relative z-10 max-w-lg w-full p-6 flex flex-col items-center text-center space-y-8"
              >
                {/* Trophy Presentation */}
                <div className="relative">
                  {/* Glowing Rings */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full"
                  />
                  
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full"
                    />
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.3 }}
                      className="w-32 h-32 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-3xl shadow-2xl flex items-center justify-center text-white ring-4 ring-white/10"
                    >
                      <Trophy size={64} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    </motion.div>
                    
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -top-2 -right-2 text-amber-400"
                    >
                      <Sparkles size={32} />
                    </motion.div>
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl sm:text-5xl font-black text-white tracking-tight"
                  >
                    Journey <span className="text-blue-400">Complete!</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-slate-400 text-lg"
                  >
                    You've arrived at <span className="text-white font-bold">{destination?.name}</span>
                  </motion.p>
                </div>

                {destination?.type !== 'Sports' && destination?.type !== 'Facility' ? (
                  <motion.div 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="w-full bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
                  >
                    <div className="p-6 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Layers size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Indoor Access Available</span>
                      </div>
                      <h3 className="text-xl font-black text-white">Navigate Indoors</h3>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-4">
                      {[0, 1].map((floor) => (
                        <button 
                          key={floor}
                          onClick={() => navigate(`/floor/${destination?.name}/${floor}`)}
                          className="group relative p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all text-left"
                        >
                          <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Floor</span>
                          <span className="block font-black text-white text-lg">{floor === 0 ? 'Ground' : 'First'}</span>
                          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
                            <ChevronRight size={16} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="w-full p-8 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 ring-1 ring-blue-500/30">
                      <Globe size={32} />
                    </div>
                    <p className="text-slate-300 font-medium text-center">
                      This is an outdoor area. <br/>
                      <span className="text-white font-bold">Enjoy your time at the {destination?.type.toLowerCase()}!</span>
                    </p>
                  </motion.div>
                )}

                <motion.button 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  onClick={() => navigate('/map')}
                  className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black text-lg shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  Return to Map
                  <ArrowLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default Navigation;
