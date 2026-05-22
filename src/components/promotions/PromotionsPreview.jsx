import React, { memo, useState, useCallback } from 'react';
import { sanitizeText } from '../../utils/security';

const PromotionsPreview = memo(({ discordMessage, fullText }) => {
  const [activeTab, setActiveTab] = useState('discord');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (text) => {
    try {
      if (!text) return;
      
      if (text.length > 50000) {
        alert('Текст слишком длинный для копирования');
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      alert('Ошибка при копировании');
    }
  }, []);

  const getTabContent = useCallback(() => {
    switch (activeTab) {
      case 'discord':
        return discordMessage || 'Нет данных для Discord';
      case 'commands':
        return fullText || 'Нет команд для отображения';
      default:
        return '';
    }
  }, [activeTab, discordMessage, fullText]);

  const currentContent = getTabContent();

  return (
    <div className="promotions-preview">
      <div className="preview-tabs">
        <button
          className={`tab-btn ${activeTab === 'discord' ? 'active' : ''}`}
          onClick={() => setActiveTab('discord')}
        >
          📋 Discord сообщение
        </button>
        <button
          className={`tab-btn ${activeTab === 'commands' ? 'active' : ''}`}
          onClick={() => setActiveTab('commands')}
        >
          📝 Команды для Discord
        </button>
      </div>
      
      <div className="preview-content">
        <div className="preview-header">
          <h3>
            {activeTab === 'discord' 
              ? '📋 Предпросмотр (будет отправлено в Discord):' 
              : '📝 Команды для Discord (для ручного выполнения):'
            }
          </h3>
          <button
            onClick={() => handleCopy(currentContent)}
            className="btn-copy"
            disabled={!currentContent || currentContent === 'Нет данных для Discord'}
          >
            {copied ? '✅ Скопировано' : '📋 Копировать'}
          </button>
        </div>
        
        <pre className={`promotions-text ${
          activeTab === 'discord' ? 'preview-discord' : 'preview-commands'
        }`}>
          {sanitizeText(currentContent)}
        </pre>
      </div>
    </div>
  );
});

PromotionsPreview.displayName = 'PromotionsPreview';

export default PromotionsPreview;