import React from 'react';
import { Loader2 } from 'lucide-react';

function LoadingSpinner({ size = 'medium', message = 'Loading...', className = '' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`loading-spinner ${className}`}>
      <Loader2 
        className={`animate-spin ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      {message && (
        <span className="loading-message">{message}</span>
      )}
    </div>
  );
}

export default LoadingSpinner;
