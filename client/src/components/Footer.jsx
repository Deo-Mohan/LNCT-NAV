import React from 'react';
import { Link } from 'react-router-dom';
import appLogo from '../assets/lnct app logo.png';

const Footer = () => {
  return (
    <footer className="w-full py-12 px-6 mt-12 transition-all duration-500 bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Section: Earth Loader & App Name */}
        <div className="flex items-center gap-4 group">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="flex-shrink-0 scale-75 sm:scale-90 relative z-10">
              <div className="earth-loader shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                  <path transform="translate(100 100)" d="M29.4,-17.4C33.1,1.8,27.6,16.1,11.5,31.6C-4.7,47,-31.5,63.6,-43,56C-54.5,48.4,-50.7,16.6,-41,-10.9C-31.3,-38.4,-15.6,-61.5,-1.4,-61C12.8,-60.5,25.7,-36.5,29.4,-17.4Z" fill="#7CC133" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                  <path transform="translate(100 100)" d="M31.7,-55.8C40.3,-50,45.9,-39.9,49.7,-29.8C53.5,-19.8,55.5,-9.9,53.1,-1.4C50.6,7.1,43.6,14.1,41.8,27.6C40.1,41.1,43.4,61.1,37.3,67C31.2,72.9,15.6,64.8,1.5,62.2C-12.5,59.5,-25,62.3,-31.8,56.7C-38.5,51.1,-39.4,37.2,-49.3,26.3C-59.1,15.5,-78,7.7,-77.6,0.2C-77.2,-7.2,-57.4,-14.5,-49.3,-28.4C-41.2,-42.4,-44.7,-63,-38.5,-70.1C-32.2,-77.2,-16.1,-70.8,-2.3,-66.9C11.6,-63,23.1,-61.5,31.7,-55.8Z" fill="#7CC133" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                  <path transform="translate(100 100)" d="M30.6,-49.2C42.5,-46.1,57.1,-43.7,67.6,-35.7C78.1,-27.6,84.6,-13.8,80.3,-2.4C76.1,8.9,61.2,17.8,52.5,29.1C43.8,40.3,41.4,53.9,33.7,64C26,74.1,13,80.6,2.2,76.9C-8.6,73.1,-17.3,59,-30.6,52.1C-43.9,45.3,-61.9,45.7,-74.1,38.2C-86.4,30.7,-92.9,15.4,-88.6,2.5C-84.4,-10.5,-69.4,-20.9,-60.7,-34.6C-52.1,-48.3,-49.8,-65.3,-40.7,-70C-31.6,-74.8,-15.8,-67.4,-3.2,-61.8C9.3,-56.1,18.6,-52.3,30.6,-49.2Z" fill="#7CC133" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                  <path transform="translate(100 100)" d="M39.4,-66C48.6,-62.9,51.9,-47.4,52.9,-34.3C53.8,-21.3,52.4,-10.6,54.4,1.1C56.3,12.9,61.7,25.8,57.5,33.2C53.2,40.5,39.3,42.3,28.2,46C17,49.6,8.5,55.1,1.3,52.8C-5.9,50.5,-11.7,40.5,-23.6,37.2C-35.4,34,-53.3,37.5,-62,32.4C-70.7,27.4,-70.4,13.7,-72.4,-1.1C-74.3,-15.9,-78.6,-31.9,-73.3,-43C-68.1,-54.2,-53.3,-60.5,-39.5,-60.9C-25.7,-61.4,-12.9,-56,1.1,-58C15.1,-59.9,30.2,-69.2,39.4,-66Z" fill="#7CC133" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-black tracking-tighter text-slate-800 dark:text-slate-100 uppercase leading-none">
              Smart Campus <span className="text-blue-600">Navigator</span>
            </h3>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mt-1">
              LNCT Bhopal Guide
            </p>
          </div>
        </div>

        {/* Right Section: Branding & Credits */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right gap-3">
          <div className="flex items-center gap-3 bg-white/50 dark:bg-white/5 p-2 px-3 rounded-xl border border-white/20 dark:border-white/10 shadow-sm backdrop-blur-sm">
            <img src={appLogo} alt="LNCT Logo" className="h-8 w-auto object-contain" />
            <div className="text-left border-l border-slate-200 dark:border-slate-700 pl-3">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Powered by</p>
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 leading-tight">LNCT Group</p>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              © 2026 • Handcrafted for LNCT
            </p>
            <div className="flex items-center justify-center md:justify-end gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="opacity-60">by</span>
              <Link to="/developer" className="text-blue-600 dark:text-blue-400 hover:underline decoration-2 underline-offset-2">Krishna Mohan</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-8 pt-6 border-t border-slate-200/30 dark:border-slate-800/30 flex justify-center">
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Support'].map((item) => (
            <span key={item} className="text-[9px] font-bold text-slate-400 hover:text-blue-500 cursor-pointer transition-colors uppercase tracking-widest">
              {item}
            </span>
          ))}
          <Link to="/developer" className="text-[9px] font-bold text-slate-400 hover:text-blue-500 cursor-pointer transition-colors uppercase tracking-widest">
            Developer
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
