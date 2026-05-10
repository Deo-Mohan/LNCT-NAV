import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MapLayersControl from '../components/MapLayersControl';
import useCampusStore from '../store/useCampusStore';
import useToastStore from '../store/useToastStore';
import { CAMPUS_PRODUCTION_DATA } from '../data/campusProductionData';
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
  Moon,
  Navigation2,
  Mic,
  ArrowUpLeft,
  Battery
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-rotate';
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
          // Clear waypoints before removal to prevent internal library crashes
          if (control.getPlan) {
            const plan = control.getPlan();
            if (plan) plan.setWaypoints([]);
          }
          map.removeControl(control);
        } catch (e) {
          console.debug("Routing cleanup handled", e);
        }
      }
    };
  }, [map, origin, destination, userLocation]);

  return null;
};
const MapRotation = ({ userLocation, heading, enabled }) => {
  const map = useMap();
  useEffect(() => {
    if (enabled && heading !== null) {
      map.setBearing(heading);
      if (userLocation) map.panTo(userLocation, { animate: true });
    } else {
      map.setBearing(0);
    }
  }, [map, heading, enabled, userLocation]);
  return null;
};



const RoadNetwork = () => {
  const paths = useCampusStore(state => state.paths || []);
  const mapLayer = useCampusStore(state => state.mapLayer);
  if (mapLayer !== 'vibrant' && mapLayer !== 'dark') return null;

  const isVibrant = mapLayer === 'vibrant';

  return (
    <>
      {paths.map((path, idx) => {
        if (!path.polylineCoords || !Array.isArray(path.polylineCoords) || path.polylineCoords.length < 2) return null;
        return (
          <React.Fragment key={path.id || idx}>
            {isVibrant ? (
              <>
                <Polyline 
                  positions={path.polylineCoords}
                  pathOptions={{ color: '#1e293b', weight: 12, opacity: 0.9, lineJoin: 'round', lineCap: 'round' }}
                />
                <Polyline 
                  positions={path.polylineCoords}
                  pathOptions={{ color: '#ffffff', weight: 2, opacity: 0.8, dashArray: '10, 15', lineJoin: 'round', lineCap: 'round' }}
                />
              </>
            ) : (
              <Polyline 
                positions={path.polylineCoords}
                pathOptions={{ color: '#facc15', weight: 3, opacity: 0.7, dashArray: '12, 8', lineJoin: 'round', lineCap: 'round' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

const getBearing = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const lat1 = p1[0] * Math.PI / 180;
  const lat2 = p2[0] * Math.PI / 180;
  const dLon = (p2[1] - p1[1]) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

const OfflineRoutingModule = ({ origin, destination, userLocation, heading, onRouteUpdate }) => {
  const { calculatePaths, findNearestNode, generateInstructions } = useCampusStore();
  const [paths, setPaths] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!destination) return;
    const startPos = origin ? origin.coords : userLocation;
    if (!startPos) return;

    const startNode = findNearestNode(startPos);
    const endNode = findNearestNode(destination.coords);

    if (startNode && endNode) {
      const calculatedPaths = calculatePaths(startNode.id, endNode.id);
      
      if (calculatedPaths && calculatedPaths.length > 0) {
        // Add exact start and end points for visual continuity to each path
        const fullPaths = calculatedPaths.map(p => [startPos, ...p, destination.coords]);
        setPaths(fullPaths);
        setActiveIndex(0); // Reset to first path on new search
      } else {
        // Fallback: Direct line if graph search fails
        const directPath = [[startPos, destination.coords]];
        setPaths(directPath);
        setActiveIndex(0);
        console.warn("Offline pathfinding failed to find a graph connection");
      }
    }
  }, [origin, destination, userLocation, calculatePaths, findNearestNode]);

  useEffect(() => {
    if (paths.length > 0 && paths[activeIndex]) {
      const currentPath = paths[activeIndex];
      let dist = 0;
      for (let i = 0; i < currentPath.length - 1; i++) {
        dist += L.latLng(currentPath[i]).distanceTo(L.latLng(currentPath[i+1]));
      }
      
      const instructions = generateInstructions(currentPath);
      
      // Wrong Way Detection: Compare compass heading with route bearing
      if (currentPath.length > 1) {
        const routeBearing = getBearing(currentPath[0], currentPath[1]);
        const angleDiff = Math.abs((heading - routeBearing + 540) % 360 - 180);
        if (angleDiff > 120 && userLocation) {
          instructions.unshift({ text: "⚠️ You are facing the wrong way!", isWarning: true });
        }
      }

      onRouteUpdate({
        distance: dist,
        time: Math.round(dist / 1.4 / 60),
        instructions: instructions,
        routeIndex: activeIndex,
        totalRoutes: paths.length
      });
    }
  }, [paths, activeIndex, heading, userLocation, generateInstructions, onRouteUpdate]);

  return (
    <>
      {paths.map((p, idx) => (
        <Polyline 
          key={idx}
          positions={p} 
          eventHandlers={{
            click: () => setActiveIndex(idx)
          }}
          pathOptions={
            idx === activeIndex 
              ? { color: '#3b82f6', weight: 8, opacity: 0.9, dashArray: '1, 15', lineCap: 'round', interactive: true, zIndex: 1000 }
              : { color: '#94a3b8', weight: 4, opacity: 0.5, dashArray: '5, 10', lineCap: 'round', interactive: true, zIndex: 500 }
          } 
        />
      ))}
    </>
  );
};

const Navigation = () => {
  const navigate = useNavigate();
  const { buildings, fetchBuildings, mapLayer, setMapLayer } = useCampusStore();
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
  const [isMapFollowHeading, setIsMapFollowHeading] = useState(false);
  const [routingMode, setRoutingMode] = useState('online'); // 'online' or 'offline'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isListening, setIsListening] = useState(null); // 'origin' or 'destination'
  const location = useLocation();
  const [isLowBattery, setIsLowBattery] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);

  // Smart Battery Aware Navigation
  useEffect(() => {
    let batteryManager;
    const updateBatteryStatus = (battery) => {
      const level = Math.round(battery.level * 100);
      setBatteryLevel(level);
      
      // If battery is 20% or below and NOT charging, activate power saving navigation
      if (level <= 20 && !battery.charging) {
        if (!isLowBattery) {
          setIsLowBattery(true);
          setMapLayer('dark'); // Switch to dark mode map
          setIsMapFollowHeading(false); // Disable map rotation to save CPU/GPU
          showToast("Battery Aware Mode", "Switched to Dark Mode & Disabled 3D Compass to save power.");
        }
      } else {
        setIsLowBattery(false);
      }
    };

    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        batteryManager = battery;
        updateBatteryStatus(battery);
        battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
        battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
      });
    }

    return () => {
      if (batteryManager) {
        batteryManager.removeEventListener('levelchange', () => updateBatteryStatus(batteryManager));
        batteryManager.removeEventListener('chargingchange', () => updateBatteryStatus(batteryManager));
      }
    };
  }, [setMapLayer, showToast]);
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className="text-blue-600 dark:text-blue-400 font-black">{part}</span> 
            : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  const handleVoiceSearch = (target) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Not Supported", "Voice search is not supported on this browser");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(target);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.replace(/\.$/, '');
      if (target === 'origin') {
        setOriginQuery(transcript);
        setActiveSearch('origin');
      } else {
        setSearchQuery(transcript);
        setActiveSearch('destination');
      }
      setIsListening(null);
      showToast("Voice Recognized", `Searching for: "${transcript}"`);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(null);
      if (event.error !== 'no-speech') {
        showToast("Voice Error", "Could not recognize speech. Try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(null);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(null);
    }
  };

  const getGhostText = (query, type) => {
    if (!query || query.length < 2) return '';
    const matches = buildings.filter(b => 
      b.name.toLowerCase().startsWith(query.toLowerCase()) && !b.parent_id
    );
    if (matches.length > 0) {
      const topMatch = matches[0].name;
      return topMatch.slice(query.length);
    }
    return '';
  };

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
    
    // Parse URL parameters for direct navigation from Events
    const params = new URLSearchParams(location.search);
    const toId = params.get('to');
    if (toId && buildings.length > 0) {
      const target = buildings.find(b => b.id === toId);
      if (target) {
        setDestination(target);
        setSearchQuery(target.name);
      }
    }
  }, [fetchBuildings, location.search, buildings]);

  useEffect(() => {
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
      
      {/* Smart Battery Aware Banner */}
      <AnimatePresence>
        {isLowBattery && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold shadow-md z-30"
          >
            <Battery size={14} className="animate-pulse" />
            Low Battery ({batteryLevel}%): Power Saving Mode Active (Dark Mode + 2D)
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header - Hide during active navigation */}
      {step === 1 && (
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 shadow-sm relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-black text-xl text-slate-900 dark:text-white">Directions</h1>
          </div>
          {step === 2 && (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const layers = ['street', 'satellite', 'dark'];
                  const nextIndex = (layers.indexOf(mapLayer) + 1) % layers.length;
                  setMapLayer(layers[nextIndex]);
                }}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 text-slate-600 dark:text-slate-300"
              >
                {mapLayer === 'street' && <Globe size={18} />}
                {mapLayer === 'satellite' && <MapIcon size={18} />}
                {mapLayer === 'dark' && <Moon size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>
      )}

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
                    <div className="flex-1 min-w-0 relative">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-0.5">From</span>
                      
                      {/* Ghost Text Overlay */}
                      <div 
                        className="absolute bottom-0 left-0 text-sm font-black pointer-events-none select-none flex items-center whitespace-pre h-[20px]"
                        style={{ padding: 0 }}
                      >
                        <span className="opacity-0">{origin ? origin.name : originQuery}</span>
                        <span 
                          onClick={() => {
                            const ghost = getGhostText(originQuery);
                            if (ghost) {
                              const fullMatch = buildings.find(b => b.name.toLowerCase().startsWith(originQuery.toLowerCase()) && !b.parent_id);
                              if (fullMatch) {
                                setOrigin(fullMatch);
                                setOriginQuery(fullMatch.name);
                              }
                            }
                          }}
                          className="text-slate-400 dark:text-slate-600 opacity-40 pointer-events-auto cursor-pointer"
                        >
                          {getGhostText(origin ? origin.name : originQuery)}
                        </span>
                      </div>

                      <input 
                        className="w-full bg-transparent border-none focus:ring-0 outline-none p-0 text-sm font-black text-slate-900 dark:text-white placeholder:text-slate-400 relative z-10"
                        value={origin ? origin.name : originQuery}
                        onFocus={() => setActiveSearch('origin')}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            const ghost = getGhostText(originQuery);
                            if (ghost) {
                              e.preventDefault();
                              const fullMatch = buildings.find(b => b.name.toLowerCase().startsWith(originQuery.toLowerCase()) && !b.parent_id);
                              if (fullMatch) {
                                setOrigin(fullMatch);
                                setOriginQuery(fullMatch.name);
                              }
                            }
                          }
                        }}
                        onChange={(e) => {
                          setOriginQuery(e.target.value);
                          setOrigin(null);
                          setActiveSearch('origin');
                        }}
                        placeholder={userLocation ? "Your Current Location" : "Locating..."}
                      />
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button 
                        onClick={() => handleVoiceSearch('origin')}
                        className={clsx(
                          "p-2 rounded-full transition-all",
                          isListening === 'origin' ? "bg-red-500 text-white animate-pulse" : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                        )}
                      >
                        <Mic size={16} />
                      </button>
                      {(origin || originQuery) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrigin(null);
                            setOriginQuery('');
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                          <X size={14} className="text-slate-400" />
                        </button>
                      )}
                    </div>
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
                    <div className="flex-1 min-w-0 relative">
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-0.5">To</span>
                      
                      {/* Ghost Text Overlay */}
                      <div 
                        className="absolute bottom-0 left-0 text-sm font-black pointer-events-none select-none flex items-center whitespace-pre h-[20px]"
                        style={{ padding: 0 }}
                      >
                        <span className="opacity-0">{destination ? destination.name : searchQuery}</span>
                        <span 
                          onClick={() => {
                            const ghost = getGhostText(searchQuery);
                            if (ghost) {
                              const fullMatch = buildings.find(b => b.name.toLowerCase().startsWith(searchQuery.toLowerCase()) && !b.parent_id);
                              if (fullMatch) {
                                setDestination(fullMatch);
                                setSearchQuery(fullMatch.name);
                              }
                            }
                          }}
                          className="text-slate-400 dark:text-slate-600 opacity-40 pointer-events-auto cursor-pointer"
                        >
                          {getGhostText(destination ? destination.name : searchQuery)}
                        </span>
                      </div>

                      <input 
                        className="w-full bg-transparent border-none focus:ring-0 outline-none p-0 text-sm font-black text-slate-900 dark:text-white placeholder:text-slate-400 relative z-10"
                        value={destination ? destination.name : searchQuery}
                        onFocus={() => setActiveSearch('destination')}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            const ghost = getGhostText(searchQuery);
                            if (ghost) {
                              e.preventDefault();
                              const fullMatch = buildings.find(b => b.name.toLowerCase().startsWith(searchQuery.toLowerCase()) && !b.parent_id);
                              if (fullMatch) {
                                setDestination(fullMatch);
                                setSearchQuery(fullMatch.name);
                              }
                            }
                          }
                        }}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setDestination(null);
                          setActiveSearch('destination');
                        }}
                        placeholder="Search destination"
                      />
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button 
                        onClick={() => handleVoiceSearch('destination')}
                        className={clsx(
                          "p-2 rounded-full transition-all",
                          isListening === 'destination' ? "bg-red-500 text-white animate-pulse" : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                        )}
                      >
                        <Mic size={16} />
                      </button>
                      {(destination || searchQuery) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDestination(null);
                            setSearchQuery('');
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                          <X size={14} className="text-slate-400" />
                        </button>
                      )}
                    </div>
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
                        <div className="text-left flex-1">
                          <p className="font-black text-slate-900 dark:text-white">
                            {highlightMatch(b.name, activeSearch === 'origin' ? originQuery : searchQuery)}
                          </p>
                          <p className="text-xs text-slate-500">{b.type}</p>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-all" />
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
              className="relative w-full h-[100vh] lg:h-full flex flex-col lg:flex-row"
            >
              <div className="absolute inset-0 z-0">
                {userLocation && destination && (
                    <MapContainer 
                      center={userLocation} 
                      zoom={17.5} 
                      className="w-full h-full"
                      zoomControl={false}
                      attributionControl={false}
                      rotate={true}
                      touchRotate={true}
                      rotateControl={false}
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
                        heading={heading}
                        onRouteUpdate={setRouteSummary}
                      />
                    )}
                    <MapRotation userLocation={userLocation} heading={heading} enabled={isMapFollowHeading} />
                    
                    <RoadNetwork />
                    
                    <div className="absolute bottom-32 left-4 z-[1000]">
                      <MapLayersControl 
                        baseLayer={mapLayer} 
                        setBaseLayer={setMapLayer}
                      />
                    </div>

                    {mapLayer === 'street' && (
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png" />
                    )}
                    {mapLayer === 'vibrant' && (
                      <TileLayer 
                        url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png" 
                        maxZoom={22}
                        maxNativeZoom={19}
                        attribution='&copy; <a href="https://www.cyclosm.org">CyclOSM</a> contributors'
                      />
                    )}
                    {mapLayer === 'satellite' && (
                      <TileLayer 
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                        attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                      />
                    )}
                    {mapLayer === 'dark' && (
                      <TileLayer 
                        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      />
                    )}
                    
                    <Marker 
                      position={origin ? origin.coords : userLocation}
                      icon={L.divIcon({
                        className: 'user-location-icon',
                        html: `<div style="transform: rotate(${isMapFollowHeading ? 0 : heading}deg); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);" class="relative flex items-center justify-center">
                               <div class="w-12 h-12 bg-blue-500/20 rounded-full animate-ping absolute"></div>
                               <div class="w-9 h-9 bg-white rounded-full shadow-2xl flex items-center justify-center border border-slate-200">
                                 <div class="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                     <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
                                   </svg>
                                 </div>
                               </div>
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

              <motion.div 
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] pointer-events-none p-4 lg:p-10 flex flex-col"
              >
                {/* Search & Back Overlay */}
                <div className="flex items-start justify-between w-full relative z-[1011]">
                  <motion.button 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    onClick={() => setStep(1)}
                    className="pointer-events-auto p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl text-slate-900 dark:text-white border border-white/20 dark:border-slate-800/50 hover:scale-105 transition-all group"
                  >
                    <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                  </motion.button>

                  <div className="flex flex-col items-end gap-3 pointer-events-auto">
                    <button 
                      onClick={() => {
                        const nextState = !isMapFollowHeading;
                        setIsMapFollowHeading(nextState);
                        showToast(
                          nextState ? "GPS Rotate Mode: ON" : "Standard Mode: ON",
                          nextState ? "Map will now rotate with your phone" : "Map locked to North"
                        );
                      }}
                      className={clsx(
                        "p-4 rounded-2xl shadow-xl backdrop-blur-xl border transition-all flex items-center justify-center",
                        isMapFollowHeading 
                          ? "bg-blue-600 border-blue-500 text-white shadow-blue-500/20" 
                          : "bg-white/90 dark:bg-slate-900/90 border-white/20 dark:border-slate-800/50 text-slate-900 dark:text-white"
                      )}
                    >
                      <Navigation2 size={24} className={clsx(isMapFollowHeading && "animate-pulse")} />
                    </button>
                    
                  </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row items-end lg:items-start gap-6 mt-6">
                  {/* Navigation Panel (Google Maps Style Side Panel) */}
                  <motion.div 
                    layout
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ 
                      width: isCollapsed ? (window.innerWidth > 1024 ? '320px' : '100%') : (window.innerWidth > 1024 ? '400px' : '100%'),
                      x: 0, 
                      opacity: isCollapsed && window.innerWidth < 1024 ? 0 : 1,
                      pointerEvents: isCollapsed && window.innerWidth < 1024 ? 'none' : 'auto'
                    }}
                    className={clsx(
                      "pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800/50 overflow-hidden flex flex-col transition-all duration-300",
                      isCollapsed ? "max-h-[80px]" : "max-h-[90vh] lg:h-fit"
                    )}
                  >
                    {/* Card Header */}
                    <div className="p-5 lg:p-6 bg-blue-600 text-white relative">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className="font-black text-xl truncate">To {destination?.name}</h3>
                          <p className="text-blue-100 text-[11px] font-bold uppercase tracking-[0.2em] mt-0.5">
                            {routeSummary.distance > 1000 
                              ? `${(routeSummary.distance / 1000).toFixed(1)} km` 
                              : `${Math.round(routeSummary.distance)}m`} • {routeSummary.time} mins
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                          >
                            {isCollapsed ? <ChevronRight className="rotate-90" size={20} /> : <ChevronRight className="-rotate-90" size={20} />}
                          </button>
                          <button 
                            onClick={() => {
                              const modes = ['online', 'offline'];
                              const next = modes[(modes.indexOf(routingMode) + 1) % modes.length];
                              setRoutingMode(next);
                              showToast(`Mode: ${next.toUpperCase()}`, next === 'offline' ? "Using local campus network" : "Using satellite GPS routing");
                            }}
                            className={clsx(
                              "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border backdrop-blur-md",
                              routingMode === 'offline' 
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                                : "bg-white/20 text-white border-white/30"
                            )}
                          >
                            {routingMode}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Content (Instructions) */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex-1 overflow-hidden"
                        >
                          <div className="p-6 space-y-6">
                            {/* Next Step Banner (Google Maps Style) */}
                            <div className="bg-emerald-600 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform"></div>
                              
                              <div className="flex items-start gap-5 relative z-10">
                                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
                                  {routeSummary.instructions[0]?.text.toLowerCase().includes("left") ? (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                                  ) : routeSummary.instructions[0]?.text.toLowerCase().includes("right") ? (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                                  ) : (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Next Step</p>
                                  <h3 className="text-2xl font-black leading-tight tracking-tight">
                                    {routeSummary.instructions[0]?.text || "Follow the highlighted path"}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-3 text-emerald-100">
                                    <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-bold">
                                      IN {Math.round(routeSummary.instructions[0]?.distance || 0)}m
                                    </span>
                                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Upcoming steps (Small & Discreet) */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Coming Up</h4>
                              {routeSummary.instructions.slice(1, 3).map((step, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{step.text}</p>
                                </div>
                              ))}
                            </div>

                            {/* Navigation Controls */}
                            <div className="flex gap-3 pt-2">
                              <button 
                                onClick={() => {
                                  setStep(1);
                                  setRouteSummary({ distance: 0, time: 0, instructions: [] });
                                }}
                                className="flex-1 py-4 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all"
                              >
                                Exit
                              </button>
                              <button 
                                onClick={() => setIsCollapsed(true)}
                                className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl hover:opacity-90 transition-all"
                              >
                                Focus Map
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Spacer for Desktop */}
                  <div className="flex-1 hidden lg:block" />
                </div>
              </motion.div>

              {/* Google Maps Style Bottom Trip Bar */}
              <AnimatePresence>
                {routeSummary && (
                  <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: isCollapsed ? 0 : 100, opacity: isCollapsed ? 1 : 0 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-lg pointer-events-none"
                  >
                    <div className="pointer-events-auto bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">
                            {routeSummary.time}
                          </span>
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">min</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-emerald-600">
                            {routeSummary.distance >= 1000 
                              ? `${(routeSummary.distance / 1000).toFixed(1)} km` 
                              : `${Math.round(routeSummary.distance)} m`}
                          </span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="text-xs font-bold text-slate-400">ETA: {new Date(Date.now() + routeSummary.time * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      
                      <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 mx-4"></div>
                      
                      <div className="flex-1 flex flex-col items-start px-2">
                         <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '30%' }}
                              className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            />
                         </div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Trip Progress</span>
                      </div>

                      <button 
                        onClick={() => setIsCollapsed(false)}
                        className="ml-4 w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 15l-6-6-6 6"/></svg>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
