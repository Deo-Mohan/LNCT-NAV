import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, MapPin, Building, ChevronRight, X, Clock, Utensils, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { clsx } from 'clsx';
import SearchingLoader from '../components/SearchingLoader';
import useCampusStore from '../store/useCampusStore';
import BookmarkToggle from '../components/BookmarkToggle';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const { bookmarks, toggleBookmark } = useCampusStore();

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem('lnct_recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const addToRecent = (building) => {
    const updated = [building, ...recentSearches.filter(b => b.id !== building.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('lnct_recent_searches', JSON.stringify(updated));
  };

  useEffect(() => {
    const searchRooms = async () => {
      if (query.trim().length === 0 && activeCategory === 'All') {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        let data;
        if (query.trim().length > 0) {
          const { data: searchData } = await supabase.rpc('smart_search', { search_term: query });
          data = searchData;
        } else {
          // Category filter only
          const { data: categoryData } = await supabase
            .from('buildings')
            .select('*')
            .eq('type', activeCategory)
            .limit(10);
          data = categoryData;
        }

        // Filter out "Path" type from results (only used for navigation)
        const filteredData = (data || []).filter(b => b.type !== 'Path' && !b.id?.includes('path'));
        
        // Add a slight delay to show the nice loader
        await new Promise(resolve => setTimeout(resolve, 800));
        setResults(filteredData);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchRooms, 300);
    return () => clearTimeout(timeoutId);
  }, [query, activeCategory]);

  const categories = [
    { name: 'All', icon: SearchIcon, color: 'text-slate-500' },
    { name: 'Academic', icon: Building, color: 'text-blue-500' },
    { name: 'Sports', icon: Trophy, color: 'text-green-500' },
    { name: 'Facility', icon: Utensils, color: 'text-amber-500' },
  ];

  const getIcon = (name, type) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('canteen') || lowerName.includes('prasadam')) return Utensils;
    if (lowerName.includes('ground') || lowerName.includes('sports') || lowerName.includes('court')) return Trophy;
    return Building;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 pt-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative group">
            <div className="[--background:theme(colors.slate.50)] [--color:theme(colors.blue.600)] [--muted:theme(colors.slate.100)] [--border:theme(colors.slate.200)] dark:[--background:theme(colors.slate.900)] dark:[--color:theme(colors.blue.400)] dark:[--muted:theme(colors.slate.800)] dark:[--border:theme(colors.slate.700)] relative flex items-center transition-all border border-[--border] bg-[--background] focus-within:bg-[--muted] px-5 py-1.5 rounded-[2rem] shadow-xl shadow-blue-500/5 focus-within:border-blue-500/50 hover:border-blue-500/30">
              <SearchIcon className="text-slate-400 group-focus-within:text-blue-500 transition-colors mr-3" size={20} />
              <input 
                type="text" 
                placeholder="Search LNCT Campus..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-bold py-3"
                autoFocus
              />
              <div className="flex items-center gap-2">
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                <kbd className="hidden sm:flex pointer-events-none select-none items-center gap-1 rounded-xl border border-[--border] bg-white dark:bg-slate-950 px-2 h-7 font-mono text-[10px] font-bold opacity-100 shadow-sm text-slate-500">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>

          <div 
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            className="flex gap-2 overflow-x-auto pb-2 no-scrollbar cursor-grab active:cursor-grabbing select-none"
          >
            {categories.map((cat) => (
              <button 
                key={cat.name} 
                onClick={() => setActiveCategory(cat.name)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-bold text-xs border transition-all",
                  activeCategory === cat.name 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-200"
                )}
              >
                <cat.icon size={14} className={activeCategory === cat.name ? "text-white" : cat.color} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full p-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <SearchingLoader />
            </motion.div>
          ) : (query.trim().length > 0 || activeCategory !== 'All') ? (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {`Found ${results.length} locations`}
                </h3>
              </div>
              
              {results.map((result) => {
                const Icon = getIcon(result.name, result.type);
                return (
                  <motion.div 
                    key={result.id}
                    layout
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      addToRecent(result);
                      navigate(`/map?building=${result.name}`);
                    }}
                    className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer group hover:border-blue-500/50 transition-all"
                  >
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{result.name}</h4>
                      <p className="text-sm text-slate-500">{result.type} • {result.description || 'LNCT Campus'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookmarkToggle 
                        isBookmarked={bookmarks.some(b => b.id === result.id)} 
                        onToggle={() => toggleBookmark(result)} 
                      />
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600" />
                    </div>
                  </motion.div>
                );
              })}
              {!loading && results.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SearchIcon size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No matches found</h3>
                  <p className="text-slate-500">Try adjusting your search or category filter</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2 flex items-center gap-2">
                    <Clock size={14} /> Recent Searches
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {recentSearches.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => navigate(`/map?building=${item.name}`)} 
                        className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all cursor-pointer shadow-sm"
                      >
                        <Clock size={16} className="text-slate-300" />
                        <span className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                        <ChevronRight size={14} className="text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookmarks.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-4 px-2 flex items-center gap-2">
                    <Trophy size={14} /> Bookmarked Locations
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {bookmarks.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => navigate(`/map?building=${item.name}`)} 
                        className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-blue-900/30 hover:border-blue-300 transition-all cursor-pointer shadow-sm"
                      >
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                          <MapPin size={16} />
                        </div>
                        <div className="flex-1">
                          <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                          <span className="block text-[10px] text-slate-500">{item.type}</span>
                        </div>
                        <BookmarkToggle 
                          isBookmarked={true} 
                          onToggle={() => toggleBookmark(item)} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 space-y-4">
                  <h3 className="text-3xl font-black leading-tight">Explore the<br/>LNCT Campus</h3>
                  <p className="text-blue-100 text-sm font-medium opacity-80">Discover labs, auditoriums, sports facilities, and more with high-precision navigation.</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button onClick={() => navigate('/map')} className="px-8 py-3 bg-white text-blue-600 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-transform active:scale-95">Open Map</button>
                    <button 
                      onClick={() => setActiveCategory('Sports')}
                      className="px-8 py-3 bg-blue-500/30 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black text-sm hover:bg-blue-500/50 transition-all"
                    >
                      Sports Areas
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchPage;
