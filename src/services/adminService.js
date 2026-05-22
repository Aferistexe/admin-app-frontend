import axios from 'axios';
import { sanitizeText, validateSteamId64, validateDiscordId } from '../utils/security';
import { SENIOR_RANKS } from '../constants/adminConstants';
import { AVAILABLE_RANKS } from '../constants/promotionConstants';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class AdminService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Получение всех администраторов
  async getAllAdmins(token) {
    try {
      const response = await this.client.get('/v2/admins/list/4', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Некорректный формат данных от сервера');
      }

      return response.data;
    } catch (error) {
      console.error('AdminService.getAllAdmins error:', error);
      throw error;
    }
  }

  // Получение старших администраторов с командой
  async getSeniorsWithTeam(token) {
    try {
      const allAdmins = await this.getAllAdmins(token);
      
      // Фильтруем старших администраторов с командой
      const seniorsWithTeam = allAdmins.filter(admin => {
        if (!admin?.server?.rang || !admin?.steam?.steam64_id) {
          return false;
        }

        if (!SENIOR_RANKS.includes(admin.server.rang)) {
          return false;
        }

        if (!validateSteamId64(admin.steam.steam64_id)) {
          return false;
        }

        const hasTeam = allAdmins.some(member => {
          if (!member?.server?.senior || !member?.steam?.steam64_id) {
            return false;
          }
          
          return member.server.senior === admin.steam.steam64_id && 
                 member.steam.steam64_id !== admin.steam.steam64_id;
        });

        return hasTeam;
      });

      return this.sortByName(seniorsWithTeam);
    } catch (error) {
      console.error('AdminService.getSeniorsWithTeam error:', error);
      throw error;
    }
  }

  // ✅ НОВЫЙ МЕТОД: Получение администраторов для повышения
  async getAdminsForPromotion(token) {
    try {
      const allAdmins = await this.getAllAdmins(token);
      
      // Фильтруем только тех, кого можно повысить
      const adminsForPromotion = allAdmins.filter(admin => {
        // Проверка обязательных полей
        if (!admin?._id || !admin?.server?.real_name || !admin?.server?.rang) {
          return false;
        }

        // Проверка, что роль доступна для повышения
        if (!AVAILABLE_RANKS.includes(admin.server.rang)) {
          return false;
        }

        // Проверка Discord ID
        if (!admin.links?.discord || !validateDiscordId(admin.links.discord)) {
          return false;
        }

        return true;
      });

      // Сортировка по уровню роли (от низшей к высшей)
      const rankOrder = {
        'Стажер': 1,
        'Модератор': 2,
        'Оператор': 3,
        'Администратор': 4
      };

      const sortedAdmins = adminsForPromotion.sort((a, b) => {
        return (rankOrder[a.server.rang] || 0) - (rankOrder[b.server.rang] || 0);
      });

      // Санитизация данных
      return this.sanitizeAdminsData(sortedAdmins);
    } catch (error) {
      console.error('AdminService.getAdminsForPromotion error:', error);
      throw error;
    }
  }

  // Получение данных команды
  async getTeamData(seniorId, token) {
    try {
      const allAdmins = await this.getAllAdmins(token);
      
      const seniorAdmin = allAdmins.find(admin => admin._id === seniorId);
      
      if (!seniorAdmin) {
        throw new Error('Старший администратор не найден');
      }

      if (!seniorAdmin.steam?.steam64_id || !validateSteamId64(seniorAdmin.steam.steam64_id)) {
        throw new Error('Некорректный SteamID64 старшего администратора');
      }

      const members = allAdmins.filter(member => {
        if (!member.steam?.steam64_id || !member.server?.senior) return false;
        if (!validateSteamId64(member.steam.steam64_id)) return false;
        
        return member.server.senior === seniorAdmin.steam.steam64_id && 
               member.steam.steam64_id !== seniorAdmin.steam.steam64_id;
      });

      return {
        senior: this.sanitizeAdminData(seniorAdmin),
        members: this.sortByName(members).map(m => this.sanitizeAdminData(m))
      };
    } catch (error) {
      console.error('AdminService.getTeamData error:', error);
      throw error;
    }
  }

  // Вспомогательные методы
  sortByName(admins) {
    return [...admins].sort((a, b) => {
      const nameA = (a.server?.real_name || '').toLowerCase();
      const nameB = (b.server?.real_name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'ru');
    });
  }

  sanitizeAdminData(admin) {
    if (!admin) return admin;
    
    return {
      ...admin,
      _id: sanitizeText(admin._id),
      server: {
        ...admin.server,
        real_name: sanitizeText(admin.server?.real_name || ''),
        rang: sanitizeText(admin.server?.rang || ''),
        status: sanitizeText(admin.server?.status || ''),
        department: sanitizeText(admin.server?.department || ''),
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

  sanitizeAdminsData(admins) {
    return admins.map(admin => this.sanitizeAdminData(admin));
  }
}

export const adminService = new AdminService();