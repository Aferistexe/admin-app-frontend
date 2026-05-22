import axios from 'axios';
import { sanitizeText, validateDiscordId, validateSteamId64 } from '../utils/security';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const TOKEN_STORAGE_KEY = process.env.REACT_APP_AUTH_STORAGE_KEY || 'auth_token';

class TeamService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 секунд таймаут
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor для автоматической подстановки токена
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor для обработки ошибок: не делаем навигацию здесь
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Удаляем локальный токен и пробрасываем ошибку, UI обработает редирект
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        return Promise.reject(error);
      }
    );
  }

  async getTeamData(seniorId, token) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await this.client.get('/v2/admins/list/4', { headers });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Некорректный формат данных от сервера');
      }

      const allAdmins = response.data;
      
      // Поиск старшего администратора
      const seniorAdmin = allAdmins.find(admin => admin._id === seniorId);
      
      if (!seniorAdmin) {
        throw new Error('Старший администратор не найден');
      }

      // Валидация данных старшего администратора
      if (!seniorAdmin.steam?.steam64_id || !validateSteamId64(seniorAdmin.steam.steam64_id)) {
        throw new Error('Некорректный SteamID64 старшего администратора');
      }

      // Безопасная фильтрация подчиненных
      const members = allAdmins.filter(member => {
        // Проверка обязательных полей
        if (!member.steam?.steam64_id || !member.server?.senior) return false;
        
        // Валидация SteamID64
        if (!validateSteamId64(member.steam.steam64_id)) return false;
        
        // Проверка принадлежности к команде
        return member.server.senior === seniorAdmin.steam.steam64_id && 
               member.steam.steam64_id !== seniorAdmin.steam.steam64_id;
      });

      // Безопасная сортировка по имени
      const sortedMembers = this.sortTeamMembers(members);

      // Очистка данных от потенциально опасного контента
      const sanitizedSenior = this.sanitizeAdminData(seniorAdmin);
      const sanitizedMembers = sortedMembers.map(member => this.sanitizeAdminData(member));

      return {
        senior: sanitizedSenior,
        members: sanitizedMembers
      };
    } catch (error) {
      console.error('TeamService.getTeamData error:', error);
      throw error;
    }
  }

  sortTeamMembers(members) {
    return [...members].sort((a, b) => {
      const nameA = (a.server?.real_name || '').toLowerCase();
      const nameB = (b.server?.real_name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'ru');
    });
  }

  sanitizeAdminData(admin) {
    if (!admin) return admin;
    
    return {
      ...admin,
      server: {
        ...admin.server,
        real_name: sanitizeText(admin.server?.real_name || ''),
        rang: sanitizeText(admin.server?.rang || ''),
        status: sanitizeText(admin.server?.status || ''),
        senior: sanitizeText(admin.server?.senior || ''),
      },
      links: {
        ...admin.links,
        discord: sanitizeText(admin.links?.discord || ''),
      },
      steam: {
        ...admin.steam,
        steamid: sanitizeText(admin.steam?.steamid || ''),
        steam64_id: sanitizeText(admin.steam?.steam64_id || ''),
      }
    };
  }
}

export const teamService = new TeamService();