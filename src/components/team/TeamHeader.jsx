import React from 'react';
import { sanitizeText } from '../../utils/security';

const TeamHeader = React.memo(({ 
  seniorName, 
  teamCount, 
  onBack,
  onAdminClick,
  onWeeklyStatsClick,
  onIntermediateStatsClick,
  onRefresh,
  isRefreshing
}) => {
  return (
    <div className="team-header">
      <button 
        onClick={onBack} 
        className="back-button"
        aria-label="Вернуться к списку"
      >
        ← Назад к списку
      </button>
      
      <div className="senior-info-header">
        <h1 
          className="senior-title"
          onClick={onAdminClick}
          style={{ cursor: onAdminClick ? 'pointer' : 'default' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (onAdminClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onAdminClick();
            }
          }}
        >
          👑 {sanitizeText(seniorName)}
        </h1>
        
        <div className="header-actions">
          <p className="team-count-info">
            Состав: {teamCount} человек
          </p>
          <button 
            onClick={onWeeklyStatsClick} 
            className="weekly-stats-btn"
            disabled={teamCount === 0}
            aria-label="Недельная статистика"
          >
            📊 Недельная
          </button>
          <button 
            onClick={onIntermediateStatsClick} 
            className="intermediate-stats-btn"
            disabled={teamCount === 0}
            aria-label="Промежуточная статистика"
          >
            📈 Промежуточная
          </button>
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
              disabled={isRefreshing}
              aria-label="Обновить"
            >
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

TeamHeader.displayName = 'TeamHeader';
export default TeamHeader;