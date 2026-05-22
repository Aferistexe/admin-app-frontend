import React from 'react';
import ReactDOM from 'react-dom/client';
import { CookiesProvider } from 'react-cookie';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Проверка наличия root элемента
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Не найден корневой элемент #root. Проверьте index.html'
  );
}

// Создаем корневой элемент
const root = ReactDOM.createRoot(rootElement);

// Безопасный рендеринг с обработкой ошибок
const renderApp = () => {
  try {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <CookiesProvider>  {/* 👈 Только CookiesProvider, без Router */}
            <App />
          </CookiesProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Критическая ошибка при рендеринге:', error);
    
    // Отображаем fallback UI при критической ошибке
    rootElement.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1>Что-то пошло не так</h1>
          <p>Пожалуйста, обновите страницу</p>
          <button onclick="window.location.reload()" 
                  style="padding: 10px 20px; 
                         font-size: 16px; 
                         cursor: pointer;">
            Обновить
          </button>
        </div>
      </div>
    `;
  }
};

// Запускаем приложение
renderApp();

// Опционально: добавляем отлов необработанных ошибок в продакшене
if (process.env.NODE_ENV === 'production') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Необработанная ошибка промиса:', event.reason);
    // Здесь можно добавить отправку в систему мониторинга (Sentry, etc.)
  });

  window.addEventListener('error', (event) => {
    console.error('Глобальная ошибка:', event.error);
    // Здесь можно добавить отправку в систему мониторинга
  });
}