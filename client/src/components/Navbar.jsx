import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map as MapIcon, Navigation, Search, ShieldCheck, Code } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import mapIcon from '../assets/map icon.png';
import appLogo from '../assets/lnct app logo.png';

import useThemeStore from '../store/useThemeStore';
import useCampusStore from '../store/useCampusStore';

const Navbar = () => {
  const location = useLocation();
  const { isDark, toggleTheme, setTheme } = useThemeStore();
  const { isNavbarVisible } = useCampusStore();

  useEffect(() => {
    setTheme(isDark);
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: MapIcon, label: 'Map' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/navigate', icon: Navigation, label: 'Go' },
  ];

  return (
    <motion.nav 
      initial={false}
      animate={{ 
        y: isNavbarVisible ? 0 : '100%',
        opacity: isNavbarVisible ? 1 : 0
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 sm:relative sm:top-0 sm:border-t-0 sm:border-b transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="hidden sm:flex items-center gap-2">
          <img src={mapIcon} alt="Map" className="w-8 h-8 object-contain" />
          <div className="font-black text-xl flex items-center">
            <div className="tracking-widest mr-1 flex items-center">
              <span className="text-slate-900 dark:text-white">L</span>
              <span className="text-[#f58220]">N</span>
              <span className="text-slate-900 dark:text-white">CT</span>
            </div>
            <span className="text-blue-600">NAV</span>
          </div>
        </Link>
        <div className="flex gap-1 sm:gap-4 w-full sm:w-auto justify-around sm:justify-end items-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col sm:flex-row items-center gap-1 p-2 rounded-xl transition-all duration-300",
                location.pathname === item.path 
                  ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px] sm:text-sm font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          ))}
          
          <div className="hidden sm:flex">
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
