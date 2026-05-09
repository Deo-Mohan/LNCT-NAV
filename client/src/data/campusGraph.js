export const CAMPUS_NODES = [
  { id: 'main_gate', name: 'Main Gate', coords: [23.2505, 77.5235] },
  { id: 'junction_1', name: 'Admin Junction', coords: [23.2515, 77.5240] },
  { id: 'junction_2', name: 'Library Square', coords: [23.2525, 77.5245] },
  { id: 'junction_3', name: 'Canteen Corner', coords: [23.2530, 77.5255] },
  { id: 'lnct_main', name: 'LNCT Main Building', coords: [23.2518, 77.5242] },
  { id: 'lncte_building', name: 'LNCTE Building', coords: [23.2528, 77.5248] },
  { id: 'lncts_building', name: 'LNCTS Building', coords: [23.2535, 77.5250] },
  { id: 'boys_hostel', name: 'Boys Hostel', coords: [23.2545, 77.5260] },
  { id: 'girls_hostel', name: 'Girls Hostel', coords: [23.2500, 77.5265] },
];

export const CAMPUS_EDGES = [
  { from: 'main_gate', to: 'junction_1', weight: 150, type: 'road' },
  { from: 'junction_1', to: 'lnct_main', weight: 50, type: 'road' },
  { from: 'junction_1', to: 'junction_2', weight: 120, type: 'road' },
  { from: 'junction_2', to: 'lncte_building', weight: 40, type: 'road' },
  { from: 'junction_2', to: 'junction_3', weight: 100, type: 'road' },
  { from: 'junction_3', to: 'lncts_building', weight: 60, type: 'road' },
  { from: 'junction_3', to: 'boys_hostel', weight: 200, type: 'road' },
  { from: 'main_gate', to: 'girls_hostel', weight: 300, type: 'road' },
];
