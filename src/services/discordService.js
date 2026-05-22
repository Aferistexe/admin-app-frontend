import { validateDiscordId, sanitizeDiscordText } from '../utils/security';
import { ROLE_MENTIONS } from '../constants/promotionConstants';

class DiscordService {
  constructor() {
    this.webhookUrl = process.env.REACT_APP_DISCORD_WEBHOOK_URL;
  }

  generatePromotionMessage(promotions) {
    if (!promotions?.length) return '';

    const sortedPromotions = this.sortByRank(promotions);
    
    let message = '📋 **ПОВЫШЕНИЯ**\n';
    message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    
    sortedPromotions.forEach(promo => {
      if (!validateDiscordId(promo.discordId)) return;
      
      const roleMention = ROLE_MENTIONS[promo.role] || `@${promo.role}`;
      // ✅ Discord-теги НЕ санитизируем
      message += `<@${promo.discordId}> → ${roleMention}\n`;
    });

    return message.slice(0, 2000);
  }

  generateFullText(promotions) {
    if (!promotions?.length) return 'История повышений пуста';

    const sortedPromotions = this.sortByRank(promotions);
    
    let text = '📋 ПОВЫШЕНИЯ\n';
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    sortedPromotions.forEach(promo => {
      if (!validateDiscordId(promo.discordId)) return;
      
      const roleMention = ROLE_MENTIONS[promo.role] || `@${promo.role}`;
      text += `<@${promo.discordId}> → ${roleMention}\n`;
    });

    text += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    text += '📝 КОМАНДЫ ДЛЯ DISCORD\n';
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    sortedPromotions.forEach(promo => {
      if (!validateDiscordId(promo.discordId)) return;
      
      const newRoleMention = ROLE_MENTIONS[promo.role] || `@${promo.role}`;
      const oldRoleMention = ROLE_MENTIONS[promo.oldRole] || `@${promo.oldRole}`;
      
      // ✅ Санитизируем только имя пользователя
      const safeUsername = sanitizeDiscordText(promo.username);
      
      text += `👤 ${safeUsername}\n`;
      text += `/role add юзер:<@${promo.discordId}> роль1:${newRoleMention}\n`;
      text += `/role remove юзер:<@${promo.discordId}> роль1:${oldRoleMention}\n\n`;
    });
    
    return text.length > 50000 ? 'Текст слишком длинный' : text;
  }

  async sendMessage(message, username = 'Система') {
    if (!this.webhookUrl || this.webhookUrl.includes('your_webhook_id')) {
      throw new Error('❌ Discord Webhook URL не настроен!');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Пустое сообщение');
    }

    try {
      const payload = {
        username: sanitizeDiscordText(username),
        content: message, // ✅ НЕ санитизируем, Discord-теги должны быть как есть
        allowed_mentions: {
          parse: ['users', 'roles']
        }
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new Error(`⏳ Превышен лимит. Подождите ${errorData.retry_after || 5} сек`);
        }
        
        throw new Error(errorData.message || `Ошибка Discord: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('DiscordService.sendMessage error:', error.message);
      throw error;
    }
  }

  sortByRank(promotions) {
    const rankOrder = {
      'Администратор': 4,
      'Оператор': 3,
      'Модератор': 2,
      'Стажёр': 1
    };
    
    return [...promotions].sort((a, b) => {
      return (rankOrder[b.role] || 0) - (rankOrder[a.role] || 0);
    });
  }
}

export const discordService = new DiscordService();