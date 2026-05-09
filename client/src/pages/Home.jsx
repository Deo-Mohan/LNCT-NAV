import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Navigation, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import logo from '../assets/lnct logo.png';
import appLogo from '../assets/lnct app logo.png';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-64px)] px-6 py-12 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full text-center space-y-8 my-auto"
      >
        {/* Header Logo removed as requested */}
        
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center mb-8 select-none w-full max-w-xl mx-auto">
            {/* Cleaned Hybrid SVG LNCT Logo: Fixed Spacing */}
            <svg viewBox="0 0 550 120" className="w-full h-auto drop-shadow-xl overflow-visible">
              {/* Main Letters Group */}
              <g fill="currentColor" className="text-slate-800 dark:text-slate-100">
                {/* L (User's Path) */}
                <path d="M 25 15 H 75 V 80 H 135 V 105 H 55 C 35 105 25 95 25 75 Z" />
                
                {/* C (Shifted for clear spacing) */}
                <g transform="translate(65, 0)">
                  <path d="M 335 15 H 270 C 250 15 240 25 240 45 V 75 C 240 95 250 105 270 105 H 335 V 85 H 270 C 265 85 262 83 262 78 V 42 C 262 37 265 35 270 35 H 335 Z" />
                </g>
                
                {/* T (Shifted for clear spacing) */}
                <g transform="translate(70, 0)">
                  <path d="M 345 15 H 403 V 105 H 383 V 35 H 345 Z" />
                  <path d="M 417 15 H 475 V 35 H 437 V 105 H 417 Z" />
                </g>
              </g>

              {/* N (Height-corrected to match L, C, T exactly) */}
              <g transform="translate(155, 0)">
                <path 
                  d="M 15 91 V 29 Q 15 14 40 14 L 105 91 Q 130 91 130 77 V 14" 
                  fill="none" 
                  stroke="#f58220" 
                  strokeWidth="32" 
                  strokeLinecap="butt" 
                  strokeLinejoin="round" 
                />
              </g>

              {/* SM Text (Shifted with T) */}
              <text x="545" y="12" fontFamily="Arial, sans-serif" fontWeight="black" fontSize="14" fill="currentColor" className="text-slate-500">SM</text>
            </svg>

            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-slate-800 dark:text-slate-100 mt-8 leading-tight text-center drop-shadow-sm">
              Smart Campus <br className="sm:hidden" />
              Navigat
              <a 
                href="https://lnct.ac.in/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative inline-flex items-center justify-center w-[1.15em] h-[1.15em] align-middle -mt-2 mx-1 hover:scale-110 transition-all duration-300 group"
              >
                {/* Glow Effect: Always on mobile, hover on desktop */}
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl scale-125 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                
                {/* Red Brand Border */}
                <div className="absolute inset-0 border-2 md:border-4 border-red-600 rounded-full z-20 shadow-[0_0_15px_rgba(220,38,38,0.4)]"></div>
                
                <img 
                  src={logo} 
                  alt="LNCT Logo" 
                  className="w-full h-full object-contain rounded-full relative z-10 p-1 bg-white"
                />
              </a>
              r
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            The ultimate guide to Lakshmi Narain College of Technology. Find blocks, classrooms, and labs with precision indoor navigation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 max-w-[320px] sm:max-w-none mx-auto w-full px-2">
          <Link to="/map" className="w-full">
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white sm:bg-blue-100/50 sm:dark:bg-blue-900/30 sm:text-blue-600 sm:group-hover:bg-blue-600 sm:group-hover:text-white transition-colors rounded-xl backdrop-blur-sm">
                  <MapPin size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">Explore Campus</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Interactive outdoor map</p>
                </div>
                <ArrowRight className="ml-auto text-blue-600 sm:text-slate-300 sm:group-hover:text-blue-600 transition-colors" size={20} />
              </div>
            </motion.div>
          </Link>

          <Link to="/search" className="w-full">
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-600 text-white sm:bg-amber-100/50 sm:dark:bg-amber-900/30 sm:text-amber-600 sm:group-hover:bg-amber-600 sm:group-hover:text-white transition-colors rounded-xl backdrop-blur-sm">
                  <Search size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">Find a Room</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Classrooms, Labs & Offices</p>
                </div>
                <ArrowRight className="ml-auto text-amber-600 sm:text-slate-300 sm:group-hover:text-amber-600 transition-colors" size={20} />
              </div>
            </motion.div>
          </Link>
        </div>

        <div className="pt-8 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            PWA Ready
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Indoor Routes
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            Fast & Offline
          </div>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
};

export default Home;
