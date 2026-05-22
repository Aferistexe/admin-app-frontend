import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Загрузка...' }) => {
  return (
    <div 
      className="loading-spinner-container"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="loading-spinner" />
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;