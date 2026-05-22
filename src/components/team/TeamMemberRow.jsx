import React, { useMemo } from 'react';
import { sanitizeText } from '../../utils/security';
import { TEAM_CONSTANTS } from '../../constants/teamConstants';

const TeamMemberRow = React.memo(({ member, onClick }) => {
  const completion = useMemo(() => {
    const required = Number(member.tickets?.required) || 0;
    const tickets7d = Number(member.tickets?.['7d']) || 0;
    
    if (required === 0) return TEAM_CONSTANTS.COMPLETION_CLASSES.none;
    if (tickets7d >= required) return TEAM_CONSTANTS.COMPLETION_CLASSES.done;
    return TEAM_CONSTANTS.COMPLETION_CLASSES.notDone;
  }, [member.tickets]);

  const statusClass = useMemo(() => {
    const status = member.server?.status;
    return TEAM_CONSTANTS.STATUS_CLASSES[status] || 'status-other';
  }, [member.server?.status]);

  const handleClick = () => {
    if (onClick) {
      onClick(member);
    }
  };

  const memberName = sanitizeText(member.server?.real_name || member.name || 'Без имени');

  return (
    <tr 
      className="clickable-row"
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <td className="member-name">
        {memberName}
      </td>
      <td>{sanitizeText(member.server?.rang || 'Участник')}</td>
      <td className="tickets-cell">
        <span className="tickets-current">
          {member.tickets?.['7d'] || 0}
        </span>
        <span className="tickets-separator">/</span>
        <span className="tickets-required">
          {member.tickets?.required || 0}
        </span>
      </td>
      <td>
        <span className={`completion-badge ${completion.class}`}>
          {completion.text}
        </span>
      </td>
      <td>
        <span className={`status-badge ${statusClass}`}>
          {sanitizeText(member.server?.status || 'Не указан')}
        </span>
      </td>
      <td className="mono">
        {sanitizeText(member.steam?.steamid || '-')}
      </td>
      <td className="mono">
        {sanitizeText(member.links?.discord || '-')}
      </td>
      <td className="mono">
        {sanitizeText(member.steam?.steam64_id || '-')}
      </td>
    </tr>
  );
});

TeamMemberRow.displayName = 'TeamMemberRow';
export default TeamMemberRow;