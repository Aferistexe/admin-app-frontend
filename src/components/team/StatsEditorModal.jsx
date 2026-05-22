import React, { useState, useEffect } from 'react';
import { sanitizeText } from '../../utils/security';

function StatsEditorModal({ members, type, onClose, onCopy, onSave, savedRequirements = {}, seniorName = '', seniorDiscordId = '' }) {
  const [requirements, setRequirements] = useState({});

  useEffect(() => {
    const defaults = {};
    members.forEach(member => {
      const discordId = member.links?.discord || member._id;
      if (savedRequirements && savedRequirements[discordId] !== undefined) {
        defaults[discordId] = savedRequirements[discordId];
      } else {
        defaults[discordId] = type === 'weekly' ? 50 : 35;
      }
    });
    setRequirements(defaults);
  }, [members, type, savedRequirements]);

  const handleRequirementChange = (discordId, value) => {
    let newValue = parseInt(value) || 0;
    if (isNaN(newValue)) newValue = 0;
    if (newValue < 0) newValue = 0;
    
    setRequirements(prev => ({
      ...prev,
      [discordId]: newValue
    }));
  };

  const formatDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  const generateStatsText = () => {
    const dateStr = formatDate();
    const typeName = type === 'weekly' ? 'ЕЖЕНЕДЕЛЬНАЯ' : 'ПРОМЕЖУТОЧНАЯ';
    
    // Используем Discord ID для упоминания старшего
    const seniorMention = seniorDiscordId ? `<@${seniorDiscordId}>` : (seniorName || 'Администратор');
    
    let text = `📊 ${typeName} СТАТИСТИКА СОСТАВА\n`;
    text += `📅 Дата: ${dateStr}\n`;
    text += `🛡️ Старший: ${seniorMention}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const sortedMembers = [...members].sort((a, b) => {
      const discordIdA = a.links?.discord || a._id;
      const discordIdB = b.links?.discord || b._id;
      const requiredA = requirements[discordIdA] !== undefined ? requirements[discordIdA] : (type === 'weekly' ? 50 : 35);
      const requiredB = requirements[discordIdB] !== undefined ? requirements[discordIdB] : (type === 'weekly' ? 50 : 35);
      const ticketsA = a.tickets?.['7d'] || 0;
      const ticketsB = b.tickets?.['7d'] || 0;
      const completedA = requiredA === 0 || ticketsA >= requiredA;
      const completedB = requiredB === 0 || ticketsB >= requiredB;
      
      if (completedA === completedB) return 0;
      return completedA ? -1 : 1;
    });
    
    const completedList = [];
    const notCompletedList = [];
    
    sortedMembers.forEach((member) => {
      const name = member.server?.real_name || member.steam?.profile_name || 'Неизвестно';
      const discordId = member.links?.discord || member._id;
      const tickets = member.tickets?.['7d'] || 0;
      const required = requirements[discordId] !== undefined ? requirements[discordId] : (type === 'weekly' ? 50 : 35);
      const isCompleted = required === 0 || tickets >= required;
      const warning = member.server?.warning || 0;
      
      let warningStr = '';
      if (!isCompleted && warning > 0) {
        warningStr = ` +выговор`;
      }
      
      if (isCompleted) {
        completedList.push({ name, discordId, tickets, required });
      } else {
        notCompletedList.push({ name, discordId, tickets, required, warningStr });
      }
    });
    
    text += `ВЫПОЛНИЛИ НОРМУ:\n`;
    if (completedList.length > 0) {
      completedList.forEach(m => {
        text += `> <@${m.discordId}>  ${m.tickets} | ${m.required === 0 ? '∞' : m.required} ✅ \n`;
      });
    } else {
      text += `НЕТ ТАКИХ\n`;
    }
    
    text += `\n`;
    
    text += `ЕЩЕ НЕ ДОДЕЛАЛИ:\n`;
    if (notCompletedList.length > 0) {
      notCompletedList.forEach(m => {
        text += `> <@${m.discordId}>  ${m.tickets} | ${m.required} ❌${m.warningStr}\n`;
      });
    } else {
      text += `НЕТУ ТАКИХ\n`;
    }
    
    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    text += `⚠️ ВНИМАНИЕ\n`;
    text += `У тех, кто не сделал норму, есть время до 00:00 (МСК):\n\n`;
    text += `1️⃣ Доделать норму и отправить ${seniorMention}.\n`;
    text += `2️⃣ Написать мне в ЛС причину, почему норма не выполнена.\n\n`;
    text += `ВАЖНО: Если до 00:00 от вас не будет нормы или причины в ЛС — вы получаете наказание (пред/выговор).`;
    
    return text;
  };

  const handleCopy = () => {
    const text = generateStatsText();
    if (onCopy) {
      onCopy(text);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const typeName = type === 'weekly' ? 'Недельная' : 'Промежуточная';
  const defaultRequirement = type === 'weekly' ? 50 : 35;

  return (
    <div className="admin-modal-overlay" onClick={handleOverlayClick}>
      <div className="admin-modal-content" style={{ maxWidth: '800px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-avatar">
            <span className="modal-avatar-icon">{type === 'weekly' ? '📊' : '📈'}</span>
          </div>
          <h2 className="modal-title">
            {typeName} статистика
          </h2>
          <div className="modal-status-badge status-active">
            Редактирование норм тикетов
          </div>
        </div>

        <div className="modal-body">
          <div className="info-section">
            <h3 className="section-title">
              <span className="section-icon">✏️</span>
              Редактирование нормы тикетов
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.85rem' }}>
              Установите для каждого сотрудника необходимое количество тикетов.<br/>
              По умолчанию: {defaultRequirement} тикетов. (0 = нет нормы)
            </p>
            
            <div className="requirements-list">
              {[...members].sort((a, b) => {
                const nameA = a.server?.real_name || a.steam?.profile_name || '';
                const nameB = b.server?.real_name || b.steam?.profile_name || '';
                return nameA.localeCompare(nameB);
              }).map((member) => {
                const name = member.server?.real_name || member.steam?.profile_name || 'Неизвестно';
                const rank = member.server?.rang || '—';
                const tickets = member.tickets?.['7d'] || 0;
                const discordId = member.links?.discord || member._id;
                const currentRequirement = requirements[discordId] !== undefined ? requirements[discordId] : defaultRequirement;
                const percent = currentRequirement > 0 ? ((tickets / currentRequirement) * 100).toFixed(1) : (tickets > 0 ? 100 : 0);
                const isCompleted = currentRequirement === 0 || tickets >= currentRequirement;
                
                return (
                  <div key={discordId} className="requirement-item">
                    <div className="requirement-info">
                      <div className="requirement-name">
                        <strong>{sanitizeText(name)}</strong>
                        <span className="requirement-rank">{rank}</span>
                      </div>
                      <div className="requirement-stats">
                        <span className="requirement-tickets">🎫 {tickets}</span>
                        <span className={`requirement-status ${isCompleted ? 'completed' : 'not-completed'}`}>
                          {currentRequirement === 0 ? '⭐ Нет нормы' : (isCompleted ? '✅' : '❌')}
                        </span>
                        <span className="requirement-percent">{percent}%</span>
                      </div>
                    </div>
                    <div className="requirement-input">
                      <label>Норма:</label>
                      <input
                        type="number"
                        value={currentRequirement}
                        onChange={(e) => handleRequirementChange(discordId, e.target.value)}
                        min="0"
                        step="1"
                        className="requirement-number"
                      />
                      <span>тикетов</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-copy" onClick={handleCopy}>
            📋 Скопировать статистику
          </button>

          <button className="modal-btn modal-btn-close" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

StatsEditorModal.displayName = 'StatsEditorModal';
export default React.memo(StatsEditorModal);