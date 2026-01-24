import React from 'react';
import './loadingAnimation.css';

const LoadingAnimation = () => {
  console.log(123);
  
  return (
    <div className="loading-container">
      <div className="loading-text">
        {Array.from('pachamuthu').map((letter, index) => (
          <span 
            key={index} 
            className="loading-letter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="loading-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};

export default LoadingAnimation;