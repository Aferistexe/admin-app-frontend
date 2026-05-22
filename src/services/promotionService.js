import { validateDiscordId, safeJsonParse } from '../utils/security';
import { RANK_HIERARCHY, PROMOTION_CONSTANTS } from '../constants/promotionConstants';

class PromotionService {
  constructor() {
    this.storageKey = 'promotions';
    this.maxStorageSize = 5 * 1024 * 1024; // 5MB
  }

  // Загрузка из localStorage
  loadPromotions() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return [];

      const parsed = safeJsonParse(saved, []);
      
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(this.storageKey);
        return [];
      }

      // Валидация и очистка
      const validPromotions = parsed.filter(p => 
        p.id && 
        p.discordId && 
        validateDiscordId(p.discordId) &&
        p.username &&
        p.role &&
        p.timestamp
      );

      // Если были невалидные данные - перезаписываем
      if (validPromotions.length !== parsed.length) {
        this.savePromotions(validPromotions);
      }

      return validPromotions;
    } catch (err) {
      console.error('PromotionService.loadPromotions error:', err);
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  // Сохранение в localStorage
  savePromotions(promotions) {
    try {
      if (!Array.isArray(promotions)) {
        throw new Error('Invalid data format');
      }

      const jsonString = JSON.stringify(promotions);
      
      // Проверка размера
      if (new Blob([jsonString]).size > this.maxStorageSize) {
        throw new Error('Данные превышают допустимый размер');
      }

      localStorage.setItem(this.storageKey, jsonString);
      return true;
    } catch (err) {
      console.error('PromotionService.savePromotions error:', err);
      return false;
    }
  }

  // Очистка
  clearPromotions() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (err) {
      console.error('PromotionService.clearPromotions error:', err);
      return false;
    }
  }

  // Получение доступных ролей для повышения
  getAvailableRoles(currentRank) {
    if (!currentRank || !RANK_HIERARCHY[currentRank]) return [];
    
    const currentLevel = RANK_HIERARCHY[currentRank];
    return Object.keys(RANK_HIERARCHY)
      .filter(role => RANK_HIERARCHY[role] > currentLevel)
      .sort((a, b) => RANK_HIERARCHY[a] - RANK_HIERARCHY[b]);
  }

  // Проверка возможности повышения
  canPromote(currentRank, newRank) {
    const currentLevel = RANK_HIERARCHY[currentRank] || 0;
    const newLevel = RANK_HIERARCHY[newRank] || 0;
    return newLevel > currentLevel;
  }
}

export const promotionService = new PromotionService();