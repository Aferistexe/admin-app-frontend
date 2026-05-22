import React from 'react';
import TeamMemberRow from './TeamMemberRow';

const TeamTable = React.memo(({ members, emptyMessage, onMemberClick }) => {
  if (!members?.length) {
    return (
      <div className="empty-state">
        <p>{emptyMessage || 'Нет данных'}</p>
      </div>
    );
  }

  return (
    <div className="team-table-wrapper">
      <table className="team-table" role="table" aria-label="Состав команды">
        <thead>
          <tr>
            <th scope="col">Имя</th>
            <th scope="col">Роль</th>
            <th scope="col">Тикеты</th>
            <th scope="col">Выполнение</th>
            <th scope="col">Статус</th>
            <th scope="col">SteamID</th>
            <th scope="col">Discord ID</th>
            <th scope="col">SteamID64</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <TeamMemberRow 
              key={member._id || member.discord_id || member.steam?.steamid} 
              member={member}
              onClick={onMemberClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

TeamTable.displayName = 'TeamTable';
export default TeamTable;