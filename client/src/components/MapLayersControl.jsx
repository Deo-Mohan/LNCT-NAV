import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Layers, Sparkles, Globe, Moon, X, Check } from 'lucide-react';
import { clsx } from 'clsx';

const MapLayersControl = ({ baseLayer, setBaseLayer, showBoundary, setShowBoundary }) => {
  const [isOpen, setIsOpen] = useState(false);

  const layers = [
    { id: 'street', name: 'Voyager', icon: Map, color: 'bg-blue-500' },
    { id: 'vibrant', name: 'Vibrant', icon: Sparkles, color: 'bg-orange-500' },
    { id: 'satellite', name: 'Satellite', icon: Globe, color: 'bg-indigo-600' },
    { id: 'dark', name: 'Dark', icon: Moon, color: 'bg-slate-900' },
  ];

  return (
    <div className="flex flex-col items-start gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mb-1 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-2 min-w-[190px] z-[2001]"
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
                  onClick={() => {
                    setBaseLayer(layer.id);
                    setIsOpen(false);
                  }}
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

            {setShowBoundary && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5">
                <button
                  onClick={() => setShowBoundary(!showBoundary)}
                  className={clsx(
                    "w-full flex items-center justify-between p-2.5 rounded-xl transition-all",
                    showBoundary 
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" 
                      : "bg-slate-50 dark:bg-slate-800/50 text-slate-400"
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-tight ml-1">Boundary</span>
                  <div className={clsx(
                    "w-8 h-4 rounded-full relative transition-colors",
                    showBoundary ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-700"
                  )}>
                    <div className={clsx(
                      "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                      showBoundary ? "right-0.5" : "left-0.5"
                    )} />
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-12 h-12 flex items-center justify-center rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-300",
          isOpen 
            ? "bg-blue-600 border-blue-500 text-white" 
            : "bg-white/90 dark:bg-slate-900/90 border-white/20 dark:border-slate-800 text-slate-600 dark:text-slate-400"
        )}
      >
        <Layers size={20} />
      </motion.button>
    </div>
  );
};

export default MapLayersControl;
