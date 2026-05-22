export const TEAM_CONSTANTS = {
  MAX_TEXT_LENGTH: 50000,
  COPY_TIMEOUT: 3000,
  STATUS_CLASSES: {
    'Активен': 'status-active',
    'В отпуске': 'status-vacation',
    'Мороз': 'status-frozen',
  },
  VALID_STATUSES: ['Активен', 'В отпуске', 'Мороз'],
  COMPLETION_CLASSES: {
    none: { text: 'Нет нормы', class: 'completion-none', completed: false },
    done: { text: '✅ Выполнил', class: 'completion-done', completed: true },
    notDone: { text: '❌ Не выполнил', class: 'completion-not', completed: false },
  },
  TICKET_DEFAULTS: {
    required: 0,
    weekly: 0,
  },
  API_TIMEOUT: 10000,
  MAX_RETRY_ATTEMPTS: 3,
};