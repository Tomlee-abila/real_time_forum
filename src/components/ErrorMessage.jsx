import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

function ErrorMessage({ 
  message = 'Something went wrong', 
  onRetry = null,
  className = '' 
}) {
  return (
    <div className={`error-message ${className}`}>
      <div className="error-content">
        <AlertCircle className="error-icon" size={24} />
        <p className="error-text">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="retry-button"
            type="button"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
