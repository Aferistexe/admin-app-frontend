import { sanitizeText, validateDiscordId } from './security';

export const generateStatisticsText = (senior, teamMembers) => {
  if (!senior || !teamMembers) return '';
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const completed = [];
  const notCompleted = [];
  
  teamMembers.forEach(member => {
    const required = Number(member.tickets?.required) || 0;
    const tickets7d = Number(member.tickets?.['7d']) || 0;
    const discordId = String(member.links?.discord || '').replace(/[^0-9]/g, '');
    
    if (!validateDiscordId(discordId)) return;
    
    const memberInfo = {
      name: sanitizeText(member.server?.real_name || ''),
      discordId,
      tickets: tickets7d,
      required,
      role: sanitizeText(member.server?.rang || ''),
      status: sanitizeText(member.server?.status || '')
    };
    
    if (required > 0) {
      if (tickets7d >= required) {
        completed.push(memberInfo);
      } else {
        notCompleted.push(memberInfo);
      }
    }
  });
  
  // Формирование текста статистики
  let text = '📊 ЕЖЕНЕДЕЛЬНАЯ СТАТИСТИКА СОСТАВА\n\n';
  text += `📅 Дата: ${dateStr}\n`;
  text += `👑 Старший Администратор: @${sanitizeText(senior.server?.real_name || '')}\n`;
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  text += '✅ ВЫПОЛНИЛИ НОРМУ:\n';
  if (completed.length > 0) {
    completed.forEach(member => {
      text += `<@${member.discordId}> | ${member.tickets}/${member.required} | ${member.role} | ${member.status}\n`;
    });
  } else {
    text += 'Нет\n';
  }
  
  text += '\n⚠️ НЕ ВЫПОЛНИЛИ НОРМУ:\n';
  if (notCompleted.length > 0) {
    notCompleted.forEach(member => {
      text += `<@${member.discordId}> | ${member.tickets}/${member.required} | ${member.role} | ${member.status}\n`;
    });
  } else {
    text += 'Нет\n';
  }
  
  text += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  text += `  • Не выполнили: ${notCompleted.length} человек\n`;
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  text += '⚠️ ВНИМАНИЕ\n';
  text += 'У тех, кто не сделал норму, есть время до 00:00 (МСК):\n\n';
  text += '1️⃣ Доделать норму и отчитаться перед своим старшим.\n';
  text += '2️⃣ Написать в ЛС причину, почему норма не выполнена.\n\n';
  text += 'ВАЖНО: Если до 00:00 не будет нормы или причины — вы получаете наказание (пред/выговор).';
  
  return text;
};