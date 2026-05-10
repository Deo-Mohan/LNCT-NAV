import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Layout, Shield, AlertCircle, CheckCircle2, X, Map as MapIcon, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import useCampusStore from '../store/useCampusStore';

const neubrutalistBtnStyles = `
.neubrutalist-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8em 0.8em 0.8em 1.5em;
  background-color: #fbbf24; /* yellow-400 */
  cursor: pointer;
  box-shadow: 6px 6px 0px #000;
  border: 4px solid #000;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  z-index: 10;
  transition: all 250ms;
  width: 100%;
}
.neubrutalist-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 3px 3px 0px #000;
}
.neubrutalist-btn:active {
  filter: saturate(0.75);
}
.neubrutalist-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  background-color: #f472b6; /* pink-400 */
  z-index: -1;
  transform: translateX(-100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.neubrutalist-btn:hover::after {
  transform: translateX(0);
}
.btn-text-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  overflow: hidden;
  height: 2.5em;
  font-size: 1.2em;
  font-weight: 800;
  color: #000;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}
.btn-text-container span {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-text-main {
  transform: translateY(0);
}
.btn-text-hover {
  position: absolute;
  transform: translateY(100%);
}
.neubrutalist-btn:hover .btn-text-main {
  transform: translateY(-100%);
}
.neubrutalist-btn:hover .btn-text-hover {
  transform: translateY(0);
}
.arrow-circle {
  padding: 0.8em;
  border: 3px solid #000;
  border-radius: 50%;
  background-color: #f472b6; /* pink */
  position: relative;
  overflow: hidden;
  transition: all 300ms;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-circle::after {
  content: "";
  position: absolute;
  inset: 0;
  background-color: #fbbf24; /* yellow */
  transform: translateX(-100%);
  z-index: -1;
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.neubrutalist-btn:hover .arrow-circle::after {
  transform: translateX(0);
}
.neubrutalist-btn:hover .arrow-circle {
  transform: translateX(3px) rotate(-45deg);
}
`;

