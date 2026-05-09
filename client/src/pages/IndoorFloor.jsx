import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ZoomIn, ZoomOut, Info, Map as MapIcon } from 'lucide-react';

const IndoorFloor = () => {
  const { building, floor } = useParams();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [zoom, setZoom] = useState(1);

  // Mock data for rooms
  const rooms = [
    { id: 'room-1', name: 'AI Lab', type: 'Lab', x: 100, y: 100, width: 150, height: 100, info: 'Equipped with NVIDIA GPUs and AI workstations.' },
    { id: 'room-2', name: 'Classroom 201', type: 'Classroom', x: 300, y: 100, width: 150, height: 100, info: 'Smart Classroom with Projector' },
    { id: 'room-3', name: 'HOD Office', type: 'Office', x: 100, y: 300, width: 100, height: 80, info: 'CSE Department HOD' },
    { id: 'corridor', name: 'Main Corridor', type: 'Corridor', x: 0, y: 220, width: 600, height: 40, isPath: true },
  ];

  const handleRoomClick = (room) => {
    if (room.type !== 'Corridor') {
      setSelectedRoom(room);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white leading-tight">{building || 'CSE Block'}</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Floor {floor || '2'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
            <ZoomIn size={18} />
          </button>
          <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
            <ZoomOut size={18} />
          </button>
        </div>
      </div>

      {/* Interactive SVG Area */}
      <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center">
        <motion.svg 
          viewBox="0 0 600 500" 
          className="w-full max-w-2xl h-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800"
          animate={{ scale: zoom }}
        >
          {/* Background Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-800" />
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#grid)" />

          {/* Rooms */}
          {rooms.map((room) => (
            <g 
              key={room.id} 
              onClick={() => handleRoomClick(room)}
              className="cursor-pointer transition-all duration-300"
            >
              <motion.rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                rx={8}
                className={clsx(
                  "stroke-2 transition-all",
                  room.type === 'Corridor' ? "fill-slate-100 dark:fill-slate-800 stroke-transparent" : 
                  selectedRoom?.id === room.id ? "fill-blue-100 dark:fill-blue-900/40 stroke-blue-600" : "fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700 hover:stroke-blue-400"
                )}
              />
              {room.type !== 'Corridor' && (
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400 pointer-events-none select-none"
                >
                  {room.name}
                </text>
              )}
              
              {/* Highlight if selected */}
              {selectedRoom?.id === room.id && (
                <motion.circle 
                  cx={room.x + room.width / 2} 
                  cy={room.y + room.height / 2} 
                  r={4} 
                  className="fill-blue-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </g>
          ))}
          
          {/* Simple Path Visualization Example */}
          <motion.path 
            d="M 50 240 L 175 240 L 175 200"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeDasharray="8 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.svg>

        {/* Room Detail Overlay */}
        <AnimatePresence>
          {selectedRoom && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 z-20"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    {selectedRoom.type}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{selectedRoom.name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <ArrowLeft className="rotate-90" size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{selectedRoom.info}</p>
              <div className="flex gap-2">
                <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">
                  Navigate Here
                </button>
                <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600">
                  <Info size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floor Selector */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="flex gap-2 min-w-max mx-auto justify-center">
          {[1, 2, 3].map((f) => (
            <button
              key={f}
              onClick={() => navigate(`/floor/${building}/${f}`)}
              className={clsx(
                "px-6 py-2 rounded-xl font-bold transition-all",
                Number(floor) === f ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
              )}
            >
              Floor {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper for classes
const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default IndoorFloor;
