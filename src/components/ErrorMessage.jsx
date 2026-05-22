import React from 'react';
import PropTypes from 'prop-types';
import './ErrorMessage.css';

const ErrorMessage = ({ 
  message = 'Произошла ошибка', 
  onRetry, 
  onBack,
  variant = 'error'
}) => {
  const variantStyles = {
    error: {
      backgroundColor: '#fff3f3',
      borderColor: '#ff4444',
      color: '#cc0000',
    },
    warning: {
      backgroundColor: '#fff8e1',
      borderColor: '#ffa000',
      color: '#cc7a00',
    },
    info: {
      backgroundColor: '#e3f2fd',
      borderColor: '#2196f3',
      color: '#0059b3',
    },
  };

  const currentStyle = variantStyles[variant] || variantStyles.error;
  const icons = {
    error: '⚠️',
    warning: '⚡',
    info: 'ℹ️'
  };

  return (
    <div 
      className="error-container"
      role="alert"
      aria-live="assertive"
    >
      <div 
        className="error-message-card"
        style={{
          ...currentStyle,
          border: `1px solid ${currentStyle.borderColor}`
        }}
      >
        <div className="error-icon">
          {icons[variant]}
        </div>
        
        <p className="error-message-text" style={{ color: currentStyle.color }}>
          {message}
        </p>
        
        <div className="error-buttons">
          {onRetry && (
            <button 
              onClick={onRetry} 
              className="retry-button"
            >
              Попробовать снова
            </button>
          )}
          
          {onBack && (
            <button 
              onClick={onBack} 
              className="back-button"
            >
              ← Вернуться
            </button>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>Техническая информация</summary>
            <pre className="error-details-pre">
              {message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
  onBack: PropTypes.func,
  variant: PropTypes.oneOf(['error', 'warning', 'info']),
};

export default React.memo(ErrorMessage);