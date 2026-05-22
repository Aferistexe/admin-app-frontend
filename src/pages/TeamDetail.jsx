import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sanitizeText } from '../utils/security';
import { generateStatisticsText } from '../utils/statisticsGenerator';
import { teamService } from '../services/teamService';
import { TEAM_CONSTANTS } from '../constants/teamConstants';
import TeamTable from '../components/team/TeamTable';
import TeamHeader from '../components/team/TeamHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import MemberDetailModal from '../components/team/MemberDetailModal';
import StatsEditorModal from '../components/team/StatsEditorModal';
import './TeamDetail.css';

function TeamDetail() {
  const { seniorId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [senior, setSenior] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showIntermediateModal, setShowIntermediateModal] = useState(false);
  
  const [savedRequirements, setSavedRequirements] = useState({
    weekly: {},
    intermediate: {}
  });

  const isValidSeniorId = useCallback(() => {
    if (!seniorId || typeof seniorId !== 'string') return false;
    const trimmed = seniorId.trim();
    return trimmed.length > 0 && trimmed.length <= 100;
  }, [seniorId]);

  const fetchTeamData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!isValidSeniorId()) {
        throw new Error('Некорректный ID администратора');
      }

      const { senior: fetchedSenior, members } = await teamService.getTeamData(seniorId, token);

      if (!fetchedSenior) {
        throw new Error('Данные администратора не найдены');
      }

      setSenior(fetchedSenior);
      setTeamMembers(members || []);
      
      const savedWeekly = localStorage.getItem(`weekly_requirements_${seniorId}`);
      const savedIntermediate = localStorage.getItem(`intermediate_requirements_${seniorId}`);
      
      if (savedWeekly) {
        setSavedRequirements(prev => ({
          ...prev,
          weekly: JSON.parse(savedWeekly)
        }));
      }
      
      if (savedIntermediate) {
        setSavedRequirements(prev => ({
          ...prev,
          intermediate: JSON.parse(savedIntermediate)
        }));
      }
      
    } catch (err) {
      console.error('Error fetching team data:', err?.message || err);
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [seniorId, token, isValidSeniorId]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleMemberClick = useCallback((member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  }, []);

  const handleCloseMemberModal = useCallback(() => {
    setShowMemberModal(false);
    setSelectedMember(null);
  }, []);

  const handleOpenWeeklyStats = useCallback(() => {
    console.log('Opening weekly modal');
    setShowWeeklyModal(true);
  }, []);

  const handleOpenIntermediateStats = useCallback(() => {
    console.log('Opening intermediate modal');
    setShowIntermediateModal(true);
  }, []);

  const handleCloseWeeklyModal = useCallback(() => {
    setShowWeeklyModal(false);
  }, []);

  const handleCloseIntermediateModal = useCallback(() => {
    setShowIntermediateModal(false);
  }, []);

  const handleCopyFromModal = useCallback((text) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleSaveRequirements = useCallback((type, requirements) => {
    setSavedRequirements(prev => ({
      ...prev,
      [type]: requirements
    }));
    
    localStorage.setItem(`${type}_requirements_${seniorId}`, JSON.stringify(requirements));
  }, [seniorId]);

  const handleRetry = useCallback(() => {
    fetchTeamData(false);
  }, [fetchTeamData]);

  const handleRefresh = useCallback(() => {
    if (!isRefreshing && !loading) {
      fetchTeamData(true);
    }
  }, [fetchTeamData, isRefreshing, loading]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/seniors');
    }
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner message="Загрузка состава..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onRetry={handleRetry}
        onBack={handleBack}
      />
    );
  }

  if (!senior) {
    return (
      <ErrorMessage 
        message="Данные не найдены"
        onRetry={handleRetry}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="team-detail-container">
      <TeamHeader
        seniorName={sanitizeText(senior?.server?.real_name || senior?.name || 'Администратор')}
        teamCount={teamMembers.length}
        onBack={handleBack}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onWeeklyStatsClick={handleOpenWeeklyStats}
        onIntermediateStatsClick={handleOpenIntermediateStats}
      />
      
      {teamMembers.length === 0 ? (
        <div className="empty-state">
          <p>👥 В составе пока нет подчиненных</p>
          <p className="empty-state-hint">Пригласите участников в команду</p>
        </div>
      ) : (
        <TeamTable 
          members={teamMembers}
          emptyMessage="В составе пока нет подчиненных"
          onMemberClick={handleMemberClick}
        />
      )}

      {showMemberModal && selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={handleCloseMemberModal}
        />
      )}

      {showWeeklyModal && (
        <StatsEditorModal
          members={teamMembers}
          type="weekly"
          savedRequirements={savedRequirements.weekly}
          onClose={handleCloseWeeklyModal}
          onCopy={handleCopyFromModal}
          onSave={handleSaveRequirements}
          seniorName={senior?.server?.real_name || senior?.name || 'Администратор'}
          seniorDiscordId={senior?.links?.discord || senior?.discord_id || ''}
        />
      )}

      {showIntermediateModal && (
        <StatsEditorModal
          members={teamMembers}
          type="intermediate"
          savedRequirements={savedRequirements.intermediate}
          onClose={handleCloseIntermediateModal}
          onCopy={handleCopyFromModal}
          onSave={handleSaveRequirements}
          seniorName={senior?.server?.real_name || senior?.name || 'Администратор'}
          seniorDiscordId={senior?.links?.discord || senior?.discord_id || ''}
        />
      )}
    </div>
  );
}

TeamDetail.displayName = 'TeamDetail';

export default React.memo(TeamDetail);