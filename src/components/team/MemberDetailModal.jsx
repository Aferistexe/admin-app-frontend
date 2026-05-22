import React, { useRef, useEffect } from 'react';
import { sanitizeText } from '../../utils/security';

function MemberDetailModal({ member, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!member) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'активен': return '🟢 Активен';
      case 'в отпуске': return '🏖️ В отпуске';
      case 'мороз': return '❄️ Мороз';
      default: return '⚪ ' + (status || 'Не указан');
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'активен': return 'status-active';
      case 'в отпуске': return 'status-vacation';
      case 'мороз': return 'status-frozen';
      default: return 'status-other';
    }
  };

  const currentTickets = member.tickets?.['7d'] || 0;
  const requiredTickets = member.tickets?.required || 0;
  const percent = requiredTickets > 0 ? (currentTickets / requiredTickets * 100).toFixed(1) : 0;

  const memberName = sanitizeText(member.server?.real_name || member.steam?.profile_name || 'Участник');

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={handleOverlayClick}>
      <div className="admin-modal-content" style={{ maxWidth: '450px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-avatar">
            <span className="modal-avatar-icon">👤</span>
          </div>
          <h2 className="modal-title">{memberName}</h2>
          <div className={`modal-status-badge ${getStatusClass(member.server?.status)}`}>
            {getStatusText(member.server?.status)}
          </div>
        </div>

        <div className="modal-body">
          <div className="info-section">
            <h3 className="section-title">
              <span className="section-icon">📋</span>
              Личная информация
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Ранг:</span>
                <span className="info-value">{member.server?.rang || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Отдел:</span>
                <span className="info-value">{member.server?.department || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Статус:</span>
                <span className="info-value">{member.server?.status || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Отпуск:</span>
                <span className="info-value">{member.server?.vacation || 'Нет'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Discord ID:</span>
                <code className="info-value mono small">{member.links?.discord || '—'}</code>
              </div>
              <div className="info-item">
                <span className="info-label">Дата вступления:</span>
                <span className="info-value">{formatDate(member.server?.join_date)}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3 className="section-title">
              <span className="section-icon">🎮</span>
              Steam
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Steam ID:</span>
                <code className="info-value mono small">{member.steam?.steamid || '—'}</code>
              </div>
              <div className="info-item">
                <span className="info-label">Steam ID64:</span>
                <code className="info-value mono small">{member.steam?.steam64_id || '—'}</code>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3 className="section-title">
              <span className="section-icon">🎫</span>
              Тикеты
            </h3>
            <div className="stats-grid-compact">
              <div className="stat-card-compact">
                <div className="stat-value-compact">{currentTickets}</div>
                <div className="stat-label-compact">За 7 дней</div>
              </div>
              <div className="stat-card-compact">
                <div className="stat-value-compact">{member.tickets?.['30d'] || 0}</div>
                <div className="stat-label-compact">За 30 дней</div>
              </div>
              <div className="stat-card-compact">
                <div className="stat-value-compact">{requiredTickets}</div>
                <div className="stat-label-compact">Норма</div>
              </div>
            </div>
            
            {requiredTickets > 0 && (
              <div className="progress-section">
                <div className="progress-label">
                  <span>Выполнение</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{percent}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {member.links?.forum && member.links.forum !== '-' && (
            <div className="info-section">
              <h3 className="section-title">
                <span className="section-icon">🔗</span>
              </h3>
              <div className="info-item">
                <span className="info-label">Форум:</span>
                <a href={member.links.forum} target="_blank" rel="noopener noreferrer" className="info-value link">
                  Перейти
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-close" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

MemberDetailModal.displayName = 'MemberDetailModal';
export default React.memo(MemberDetailModal);