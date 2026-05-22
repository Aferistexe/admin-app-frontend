export const SENIOR_RANKS = [
  'Старший Администратор', 
  'Судо-Куратор', 
  'Куратор', 
  'Ассистент'
];

export const VALID_STATUSES = ['Активен', 'В отпуске', 'Мороз'];

export const STATUS_CLASSES = {
  'Активен': 'status-active',
  'В отпуске': 'status-vacation',
  'Мороз': 'status-frozen',
};

export const ADMIN_CONSTANTS = {
  MAX_RETRY_ATTEMPTS: 3,
  CACHE_DURATION: 5 * 60 * 1000,
  MIN_SEARCH_LENGTH: 2,
  ITEMS_PER_PAGE: 20,
};