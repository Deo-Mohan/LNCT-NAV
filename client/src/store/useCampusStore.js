import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { buildingService } from '../services/api';
import { supabase } from '../supabase';
import { CAMPUS_NODES, CAMPUS_EDGES } from '../data/campusGraph';
import { CAMPUS_PRODUCTION_DATA } from '../data/campusProductionData';
import { CAMPUS_EVENTS } from '../data/campusEvents';

const useCampusStore = create(
  persist(
    (set, get) => ({
      userLocation: null,
      selectedBuilding: null,
      searchQuery: '',
      navigationPath: null,
      isDarkMode: false,
      buildings: CAMPUS_PRODUCTION_DATA,
      paths: CAMPUS_PRODUCTION_DATA.filter(b => (b.type === 'Path' || b.polylineCoords) && b.polylineCoords && b.polylineCoords.length > 0),
      lastFetched: null,
      lastBuildingsFetched: null,
      isLoading: false,
      bookmarks: [],
      isNavbarVisible: true,
      events: CAMPUS_EVENTS,
      upcomingReminders: [],
      lastEventsFetched: null,
      mapLayer: 'street',
      setMapLayer: (layer) => set({ mapLayer: layer }),
      
      fetchEvents: async (force = false) => {
        const { lastEventsFetched } = get();
        const now = new Date();
        
        // --- Smart Caching Logic ---
        if (!force && lastEventsFetched) {
          const diffMins = (now - new Date(lastEventsFetched)) / (1000 * 60);
          if (diffMins < 5) return; // Increased freshness: fetch every 5 mins
        }

        try {
          // Fetch live data
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('time', { ascending: true });

          if (error) throw error;
          
          // If we have live data, use it. Fallback to static only if DB is empty.
          const finalEvents = (data && data.length > 0) ? data.map(e => ({
            ...e,
            venueId: e.venueId || e.venue_id || '', // Normalize field names
            venue: e.venue || ''
          })) : CAMPUS_EVENTS;
          
          set({ 
            events: finalEvents,
            lastEventsFetched: now.toISOString()
          });
        } catch (err) {
          console.error("Failed to fetch events:", err.message);
        }
      },
      weather: {
        temp: 28,
        condition: 'Clear',
        forecast: 'Campus Weather',
        isDay: false,
        lastUpdated: new Date(0) // Initialize with old date to force first fetch
      },
      
      fetchWeather: async () => {
        const { weather } = get();
        const now = new Date();
        
        // Only fetch if data is older than 15 minutes
        const diffMins = (now - new Date(weather.lastUpdated)) / (1000 * 60);
        if (diffMins < 15 && weather.temp !== '--') return;

        try {
          const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.2140&longitude=77.4100&current=temperature_2m,weather_code,is_day&timezone=auto');
          const data = await res.json();
          
          if (data && data.current) {
            const code = data.current.weather_code;
            const isDay = data.current.is_day;
            let condition = isDay ? 'Sunny' : 'Clear Night';
            let advice = isDay ? 'Perfect for outdoor events' : 'Quiet night on campus';

            if (code === 0) { 
              condition = isDay ? 'Sunny' : 'Clear Night'; 
            }
            else if (code <= 3) { 
              condition = isDay ? 'Cloudy' : 'Cloudy Night'; 
              advice = 'Nice weather today'; 
            }
            else if (code <= 48) { condition = 'Foggy'; advice = 'Drive safely'; }
            else if (code <= 67) { condition = 'Rainy'; advice = 'Carry an umbrella ☂️'; }
            else if (code <= 99) { condition = 'Stormy'; advice = 'Stay indoors'; }

            set({ 
              weather: {
                temp: Math.round(data.current.temperature_2m),
                condition,
                forecast: advice,
                isDay: !!isDay,
                lastUpdated: new Date().toISOString()
              }
            });
          }
        } catch (error) {
          console.error("Weather fetch failed:", error);
        }
      },

      setIsNavbarVisible: (visible) => set({ isNavbarVisible: visible }),
      
      // Graph Navigation Data
      campusGraph: {
        nodes: CAMPUS_NODES,
        edges: CAMPUS_EDGES
      },

      // A* (A-Star) Multi-Path Algorithm
      calculatePaths: (startNodeId, endNodeId) => {
        const { campusGraph } = get();
        const { nodes, edges } = campusGraph;
        if (!nodes.length || !edges.length) return [];

        const startNode = nodes.find(n => n.id === startNodeId);
        const endNode = nodes.find(n => n.id === endNodeId);
        if (!startNode || !endNode) return [];

        const h = (aCoords, bCoords) => Math.sqrt(Math.pow(aCoords[0] - bCoords[0], 2) + Math.pow(aCoords[1] - bCoords[1], 2));
        
        const findSinglePath = (penalizedEdges = []) => {
          const gScore = {}; const fScore = {}; const previous = {};
          const openSet = new Set([startNodeId]);
          nodes.forEach(node => { gScore[node.id] = Infinity; fScore[node.id] = Infinity; });
          gScore[startNodeId] = 0;
          fScore[startNodeId] = h(startNode.coords, endNode.coords);

          while (openSet.size > 0) {
            let currentId = null;
            openSet.forEach(id => { if (currentId === null || fScore[id] < fScore[currentId]) currentId = id; });
            if (currentId === endNodeId) {
              const path = []; const pathEdgeIds = [];
              let curr = endNodeId;
              while (curr !== undefined) {
                const node = nodes.find(n => n.id === curr);
                if (node) path.unshift(node.coords);
                const prevId = previous[curr];
                if (prevId) pathEdgeIds.push(`${prevId}-${curr}`, `${curr}-${prevId}`);
                curr = previous[curr];
              }
              return { coords: path, edgeIds: pathEdgeIds };
            }
            openSet.delete(currentId);
            edges.filter(e => e.from === currentId || e.to === currentId).forEach(edge => {
              const neighborId = edge.from === currentId ? edge.to : edge.from;
              const neighbor = nodes.find(n => n.id === neighborId);
              const edgeKey = `${edge.from}-${edge.to}`;
              const penalty = penalizedEdges.includes(edgeKey) || penalizedEdges.includes(`${edge.to}-${edge.from}`) ? 100 : 0;
              const tentativeGScore = gScore[currentId] + edge.weight + penalty;
              if (tentativeGScore < gScore[neighborId]) {
                previous[neighborId] = currentId;
                gScore[neighborId] = tentativeGScore;
                fScore[neighborId] = gScore[neighborId] + h(neighbor.coords, endNode.coords);
                openSet.add(neighborId);
              }
            });
          }
          return null;
        };

        const allPaths = [];
        const usedEdges = [];
        for (let i = 0; i < 3; i++) {
          const result = findSinglePath(usedEdges);
          if (!result) break;
          allPaths.push(result.coords);
          usedEdges.push(...result.edgeIds);
        }
        return allPaths;
      },

      // Event Management
      getEventById: (id) => get().events.find(e => e.id === id),
      
      checkUpcomingEvents: () => {
        const { events, weather } = get();
        const now = new Date();
        const reminders = [];
        
        events.forEach(event => {
          const eventTime = new Date(event.time);
          const diffMs = eventTime - now;
          const diffMins = Math.floor(diffMs / (1000 * 60));
          
          if (diffMins > 0 && diffMins <= 30) {
            let weatherWarning = '';
            if (weather.condition.toLowerCase().includes('rain') || weather.condition.toLowerCase().includes('cloudy')) {
              weatherWarning = ' • ☂️ Carry umbrella (Rain expected)';
            } else if (weather.temp > 35) {
              weatherWarning = ' • ☀️ High temperature (Stay hydrated)';
            }
            
            reminders.push({
              ...event,
              message: `${event.title} starts in ${diffMins} mins!${weatherWarning}`,
              type: 'urgent'
            });
          }
        });
        
        set({ upcomingReminders: reminders });
        return reminders;
      },
      findNearestNode: (latlng) => {
        const { campusGraph } = get();
        if (!campusGraph.nodes.length) return null;

        let nearest = null;
        let minDist = Infinity;

        campusGraph.nodes.forEach(node => {
          const dist = Math.sqrt(
            Math.pow(node.coords[0] - latlng[0], 2) + 
            Math.pow(node.coords[1] - latlng[1], 2)
          );
          if (dist < minDist) {
            minDist = dist;
            nearest = node;
          }
        });
        return nearest;
      },
      
      // Generate Human-Readable Turn-by-Turn Instructions
      generateInstructions: (path) => {
        if (!path || path.length < 2) return [];
        
        const getBearing = (p1, p2) => {
          const lat1 = p1[0] * Math.PI / 180;
          const lat2 = p2[0] * Math.PI / 180;
          const dLon = (p2[1] - p1[1]) * Math.PI / 180;
          const y = Math.sin(dLon) * Math.cos(lat2);
          const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
          return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        };

        const getDist = (p1, p2) => {
          // Approximate distance in meters
          const R = 6371e3; 
          const φ1 = p1[0] * Math.PI/180;
          const φ2 = p2[0] * Math.PI/180;
          const Δφ = (p2[0]-p1[0]) * Math.PI/180;
          const Δλ = (p2[1]-p1[1]) * Math.PI/180;
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        const getDirectionName = (b) => {
          if (b >= 337.5 || b < 22.5) return "North";
          if (b >= 22.5 && b < 67.5) return "North East";
          if (b >= 67.5 && b < 112.5) return "East";
          if (b >= 112.5 && b < 157.5) return "South East";
          if (b >= 157.5 && b < 202.5) return "South";
          if (b >= 202.5 && b < 247.5) return "South West";
          if (b >= 247.5 && b < 292.5) return "West";
          return "North West";
        };

        const instructions = [];
        let currentDist = 0;
        let lastBearing = null;

        for (let i = 0; i < path.length - 1; i++) {
          const p1 = path[i];
          const p2 = path[i + 1];
          const bearing = getBearing(p1, p2);
          const dist = getDist(p1, p2);

          if (i === 0) {
            instructions.push({ text: `Head ${getDirectionName(bearing)}`, distance: dist });
            lastBearing = bearing;
            currentDist = dist;
            continue;
          }

          let diff = bearing - lastBearing;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;

          if (Math.abs(diff) > 25) {
            const turnType = diff > 0 ? "right" : "left";
            const intensity = Math.abs(diff) > 60 ? "" : "slightly ";
            instructions.push({ 
              text: `Turn ${intensity}${turnType} and continue for ${Math.round(currentDist)}m`, 
              distance: currentDist 
            });
            currentDist = dist;
            lastBearing = bearing;
          } else {
            currentDist += dist;
          }
        }

        instructions.push({ text: "You have arrived at your destination", distance: 0 });
        return instructions;
      },

      setUserLocation: (location) => set({ userLocation: location }),
      setSelectedBuilding: (building) => set({ selectedBuilding: building }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setNavigationPath: (path) => set({ navigationPath: path }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      toggleBookmark: (building) => {
        const { bookmarks } = get();
        const isExisting = bookmarks.find(b => b.id === building.id);
        if (isExisting) {
          set({ bookmarks: bookmarks.filter(b => b.id !== building.id) });
          return false;
        } else {
          set({ bookmarks: [...bookmarks, building] });
          return true;
        }
      },

      fetchBuildings: async (force = false) => {
        const { buildings, lastFetched } = get();
        const now = Date.now();
        const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

        if (!force && buildings.length > 0 && lastFetched && (now - lastFetched < CACHE_DURATION)) {
          console.log('Using cached campus data');
          return buildings;
        }

        set({ isLoading: true });
        try {
          const { data } = await buildingService.getAll();
          let processed = [];
          
          if (data && Array.isArray(data)) {
            // DEDUPLICATE DATABASE ENTRIES: Prioritize entries with polygons
            const uniqueData = [];
            data.forEach(item => {
              const existingIndex = uniqueData.findIndex(u => u.name?.trim().toLowerCase() === item.name?.trim().toLowerCase());
              if (existingIndex === -1) {
                uniqueData.push(item);
              } else if (item.boundary?.type === 'Polygon' && uniqueData[existingIndex].boundary?.type !== 'Polygon') {
                uniqueData[existingIndex] = item;
              }
            });

            processed = uniqueData.map(b => {
              let latlng = [23.2512, 77.5245];
              let poly = null;

              if (b.boundary?.type === 'Polygon') {
                poly = b.boundary.coordinates[0].map(c => [c[1], c[0]]);
                const lats = poly.map(p => p[0]);
                const lngs = poly.map(p => p[1]);
                latlng = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
              } else if (b.boundary?.type === 'Point') {
                latlng = [b.boundary.coordinates[1], b.boundary.coordinates[0]];
              } else if (b.coordinates?.coordinates?.[1]) {
                latlng = [b.coordinates.coordinates[1], b.coordinates.coordinates[0]];
              }

              return { ...b, coords: latlng, polygonCoords: poly };
            });
          }

          // Merge Production Features (Buildings, Gates, Paths)
          CAMPUS_PRODUCTION_DATA.forEach(feature => {
            if (feature.polygonCoords && !feature.coords) {
              const lats = feature.polygonCoords.map(p => p[0]);
              const lngs = feature.polygonCoords.map(p => p[1]);
              feature.coords = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
            }
            // Only add if not already present by ID or normalized name
            const featureName = feature.name?.trim().toLowerCase();
            if (!processed.some(p => 
              p.id === feature.id || 
              p.name?.trim().toLowerCase() === featureName
            )) {
              processed.push(feature);
            }
          });


          // Generate Dynamic Graph from all available paths
          const supabasePaths = processed.filter(b => (b.type === 'Path' || b.polylineCoords) && b.polylineCoords && b.polylineCoords.length > 0);
          
          // Merge with local paths to ensure they are always present even if DB is empty
          const localPaths = CAMPUS_PRODUCTION_DATA.filter(b => (b.type === 'Path' || b.polylineCoords) && b.polylineCoords && b.polylineCoords.length > 0);
          
          // Use a Map to de-duplicate by ID
          const pathsMap = new Map();
          localPaths.forEach(p => pathsMap.set(p.id, p));
          supabasePaths.forEach(p => pathsMap.set(p.id, p));
          
          const allPaths = Array.from(pathsMap.values());
          const dynamicNodes = [...CAMPUS_NODES];
          const dynamicEdges = [...CAMPUS_EDGES];

          // Use a coordinate map to connect paths at junctions
          const coordToNodeId = {};
          // Initialize map with existing graph nodes
          const allNodes = [...dynamicNodes];
          
          const getDistance = (c1, c2) => Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2));
          const SNAP_THRESHOLD = 0.00008; // Approx 8-10 meters fuzzy snapping

          const findOrAddNode = (c, pathId, idx) => {
            // 1. Try exact match first for performance
            const exactKey = `${c[0].toFixed(7)},${c[1].toFixed(7)}`;
            if (coordToNodeId[exactKey]) return coordToNodeId[exactKey];

            // 2. Try fuzzy match with existing nodes
            for (const node of allNodes) {
              if (getDistance(node.coords, c) < SNAP_THRESHOLD) {
                // Cache this exact coordinate to the found node for future exact matches
                coordToNodeId[exactKey] = node.id;
                return node.id;
              }
            }

            // 3. Create new node if no match
            const newNodeId = `dyn_${pathId}_${idx}`;
            const newNode = { id: newNodeId, name: `Path Pt`, coords: c };
            allNodes.push(newNode);
            coordToNodeId[exactKey] = newNodeId;
            return newNodeId;
          };

          allPaths.forEach(path => {
            const coords = path.polylineCoords;
            if (!coords || coords.length < 2) return;

            let prevNodeId = null;

            coords.forEach((c, i) => {
              const nodeId = findOrAddNode(c, path.id, i);

              if (prevNodeId && prevNodeId !== nodeId) {
                const p1 = allNodes.find(n => n.id === prevNodeId).coords;
                const dist = getDistance(p1, c);
                
                // Add bi-directional edges
                dynamicEdges.push({ from: prevNodeId, to: nodeId, weight: dist });
                dynamicEdges.push({ from: nodeId, to: prevNodeId, weight: dist });
              }
              prevNodeId = nodeId;
            });
          });

          set({ 
            buildings: processed.filter(b => b.type !== 'Path' && !b.id?.includes('path')), 
            paths: allPaths,
            campusGraph: { nodes: allNodes, edges: dynamicEdges },
            lastFetched: now, 
            isLoading: false 
          });
          return processed;
        } catch (error) {
          console.error('Fetch buildings failed:', error);
          set({ isLoading: false });
          // Fallback to production data only if fetch fails and we have no data
          if (get().buildings.length === 0) {
            set({ 
              buildings: CAMPUS_PRODUCTION_DATA.filter(b => b.type !== 'Path' && !b.id?.includes('path')),
              paths: CAMPUS_PRODUCTION_DATA.filter(b => b.type === 'Path' || b.polylineCoords)
            });
          }
        }
      }
    }),
    {
      name: 'campus-navigator-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        bookmarks: state.bookmarks,
        mapLayer: state.mapLayer
      }),
      version: 15,
      migrate: () => ({})  // Clear all stale persisted state on version bump
    }
  )
);

export default useCampusStore;
