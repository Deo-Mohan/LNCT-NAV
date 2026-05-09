import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { buildingService } from '../services/api';
import { CAMPUS_NODES, CAMPUS_EDGES } from '../data/campusGraph';
import { CAMPUS_PRODUCTION_DATA } from '../data/campusProductionData';

const useCampusStore = create(
  persist(
    (set, get) => ({
      userLocation: null,
      selectedBuilding: null,
      searchQuery: '',
      navigationPath: null,
      isDarkMode: false,
      buildings: [],
      lastFetched: null,
      isLoading: false,
      bookmarks: [],
      isNavbarVisible: true,
      
      setIsNavbarVisible: (visible) => set({ isNavbarVisible: visible }),
      
      // Graph Navigation Data
      campusGraph: {
        nodes: CAMPUS_NODES,
        edges: CAMPUS_EDGES
      },

      // A* (A-Star) Shortest Path Algorithm
      calculatePath: (startNodeId, endNodeId) => {
        const { campusGraph } = get();
        const { nodes, edges } = campusGraph;
        
        if (!nodes.length || !edges.length) return null;

        const startNode = nodes.find(n => n.id === startNodeId);
        const endNode = nodes.find(n => n.id === endNodeId);
        if (!startNode || !endNode) return null;

        // Heuristic: Straight-line distance
        const h = (aCoords, bCoords) => {
          return Math.sqrt(
            Math.pow(aCoords[0] - bCoords[0], 2) + 
            Math.pow(aCoords[1] - bCoords[1], 2)
          );
        };

        const gScore = {}; 
        const fScore = {}; 
        const previous = {};
        const openSet = new Set([startNodeId]);

        nodes.forEach(node => {
          gScore[node.id] = Infinity;
          fScore[node.id] = Infinity;
        });

        gScore[startNodeId] = 0;
        fScore[startNodeId] = h(startNode.coords, endNode.coords);

        while (openSet.size > 0) {
          let currentId = null;
          openSet.forEach(id => {
            if (currentId === null || fScore[id] < fScore[currentId]) {
              currentId = id;
            }
          });

          if (currentId === endNodeId) {
            const path = [];
            let curr = endNodeId;
            while (curr !== undefined) {
              const node = nodes.find(n => n.id === curr);
              if (node) path.unshift(node.coords);
              curr = previous[curr];
            }
            return path;
          }

          openSet.delete(currentId);

          edges.filter(e => e.from === currentId || e.to === currentId).forEach(edge => {
            const neighborId = edge.from === currentId ? edge.to : edge.from;
            const neighbor = nodes.find(n => n.id === neighborId);
            
            const tentativeGScore = gScore[currentId] + edge.weight;
            
            if (tentativeGScore < gScore[neighborId]) {
              previous[neighborId] = currentId;
              gScore[neighborId] = tentativeGScore;
              fScore[neighborId] = gScore[neighborId] + h(neighbor.coords, endNode.coords);
              openSet.add(neighborId);
            }
          });
        }

        return null;
      },

      // Helper to find nearest node to a latlng
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
            processed = data.map(b => {
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
            // Only add if not already present by ID or name
            if (!processed.some(p => p.id === feature.id || p.name === feature.name)) {
              processed.push(feature);
            }
          });

          // Add synthetic sub-locations for LNCTE if not present
          const lncte = processed.find(b => b.name?.toUpperCase().includes('LNCTE'));
          if (lncte && !processed.some(b => b.name === 'LNCTE Lab 101')) {
            const subLocs = [
              { id: 'sub1', name: 'LNCTE Lab 101', type: 'Lab', coords: [lncte.coords[0] + 0.0001, lncte.coords[1] + 0.0001] },
              { id: 'sub2', name: 'LNCTE Room 202', type: 'Room', coords: [lncte.coords[0] - 0.0001, lncte.coords[1] - 0.0001] },
              { id: 'sub3', name: 'LNCTE Office', type: 'Office', coords: [lncte.coords[0] + 0.0001, lncte.coords[1] - 0.0001] },
              { id: 'sub4', name: 'LNCTE Seminar Hall', type: 'Auditorium', coords: [lncte.coords[0] - 0.0001, lncte.coords[1] + 0.0001] },
            ];
            processed.push(...subLocs);
          }

          set({ buildings: processed.filter(b => b.type !== 'Path' && !b.id?.includes('path')), lastFetched: now, isLoading: false });
          return processed;
        } catch (error) {
          console.error('Fetch buildings failed:', error);
          set({ isLoading: false });
          // Fallback to production data only if fetch fails and we have no data
          if (get().buildings.length === 0) {
            set({ buildings: CAMPUS_PRODUCTION_DATA.filter(b => b.type !== 'Path' && !b.id?.includes('path')) });
          }
        }
      }
    }),
    {
      name: 'campus-navigator-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        buildings: state.buildings,
        lastFetched: state.lastFetched,
        isDarkMode: state.isDarkMode,
        bookmarks: state.bookmarks,
        campusGraph: state.campusGraph
      }),
    }
  )
);

export default useCampusStore;
