import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { promotionService } from '../services/promotionService';
import { discordService } from '../services/discordService';
import { sanitizeText, validateDiscordId } from '../utils/security';
import { 
  RANK_HIERARCHY, 
  AVAILABLE_RANKS,
  PROMOTION_CONSTANTS 
} from '../constants/promotionConstants';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './Promotions.css';

function Promotions() {
  const { token, username, logout, isAuthenticated } = useAuth();
  
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendStatus, setSendStatus] = useState({ type: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('discord');
  const [copied, setCopied] = useState(false);
  
  const dropdownRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        if (isAuthenticated) {
          logout();
        }
        return;
      }

      const data = await adminService.getAdminsForPromotion(token);
      
      if (!Array.isArray(data)) {
        throw new Error('Некорректный формат данных');
      }
      
      setAdmins(data);
      setFilteredAdmins(data);
      
    } catch (err) {
      console.error('Error fetching admins:', err.message);
      
      if (err.response?.status === 401) {
        logout();
        setError('Сессия истекла, пожалуйста, войдите заново');
        return;
      }
      
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [token, logout, isAuthenticated]);

  const loadPromotions = useCallback(() => {
    try {
      const savedPromotions = promotionService.loadPromotions();
      setPromotions(Array.isArray(savedPromotions) ? savedPromotions : []);
    } catch (err) {
      console.error('Error loading promotions:', err.message);
      setPromotions([]);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
    loadPromotions();
  }, [fetchAdmins, loadPromotions]);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (!searchName?.trim()) {
        setFilteredAdmins(admins);
      } else {
        const searchTerm = searchName.toLowerCase().trim();
        const filtered = admins.filter(admin => 
          admin.server?.real_name?.toLowerCase().includes(searchTerm)
        );
        setFilteredAdmins(filtered.slice(0, PROMOTION_CONSTANTS.MAX_SEARCH_RESULTS || 50));
      }
    }, PROMOTION_CONSTANTS.SEARCH_DEBOUNCE_DELAY || 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchName, admins]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showStatus = useCallback((type, message) => {
    setSendStatus({ type, message });
    
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    
    statusTimeoutRef.current = setTimeout(() => {
      setSendStatus({ type: '', message: '' });
    }, PROMOTION_CONSTANTS.STATUS_DURATION || 3000);
  }, []);

  const canPromote = useCallback((user, targetRole) => {
    if (!user?.server?.rang) return false;
    
    const currentLevel = RANK_HIERARCHY[user.server.rang] || 0;
    const newLevel = RANK_HIERARCHY[targetRole] || 0;
    
    return newLevel > currentLevel;
  }, []);

  const handleSelectUser = useCallback((admin) => {
    if (!admin?._id || !admin?.server?.real_name) return;
    
    setSelectedUser(admin);
    setSearchName(admin.server.real_name);
    setSelectedRole('');
    setShowDropdown(false);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchName(value);
    setSelectedUser(null);
    setSelectedRole('');
    setShowDropdown(true);
  }, []);

  const handleAddPromotion = useCallback(() => {
    try {
      if (!selectedUser || !selectedUser._id) {
        showStatus('error', 'Пожалуйста, выберите сотрудника из списка');
        return;
      }
      
      if (!selectedRole) {
        showStatus('error', 'Пожалуйста, выберите роль');
        return;
      }

      if (!canPromote(selectedUser, selectedRole)) {
        const currentRank = selectedUser.server.rang;
        showStatus('error', `Нельзя повысить с роли "${currentRank}" до "${selectedRole}"`);
        return;
      }

      const discordId = String(selectedUser.links?.discord || '').replace(/[^0-9]/g, '');
      
      if (!validateDiscordId(discordId)) {
        showStatus('error', 'Некорректный Discord ID пользователя');
        return;
      }

      const existingPromotion = promotions.find(p => p.discordId === discordId);
      if (existingPromotion) {
        showStatus('error', 'Этот пользователь уже был повышен!');
        return;
      }

      const newPromotion = {
        id: Date.now().toString(),
        discordId,
        username: sanitizeText(selectedUser.server.real_name),
        oldRole: sanitizeText(selectedUser.server.rang),
        role: sanitizeText(selectedRole),
        timestamp: new Date().toISOString()
      };

      const updatedPromotions = [newPromotion, ...promotions];
      
      if (promotionService.savePromotions(updatedPromotions)) {
        setPromotions(updatedPromotions);
        setSelectedUser(null);
        setSelectedRole('');
        setSearchName('');
        showStatus('success', `✅ Повышение для ${newPromotion.username} добавлено`);
      } else {
        showStatus('error', 'Ошибка при сохранении повышения');
      }
    } catch (err) {
      console.error('Error adding promotion:', err);
      showStatus('error', 'Ошибка при добавлении повышения');
    }
  }, [selectedUser, selectedRole, promotions, showStatus, canPromote]);

  const handleDeletePromotion = useCallback((id, username) => {
    if (window.confirm(`Удалить повышение для ${username}?`)) {
      try {
        const updatedPromotions = promotions.filter(p => p.id !== id);
        if (promotionService.savePromotions(updatedPromotions)) {
          setPromotions(updatedPromotions);
          showStatus('success', `✅ Повышение для ${username} удалено`);
        }
      } catch (err) {
        console.error('Error deleting promotion:', err);
        showStatus('error', 'Ошибка при удалении');
      }
    }
  }, [promotions, showStatus]);

  const handleClearAll = useCallback(() => {
    if (promotions.length === 0) return;
    
    if (window.confirm(`Вы уверены, что хотите очистить все ${promotions.length} записей о повышениях?`)) {
      if (promotionService.clearPromotions()) {
        setPromotions([]);
        showStatus('success', '✅ Все записи очищены');
      }
    }
  }, [promotions, showStatus]);

  const handleSendToDiscord = useCallback(async () => {
    if (promotions.length === 0) {
      showStatus('error', 'Нет повышений для отправки');
      return;
    }

    setIsSending(true);
    
    try {
      const message = discordService.generatePromotionMessage(promotions, username);
      
      if (!message || message === 'Нет данных для Discord') {
        showStatus('error', 'Не удалось сгенерировать сообщение');
        return;
      }
      
      const success = await discordService.sendMessage(message, username);
      
      if (success) {
        showStatus('success', `✅ Отправлено в Discord! (${promotions.length} повышений)`);
      } else {
        showStatus('error', '❌ Ошибка отправки в Discord');
      }
    } catch (err) {
      console.error('Discord send error:', err.message);
      showStatus('error', '❌ Ошибка отправки в Discord');
    } finally {
      setIsSending(false);
    }
  }, [promotions, username, showStatus]);

  const handleCopy = useCallback(async (text, type = 'discord') => {
    try {
      if (!text || text === 'Нет данных для Discord' || text === 'Нет команд для отображения') {
        showStatus('error', 'Нечего копировать');
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('Fallback copy failed');
        }
      }
      
      setCopied(true);
      showStatus('success', `✅ ${type === 'discord' ? 'Сообщение' : 'Команды'} скопированы`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      showStatus('error', 'Ошибка при копировании');
    }
  }, [showStatus]);

  const availableRoles = useMemo(() => {
    if (!selectedUser) return AVAILABLE_RANKS;
    return promotionService.getAvailableRoles(selectedUser.server.rang);
  }, [selectedUser]);

  const discordMessage = useMemo(() => {
    if (promotions.length === 0) return '';
    return discordService.generatePromotionMessage(promotions, username);
  }, [promotions, username]);

  const fullText = useMemo(() => {
    if (promotions.length === 0) return '';
    return discordService.generateFullText(promotions);
  }, [promotions]);

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

  if (loading) {
    return <LoadingSpinner message="Загрузка данных..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onRetry={fetchAdmins}
        onBack={() => window.history.back()}
      />
    );
  }

  return (
    <div className="promotions-container">
      <h1 className="page-title">🎖️ Повышения</h1>
      
      <div className="promotion-form">
        <h2>➕ Добавить повышение</h2>
        
        <div className="form-group">
          <label>👤 Выберите сотрудника (Стажер, Модератор, Оператор):</label>
          <div className="search-container" ref={dropdownRef}>
            <input
              type="text"
              className="search-input"
              placeholder="Введите имя или выберите из списка..."
              value={searchName}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onClick={() => setShowDropdown(true)}
              autoComplete="off"
            />
            {showDropdown && (
              <div className="dropdown-list">
                {filteredAdmins.length > 0 ? (
                  filteredAdmins.map(admin => (
                    <div
                      key={admin._id}
                      className={`dropdown-item ${selectedUser?._id === admin._id ? 'selected' : ''}`}
                      onClick={() => handleSelectUser(admin)}
                      role="option"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSelectUser(admin);
                      }}
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
              (текущая роль: <span className="current-rank">{sanitizeText(selectedUser.server.rang)}</span>)
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>⬆️ Повысить до роли:</label>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={!selectedUser}
          >
            <option value="">Выберите роль</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{sanitizeText(role)}</option>
            ))}
          </select>
          {selectedUser && availableRoles.length === 0 && (
            <div className="warning-message">
              ⚠️ Нет доступных ролей для повышения (пользователь уже имеет максимальную роль)
            </div>
          )}
        </div>
        
        <div className="form-buttons">
          <button 
            onClick={handleAddPromotion} 
            className="btn-add"
            disabled={!selectedUser || !selectedRole}
          >
            ➕ Добавить
          </button>
          <button 
            onClick={handleClearAll} 
            className="btn-clear"
            disabled={promotions.length === 0}
          >
            🗑️ Очистить всё
          </button>
          {promotions.length > 0 && (
            <button 
              onClick={handleSendToDiscord} 
              className="btn-send"
              disabled={isSending}
            >
              {isSending ? '⏳ Отправка...' : '📤 Отправить в Discord'}
            </button>
          )}
        </div>
        
        {sendStatus.message && (
          <div className={`send-status ${sendStatus.type}`}>
            {sendStatus.message}
          </div>
        )}
      </div>
      
      {promotions.length > 0 && (
        <div className="promotions-preview">
          <div className="preview-tabs">
            <button
              className={`tab-btn ${activeTab === 'discord' ? 'active' : ''}`}
              onClick={() => setActiveTab('discord')}
            >
              📋 Discord сообщение
            </button>
            <button
              className={`tab-btn ${activeTab === 'commands' ? 'active' : ''}`}
              onClick={() => setActiveTab('commands')}
            >
              📝 Команды для Discord
            </button>
          </div>
          
          <div className="preview-content">
            <div className="preview-header">
              <h3>
                {activeTab === 'discord' 
                  ? '📋 Предпросмотр (будет отправлено в Discord):' 
                  : '📝 Команды для Discord (для ручного выполнения):'
                }
              </h3>
            </div>
            
            <pre className={`promotions-text ${activeTab === 'discord' ? 'preview-discord' : 'preview-commands'}`}>
              {activeTab === 'discord' ? discordMessage : fullText}
            </pre>
          </div>
        </div>
      )}
      
      {promotions.length > 0 && (
        <div className="promotions-list">
          <div className="promotions-cards-view">
            <h3>📋 Список повышений ({promotions.length})</h3>
            
            <div className="promotions-grid">
              {sortedPromotions.map(promo => (
                <div key={promo.id} className="promotion-card">
                  <div className="promotion-text">
                    <span className="mention-text">
                      &lt;@{promo.discordId}&gt;
                    </span>
                    <span className="arrow">→</span>
                    <span className="role-text">
                      @{sanitizeText(promo.role)}
                    </span>
                  </div>
                  
                  <div className="promotion-info">
                    <span className="username">
                      👤 {sanitizeText(promo.username)}
                    </span>
                    <span className="old-role">
                      📈 {sanitizeText(promo.oldRole)}
                    </span>
                    <span className="timestamp">
                      🕐 {formatTimestamp(promo.timestamp)}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => handleDeletePromotion(promo.id, promo.username)}
                    className="btn-delete"
                    aria-label="Удалить"
                  >
                    ✕ Удалить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {promotions.length === 0 && !loading && (
        <div className="no-promotions">
          <p>📭 Нет записей о повышениях</p>
          <p className="no-promotions-hint">Добавьте первое повышение, выбрав сотрудника из списка выше</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(Promotions);