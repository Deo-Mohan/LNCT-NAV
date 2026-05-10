import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useCampusStore from '../store/useCampusStore';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Search,
  Filter,
  Navigation2,
  Bell,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  X
} from 'lucide-react';
import EventSkeleton from '../components/EventSkeleton';

const Events = () => {
  const navigate = useNavigate();
  const { events, checkUpcomingEvents, upcomingReminders, fetchEvents, weather, fetchWeather } = useCampusStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchEvents();
      await fetchWeather();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEvents(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Hackathon', 'Workshop', 'Seminar', 'Cultural'];

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'All' || event.category === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkUpcomingEvents]);

  const handleNavigate = (venueId) => {
    navigate(`/navigate?to=${venueId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Campus Events</h1>
                <p className="text-slate-500 text-sm font-medium">Workshops, Hackathons & more</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                className={`p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh Events"
              >
                <RefreshCw size={20} />
              </button>
              {upcomingReminders.length > 0 && (
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-3 rounded-2xl flex items-center gap-2 border border-amber-200 dark:border-amber-800/50"
                >
                  <Bell size={20} className="animate-bounce" />
                  <span className="text-xs font-bold uppercase tracking-wider">{upcomingReminders.length} UPCOMING</span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search events or venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                    filter === cat 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reminders Bar */}
      <AnimatePresence>
        {upcomingReminders.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-600 text-white overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles size={18} />
                <p className="text-sm font-bold">
                  "{upcomingReminders[0].title}" starts soon! Leave now to reach on time.
                </p>
              </div>
              <button 
                onClick={() => handleNavigate(upcomingReminders[0].venue_id || 'main-gate')}
                className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider hover:bg-blue-50 transition-colors"
              >
                Navigate Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EventSkeleton />
            </motion.div>
          ) : filteredEvents.length > 0 ? (
            <motion.div 
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all"
              >
                 {/* Event Image */}
                <div 
                  className="relative h-56 overflow-hidden cursor-zoom-in group/image"
                  onClick={() => setSelectedPoster({ url: event.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop', title: event.title })}
                >
                  <img 
                    src={event.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop'} 
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <Search className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity scale-50 group-hover/image:scale-100 duration-300" size={32} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                      {event.category}
                    </span>
                    {(weather.condition === 'Rainy' || weather.condition === 'Thunderstorm') && (
                      <motion.span 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="px-4 py-1.5 bg-amber-500/90 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-amber-400/50 flex items-center gap-2"
                      >
                        <Sparkles size={12} /> Take Umbrella ☂️
                      </motion.span>
                    )}
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">
                    <Calendar size={14} />
                    {new Date(event.time).toLocaleDateString([], { month: 'long', day: 'numeric' })}
                    <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                    <Clock size={14} />
                    {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 line-clamp-1">
                    {event.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-6">
                    {event.description}
                  </p>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-slate-400">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Venue</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {event.venue} {event.room_details && `• ${event.room_details}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleNavigate(event.venue_id || 'main-gate')}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                      >
                        <Navigation2 size={18} />
                        NAVIGATE
                      </button>
                      <button className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <Calendar size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No events found</h3>
              <p className="text-slate-500 max-w-xs">Try adjusting your filters or search query to find campus happenings.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Full-Screen Poster Modal */}
      <AnimatePresence>
        {selectedPoster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPoster(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-[80vh] bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            >
              <button 
                onClick={() => setSelectedPoster(null)}
                className="absolute top-6 right-6 z-20 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-xl text-white rounded-2xl transition-colors border border-white/10 shadow-lg"
              >
                <X size={24} />
              </button>
              
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                {/* Loading Shimmer for Modal */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                
                <img 
                  src={selectedPoster.url} 
                  alt={selectedPoster.title}
                  onLoad={(e) => e.target.style.opacity = 1}
                  style={{ opacity: 0 }}
                  className="relative z-10 max-w-full max-h-full object-contain transition-opacity duration-500"
                />
              </div>
              
              <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{selectedPoster.title}</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Event Poster Hub</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events;
