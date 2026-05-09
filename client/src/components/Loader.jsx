import React from 'react';

const Loader = ({ fullPage = true }) => {
  const content = (
    <div className="loader">
      <div className="text"><span>LNCT</span></div>
      <div className="text"><span>LNCT</span></div>
      <div className="text"><span>LNCT</span></div>
      <div className="text"><span>LNCT</span></div>
      <div className="text"><span>LNCT</span></div>
      <div className="text"><span>LNCT</span></div>
      <div className="text"><span>LNCT</span></div>
      <div className="text"><span>LNCT</span></div>
      <div className="text"><span>LNCT</span></div>
      <div className="line"></div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-slate-950">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
