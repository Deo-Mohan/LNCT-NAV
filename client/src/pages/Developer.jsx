import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Globe, Mail, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const developers = [
  {
    name: 'Krishna Mohan',
    initials: 'KM',
    role: 'Lead Developer',
    description: 'Full Stack Developer & AI Enthusiast. Dedicated to crafting seamless digital experiences and intelligent spatial solutions for the LNCT Smart Campus.',
    github: 'https://github.com/Deo-Mohan',
    linkedin: 'https://www.linkedin.com/in/krishna-mohan-kumar',
    email: 'krishnamohan813101@gmail.com',
    portfolio: 'https://krishnamohandeo.netlify.app',
    gradient: 'from-blue-500 to-teal-500'
  },
  {
    name: 'Ramendra Singh',
    initials: 'RS',
    role: 'Backend Architect',
    description: 'Specializing in robust system architecture and scalable cloud solutions to ensure peak performance for the campus navigation ecosystem.',
    github: 'https://github.com/',
    linkedin: 'https://www.linkedin.com/in/ramendra-singh-chauhan-672227279/',
    email: 'ramendrasinghchouhan870@gmail.com',
    portfolio: 'https://portfolio.com',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    name: 'Ravi Singh',
    initials: 'RS',
    role: 'UI/UX Engineer',
    description: 'Focusing on intuitive user journeys and pixel-perfect design systems to make campus navigation as smooth as possible for every student.',
    github: 'https://github.com/ravi5949singh',
    linkedin: 'https://www.linkedin.com/in/ravi-singh-4133a9290',
    email: 'ravi8959singh@gmail.com',
    portfolio: 'https://portfolio.com',
    gradient: 'from-emerald-500 to-cyan-500'
  },
  {
    name: 'Navneet Raj',
    initials: 'NK',
    role: 'Frontend Specialist',
    description: 'Crafting responsive and dynamic user interfaces with a focus on accessibility and modern frontend performance best practices.',
    github: 'https://github.com/',
    linkedin: 'https://linkedin.com/',
    email: 'navneet@example.com',
    portfolio: 'https://portfolio.com',
    gradient: 'from-amber-500 to-orange-500'
  }
];

const Developer = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-20 px-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500 rounded-full blur-[120px]"></div>
      </div>

      <button 
        onClick={() => navigate(-1)}
        className="fixed top-8 left-8 p-3 bg-white dark:bg-slate-900 rounded-full shadow-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-all z-50 border border-slate-100 dark:border-slate-800"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white"
          >
            Core Team
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 font-medium"
          >
            The visionaries behind LNCT Smart Campus Navigator
          </motion.p>
        </div>

        <div className="flex flex-wrap justify-center gap-12 lg:gap-16">
          {developers.map((dev, idx) => (
            <motion.div 
              key={dev.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="dev-card-parent"
            >
              <div className={`dev-card bg-gradient-to-br ${dev.gradient}`}>
                <div className="dev-card-logo">
                  <span className="circle circle1"></span>
                  <span className="circle circle2"></span>
                  <span className="circle circle3"></span>
                  <span className="circle circle4"></span>
                  <span className="circle circle5 flex items-center justify-center">
                    <span className="text-white font-black text-xl tracking-tighter drop-shadow-md">{dev.initials}</span>
                  </span>
                </div>
                <div className="dev-card-glass"></div>
                <div className="dev-card-content relative z-10">
                  <span className="title text-slate-900 dark:text-slate-950 drop-shadow-sm leading-tight">
                    {dev.name}
                  </span>
                  <span className="text">
                    {dev.description}
                  </span>
                </div>
                <div className="dev-card-bottom">
                  <div className="social-buttons-container">
                    <button className="social-button" onClick={() => window.open(dev.github, '_blank')} title="GitHub">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                    </button>
                    <button className="social-button" onClick={() => window.open(`mailto:${dev.email}`)} title="Email">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </button>
                    <button className="social-button" onClick={() => window.open(dev.linkedin, '_blank')} title="LinkedIn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    </button>
                  </div>
                  <div className="view-more">
                    <button className="view-more-button" onClick={() => window.open(dev.portfolio, '_blank')}>Portfolio</button>
                    <ExternalLink className="svg ml-1" size={14} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-20 text-center">
        <p className="text-slate-400 font-medium text-sm tracking-widest uppercase">Development Team</p>
        <p className="text-slate-300 dark:text-slate-800 font-black text-7xl md:text-9xl mt-2 select-none pointer-events-none opacity-50">LNCT NAV</p>
      </div>
    </div>
  );
};

export default Developer;
