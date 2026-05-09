import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bell, Compass, ShieldCheck, X, ArrowRight, Shield, Settings2, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const PermissionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [permissions, setPermissions] = useState({
    location: 'prompt',
    notifications: 'prompt',
    orientation: 'prompt'
  });

  useEffect(() => {
    const checkPermissions = async () => {
      // Don't show if already dismissed this week
      const lastDismissed = localStorage.getItem('permissions_modal_dismissed');
      if (lastDismissed) {
        const diff = Date.now() - parseInt(lastDismissed);
        if (diff < 7 * 24 * 60 * 60 * 1000) return;
      }

      try {
        const geo = await navigator.permissions.query({ name: 'geolocation' });
        const notif = Notification.permission;
        
        setPermissions({
          location: geo.state,
          notifications: notif,
          orientation: (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') ? 'prompt' : 'granted'
        });

        if (geo.state === 'prompt' || notif === 'default') {
          // Show after 3 seconds of browsing
          setTimeout(() => setIsOpen(true), 3000);
        }
      } catch (err) {
        console.error("Permission check failed", err);
      }
    };

    checkPermissions();
  }, []);

  const requestAll = async () => {
    // 1. Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setPermissions(prev => ({ ...prev, location: 'granted' })),
        () => setPermissions(prev => ({ ...prev, location: 'denied' }))
      );
    }

    // 2. Notifications
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setPermissions(prev => ({ ...prev, notifications: permission }));
    }

    // 3. Orientation (iOS 13+)
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        setPermissions(prev => ({ ...prev, orientation: response }));
      } catch (err) {
        console.error("Orientation permission failed", err);
      }
    }

    // Close after a short delay to show success
    setTimeout(() => {
      setIsOpen(false);
      localStorage.setItem('permissions_modal_dismissed', Date.now().toString());
    }, 1500);
  };

  const dismiss = () => {
    setIsOpen(false);
    localStorage.setItem('permissions_modal_dismissed', Date.now().toString());
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 40 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/40 dark:border-slate-800/50 flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header: Animated & Vibrant (Fixed) */}
            <div className="h-44 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative overflow-hidden shrink-0">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, -5, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"
              />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="p-5 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl mb-3"
                >
                  <ShieldCheck size={48} className="text-white filter drop-shadow-lg" />
                </motion.div>
                <div className="flex items-center gap-2 text-white/60 font-black text-[10px] uppercase tracking-[0.3em]">
                  <Sparkles size={12} />
                  <span>Trust & Safety</span>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-12 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-8">
                <motion.div variants={itemVariants}>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                    Personalize Your <br/>
                    <span className="text-blue-600 dark:text-blue-400">Navigation Journey</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium leading-relaxed">
                    Unlock the full potential of LNCT Smart Campus with real-time tracking and directional guidance.
                  </p>
                </motion.div>

                <div className="grid gap-4">
                  <PermissionItem 
                    variants={itemVariants}
                    icon={MapPin} 
                    title="Real-time Location" 
                    desc="Required for high-precision blue-dot tracking."
                    status={permissions.location}
                    color="blue"
                  />
                  <PermissionItem 
                    variants={itemVariants}
                    icon={Compass} 
                    title="Dynamic Compass" 
                    desc="Orients the map to match your heading."
                    status={permissions.orientation}
                    color="indigo"
                  />
                  <PermissionItem 
                    variants={itemVariants}
                    icon={Bell} 
                    title="Smart Alerts" 
                    desc="Get notified when you reach your destination."
                    status={permissions.notifications === 'granted' ? 'granted' : 'prompt'}
                    color="violet"
                  />
                </div>

                <motion.div variants={itemVariants} className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={requestAll}
                    className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black shadow-[0_20px_40px_-12px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
                  >
                    <Settings2 size={20} />
                    <span>Grant Access</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={dismiss}
                    className="flex-1 py-5 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98]"
                  >
                    Skip
                  </button>
                </motion.div>
                
                <motion.p 
                  variants={itemVariants}
                  className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]"
                >
                  Private • Secure • Campus Exclusive
                </motion.p>
              </div>
            </div>

            <button 
              onClick={dismiss}
              className="absolute top-6 right-6 p-2.5 bg-black/10 hover:bg-black/20 text-white rounded-full transition-all backdrop-blur-md border border-white/10"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PermissionItem = ({ icon: Icon, title, desc, status, color, variants }) => (
  <motion.div 
    variants={variants}
    className={clsx(
      "flex items-start gap-4 p-5 rounded-[2rem] border transition-all",
      status === 'granted' 
        ? "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 shadow-sm" 
        : "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/50 hover:border-blue-200 dark:hover:border-blue-900/30"
    )}
  >
    <div className={clsx(
      "p-3.5 rounded-[1.25rem] shrink-0 shadow-lg",
      status === 'granted' 
        ? "bg-green-500 text-white" 
        : {
          'bg-blue-600 text-white': color === 'blue',
          'bg-indigo-600 text-white': color === 'indigo',
          'bg-violet-600 text-white': color === 'violet',
        }
    )}>
      <Icon size={22} />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">{title}</h4>
        {status === 'granted' ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500 text-white text-[10px] font-black uppercase rounded-full shadow-md">
            <Sparkles size={10} />
            <span>Active</span>
          </div>
        ) : (
          <div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-tight">{desc}</p>
    </div>
  </motion.div>
);

export default PermissionModal;
