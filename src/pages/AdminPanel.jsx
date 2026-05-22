import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AdminPanel.css';

const API_URL = 'http://localhost:5000/api';

function AdminPanel() {
  const { token, user, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Форма нового пользователя
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user'
  });

  // Загрузка списка пользователей
  useEffect(() => {
    if (hasPermission('admin')) {
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUser.username || !newUser.password) {
      setError('❌ Логин и пароль обязательны');
      return;
    }

    if (newUser.password.length < 4) {
      setError('❌ Пароль должен быть минимум 4 символа');
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/register`, {
        username: newUser.username,
        password: newUser.password,
        name: newUser.name || newUser.username,
        email: `${newUser.username}@local.com`,
        role: newUser.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`✅ Пользователь "${newUser.username}" создан!`);
      setNewUser({ username: '', password: '', name: '', role: 'user' });
      fetchUsers(); // Обновить список
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания пользователя');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Удалить пользователя "${username}"?`)) return;

    try {
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`✅ Пользователь "${username}" удалён`);
      fetchUsers();
    } catch (err) {
      setError('Ошибка удаления');
    }
  };

  const handleResetPassword = async (userId, username) => {
    const newPassword = prompt(`Введите новый пароль для ${username}:`);
    if (!newPassword || newPassword.length < 4) {
      alert('Пароль должен быть минимум 4 символа');
      return;
    }

    try {
      await axios.put(`${API_URL}/users/${userId}/password`, {
        password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`✅ Пароль для "${username}" изменён`);
    } catch (err) {
      setError('Ошибка смены пароля');
    }
  };

  // Проверка прав доступа
  if (!hasPermission('admin')) {
    return (
      <div className="admin-panel-container">
        <div className="error-message">
          ⚠️ Доступ запрещён. Только для администраторов.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <h1 className="page-title">👑 Панель управления</h1>
      
      {/* Форма создания пользователя */}
      <div className="admin-card">
        <h2>➕ Создать нового пользователя</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleCreateUser} className="create-user-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="👤 Логин *"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="🔒 Пароль *"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              required
            />
          </div>
          
          <div className="form-row">

            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            >
              <option value="user">👤 Пользователь</option>
              <option value="admin">👑 Администратор</option>
            </select>
          </div>
          
          <button type="submit" className="btn-create">
            🚀 Создать пользователя
          </button>
        </form>
      </div>
      
      {/* Список пользователей */}
      <div className="admin-card">
        <h2>📋 Список пользователей</h2>
        
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">Нет пользователей</div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Логин</th>
                  <th>Имя</th>
                  <th>Роль</th>
                  <th>Создан</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.name || '-'}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role === 'admin' ? '👑 Админ' : u.role === 'moderator' ? '⚙️ Модер' : '👤 Юзер'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => handleResetPassword(u.id, u.username)}
                        className="btn-icon btn-edit"
                        title="Сменить пароль"
                      >
                        🔑
                      </button>
                      {u.username !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="btn-icon btn-delete"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;