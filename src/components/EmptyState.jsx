import React from 'react';
import './EmptyState.css';

const EmptyState = React.memo(({ 
  title = 'Нет данных', 
  message = '', 
  onAction, 
  actionText = 'Обновить',
  icon = '📭'
}) => {
  return (
    <div className="empty-state-card" role="status">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onAction && (
        <button 
          onClick={onAction} 
          className="empty-state-button"
        >
          {actionText}
        </button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;