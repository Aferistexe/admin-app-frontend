// security.js - Модуль безопасности и валидации данных

/**
 * Очистка текста от HTML-тегов и экранирование спецсимволов (Защита от XSS-атак).
 * Исправлена проблема с DOMParser, которая удаляла текст вида "< 3 месяцев".
 */
export const sanitizeText = (text) => {
  if (!text && text !== 0) return '';
  
  const stringText = String(text);
  
  // Проверяем на потенциально опасные паттерны перед очисткой
  const dangerousPatterns = /<script|javascript:|onerror=|onclick=/i;
  if (dangerousPatterns.test(stringText)) {
    console.warn('Potentially dangerous content detected and sanitized');
  }
  
  // Надежное и быстрое экранирование спецсимволов
  return sanitizeHtml(stringText);
};

/**
 * Очистка текста С СОХРАНЕНИЕМ Discord-тегов (<@id>, <@&id>, <#id>)
 * Использовать для текста, который будет отправлен в Discord
 */
export const sanitizeDiscordText = (text) => {
  if (!text && text !== 0) return '';
  
  const stringText = String(text);
  
  // Шаг 1: Сохраняем Discord-теги
  const discordTags = [];
  const withPlaceholders = stringText.replace(/<(@[!&]?|#)\d+>/g, (match) => {
    const index = discordTags.length;
    discordTags.push(match);
    return `___DISCORD_TAG_${index}___`;
  });
  
  // Шаг 2: Санитизируем обычный текст (кроме < и >)
  let cleaned = withPlaceholders
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // Шаг 3: Возвращаем Discord-теги
  cleaned = cleaned.replace(/___DISCORD_TAG_(\d+)___/g, (match, index) => {
    return discordTags[parseInt(index)] || match;
  });
  
  return cleaned;
};

/**
 * Глобальная функция экранирования HTML-сущностей
 */
export const sanitizeHtml = (str) => {
  if (!str && str !== 0) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  const reg = /[&<>"'/]/g;
  return String(str).replace(reg, (match) => map[match]);
};

/**
 * Валидация Discord ID (строка из 17-19 цифр)
 */
export const validateDiscordId = (id) => {
  if (!id && id !== 0) return false;
  const cleanedId = String(id).replace(/[^0-9]/g, '');
  return /^\d{17,19}$/.test(cleanedId);
};

/**
 * Валидация SteamID64 (строка строго из 17 цифр)
 */
export const validateSteamId64 = (id) => {
  if (!id && id !== 0) return false;
  const cleanedId = String(id).replace(/[^0-9]/g, '');
  return /^\d{17}$/.test(cleanedId);
};

/**
 * Валидация URL-адресов
 */
export const isValidUrl = (string) => {
  if (!string) return false;
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Очистка номера телефона (разрешены только цифры и знак плюс)
 */
export const sanitizePhone = (phone) => {
  return phone ? String(phone).replace(/[^\d+]/g, '').slice(0, 20) : '';
};

/**
 * Безопасный парсинг JSON с обработкой ошибок
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  if (typeof jsonString !== 'string') return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback;
  }
};

/**
 * Безопасное получение глубоко вложенных значений из объекта (аналог _.get)
 */
export const safeGet = (obj, path, defaultValue = '') => {
  if (!path) return defaultValue;
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result != null ? result : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Глубокая проверка строки на наличие вредоносных скриптов / инъекций
 */
export const hasDangerousContent = (str) => {
  if (!str) return false;
  
  const dangerousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
  ];
  
  const stringToCheck = String(str);
  return dangerousPatterns.some(pattern => pattern.test(stringToCheck));
};

/**
 * Безопасное ограничение длины строки для превью контента
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text && text !== 0) return '';
  const str = String(text);
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};