const Admin = () => {
  const { buildings, fetchBuildings } = useCampusStore();
  const [activeTab, setActiveTab] = useState('buildings');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [posterFile, setPosterFile] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [newBuilding, setNewBuilding] = useState({
    name: '',
    category: 'Academic',
    floors: 1,
    rooms: 0,
    coordinates: '',
    center_lat: 23.2140,
    center_lng: 77.4100
  });

  const [newEvent, setNewEvent] = useState({
    title: '',
    venue: '',
    time: '',
    category: 'Hackathon',
    description: '',
    poster_url: '',
    venue_id: '',
    room_details: ''
  });

  useEffect(() => {
    fetchData();
    fetchBuildings();
  }, [activeTab, fetchBuildings]);
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const table = activeTab === 'events' ? 'events' : 'buildings';
      
      // Removed .order('created_at') because custom SQL tables might not have it
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) throw error;

      // Handle custom mapping (type vs category) and Filter out Paths
      const formatted = (data || [])
        .filter(item => {
          const cat = (item.category || item.type || '').toLowerCase();
          return cat !== 'path';
        })
        .map(item => ({
          ...item,
          category: item.category || item.type || 'Academic',
          floors: item.floors || 1,
          rooms: item.rooms || 0
        }));

      setItems(formatted);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const uploadImage = async (file) => {
    // Simplified filename to avoid path issues
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    const { data, error: uploadError } = await supabase.storage
      .from('events')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Storage Upload Error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleRegisterEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let finalPosterUrl = newEvent.poster_url;
      if (posterFile) {
        const compressed = await compressImage(posterFile);
        finalPosterUrl = await uploadImage(compressed);
      }

      if (editingItem) {
        const { error } = await supabase
          .from('events')
          .update({ ...newEvent, poster_url: finalPosterUrl })
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([{ ...newEvent, poster_url: finalPosterUrl }]);
        if (error) throw error;
      }

      handleSuccess();
      setNewEvent({ title: '', venue: '', time: '', category: 'Hackathon', description: '', poster_url: '' });
      setPosterFile(null);
      setEditingItem(null);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterBuilding = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.from('buildings').insert([newBuilding]);
      if (error) throw error;
      handleSuccess();
      setNewBuilding({ name: '', category: 'Academic', floors: 1, rooms: 0, coordinates: '', center_lat: 23.2140, center_lng: 77.4100 });
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccess(true);
    setIsModalOpen(false);
    setEditingItem(null);
    fetchData();
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const startEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'events') {
      setNewEvent({
        title: item.title || '',
        venue: item.venue || '',
        time: item.time || '',
        category: item.category || 'Hackathon',
        description: item.description || '',
        poster_url: item.poster_url || '',
        venue_id: item.venue_id || '',
        room_details: item.room_details || ''
      });
    } else {
      setNewBuilding({
        name: item.name,
        category: item.category,
        floors: item.floors,
        rooms: item.rooms,
        coordinates: item.coordinates,
        center_lat: item.center_lat,
        center_lng: item.center_lng
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const table = activeTab === 'events' ? 'events' : 'buildings';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const stats = [
    { label: 'Buildings', count: activeTab === 'buildings' ? items.length : '...', icon: Layout, color: 'text-blue-600' },
    { label: 'Events', count: activeTab === 'events' ? items.length : '...', icon: MapIcon, color: 'text-purple-600' },
    { label: 'Security', count: 'Active', icon: Shield, color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-6 md:p-10 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-slate-500">Manage LNCT campus data and cloud sync</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
            >
              <Plus size={18} />
              {activeTab === 'events' ? 'Add Event' : 'Add Building'}
            </button>
            <Link to="/" className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">
              <X size={20} />
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 ${stat.color}`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-200 dark:border-slate-800 p-2 gap-1 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto">
            {['buildings', 'events'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                  activeTab === tab ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    <th className="pb-4 px-4">{activeTab === 'events' ? 'Poster' : ''}</th>
                    <th className="pb-4 px-4">{activeTab === 'events' ? 'Event Name' : 'Building Name'}</th>
                    <th className="pb-4 px-4">{activeTab === 'events' ? 'Venue' : 'Type'}</th>
                    <th className="pb-4 px-4">{activeTab === 'events' ? 'Timing' : 'Details'}</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {items.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4">
                        {activeTab === 'events' && (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            {item.poster_url ? (
                              <img src={item.poster_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Layers size={16} className="text-slate-400" />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{activeTab === 'events' ? item.title : item.name}</td>
                      <td className="py-4 px-4 text-sm text-slate-500">{activeTab === 'events' ? item.venue : item.category}</td>
                      <td className="py-4 px-4 text-sm text-slate-500">
                        {activeTab === 'events' ? new Date(item.time).toLocaleDateString() : `${item.floors} Floors`}
                      </td>
                      <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && !isLoading && (
                    <tr><td colSpan="5" className="py-20 text-center text-slate-400">No data found in Supabase.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-white/10">
              <form onSubmit={activeTab === 'events' ? handleRegisterEvent : handleRegisterBuilding} className="p-8 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black">
                    {editingItem ? 'Edit ' : 'Register '}
                    {activeTab === 'events' ? 'Event' : 'Building'}
                  </h2>
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditingItem(null); }}><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="space-y-5">
                  {activeTab === 'events' ? (
                    <>
                      <input type="text" required placeholder="Event Name" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl" />
                      
                      <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-wider">Select Venue (Searchable)</label>
                        <div className="relative">
                          <input 
                            required 
                            placeholder="Type to search building..."
                            value={newEvent.venue}
                            onFocus={() => setShowSearchResults(true)}
                            onChange={e => {
                              const name = e.target.value;
                              const selected = buildings.find(b => b.name === name);
                              setNewEvent({
                                ...newEvent, 
                                venue: name, 
                                venue_id: selected ? selected.id : ''
                              });
                              setShowSearchResults(true);
                            }}
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                          />
                          
                          <AnimatePresence>
                            {showSearchResults && newEvent.venue.length > 0 && !newEvent.venue_id && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto"
                              >
                                {buildings
                                  .filter(b => b.name.toLowerCase().includes(newEvent.venue.toLowerCase()))
                                  .map(b => (
                                    <button
                                      key={b.id}
                                      type="button"
                                      onClick={() => {
                                        setNewEvent({ ...newEvent, venue: b.name, venue_id: b.id });
                                        setShowSearchResults(false);
                                      }}
                                      className="w-full px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                                    >
                                      <p className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</p>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{b.category || 'Building'}</p>
                                    </button>
                                  ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {newEvent.venue_id ? (
                          <div className="flex items-center gap-2 ml-2 mt-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Linked to Map Navigation</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 ml-2 mt-1 italic">Type to find building on map</p>
                        )}
                      </div>

                      <input type="text" placeholder="Specific Room/Hall (Optional)" value={newEvent.room_details} onChange={e => setNewEvent({...newEvent, room_details: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl" />

                      <input type="datetime-local" required value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl" />
                      <div className="relative p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center">
                        <input type="file" onChange={(e) => {
                              const file = e.target.files[0];
                              if (file && file.size > 5 * 1024 * 1024) {
                                alert("File is too large! Maximum size is 5MB.");
                                e.target.value = null;
                                return;
                              }
                              setPosterFile(file);
                            }} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Layers className="mx-auto text-slate-400 mb-2" />
                        <p className="text-sm font-bold text-slate-500">
                          {posterFile ? posterFile.name : (editingItem ? 'Keep Existing Poster' : 'Upload Event Poster')}
                        </p>
                      </div>
                      <textarea placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl" rows="3" />
                    </>
                  ) : (
                    <>
                      <input type="text" required placeholder="Building Name" value={newBuilding.name} onChange={e => setNewBuilding({...newBuilding, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl" />
                      <select value={newBuilding.category} onChange={e => setNewBuilding({...newBuilding, category: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <option>Academic</option><option>Hostel</option><option>Canteen</option><option>Workshop</option>
                      </select>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Floors" value={newBuilding.floors} onChange={e => setNewBuilding({...newBuilding, floors: parseInt(e.target.value)})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl" />
                        <input type="number" placeholder="Rooms" value={newBuilding.rooms} onChange={e => setNewBuilding({...newBuilding, rooms: parseInt(e.target.value)})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl" />
                      </div>
                      <textarea placeholder="Polygon Coordinates [[lat, lng], ...]" value={newBuilding.coordinates} onChange={e => setNewBuilding({...newBuilding, coordinates: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-mono text-xs" rows="4" />
                    </>
                  )}
                  <div className="pt-4">
                    <style>{neubrutalistBtnStyles}</style>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="neubrutalist-btn"
                    >
                      <div className="btn-text-container">
                        <span className="btn-text-main">
                          {editingItem ? `Update ${activeTab.slice(0, -1)}` : `Register ${activeTab.slice(0, -1)}`}
                        </span>
                        <span className="btn-text-hover">
                          Confirm Action?
                        </span>
                      </div>
                      <div className="arrow-circle">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 45 38"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M43.7678 20.7678C44.7441 19.7915 44.7441 18.2085 43.7678 17.2322L27.8579 1.32233C26.8816 0.34602 25.2986 0.34602 24.3223 1.32233C23.346 2.29864 23.346 3.88155 24.3223 4.85786L38.4645 19L24.3223 33.1421C23.346 34.1184 23.346 35.7014 24.3223 36.6777C25.2986 37.654 26.8816 37.654 27.8579 36.6777L43.7678 20.7678ZM0 21.5L42 21.5V16.5L0 16.5L0 21.5Z"
                            fill="black"
                          ></path>
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold z-[110]">
            <CheckCircle2 size={20} /> Success! Data synced to Supabase.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
