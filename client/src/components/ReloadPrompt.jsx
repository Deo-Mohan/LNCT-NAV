import React, { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function ReloadPrompt() {
  const sw = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  // Destructure with extreme safety
  const {
    offlineReady: [offlineReady, setOfflineReady] = [false, () => {}],
    needUpdate: [needUpdate, setNeedUpdate] = [false, () => {}],
    updateServiceWorker,
  } = sw || {}

  const close = () => {
    setOfflineReady(false)
    setNeedUpdate(false)
  }

  // Debugging
  useEffect(() => {
    if (offlineReady) console.log('App is ready for offline use')
    if (needUpdate) console.log('New content available, please reload')
  }, [offlineReady, needUpdate])

  if (!offlineReady && !needUpdate) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <RefreshCw className={`w-5 h-5 ${needUpdate ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                {offlineReady ? 'App Ready Offline' : 'Update Available'}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {offlineReady 
                  ? 'The app is now ready to work without internet.' 
                  : 'A new version is available. Click to update.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {needUpdate && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                Reload
              </button>
            )}
            <button
              onClick={() => close()}
              className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ReloadPrompt
