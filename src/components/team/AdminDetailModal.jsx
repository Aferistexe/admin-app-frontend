import React from 'react';
import { sanitizeText } from '../../utils/security';

function AdminDetailModal({ senior, onClose, onRefresh }) {
  if (!senior) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '🟢';
      case 'vacation': return '🏖️';
      case 'frozen': return '❄️';
      default: return '⚪';
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'vacation': return 'status-vacation';
      case 'frozen': return 'status-frozen';
      default: return 'status-other';
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={handleOverlayClick}>
      <div className="admin-modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-avatar">
            <span className="modal-avatar-icon">👑</span>
          </div>
          <h2 className="modal-title">
            {sanitizeText(senior?.server?.real_name || senior?.name || 'Администратор')}
          </h2>
          <div className={`modal-status-badge ${getStatusClass(senior?.status)}`}>
            {getStatusIcon(senior?.status)} {senior?.status || 'Не указан'}
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
                <span className="info-label">Discord ID:</span>
                <code className="info-value mono">{senior?.discord_id || 'Не указан'}</code>
              </div>
              <div className="info-item">
                <span className="info-label">Ранг:</span>
                <span className="info-value">
                  <span className="rank-badge rank-senior-badge">
                    {senior?.rank || 'Senior'}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Отдел:</span>
                <span className="info-value">
                  <span className="department-badge">
                    {senior?.department || 'Не указан'}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Дата регистрации:</span>
                <span className="info-value">{formatDate(senior?.created_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Последний вход:</span>
                <span className="info-value">{formatDate(senior?.last_login)}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3 className="section-title">
              <span className="section-icon">📊</span>
              Статистика
            </h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{senior?.total_tickets || 0}</div>
                <div className="stat-label">Всего тикетов</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{senior?.completed_tickets || 0}</div>
                <div className="stat-label">Выполнено</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{senior?.team_count || 0}</div>
                <div className="stat-label">В команде</div>
              </div>
            </div>
          </div>
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

AdminDetailModal.displayName = 'AdminDetailModal';
export default React.memo(AdminDetailModal);