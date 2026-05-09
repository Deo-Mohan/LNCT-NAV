import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Layout, Database, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('buildings');
  const [showSuccess, setShowSuccess] = useState(false);

  const stats = [
    { label: 'Buildings', count: 12, icon: Layout, color: 'text-blue-600' },
    { label: 'Rooms', count: 245, icon: Database, color: 'text-purple-600' },
    { label: 'Total Visits', count: '1.2k', icon: Shield, color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-slate-500">Manage LNCT campus data and indoor maps</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
              <Plus size={18} />
              Add Building
            </button>
          </div>
        </header>

        {/* Stats Grid */}
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

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-200 dark:border-slate-800 p-2 gap-1 bg-slate-50 dark:bg-slate-900/50">
            {['buildings', 'rooms', 'floor-maps', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all",
                  activeTab === tab 
                    ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    <th className="pb-4 px-4 font-black">Building Name</th>
                    <th className="pb-4 px-4 font-black">Floors</th>
                    <th className="pb-4 px-4 font-black">Rooms</th>
                    <th className="pb-4 px-4 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {[
                    { name: 'CSE Block', floors: 3, rooms: 42 },
                    { name: 'Main Block', floors: 4, rooms: 68 },
                    { name: 'Mechanical Block', floors: 2, rooms: 24 },
                    { name: 'Library', floors: 2, rooms: 12 },
                  ].map((row, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-500">{row.floors} Floors</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-500">{row.rooms} Rooms</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <Edit2 size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="flex items-start gap-4 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100">Indoor SVG Map System</h4>
            <p className="text-sm text-blue-800/70 dark:text-blue-300/70 mt-1">
              For indoor navigation to work correctly, ensure SVG floor maps have unique IDs for each room element (e.g., id="room-ai-lab"). These IDs must match the records in the Rooms database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const clsx = (...classes) => classes.filter(Boolean).join(' ');

export default Admin;
