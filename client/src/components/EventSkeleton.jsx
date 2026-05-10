import React from 'react';
import { motion } from 'framer-motion';

const EventSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative">
          {/* Shimmer Effect Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full"></div>
          </div>

          {/* Image Area */}
          <div className="h-56 bg-slate-200 dark:bg-slate-800"></div>

          {/* Content Area */}
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
            
            <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
            
            <div className="pt-4 flex gap-3">
              <div className="h-12 flex-1 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            </div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default EventSkeleton;
