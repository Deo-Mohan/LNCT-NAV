import React from 'react';

const SearchingLoader = () => {
  const letters = "SEARCHING".split("");

  return (
    <div className="loader-wrapper">
      <div className="searching-orb"></div>
      <div className="letter-wrapper">
        {letters.map((letter, index) => (
          <span 
            key={index} 
            className="loader-letter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SearchingLoader;
