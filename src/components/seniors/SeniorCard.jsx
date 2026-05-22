import React, { useMemo } from 'react';
import { sanitizeText } from '../../utils/security';
import { SENIOR_RANKS, STATUS_CLASSES } from '../../constants/adminConstants';

const SeniorCard = React.memo(({ senior, onClick, onKeyPress }) => {
  const statusClass = useMemo(() => {
    const status = senior.server?.status;
    return STATUS_CLASSES[status] || 'status-other';
  }, [senior.server?.status]);

  const isSeniorRank = useMemo(() => {
    return SENIOR_RANKS.includes(senior.server?.rang);
  }, [senior.server?.rang]);

  const safeName = useMemo(() => {
    return sanitizeText(senior.server?.real_name || 'Без имени');
  }, [senior.server?.real_name]);

  const safeRank = useMemo(() => {
    return sanitizeText(senior.server?.rang || '');
  }, [senior.server?.rang]);

  const safeDepartment = useMemo(() => {
    return sanitizeText(senior.server?.department || 'Не указан');
  }, [senior.server?.department]);

  const safeStatus = useMemo(() => {
    return sanitizeText(senior.server?.status || 'Неизвестно');
  }, [senior.server?.status]);

  return (
    <div 
      className="senior-card-clickable"
      onClick={onClick}
      onKeyPress={onKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`${safeName} - ${safeRank}`}
    >
      <div className="senior-card-content">
        <div className="senior-avatar" aria-hidden="true">
          <span className="crown-icon">👑</span>
        </div>
        
        <div className="senior-details">
          <h3 className="senior-name-card">
            {safeName}
          </h3>
          
          <div className="senior-meta">
            <span className={`rank-badge ${isSeniorRank ? 'rank-senior-badge' : ''}`}>
              {safeRank}
            </span>
            <span className="department-badge">
              {safeDepartment}
            </span>
          </div>
          
          <div className="senior-stats">
            <div className="stat-item">
              <span className="stat-label">Статус:</span>
              <span 
                className={`status-badge-small ${statusClass}`}
                aria-label={`Статус: ${safeStatus}`}
              >
                {safeStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SeniorCard.displayName = 'SeniorCard';

export default SeniorCard;