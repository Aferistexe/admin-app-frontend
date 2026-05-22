import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sanitizeText } from '../utils/security';
import { SENIOR_RANKS, STATUS_CLASSES } from '../constants/adminConstants';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './SeniorList.css';

function SeniorList() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [seniors, setSeniors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasTeam = useCallback((senior, allAdmins) => {
    if (!senior?.steam?.steam64_id) return false;
    
    return allAdmins.some(member => {
      if (!member?.server?.senior || !member?.steam?.steam64_id) return false;
      return member.server.senior === senior.steam.steam64_id && 
             member.steam.steam64_id !== senior.steam.steam64_id;
    });
  }, []);

  const isSeniorRank = useCallback((senior) => {
    return senior?.server?.rang && SENIOR_RANKS.includes(senior.server.rang);
  }, []);

  const fetchSeniors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/v2/admins/list/4', { headers });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Необходима авторизация');
        }
        if (response.status === 404) {
          throw new Error('API endpoint не найден');
        }
        throw new Error(`Ошибка загрузки данных: ${response.status}`);
      }

      const allAdmins = await response.json();
      
      if (!Array.isArray(allAdmins)) {
        throw new Error('Некорректный формат данных от сервера');
      }

      const seniorsWithTeam = allAdmins.filter(senior => {
        if (!senior?.steam?.steam64_id || !senior?.server?.rang) return false;
        if (!isSeniorRank(senior)) return false;
        return hasTeam(senior, allAdmins);
      });

      const sortedSeniors = seniorsWithTeam.sort((a, b) => {
        const nameA = (a.server?.real_name || '').toLowerCase();
        const nameB = (b.server?.real_name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'ru');
      });

      setSeniors(sortedSeniors);
    } catch (err) {
      console.error('Error fetching seniors:', err.message);
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [token, isSeniorRank, hasTeam]);

  useEffect(() => {
    fetchSeniors();
  }, [fetchSeniors]);

  const handleSeniorClick = useCallback((seniorId) => {
    if (seniorId && typeof seniorId === 'string') {
      navigate(`/team/${encodeURIComponent(seniorId)}`);
    }
  }, [navigate]);

  const handleRetry = useCallback(() => {
    fetchSeniors();
  }, [fetchSeniors]);

  if (loading) {
    return <LoadingSpinner message="Загрузка списка старших..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="senior-list-container">
      <h1 className="page-title">
        Старшие администраторы
        <span className="title-count">({seniors.length})</span>
      </h1>
      
      {seniors.length > 0 ? (
        <div className="seniors-grid">
          {seniors.map((senior) => (
            <div 
              key={senior._id} 
              className="senior-card-clickable"
              onClick={() => handleSeniorClick(senior._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSeniorClick(senior._id);
                }
              }}
            >
              <div className="senior-card-content">
                <div className="senior-avatar">
                  <span className="crown-icon">👑</span>
                </div>
                <div className="senior-details">
                  <h3 className="senior-name-card">
                    {sanitizeText(senior.server?.real_name || 'Без имени')}
                  </h3>
                  <div className="senior-meta">
                    <span className="rank-badge rank-senior-badge">
                      {sanitizeText(senior.server?.rang || '')}
                    </span>
                    {senior.server?.department && (
                      <span className="department-badge">
                        {sanitizeText(senior.server.department)}
                      </span>
                    )}
                  </div>
                  <div className="senior-stats">
                    <div className="stat-item">
                      <span className="stat-label">Статус:</span>
                      <span className={`status-badge-small ${STATUS_CLASSES[senior.server?.status] || 'status-other'}`}>
                        {sanitizeText(senior.server?.status || 'unknown')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data-card">
          <h3>Нет старших с составом</h3>
          <p>В данный момент нет старших администраторов, у которых есть подчиненные</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(SeniorList);