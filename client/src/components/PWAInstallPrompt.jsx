import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Settings2 } from 'lucide-react';
import { clsx } from 'clsx';
import useToastStore from '../store/useToastStore';

const PWAInstallPrompt = () => {
  const showToast = useToastStore(state => state.showToast);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if already in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    // Handle Android/Chrome/Windows install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem('pwa_prompt_dismissed') && !isStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Specific: Show prompt manually since beforeinstallprompt never fires
    if (isIOSDevice && !isStandalone && !sessionStorage.getItem('pwa_prompt_dismissed')) {
      // Delay slightly to not overwhelm user
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    // Fallback: If after 5 seconds we have no prompt but aren't standalone, 
    // we might be on a browser that doesn't support the event (like Safari Mac or Firefox)
    // We can show a "Manual Install" tip
    const fallbackTimer = setTimeout(() => {
      if (!isStandalone && !deferredPrompt && !sessionStorage.getItem('pwa_prompt_dismissed')) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Manual guidance
      if (isIOS) {
        showToast("iOS Installation", "Tap the 'Share' icon in Safari and select 'Add to Home Screen'");
      } else {
        showToast("Manual Install", "Open your browser menu (⋮ or ≡) and select 'Install App' or 'Add to Home Screen'");
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-full sm:max-w-md z-[9999]"
        >
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl overflow-hidden relative group">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Download className="text-white" size={28} />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Install LNCT Navigator
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Get the full campus experience with offline support and real-time GPS.
                </p>
              </div>
              
              <button 
                onClick={handleDismiss}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="mt-6 flex gap-3 relative z-10">
              <button
                onClick={handleInstall}
                className={clsx(
                   "flex-1 py-3.5 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2",
                   deferredPrompt 
                     ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" 
                     : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                )}
              >
                {deferredPrompt ? 'Install Now' : (isIOS ? 'How to Install' : 'Show Instructions')}
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all"
              >
                Not Now
              </button>
            </div>

            {isIOS && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Share size={12} />
                <span>Tap Share then "Add to Home Screen"</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
