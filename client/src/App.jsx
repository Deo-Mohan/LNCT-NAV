import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import CampusMap from './pages/CampusMap';
import Navigation from './pages/Navigation';
import IndoorFloor from './pages/IndoorFloor';
import Search from './pages/Search';
import Admin from './pages/Admin';
import Developer from './pages/Developer';
import Events from './pages/Events';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import PageTransition from './components/PageTransition';
import Loader from './components/Loader';
import SuccessToast from './components/SuccessToast';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import ReloadPrompt from './components/ReloadPrompt';
import PermissionModal from './components/PermissionModal';
import AdminGuard from './components/AdminGuard';
import useThemeStore from './store/useThemeStore';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/map" element={<PageTransition><CampusMap /></PageTransition>} />
        <Route path="/navigate" element={<PageTransition><Navigation /></PageTransition>} />
        <Route path="/floor/:building/:floor" element={<PageTransition><IndoorFloor /></PageTransition>} />
        <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
        <Route path="/admin" element={
          <AdminGuard>
            <PageTransition><Admin /></PageTransition>
          </AdminGuard>
        } />
        <Route path="/developer" element={<PageTransition><Developer /></PageTransition>} />
        <Route path="/events" element={<PageTransition><Events /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { isDark, setTheme } = useThemeStore();

  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    
    // Theme Sync
    if (isMobile) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setTheme(mediaQuery.matches);
      const handleChange = (e) => setTheme(e.matches);
      mediaQuery.addEventListener('change', handleChange);
    } else {
      setTheme(isDark);
    }

    // Splash Screen Timer
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.removeEventListener('change', (e) => setTheme(e.matches));
    };
  }, [setTheme, isDark]);

  if (isInitialLoading) {
    return <Loader fullPage={true} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <SuccessToast />
        <PWAInstallPrompt />
        <ReloadPrompt />
        <PermissionModal />
        <main className="flex-grow flex flex-col overflow-x-hidden">
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App;
