import React, { memo, useCallback } from 'react';
import { sanitizeText } from '../../utils/security';

const PromotionsForm = memo(({
  searchName,
  onSearchChange,
  showDropdown,
  onShowDropdown,
  dropdownRef,
  filteredAdmins,
  selectedUser,
  onSelectUser,
  selectedRole,
  onRoleChange,
  availableRoles,
  onAddPromotion,
  onClearAll,
  promotionsCount,
  onSendToDiscord,
  isSending,
  sendStatus
}) => {
  const handleKeyDown = useCallback((e, admin) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectUser(admin);
    }
  }, [onSelectUser]);

  return (
    <div className="promotion-form">
      <h2>Добавить повышение</h2>
      
      <div className="form-group">
        <label htmlFor="search-input">
          Выберите сотрудника (Стажер, Модератор, Оператор):
        </label>
        <div className="search-container" ref={dropdownRef}>
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder="Введите имя или выберите из списка..."
            value={searchName}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={onShowDropdown}
            onClick={onShowDropdown}
            autoComplete="off"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            role="combobox"
          />
          
          {showDropdown && (
            <div className="dropdown-list" role="listbox">
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map(admin => (
                  <div
                    key={admin._id}
                    className={`dropdown-item ${
                      selectedUser?._id === admin._id ? 'selected' : ''
                    }`}
                    onClick={() => onSelectUser(admin)}
                    onKeyDown={(e) => handleKeyDown(e, admin)}
                    role="option"
                    tabIndex={0}
                    aria-selected={selectedUser?._id === admin._id}
                  >
                    <span className="dropdown-name">
                      {sanitizeText(admin.server.real_name)}
                    </span>
                    <span className="dropdown-rank">
                      {sanitizeText(admin.server.rang)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="dropdown-item no-results">
                  📋 Нет сотрудников с ролями: Стажер, Модератор, Оператор
                </div>
              )}
            </div>
          )}
        </div>
        
        {selectedUser && (
          <div className="selected-user">
            ✅ Выбран: <strong>{sanitizeText(selectedUser.server.real_name)}</strong>
            {' '}(текущая роль: {sanitizeText(selectedUser.server.rang)})
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="role-select">Повысить до роли:</label>
        <select 
          id="role-select"
          value={selectedRole} 
          onChange={(e) => onRoleChange(sanitizeText(e.target.value))}
          disabled={!selectedUser}
        >
          <option value="">Выберите роль</option>
          {availableRoles.map(role => (
            <option key={role} value={role}>
              {sanitizeText(role)}
            </option>
          ))}
        </select>
        
        {selectedUser && availableRoles.length === 0 && (
          <div className="warning-message">
            ⚠️ Нет доступных ролей для повышения
          </div>
        )}
      </div>
      
      <div className="form-buttons">
        <button 
          onClick={onAddPromotion} 
          className="btn-add"
          disabled={!selectedUser || !selectedRole}
          aria-label="Добавить повышение"
        >
          Добавить
        </button>
        
        <button 
          onClick={onClearAll} 
          className="btn-clear"
          disabled={promotionsCount === 0}
          aria-label="Очистить все записи"
        >
          Очистить всё
        </button>
        
        {promotionsCount > 0 && (
          <button 
            onClick={onSendToDiscord} 
            className="btn-send"
            disabled={isSending}
            aria-label="Отправить в Discord"
          >
            {isSending ? '⏳ Отправка...' : '📤 Отправить в Discord'}
          </button>
        )}
      </div>
      
      {sendStatus.message && (
        <div 
          className={`send-status ${sendStatus.type}`}
          role="alert"
          aria-live="polite"
        >
          {sanitizeText(sendStatus.message)}
        </div>
      )}
    </div>
  );
});

PromotionsForm.displayName = 'PromotionsForm';

export default PromotionsForm;