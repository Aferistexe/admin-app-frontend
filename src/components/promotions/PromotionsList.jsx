import React, { memo, useMemo, useCallback } from 'react';
import { sanitizeText } from '../../utils/security';

const PromotionsList = memo(({ promotions, onDeletePromotion }) => {
  const sortedPromotions = useMemo(() => {
    if (!promotions?.length) return [];
    
    const rankOrder = {
      'Администратор': 4,
      'Оператор': 3,
      'Модератор': 2,
      'Стажёр': 1
    };
    
    return [...promotions].sort((a, b) => {
      return (rankOrder[b.role] || 0) - (rankOrder[a.role] || 0);
    });
  }, [promotions]);

  const formatTimestamp = useCallback((timestamp) => {
    try {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }, []);

  if (!promotions?.length) {
    return (
      <div className="promotions-list">
        <div className="no-promotions">
          <p>Нет записей о повышениях</p>
        </div>
      </div>
    );
  }

  return (
    <div className="promotions-list">
      <div className="promotions-cards-view">
        <h3>📋 Список повышений ({promotions.length})</h3>
        
        <div className="promotions-grid" role="list">
          {sortedPromotions.map(promo => (
            <div 
              key={promo.id} 
              className="promotion-card"
              role="listitem"
            >
              <div className="promotion-text">
                <span className="mention-text">
                  &lt;@{sanitizeText(String(promo.discordId))}&gt;
                </span>
                <span className="arrow">→</span>
                <span className="role-text">
                  @{sanitizeText(promo.role)}
                </span>
              </div>
              
              <div className="promotion-info">
                <span className="username">
                  {sanitizeText(promo.username)}
                </span>
                <span className="old-role">
                  {sanitizeText(promo.oldRole)}
                </span>
                <span className="timestamp">
                  {formatTimestamp(promo.timestamp)}
                </span>
              </div>
              
              <button 
                onClick={() => onDeletePromotion(promo.id)}
                className="btn-delete"
                aria-label={`Удалить повышение для ${sanitizeText(promo.username)}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

PromotionsList.displayName = 'PromotionsList';

export default PromotionsList;